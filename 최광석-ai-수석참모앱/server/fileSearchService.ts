import { GoogleGenAI } from '@google/genai';
import {
  DocumentChunk,
  SearchResultProvenance,
  FileSearchStatus,
} from '../src/types/g3Intelligence';
import { EnvironmentType, Document, EvidenceReliability } from '../src/types';
import { LatestnessEngine } from './latestnessEngine';

export class FileSearchService {
  private static chunks: DocumentChunk[] = [];
  private static status: FileSearchStatus = 'ACTIVE_LOCAL_PROVENANCE_RETRIEVAL';
  private static cloudStoreId: string | null = null;

  /**
   * Status of File Search capability in the current environment
   */
  static getStatus(): {
    status: FileSearchStatus;
    chunkCount: number;
    totalChunks: number;
    cloudStoreId: string | null;
    note: string;
  } {
    return {
      status: this.status,
      chunkCount: this.chunks.length,
      totalChunks: this.chunks.length,
      cloudStoreId: this.cloudStoreId,
      note: '내부 정밀 출처(Document→Page→Section→Chunk) 로컬 프로비넌스 검색 엔진 가동 중. Cloud FileSearchStore 연결 대기 상태 지원.',
    };
  }

  /**
   * Index multiple documents into searchable chunks
   */
  static indexDocuments(docs: Document[], environment: EnvironmentType = 'TEST'): void {
    docs.forEach((doc) => {
      const text =
        (doc as any).rawText ||
        (doc as any).content ||
        (doc.keyPoints && doc.keyPoints.join('\n')) ||
        `${doc.name}: ${doc.title || ''}`;
      if (text) {
        this.ingestDocument(doc, text, environment);
      }
    });
  }

  /**
   * Ingest and split a document into structured, searchable chunks with strict provenance.
   */
  static ingestDocument(
    doc: Document,
    rawText: string,
    environment: EnvironmentType = 'TEST'
  ): DocumentChunk[] {
    const documentId = doc.id;
    const documentName = doc.name || doc.title || '미제문서';
    const projectId = doc.project || (doc as any).projectId || 'proj-gunsan-pmi';
    const referenceDate = doc.referenceDate || doc.uploadedAt || doc.date || new Date().toISOString().substring(0, 10);
    const version = doc.version || 'v1.0';
    let reliability: EvidenceReliability = 'HIGH';
    if ((doc.reliability as any) === 'A (공식/검증됨)' || (doc.reliability as any) === 'VERIFIED') reliability = 'VERIFIED';
    else if ((doc.reliability as any) === 'B (신뢰성 높음)' || (doc.reliability as any) === 'HIGH') reliability = 'HIGH';
    else if ((doc.reliability as any) === 'C (참고자료/미검증)' || (doc.reliability as any) === 'MEDIUM') reliability = 'MEDIUM';
    else if ((doc.reliability as any) === 'D (추정치)' || (doc.reliability as any) === 'LOW') reliability = 'LOW';
    const sourceType: any = doc.sourceType || 'DOCUMENT';

    // Normalize and clean raw text
    const cleanText = rawText.replace(/\r\n/g, '\n').trim();
    if (!cleanText) return [];

    // Split text by structural boundaries (sections, headings, paragraphs)
    const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const newChunks: DocumentChunk[] = [];

    let currentSection = '서두 및 개요';
    let currentHeading = doc.name || doc.title;
    let pageCounter = 1;
    let charCountOnPage = 0;

    paragraphs.forEach((p, idx) => {
      // Heading/Section detection
      const trimmed = p.trim();
      if (/^(?:[0-9]+[.)]|제[0-9]+장|\[[^\]]+\]|■|◆|▶)/.test(trimmed) && trimmed.length < 80) {
        currentSection = trimmed;
        currentHeading = trimmed;
      }

      charCountOnPage += trimmed.length;
      if (charCountOnPage > 1200) {
        pageCounter++;
        charCountOnPage = 0;
      }

      const chunk: DocumentChunk = {
        chunkId: `chk_${documentId}_${idx + 1}`,
        documentId,
        documentName,
        projectId,
        environment,
        text: trimmed,
        page: pageCounter,
        section: currentSection,
        heading: currentHeading,
        chunkIndex: idx + 1,
        referenceDate,
        version,
        sourceType,
        reliability,
        metadata: {
          author: doc.author,
          domain: doc.domain,
          classification: doc.classification,
        },
      };

      newChunks.push(chunk);
    });

    // Remove old chunks of same document and append new chunks
    this.chunks = this.chunks.filter((c) => c.documentId !== documentId).concat(newChunks);
    return newChunks;
  }

  /**
   * Search chunks with exact provenance and relevance scoring
   */
  static search(
    query: string,
    projectId: string,
    environment: EnvironmentType,
    topK = 5
  ): SearchResultProvenance[] {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    if (terms.length === 0) return [];

    // Scoped candidate chunks strictly matching projectId and environment
    const candidates = this.chunks.filter((c) => {
      const projMatch =
        c.projectId === projectId ||
        (projectId === 'proj-gunsan-pmi' && c.projectId === 'pmi-gunsan-001') ||
        (projectId === 'pmi-gunsan-001' && c.projectId === 'proj-gunsan-pmi');
      const envMatch = c.environment === environment;
      return projMatch && envMatch;
    });

    const scored: Array<{ chunk: DocumentChunk; score: number }> = [];

    candidates.forEach((chunk) => {
      const lower = chunk.text.toLowerCase();
      let matchCount = 0;

      terms.forEach((term) => {
        if (lower.includes(term)) {
          matchCount++;
        }
      });

      if (matchCount > 0) {
        let baseScore = matchCount / terms.length;
        // Boost for heading/section matches
        if (chunk.heading && terms.some((t) => chunk.heading!.toLowerCase().includes(t))) {
          baseScore += 0.2;
        }
        // Boost for reliability
        if (chunk.reliability === 'VERIFIED') baseScore += 0.15;
        if (chunk.reliability === 'HIGH') baseScore += 0.1;

        scored.push({
          chunk,
          score: Math.min(1.0, Math.round(baseScore * 100) / 100),
        });
      }
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, topK);

    // Evaluate latestness for each result relative to all candidate chunks
    return topResults.map(({ chunk, score }, idx) => {
      const latestness = LatestnessEngine.evaluate(chunk, candidates);
      return {
        resultId: `res_${chunk.chunkId}_${idx + 1}`,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        chunkId: chunk.chunkId,
        page: chunk.page,
        section: chunk.section,
        heading: chunk.heading,
        text: chunk.text,
        score,
        referenceDate: chunk.referenceDate,
        version: chunk.version,
        sourceType: chunk.sourceType,
        reliability: chunk.reliability,
        isLatest: latestness.isLatest,
        latestnessNote: latestness.note,
        provenance: {
          documentId: chunk.documentId,
          documentName: chunk.documentName,
          page: chunk.page,
          section: chunk.section,
          heading: chunk.heading,
          chunkId: chunk.chunkId,
        },
      };
    });
  }

  /**
   * Attempt to initialize or check real Cloud GenAI File Search Store if key is present
   */
  static async checkCloudFileSearchStore(apiKey?: string): Promise<boolean> {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      this.status = 'ACTIVE_LOCAL_PROVENANCE_RETRIEVAL';
      return false;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      if (ai.fileSearchStores) {
        // SDK supports fileSearchStores
        this.status = 'AWAITING_CLOUD_STORE_PROVISIONING';
        return true;
      }
    } catch (e) {
      console.warn('[FileSearchService] Cloud file search store check failed, staying on local provenance:', e);
    }
    this.status = 'ACTIVE_LOCAL_PROVENANCE_RETRIEVAL';
    return false;
  }
}

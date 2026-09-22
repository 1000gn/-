import { Router, type Request, type Response } from 'express';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import pdfParse from 'pdf-parse';
import { executeDocumentIntake } from '../intakeEngine';
import { extractDocumentWithGemini } from '../gemini';

// server.ts 클로저 상태와 연결하기 위한 최소 인터페이스
export interface HwpxStores {
  getDocuments: () => any[];
  setDocuments: (d: any[]) => void;
  getPeople: () => any[];
  getIssues: () => any[];
  getRisks: () => any[];
  getDecisions: () => any[];
  getActions: () => any[];
}

const MAX_BIN_BYTES = 100 * 1024 * 1024; // 원본 100MB
const MAX_OUT_CHARS = 120000;
const ALLOWED_EXT = ['hwpx', 'docx', 'pdf', 'pptx', 'ppt', 'xlsx', 'txt', 'md', 'csv', 'json'] as const;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
});

function getExt(fileName: string): string {
  const m = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function decodeBase64(base64: string): Buffer {
  const clean = String(base64 || '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!clean) throw Object.assign(new Error('base64 본문이 비어 있습니다.'), { status: 400, code: 'INVALID_INPUT' });
  // 대략 크기 사전 체크 (base64 4자 = 3바이트)
  if ((clean.length * 3) / 4 > MAX_BIN_BYTES + 1024) {
    throw Object.assign(new Error('파일이 너무 큽니다. 100MB 이하만 가능합니다.'), { status: 413, code: 'FILE_TOO_LARGE' });
  }
  const buf = Buffer.from(clean, 'base64');
  if (buf.length === 0 || buf.length > MAX_BIN_BYTES) {
    throw Object.assign(new Error('파일이 너무 크거나 손상되었습니다. 100MB 이하만 가능합니다.'), { status: 413, code: 'FILE_TOO_LARGE' });
  }
  return buf;
}

// 't' 텍스트노드 수집 (OWPML hp:t + DOCX w:t + PPTX a:t → removeNSPrefix 후 't')
function collectT(node: unknown, out: string[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const v of node) collectT(v, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  const t = obj['t'];
  if (typeof t === 'string' && t.trim()) out.push(t);
  else if (Array.isArray(t)) {
    for (const x of t as unknown[]) {
      if (typeof x === 'string' && (x as string).trim()) out.push(x as string);
      else collectT(x, out);
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === 't' || !v || typeof v !== 'object') continue;
    collectT(v, out);
  }
}

// 'p' 문단 단위로 묶기 (중복방지: p를 처리한 노드는 하위 재귀시 p 제외)
function collectParagraphs(node: unknown, out: string[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const v of node) collectParagraphs(v, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (obj['p'] !== undefined) {
    const ps = Array.isArray(obj['p']) ? (obj['p'] as unknown[]) : [obj['p']];
    for (const p of ps) {
      const texts: string[] = [];
      collectT(p, texts);
      const line = texts.join('').replace(/\s+/g, ' ').trim();
      if (line) out.push(line);
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'p' || !v || typeof v !== 'object') continue;
      collectParagraphs(v, out);
    }
    return;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') collectParagraphs(v, out);
  }
}

function xmlToParagraphs(xml: string): { paras: string[]; tblCount: number } {
  const tblCount = (xml.match(/<(?:\w+:)?tbl[\s>/]/g) || []).length;
  const obj = xmlParser.parse(xml) as unknown;
  const paras: string[] = [];
  collectParagraphs(obj, paras);
  // p를 못 찾은 문서 fallback: t만 이어붙이기
  if (paras.length === 0) {
    const texts: string[] = [];
    collectT(obj, texts);
    const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) paras.push(joined);
  }
  return { paras, tblCount };
}

async function parseHwpxLike(buf: Buffer, kind: 'hwpx' | 'docx'): Promise<{ markdown: string; sections: number; tblCount: number }> {
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const sectionNames =
    kind === 'hwpx'
      ? names.filter((n) => /^contents\/section\d+\.xml$/i.test(n)).sort().slice(0, 50)
      : names.filter((n) => /^word\/document\.xml$/i.test(n));
  if (sectionNames.length === 0) throw Object.assign(new Error('본문 XML을 찾지 못했습니다. 손상된 파일일 수 있습니다.'), { status: 400, code: 'PARSE_FAILED' });

  const allParas: string[] = [];
  let tblCount = 0;
  for (const name of sectionNames) {
    const file = zip.files[name];
    if ((file as any)._data && (file as any)._data.uncompressedSize > 20 * 1024 * 1024) continue;
    const xml = await file.async('string');
    if (xml.length > 25 * 1024 * 1024) continue;
    const { paras, tblCount: t } = xmlToParagraphs(xml);
    tblCount += t;
    allParas.push(...paras);
  }
  let markdown = allParas.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!markdown) throw Object.assign(new Error('추출된 텍스트가 없습니다. 스캔본이면 OCR이 필요합니다.'), { status: 400, code: 'EMPTY_TEXT' });
  if (markdown.length > MAX_OUT_CHARS) markdown = markdown.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)';
  return { markdown, sections: sectionNames.length, tblCount };
}

/**
 * PPTX 슬라이드 내의 표(a:tbl)를 Markdown 표 포맷으로 변환
 */
function extractPptxTables(node: unknown): string[] {
  const tables: string[] = [];
  if (!node || typeof node !== 'object') return tables;

  function walk(n: any) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      for (const item of n) walk(item);
      return;
    }
    const tbl = n['tbl'] || n['a:tbl'];
    if (tbl && typeof tbl === 'object') {
      const rows = tbl['tr'] || tbl['a:tr'];
      if (rows) {
        const rowList = Array.isArray(rows) ? rows : [rows];
        const grid: string[][] = [];
        for (const r of rowList) {
          const cells = r['tc'] || r['a:tc'];
          if (cells) {
            const cellList = Array.isArray(cells) ? cells : [cells];
            const rowValues = cellList.map((c: any) => {
              const paras: string[] = [];
              collectParagraphs(c, paras);
              return paras.join(' ').replace(/\|/g, '\\|').trim() || '-';
            });
            if (rowValues.length > 0) grid.push(rowValues);
          }
        }
        if (grid.length > 0) {
          const maxCols = Math.max(...grid.map((r) => r.length));
          const normalized = grid.map((r) => {
            const copy = [...r];
            while (copy.length < maxCols) copy.push('-');
            return copy;
          });
          const header = `| ${normalized[0].join(' | ')} |`;
          const divider = `| ${normalized[0].map(() => '---').join(' | ')} |`;
          const body = normalized.slice(1).map((r) => `| ${r.join(' | ')} |`).join('\n');
          tables.push([header, divider, body].filter(Boolean).join('\n'));
        }
      }
    }
    for (const v of Object.values(n)) {
      if (v && typeof v === 'object') walk(v);
    }
  }

  walk(node);
  return tables;
}

/**
 * PPTX (PowerPoint 2007+) 파싱:
 * 슬라이드별(ppt/slides/slide*.xml) 텍스트, 제목, 표, 발표자 메모(ppt/notesSlides) 추출
 */
async function parsePptxLike(
  buf: Buffer,
  fileName: string,
  base64?: string
): Promise<{ markdown: string; sections: number; tblCount: number; warnings: string[] }> {
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);

  const slideNames = names
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  if (slideNames.length === 0) {
    throw Object.assign(new Error('PPTX 슬라이드 구조를 찾지 못했습니다. 손상되었거나 빈 프레젠테이션 파일입니다.'), {
      status: 400,
      code: 'PARSE_FAILED',
    });
  }

  const slideOutputs: string[] = [];
  let totalTblCount = 0;

  for (let idx = 0; idx < slideNames.length; idx++) {
    const slidePath = slideNames[idx];
    const file = zip.files[slidePath];
    if (!file) continue;

    const xml = await file.async('string');
    const slideNum = idx + 1;

    const tblMatch = xml.match(/<(?:\w+:)?tbl[\s>/]/g);
    if (tblMatch) totalTblCount += tblMatch.length;

    const obj = xmlParser.parse(xml) as Record<string, unknown>;
    const tables = extractPptxTables(obj);

    const paras: string[] = [];
    collectParagraphs(obj, paras);

    // 발표자 메모 탐색
    const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let noteText = '';
    if (zip.files[notesPath]) {
      try {
        const noteXml = await zip.files[notesPath].async('string');
        const noteObj = xmlParser.parse(noteXml);
        const noteParas: string[] = [];
        collectParagraphs(noteObj, noteParas);
        if (noteParas.length > 0) {
          noteText = noteParas.filter((p) => !p.includes('슬라이드')).join(' ').trim();
        }
      } catch {
        // notes ignore
      }
    }

    const slideContent: string[] = [];
    let title = `슬라이드 ${slideNum}`;
    let remainingParas = paras;

    if (paras.length > 0 && paras[0].length <= 80) {
      title = paras[0];
      remainingParas = paras.slice(1);
    }

    slideContent.push(`## [슬라이드 ${slideNum}] ${title}`);

    for (const p of remainingParas) {
      if (p.trim() && p !== title) {
        slideContent.push(`- ${p}`);
      }
    }

    for (const tbl of tables) {
      slideContent.push('\n' + tbl + '\n');
    }

    if (noteText) {
      slideContent.push(`> 💡 발표자 메모: ${noteText}`);
    }

    slideOutputs.push(slideContent.join('\n'));
  }

  let markdown = slideOutputs.join('\n\n---\n\n').trim();

  // If parsed text is too short, attempt Gemini multimodal recovery if base64 exists
  if (markdown.replace(/\s/g, '').length < 40 && base64) {
    try {
      const geminiDoc = await extractDocumentWithGemini(fileName, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', base64);
      if (geminiDoc && geminiDoc.trim().length > markdown.length) {
        warnings.push('슬라이드 내 이미지/도형을 Gemini AI Vision으로 정밀 판독하였습니다.');
        markdown = geminiDoc;
      }
    } catch {
      // fallback
    }
  }

  if (!markdown || markdown.length < 5) {
    throw Object.assign(new Error('PPTX 슬라이드에서 텍스트를 추출하지 못했습니다.'), { status: 400, code: 'EMPTY_TEXT' });
  }

  if (markdown.length > MAX_OUT_CHARS) {
    markdown = markdown.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)';
  }

  return {
    markdown,
    sections: slideNames.length,
    tblCount: totalTblCount,
    warnings,
  };
}

/**
 * PDF 파싱:
 * 1) 고속 로컬 pdf-parse 실행 (페이지 수 및 텍스트 추출)
 * 2) 스캔 전용/이미지 PDF의 경우 Gemini AI Vision OCR로 자동 고도화
 */
async function parsePdfBuffer(
  buf: Buffer,
  fileName: string,
  base64?: string
): Promise<{ markdown: string; sections: number; tblCount: number; warnings: string[] }> {
  const warnings: string[] = [];
  let localText = '';
  let pages = 1;

  try {
    const pdfData = await pdfParse(buf);
    pages = pdfData.numpages || 1;
    localText = (pdfData.text || '').trim();
  } catch (pdfErr: any) {
    warnings.push(`로컬 PDF 파서 경고: ${pdfErr?.message || '텍스트 추출 중 경미한 문제 발생'}`);
  }

  // 스캔본이거나 텍스트가 극도로 적은 경우 Gemini Multimodal Vision 가동
  const nonWsCount = localText.replace(/\s/g, '').length;
  if (nonWsCount < 40 && base64) {
    try {
      const geminiOcr = await extractDocumentWithGemini(fileName, 'application/pdf', base64);
      if (geminiOcr && geminiOcr.trim().length > nonWsCount) {
        warnings.push('스캔/이미지 기반 PDF 문서를 Gemini AI Vision으로 정밀 OCR 판독하였습니다.');
        const tblCount = (geminiOcr.match(/\|[\s-:]+\|/g) || []).length;
        return {
          markdown: geminiOcr.length > MAX_OUT_CHARS ? geminiOcr.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)' : geminiOcr,
          sections: pages,
          tblCount,
          warnings,
        };
      }
    } catch (gErr) {
      console.warn('[PDF Gemini OCR fallback skipped]', gErr);
    }
  }

  if (!localText) {
    throw Object.assign(new Error('PDF에서 텍스트를 추출할 수 없습니다. 스캔 전용 문서인 경우 본문을 직접 붙여넣거나 AI 키를 확인하십시오.'), {
      status: 400,
      code: 'EMPTY_TEXT',
    });
  }

  // 페이지 구분자 및 단락 정리
  const cleaned = localText
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n\n---\n[페이지 구분]\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const tblCount = (cleaned.match(/\|[\s-:]+\|/g) || []).length;
  const markdown = cleaned.length > MAX_OUT_CHARS ? cleaned.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)' : cleaned;

  return { markdown, sections: pages, tblCount, warnings };
}

/**
 * 구형 PPT (PowerPoint 97-2003 바이너리) 파싱:
 * Gemini AI Vision 및 UTF-16LE/ASCII 바이너리 텍스트 복원
 */
async function parseLegacyPptBuffer(
  buf: Buffer,
  fileName: string,
  base64?: string
): Promise<{ markdown: string; sections: number; tblCount: number; warnings: string[] }> {
  const warnings: string[] = [
    'PowerPoint 97-2003 (.ppt) 형식입니다. 슬라이드 텍스트 블록을 복원하여 추출하였습니다.',
  ];

  if (base64) {
    try {
      const geminiExtracted = await extractDocumentWithGemini(fileName, 'application/vnd.ms-powerpoint', base64);
      if (geminiExtracted && geminiExtracted.trim().length > 50) {
        warnings.push('구형 PPT 문서를 Gemini AI Vision으로 정밀 구조화하여 복원하였습니다.');
        return {
          markdown: geminiExtracted,
          sections: (geminiExtracted.match(/슬라이드/g) || []).length || 1,
          tblCount: (geminiExtracted.match(/\|[\s-:]+\|/g) || []).length,
          warnings,
        };
      }
    } catch (e) {
      console.warn('[Legacy PPT Gemini fallback]', e);
    }
  }

  const extractedLines: string[] = [];
  let curAscii = '';
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (byte >= 32 && byte <= 126) {
      curAscii += String.fromCharCode(byte);
    } else {
      if (curAscii.length >= 4 && !/^(Arial|Calibri|Times|Segoe|Symbol|Default|Picture|Windows|Microsoft|PowerPoint)/i.test(curAscii)) {
        extractedLines.push(curAscii.trim());
      }
      curAscii = '';
    }
  }

  for (let i = 0; i < buf.length - 1; i += 2) {
    const code = buf.readUInt16LE(i);
    if ((code >= 0xac00 && code <= 0xd7a3) || (code >= 0x3000 && code <= 0x303f)) {
      let run = '';
      let j = i;
      while (j < buf.length - 1) {
        const c = buf.readUInt16LE(j);
        if ((c >= 0xac00 && c <= 0xd7a3) || (c >= 32 && c <= 126) || (c >= 0x3000 && c <= 0x303f) || c === 10 || c === 13) {
          run += String.fromCharCode(c);
          j += 2;
        } else {
          break;
        }
      }
      if (run.trim().length >= 2) {
        extractedLines.push(run.trim());
      }
      i = j;
    }
  }

  const uniqueLines = Array.from(new Set(extractedLines.filter((l) => l.length > 2)));
  if (uniqueLines.length === 0) {
    throw Object.assign(new Error('구형 PPT 파일에서 텍스트를 판독하지 못했습니다. 최신 .pptx 형식으로 저장하거나 본문을 직접 입력하십시오.'), {
      status: 400,
      code: 'EMPTY_TEXT',
    });
  }

  const slideChunks: string[] = [];
  const chunkSize = 6;
  for (let s = 0; s < uniqueLines.length; s += chunkSize) {
    const slideNum = Math.floor(s / chunkSize) + 1;
    const chunk = uniqueLines.slice(s, s + chunkSize);
    slideChunks.push(`## [슬라이드 ${slideNum}] ${chunk[0]}\n${chunk.slice(1).map((l) => `- ${l}`).join('\n')}`);
  }

  const markdown = slideChunks.join('\n\n---\n\n');
  return {
    markdown: markdown.length > MAX_OUT_CHARS ? markdown.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)' : markdown,
    sections: slideChunks.length,
    tblCount: 0,
    warnings,
  };
}

/**
 * Excel XLSX 파싱:
 * xl/worksheets/sheet*.xml 및 xl/sharedStrings.xml 파싱하여 Markdown 테이블로 변환
 */
async function parseXlsxLike(
  buf: Buffer,
  fileName: string
): Promise<{ markdown: string; sections: number; tblCount: number; warnings: string[] }> {
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);

  // 1. Shared strings
  const sharedStrings: string[] = [];
  if (zip.files['xl/sharedStrings.xml']) {
    const ssXml = await zip.files['xl/sharedStrings.xml'].async('string');
    const ssObj = xmlParser.parse(ssXml) as any;
    const siList = ssObj?.sst?.si ? (Array.isArray(ssObj.sst.si) ? ssObj.sst.si : [ssObj.sst.si]) : [];
    for (const si of siList) {
      const texts: string[] = [];
      collectT(si, texts);
      sharedStrings.push(texts.join('').trim());
    }
  }

  // 2. Worksheets
  const sheetNames = names.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n)).sort();
  if (sheetNames.length === 0) {
    throw Object.assign(new Error('Excel 시트를 찾지 못했습니다.'), { status: 400, code: 'PARSE_FAILED' });
  }

  const sheetOutputs: string[] = [];
  for (let idx = 0; idx < sheetNames.length; idx++) {
    const sName = sheetNames[idx];
    const xml = await zip.files[sName].async('string');
    const obj = xmlParser.parse(xml) as any;
    const sheetData = obj?.worksheet?.sheetData;
    if (!sheetData || !sheetData.row) continue;

    const rowList = Array.isArray(sheetData.row) ? sheetData.row : [sheetData.row];
    const rows: string[][] = [];

    for (const r of rowList) {
      if (!r.c) continue;
      const cells = Array.isArray(r.c) ? r.c : [r.c];
      const rowVals: string[] = [];
      for (const c of cells) {
        let val = '';
        if (c.t === 's' && c.v !== undefined) {
          const sIdx = parseInt(c.v, 10);
          val = sharedStrings[sIdx] || '';
        } else if (c.v !== undefined) {
          val = String(c.v);
        }
        rowVals.push(val.replace(/\|/g, '\\|').trim() || '-');
      }
      if (rowVals.some((v) => v !== '-')) {
        rows.push(rowVals);
      }
    }

    if (rows.length > 0) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      const normalized = rows.map((r) => {
        const copy = [...r];
        while (copy.length < maxCols) copy.push('-');
        return copy;
      });
      const header = `| ${normalized[0].join(' | ')} |`;
      const divider = `| ${normalized[0].map(() => '---').join(' | ')} |`;
      const body = normalized.slice(1).map((r) => `| ${r.join(' | ')} |`).join('\n');
      sheetOutputs.push(`### [시트 ${idx + 1}]\n\n${header}\n${divider}\n${body}`);
    }
  }

  const markdown = sheetOutputs.join('\n\n---\n\n').trim();
  if (!markdown) {
    throw Object.assign(new Error('Excel 시트에 데이터가 없습니다.'), { status: 400, code: 'EMPTY_TEXT' });
  }

  return {
    markdown: markdown.length > MAX_OUT_CHARS ? markdown.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)' : markdown,
    sections: sheetNames.length,
    tblCount: sheetOutputs.length,
    warnings,
  };
}

export async function parseOfficeBuffer(
  fileName: string,
  buf: Buffer,
  base64?: string
): Promise<{ markdown: string; detectedType: string; sections: number; tblCount: number; warnings: string[] }> {
  const ext = getExt(fileName);
  const warnings: string[] = [];

  if ((ext as string) === 'hwp') {
    throw Object.assign(new Error('.hwp(구 한글 바이너리)는 미지원입니다. HWPX로 저장하거나 PDF로 변환 후 업로드하세요.'), {
      status: 400,
      code: 'UNSUPPORTED_TYPE',
    });
  }

  if (!(ALLOWED_EXT as readonly string[]).includes(ext)) {
    throw Object.assign(new Error(`미지원 파일 형식입니다. 지원 포맷: ${ALLOWED_EXT.join(', ')}`), {
      status: 400,
      code: 'UNSUPPORTED_TYPE',
    });
  }

  // 1. PDF
  if (ext === 'pdf') {
    const r = await parsePdfBuffer(buf, fileName, base64);
    return { markdown: r.markdown, detectedType: 'pdf', sections: r.sections, tblCount: r.tblCount, warnings: [...warnings, ...r.warnings] };
  }

  // 2. PPTX
  if (ext === 'pptx') {
    const r = await parsePptxLike(buf, fileName, base64);
    return { markdown: r.markdown, detectedType: 'pptx', sections: r.sections, tblCount: r.tblCount, warnings: [...warnings, ...r.warnings] };
  }

  // 3. PPT (Legacy)
  if (ext === 'ppt') {
    const r = await parseLegacyPptBuffer(buf, fileName, base64);
    return { markdown: r.markdown, detectedType: 'ppt', sections: r.sections, tblCount: r.tblCount, warnings: [...warnings, ...r.warnings] };
  }

  // 4. XLSX
  if (ext === 'xlsx') {
    const r = await parseXlsxLike(buf, fileName);
    return { markdown: r.markdown, detectedType: 'xlsx', sections: r.sections, tblCount: r.tblCount, warnings: [...warnings, ...r.warnings] };
  }

  // 5. HWPX / DOCX
  if (ext === 'hwpx' || ext === 'docx') {
    const r = await parseHwpxLike(buf, ext as 'hwpx' | 'docx');
    warnings.push('그림·수식은 텍스트 및 서식 구조만 추출됩니다.');
    return { markdown: r.markdown, detectedType: ext, sections: r.sections, tblCount: r.tblCount, warnings };
  }

  // 6. txt / md / csv / json
  const text = buf.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
  if (!text) throw Object.assign(new Error('추출된 텍스트가 없습니다.'), { status: 400, code: 'EMPTY_TEXT' });
  return {
    markdown: text.length > MAX_OUT_CHARS ? text.slice(0, MAX_OUT_CHARS) + '\n\n…(이하 생략)' : text,
    detectedType: ext,
    sections: 1,
    tblCount: (text.match(/\|[\s-:]+\|/g) || []).length,
    warnings,
  };
}

function sendErr(res: Response, err: any): void {
  const status = typeof err?.status === 'number' ? err.status : 500;
  const code = typeof err?.code === 'string' ? err.code : 'HWPX_FAILED';
  if (status >= 500) console.error('[document-intake]', err);
  res.status(status).json({ error: status >= 500 ? '문서 파싱 중 오류가 발생했습니다.' : String(err?.message || '파싱 실패'), code });
}

export function createHwpxRouter(stores?: HwpxStores) {
  const r = Router();

  r.get('/health', (_req, res) => {
    res.json({ ok: true, allowed: ALLOWED_EXT, maxBytes: MAX_BIN_BYTES });
  });

  // 1) 파싱만 (권장: 결과 rawText를 기존 /api/intake로 전달)
  r.post('/parse', async (req: Request, res: Response) => {
    try {
      const { fileName, base64 } = req.body ?? {};
      if (!fileName || !base64) {
        res.status(400).json({ error: 'fileName과 base64가 필요합니다.', code: 'INVALID_INPUT' });
        return;
      }
      const rawBase64 = String(base64);
      const buf = decodeBase64(rawBase64);
      const parsed = await parseOfficeBuffer(String(fileName), buf, rawBase64);
      res.json({
        fileName: String(fileName),
        ...parsed,
        charCount: parsed.markdown.length,
      });
    } catch (err) {
      sendErr(res, err);
    }
  });

  // 2) 파싱 + intakeEngine 직접 실행 (server.ts에서 stores 주입시에만 동작)
  r.post('/intake', async (req: Request, res: Response) => {
    try {
      if (!stores) {
        res.status(500).json({ error: '서버에 stores가 연결되지 않았습니다.', code: 'NOT_WIRED' });
        return;
      }
      const ctx = (req as any).projectContext ?? {};
      const { fileName, base64, displayName, domain, importance, version, referenceDate, source, author, project } = req.body ?? {};
      if (!fileName || !base64) {
        res.status(400).json({ error: 'fileName과 base64가 필요합니다.', code: 'INVALID_INPUT' });
        return;
      }
      const rawBase64 = String(base64);
      const buf = decodeBase64(rawBase64);
      const parsed = await parseOfficeBuffer(String(fileName), buf, rawBase64);
      const { document, updatedDocuments } = executeDocumentIntake(
        {
          fileName: String(fileName),
          displayName: displayName || String(fileName),
          rawText: parsed.markdown,
          project: project || ctx.projectId || 'proj-gunsan-pmi',
          domain: domain || '자동판단',
          importance: importance || '자동판단',
          environment: ctx.environment || 'TEST',
          version,
          referenceDate,
          source: source || `IntakeEngine(${parsed.detectedType})`,
          author: author || '문서 자동추출',
        },
        {
          existingDocuments: stores.getDocuments(),
          existingPeople: stores.getPeople(),
          existingIssues: stores.getIssues(),
          existingRisks: stores.getRisks(),
          existingDecisions: stores.getDecisions(),
          existingActions: stores.getActions(),
        }
      );
      stores.setDocuments(updatedDocuments);
      res.json({ success: true, document, analysisResult: document.analysisResult, parse: { ...parsed, charCount: parsed.markdown.length } });
    } catch (err) {
      sendErr(res, err);
    }
  });

  return r;
}

export default createHwpxRouter;

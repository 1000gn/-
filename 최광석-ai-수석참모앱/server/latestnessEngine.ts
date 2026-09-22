export interface LatestnessEvaluation {
  isLatest: boolean;
  score: number; // 0 - 100
  note: string;
  referenceDate?: string;
  effectiveDate?: string;
  version?: string;
  comparisonWarning?: string;
}

export class LatestnessEngine {
  /**
   * Evaluates chronological recency, version sequence, and scope validity.
   */
  static evaluate(item: {
    referenceDate?: string;
    version?: string;
    createdAt?: string;
    scope?: string;
  }, allPeers: Array<{ referenceDate?: string; version?: string; createdAt?: string; scope?: string }>): LatestnessEvaluation {
    const targetDateStr = item.referenceDate || item.createdAt;
    if (!targetDateStr) {
      return {
        isLatest: false,
        score: 40,
        note: '최신 여부 확인 필요 (기준일 미기재)',
      };
    }

    const targetDate = new Date(targetDateStr).getTime();
    if (isNaN(targetDate)) {
      return {
        isLatest: false,
        score: 40,
        note: '최신 여부 확인 필요 (일자 형식 불명확)',
      };
    }

    let isHighestDate = true;
    let peersWithDates = 0;
    let newerPeerFound = false;
    let newerDateStr = '';

    for (const peer of allPeers) {
      const pDateStr = peer.referenceDate || peer.createdAt;
      if (!pDateStr) continue;
      const pDate = new Date(pDateStr).getTime();
      if (isNaN(pDate)) continue;

      peersWithDates++;
      if (pDate > targetDate) {
        isHighestDate = false;
        newerPeerFound = true;
        newerDateStr = pDateStr;
      }
    }

    if (newerPeerFound) {
      return {
        isLatest: false,
        score: 50,
        note: `과거 자료 (${targetDateStr}) - 더 최신의 자료(${newerDateStr})가 존재함`,
        comparisonWarning: `후속 문서(${newerDateStr}) 존재에 따른 유효성 재확인 필요`,
        referenceDate: targetDateStr,
        version: item.version,
      };
    }

    // Check version sequence if available (e.g. v1.0 vs v2.1)
    if (item.version) {
      const targetVerNum = parseFloat(item.version.replace(/[^0-9.]/g, '')) || 1.0;
      for (const peer of allPeers) {
        if (!peer.version) continue;
        const peerVerNum = parseFloat(peer.version.replace(/[^0-9.]/g, '')) || 1.0;
        if (peerVerNum > targetVerNum) {
          return {
            isLatest: false,
            score: 60,
            note: `버전(${item.version})보다 높은 버전(${peer.version})이 존재함`,
            comparisonWarning: '최신 개정본 여부 확인 필요',
            referenceDate: targetDateStr,
            version: item.version,
          };
        }
      }
    }

    return {
      isLatest: true,
      score: 95,
      note: `현재 확인된 범위 내 최신 문서 (${targetDateStr} 기준)`,
      referenceDate: targetDateStr,
      version: item.version,
    };
  }

  /**
   * Evaluates an array of documents and assigns latestness status and recency ranking.
   */
  static evaluateDocuments(docs: Array<any>): Array<any & {
    latestnessStatus: 'LATEST' | 'SUPERSEDED' | 'OUTDATED';
    recencyRank: number;
    latestnessEvaluation: LatestnessEvaluation;
  }> {
    // Group documents by subject/domain or sort chronologically
    const sorted = [...docs].sort((a, b) => {
      const dateA = new Date(a.referenceDate || a.uploadedAt || a.date || 0).getTime();
      const dateB = new Date(b.referenceDate || b.uploadedAt || b.date || 0).getTime();
      return dateB - dateA;
    });

    return docs.map((doc) => {
      const evalResult = this.evaluate(doc, docs);
      const rank = sorted.findIndex((d) => d.id === doc.id) + 1;
      let status: 'LATEST' | 'SUPERSEDED' | 'OUTDATED' = 'SUPERSEDED';

      if (evalResult.isLatest && rank === 1) {
        status = 'LATEST';
      } else if (evalResult.score < 50) {
        status = 'OUTDATED';
      } else {
        status = 'SUPERSEDED';
      }

      return {
        ...doc,
        latestnessStatus: status,
        recencyRank: rank,
        latestnessEvaluation: evalResult,
      };
    });
  }
}


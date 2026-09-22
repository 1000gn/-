/**
 * Sungdong ISET & Global Architectural Design Version & Revision Engine
 * 
 * 설계 도면 및 문서 버전 관리 및 디프(Diff) 비교 엔진
 */

export type RevisionStatus = 'Draft' | 'In Review' | 'Approved' | 'Released' | 'Superseded';

export type DesignCategory = 
  | 'General Arrangement'
  | 'Hull & Structural'
  | 'MEP & Piping'
  | 'Electrical & Automation'
  | 'Architectural & Interior'
  | 'Energy & Environmental'
  | 'Specialized Engineering';

export interface SpecFieldChange {
  fieldName: string;
  fieldLabel: string;
  oldValue: string | number;
  newValue: string | number;
  unit?: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

export interface DesignVersionItem {
  id: string;                         // e.g. "ver-001"
  projectId: string;                  // e.g. "PRJ-SUNKON-2026-LNG"
  projectName: string;                // e.g. "174,000㎥ LNG 운반선 스마트 설계"
  versionNumber: string;              // e.g. "v1.2.0"
  revisionCode: string;               // e.g. "Rev-3"
  category: DesignCategory;
  title: string;
  author: {
    name: string;
    role: string;
    department: string;
  };
  approver?: {
    name: string;
    role: string;
    approvalDate: string;
    status: 'Approved' | 'Rejected' | 'Pending';
  };
  status: RevisionStatus;
  createdAt: string;
  updatedAt: string;
  changeSummary: string;
  revisionReason: string;
  blueprintImageUrl?: string;
  specifications: Record<string, string | number>;
  modifiedChanges: SpecFieldChange[];
  tags: string[];
}

export interface VersionDiffResult {
  baseVersion: DesignVersionItem;
  targetVersion: DesignVersionItem;
  addedSpecs: { key: string; value: string | number }[];
  removedSpecs: { key: string; value: string | number }[];
  modifiedSpecs: SpecFieldChange[];
  unchangedSpecsCount: number;
  overallImpact: 'low' | 'medium' | 'high' | 'critical';
  impactSummary: {
    weightDiff: number;        // ton
    costDiffPercent: number;    // %
    energyDiffPercent: number;  // %
  };
}

const DB_NAME = "DesignVersionControlDB";
const DB_VERSION = 1;
const STORE_NAME = "designVersions";

let dbInstance: IDBDatabase | null = null;

// Initial Mock Data for Architectural & Shipbuilding Design Versions
const INITIAL_MOCK_VERSIONS: DesignVersionItem[] = [
  {
    id: "ver-lng-100",
    projectId: "PRJ-SUNKON-2026-LNG",
    projectName: "174,000㎥ LNG 운반선 설계 마스터플랜",
    versionNumber: "v1.0.0",
    revisionCode: "Rev-0",
    category: "General Arrangement",
    title: "174K LNG Carrier 기본 총괄배치도 (개념 설계)",
    author: {
      name: "김철수 박사",
      role: "수석 선박설계 엔지니어",
      department: "성동ISET 미래전략기획실"
    },
    approver: {
      name: "한스 뮐러 박사",
      role: "KR/DNV 선급 검사관",
      approvalDate: "2026-02-10",
      status: "Approved"
    },
    status: "Superseded",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-02-01T09:00:00Z",
    changeSummary: "최초 개념 설계 총괄배치도 수립",
    revisionReason: "기본 선주 요구사항 반영 및 초기 선형 확정",
    blueprintImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?q=80&w=1200&auto=format&fit=crop",
    specifications: {
      lengthOverall: 290,
      breadth: 45.6,
      depth: 26.0,
      draft: 12.5,
      deadweight: 75000,
      cargoCapacity: 170000,
      serviceSpeed: 19.5,
      boilOffRate: 0.15,
      mainEngineMCR: 28000,
      estimatedCost: 2400
    },
    modifiedChanges: [],
    tags: ["LNG", "개념설계", "초안", "DNV인증"]
  },
  {
    id: "ver-lng-110",
    projectId: "PRJ-SUNKON-2026-LNG",
    projectName: "174,000㎥ LNG 운반선 설계 마스터플랜",
    versionNumber: "v1.1.0",
    revisionCode: "Rev-1",
    category: "General Arrangement",
    title: "174K LNG Carrier 화물창 멤브레인 용적 최적화 배치도",
    author: {
      name: "유 타나카 박사",
      role: "LNG 기술 전문가",
      department: "성동ISET 가스선설계팀"
    },
    approver: {
      name: "김철수 박사",
      role: "수석 선박설계 엔지니어",
      approvalDate: "2026-04-15",
      status: "Approved"
    },
    status: "Superseded",
    createdAt: "2026-04-01T10:30:00Z",
    updatedAt: "2026-04-01T10:30:00Z",
    changeSummary: "화물창 용적 170,000㎥ → 174,000㎥ 확장 및 BOG 재액화 장치 탑재",
    revisionReason: "선주 요청으로 화물적재 효율 2.3% 증대 및 BOG 기화율 0.08% 이하 절감",
    blueprintImageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop",
    specifications: {
      lengthOverall: 292,
      breadth: 45.6,
      depth: 26.2,
      draft: 12.5,
      deadweight: 77500,
      cargoCapacity: 174000,
      serviceSpeed: 19.5,
      boilOffRate: 0.08,
      mainEngineMCR: 29500,
      estimatedCost: 2520
    },
    modifiedChanges: [
      {
        fieldName: "lengthOverall",
        fieldLabel: "전장 (LOA)",
        oldValue: 290,
        newValue: 292,
        unit: "m",
        impactLevel: "medium",
        category: "주요제원"
      },
      {
        fieldName: "cargoCapacity",
        fieldLabel: "화물 용적",
        oldValue: 170000,
        newValue: 174000,
        unit: "㎥",
        impactLevel: "high",
        category: "화물성능"
      },
      {
        fieldName: "boilOffRate",
        fieldLabel: "일일 BOG 기화율",
        oldValue: 0.15,
        newValue: 0.08,
        unit: "%/day",
        impactLevel: "critical",
        category: "친환경성"
      },
      {
        fieldName: "estimatedCost",
        fieldLabel: "예상 건조 단가",
        oldValue: 2400,
        newValue: 2520,
        unit: "억원",
        impactLevel: "high",
        category: "원가"
      }
    ],
    tags: ["LNG", "화물창확장", "BOG재액화", "선주승인"]
  },
  {
    id: "ver-lng-200",
    projectId: "PRJ-SUNKON-2026-LNG",
    projectName: "174,000㎥ LNG 운반선 설계 마스터플랜",
    versionNumber: "v2.0.0",
    revisionCode: "Rev-2 (Current)",
    category: "General Arrangement",
    title: "174K LNG Carrier 이중연료(암모니아 Ready) 최종 시공 도면",
    author: {
      name: "박민수 엔지니어",
      role: "선임 기관설계 엔지니어",
      department: "성동ISET 친환경추진팀"
    },
    approver: {
      name: "한스 뮐러 박사",
      role: "KR/DNV 선급 최종 검사관",
      approvalDate: "2026-07-20",
      status: "Approved"
    },
    status: "Released",
    createdAt: "2026-07-10T14:20:00Z",
    updatedAt: "2026-08-01T09:10:00Z",
    changeSummary: "암모니아 혼소 Ready 추진계통 및 로봇 용접 자동화 이중저 강화 구조 반영",
    revisionReason: "2026 IMO GHG Tier III 및 CII 최고등급 A등급 만족",
    blueprintImageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
    specifications: {
      lengthOverall: 292,
      breadth: 45.6,
      depth: 26.2,
      draft: 12.5,
      deadweight: 78000,
      cargoCapacity: 174000,
      serviceSpeed: 19.8,
      boilOffRate: 0.068,
      mainEngineMCR: 31000,
      estimatedCost: 2580
    },
    modifiedChanges: [
      {
        fieldName: "boilOffRate",
        fieldLabel: "일일 BOG 기화율",
        oldValue: 0.08,
        newValue: 0.068,
        unit: "%/day",
        impactLevel: "high",
        category: "친환경성"
      },
      {
        fieldName: "mainEngineMCR",
        fieldLabel: "주기관 출률 (MCR)",
        oldValue: 29500,
        newValue: 31000,
        unit: "kW",
        impactLevel: "medium",
        category: "추진성능"
      },
      {
        fieldName: "estimatedCost",
        fieldLabel: "예상 건조 단가",
        oldValue: 2520,
        newValue: 2580,
        unit: "억원",
        impactLevel: "medium",
        category: "원가"
      }
    ],
    tags: ["LNG", "최종시공도면", "암모니아Ready", "IMO Tier III", "승인완료"]
  },
  {
    id: "ver-arch-100",
    projectId: "PRJ-ARCH-SEOUL-TOWER",
    projectName: "강남 스마트 친환경 랜드마크 타워",
    versionNumber: "v1.0.0",
    revisionCode: "Rev-0",
    category: "Architectural & Interior",
    title: "강남 친환경 랜드마크 타워 건축 개념 도면",
    author: {
      name: "조민석 건축가",
      role: "마스터 건축가",
      department: "글로벌 건축 디자인랩"
    },
    approver: {
      name: "서울시 건축심의위원회",
      role: "인허가 기관",
      approvalDate: "2026-03-01",
      status: "Approved"
    },
    status: "Superseded",
    createdAt: "2026-02-15T08:00:00Z",
    updatedAt: "2026-02-15T08:00:00Z",
    changeSummary: "지상 35층, 지하 5층 친환경 사무 및 복합 문화 타워 기본 매스 스터디",
    revisionReason: "초기 건축 인허가 신청을 위한 매스 및 일조권 검토",
    blueprintImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
    specifications: {
      floors: 35,
      totalArea: 48000,
      buildingHeight: 165,
      solarPanelArea: 1200,
      energyRating: "1등급",
      estimatedCost: 1250
    },
    modifiedChanges: [],
    tags: ["건축", "개념설계", "스마트타워", "강남"]
  },
  {
    id: "ver-arch-200",
    projectId: "PRJ-ARCH-SEOUL-TOWER",
    projectName: "강남 스마트 친환경 랜드마크 타워",
    versionNumber: "v2.0.0",
    revisionCode: "Rev-1 (Current)",
    category: "Architectural & Interior",
    title: "강남 친환경 랜드마크 타워 BIPV & 바이오필릭 상세 도면",
    author: {
      name: "진 갱 건축가",
      role: "지속가능 건축 총괄",
      department: "글로벌 친환경 설계그룹"
    },
    approver: {
      name: "서울시 심의위원회",
      role: "최종 승인기관",
      approvalDate: "2026-06-12",
      status: "Approved"
    },
    status: "Released",
    createdAt: "2026-06-01T11:00:00Z",
    updatedAt: "2026-06-12T09:00:00Z",
    changeSummary: "건물일체형 태양광(BIPV) 및 수직 정원 바이오필릭 디자인 적용, 에너지 자립률 85% 달성",
    revisionReason: "제로에너지건축물(ZEB) 1등급 및 LEED Platinum 인증 확보",
    blueprintImageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop",
    specifications: {
      floors: 38,
      totalArea: 52000,
      buildingHeight: 178,
      solarPanelArea: 3800,
      energyRating: "ZEB 1등급 (LEED Platinum)",
      estimatedCost: 1380
    },
    modifiedChanges: [
      {
        fieldName: "floors",
        fieldLabel: "층수",
        oldValue: 35,
        newValue: 38,
        unit: "층",
        impactLevel: "medium",
        category: "규모"
      },
      {
        fieldName: "totalArea",
        fieldLabel: "연면적",
        oldValue: 48000,
        newValue: 52000,
        unit: "㎡",
        impactLevel: "high",
        category: "규모"
      },
      {
        fieldName: "solarPanelArea",
        fieldLabel: "BIPV 태양광 패널 면적",
        oldValue: 1200,
        newValue: 3800,
        unit: "㎡",
        impactLevel: "critical",
        category: "친환경성"
      },
      {
        fieldName: "estimatedCost",
        fieldLabel: "총 공사비",
        oldValue: 1250,
        newValue: 1380,
        unit: "억원",
        impactLevel: "high",
        category: "원가"
      }
    ],
    tags: ["BIPV", "ZEB1등급", "LEEDPlatinum", "바이오필릭", "최종인허가"]
  }
];

const initDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("DesignVersionControlDB Error:", request.error);
      reject("DesignVersionControlDB를 여는데 실패했습니다.");
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("versionNumber", "versionNumber", { unique: false });

        // Bootstrap mock data
        INITIAL_MOCK_VERSIONS.forEach((item) => store.add(item));
      }
    };
  });
};

export const getAllDesignVersions = async (): Promise<DesignVersionItem[]> => {
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const res = request.result as DesignVersionItem[];
        if (!res || res.length === 0) {
          resolve(INITIAL_MOCK_VERSIONS);
        } else {
          // Sort descending by updatedAt
          res.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          resolve(res);
        }
      };
      request.onerror = () => resolve(INITIAL_MOCK_VERSIONS);
    });
  } catch (err) {
    console.warn("Falling back to in-memory mock versions:", err);
    return INITIAL_MOCK_VERSIONS;
  }
};

export const getVersionsByProject = async (projectId: string): Promise<DesignVersionItem[]> => {
  const all = await getAllDesignVersions();
  return all.filter((item) => item.projectId === projectId);
};

export const saveDesignVersion = async (versionItem: DesignVersionItem): Promise<void> => {
  try {
    const db = await initDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(versionItem);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Error saving design version:", err);
  }
};

export const compareDesignVersions = (
  baseVersion: DesignVersionItem,
  targetVersion: DesignVersionItem
): VersionDiffResult => {
  const baseSpecs = baseVersion.specifications || {};
  const targetSpecs = targetVersion.specifications || {};

  const addedSpecs: { key: string; value: string | number }[] = [];
  const removedSpecs: { key: string; value: string | number }[] = [];
  const modifiedSpecs: SpecFieldChange[] = [...(targetVersion.modifiedChanges || [])];

  const allKeys = new Set([...Object.keys(baseSpecs), ...Object.keys(targetSpecs)]);
  let unchangedCount = 0;

  allKeys.forEach((key) => {
    const baseVal = baseSpecs[key];
    const targetVal = targetSpecs[key];

    if (baseVal === undefined && targetVal !== undefined) {
      addedSpecs.push({ key, value: targetVal });
    } else if (baseVal !== undefined && targetVal === undefined) {
      removedSpecs.push({ key, value: baseVal });
    } else if (baseVal !== targetVal) {
      const existsInModified = modifiedSpecs.some((m) => m.fieldName === key);
      if (!existsInModified) {
        modifiedSpecs.push({
          fieldName: key,
          fieldLabel: key,
          oldValue: baseVal,
          newValue: targetVal,
          impactLevel: "medium",
          category: "일반성능"
        });
      }
    } else {
      unchangedCount++;
    }
  });

  // Calculate Impact Summary
  const weightOld = Number(baseSpecs.deadweight || baseSpecs.totalArea || 0);
  const weightNew = Number(targetSpecs.deadweight || targetSpecs.totalArea || 0);
  const weightDiff = weightNew - weightOld;

  const costOld = Number(baseSpecs.estimatedCost || 1);
  const costNew = Number(targetSpecs.estimatedCost || 1);
  const costDiffPercent = costOld > 0 ? Number((((costNew - costOld) / costOld) * 100).toFixed(1)) : 0;

  const bogOld = Number(baseSpecs.boilOffRate || baseSpecs.energyRating || 0);
  const bogNew = Number(targetSpecs.boilOffRate || targetSpecs.energyRating || 0);
  const energyDiffPercent = bogOld > 0 && typeof bogOld === 'number' && typeof bogNew === 'number'
    ? Number((((bogNew - bogOld) / bogOld) * 100).toFixed(1))
    : -12.5;

  let overallImpact: VersionDiffResult['overallImpact'] = 'low';
  if (modifiedSpecs.some(m => m.impactLevel === 'critical') || Math.abs(costDiffPercent) > 10) {
    overallImpact = 'critical';
  } else if (modifiedSpecs.some(m => m.impactLevel === 'high') || Math.abs(costDiffPercent) > 5) {
    overallImpact = 'high';
  } else if (modifiedSpecs.length > 2) {
    overallImpact = 'medium';
  }

  return {
    baseVersion,
    targetVersion,
    addedSpecs,
    removedSpecs,
    modifiedSpecs,
    unchangedSpecsCount: unchangedCount,
    overallImpact,
    impactSummary: {
      weightDiff,
      costDiffPercent,
      energyDiffPercent
    }
  };
};

export const exportVersionAuditReport = (projectId: string, versions: DesignVersionItem[]): string => {
  const projectVersions = versions.filter(v => v.projectId === projectId);
  
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    projectId,
    totalRevisions: projectVersions.length,
    latestVersion: projectVersions[0]?.versionNumber || "v1.0.0",
    revisions: projectVersions.map(v => ({
      version: v.versionNumber,
      code: v.revisionCode,
      title: v.title,
      author: `${v.author.name} (${v.author.role})`,
      status: v.status,
      approver: v.approver ? `${v.approver.name} - ${v.approver.status}` : 'N/A',
      updatedAt: v.updatedAt,
      changes: v.changeSummary,
      modifiedFieldsCount: v.modifiedChanges.length
    }))
  }, null, 2);
};

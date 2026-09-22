/**
 * 글로벌 건축 AI 도면 설계 엔진
 * 
 * 2025년~ 현대 건축 트렌드 반영
 * 글로벌 건축 거장들의 디자인 철학 통합
 * AI 건축 설계 마스터플랜 페르소나 시스템
 */

// ============================================================
// 1. 건축 거장 페르소나 정의
// ============================================================

interface ArchitectPersona {
  id: string;
  name: string;
  nameKo: string;
  region: 'domestic' | 'europe' | 'americas';
  awards: string[];
  designPhilosophy: string[];
  signatureStyles: string[];
  materialPreferences: string[];
  spatialConcepts: string[];
  sustainabilityApproach: string[];
  digitalTools: string[];
  famousProjects: string[];
  quotes: string[];
}

// ============================================================
// 2. 글로벌 건축 거장 데이터베이스
// ============================================================

const ARCHITECT_MASTERS: ArchitectPersona[] = [
  // ============================================================
  // 국내 거장 (Domestic Masters)
  // ============================================================
  {
    id: 'domestic-001',
    name: 'Cho Min-suk',
    nameKo: '조민석',
    region: 'domestic',
    awards: ['普利兹克建筑奖 (2023)', '韩国建筑文化大奖'],
    designPhilosophy: [
      '풍토성과 현대성의 조화',
      '자연과 건축의 유기적 연결',
      '한국 전통 공간의 현대적 해석',
      '지역 재료와 기술의 혁신적 활용'
    ],
    signatureStyles: [
      '노출 콘크리트',
      '자연 채광 극대화',
      '중정 공간 활용',
      '수평선과 지평선의 강조'
    ],
    materialPreferences: [
      '清水混凝土',
      '韩国传统木材',
      '天然石材',
      '再生材料'
    ],
    spatialConcepts: [
      '마당과 중정의 공간',
      '内外의 경계 허물기',
      '수직과 수평의 교차',
      '빛과 그림자의 연출'
    ],
    sustainabilityApproach: [
      '被动式节能设计',
      '本土材料优先使用',
      '自然通风采光优化',
      '地形适应性设计'
    ],
    digitalTools: ['Rhino', 'Grasshopper', 'Revit', 'Lumion'],
    famousProjects: [
      '韩国国家图书馆',
      '首尔东大门设计广场',
      '济州岛文化艺术中心'
    ],
    quotes: [
      '建筑是土地的记忆，也是未来的承诺。',
      '真正的创新来自于对传统的深刻理解。'
    ]
  },
  {
    id: 'domestic-002',
    name: 'Kim Jong-gil',
    nameKo: '김종길',
    region: 'domestic',
    awards: ['韩国建筑奖', '亚洲建筑师协会金奖'],
    designPhilosophy: [
      '空间의 시적 표현',
      '건축과 자연의 대화',
      '한국적 미감의 현대적 구현',
      '소박함 속의 웅장함'
    ],
    signatureStyles: [
      '传统韩屋的现代演绎',
      '自然曲线的运用',
      '光影效果的极致追求',
      '空间的留白艺术'
    ],
    materialPreferences: [
      '韩国传统瓦片',
      '天然木材',
      '夯土材料',
      '现代混凝土'
    ],
    spatialConcepts: [
      '마루와 온돌의 공간',
      '景与空间的融合',
      '时间的建筑化表达',
      '记忆的空间化'
    ],
    sustainabilityApproach: [
      '传统智慧的现代应用',
      '被动式气候调节',
      '本地材料循环利用',
      '生态系统整合设计'
    ],
    digitalTools: ['AutoCAD', 'SketchUp', 'V-Ray', 'Adobe Suite'],
    famousProjects: [
      '韩国传统村落改造项目',
      '首尔北村韩屋保护区',
      '江原道度假酒店'
    ],
    quotes: [
      '建筑应该像一首诗，静静地诉说着土地的故事。',
      '真正的奢华是与自然和谐共处。'
    ]
  },

  // ============================================================
  // 유럽 거장 (European Masters)
  // ============================================================
  {
    id: 'europe-001',
    name: 'Bjarke Ingels',
    nameKo: '야르케 인겔스',
    region: 'europe',
    awards: ['普利兹克建筑奖 (2024)', '丹麦建筑奖', '欧洲建筑奖'],
    designPhilosophy: [
      '实用乌托邦主义',
      'Yes is More 哲学',
      '社会可持续性与美学的平衡',
      '建筑作为社会催化剂'
    ],
    signatureStyles: [
      '参数化设计',
      '几何形态的创新',
      '公共空间的重视',
      '适应性再利用'
    ],
    materialPreferences: [
      '参数化混凝土',
      '可持续木材',
      '高性能玻璃',
      '再生钢材'
    ],
    spatialConcepts: [
      '立体城市概念',
      '社交空间的创新',
      '垂直绿化整合',
      '弹性空间设计'
    ],
    sustainabilityApproach: [
      '碳中性建筑设计',
      '可再生能源整合',
      '循环经济原则',
      '社会公平性考量'
    ],
    digitalTools: ['Grasshopper', 'Rhino', 'Maya', 'Cinema 4D'],
    famousProjects: [
      'CopenHill 能源工厂',
      'VIA 57 West 住宅',
      '乐高之家',
      '台北表演艺术中心'
    ],
    quotes: [
      '建筑应该解决实际问题，同时激发想象力。',
      'Yes is More - 复杂问题需要更复杂的解决方案。'
    ]
  },
  {
    id: 'europe-002',
    name: 'Zaha Hadid',
    nameKo: '자하 하디드',
    region: 'europe',
    awards: ['普利兹克建筑奖 (2004)', '英国皇家建筑师协会金奖'],
    designPhilosophy: [
      '解构主义建筑',
      '流动性空间概念',
      '未来主义美学',
      '建筑与城市的对话'
    ],
    signatureStyles: [
      '流动的曲线形态',
      '动态空间体验',
      '参数化表皮设计',
      '大胆的结构创新'
    ],
    materialPreferences: [
      '高性能混凝土',
      '钛合金面板',
      '智能玻璃',
      '复合材料'
    ],
    spatialConcepts: [
      '无缝流动空间',
      '多维度空间体验',
      '动态功能分区',
      '沉浸式空间序列'
    ],
    sustainabilityApproach: [
      '被动式设计策略',
      '可再生能源整合',
      '智能建筑系统',
      '生命周期评估'
    ],
    digitalTools: ['Zaha Hadid Architects ZHA Platform', 'Maya', 'Rhino', 'CATIA'],
    famousProjects: [
      '广州大剧院',
      '伦敦水上运动中心',
      '北京大兴国际机场',
      '阿利耶夫文化中心'
    ],
    quotes: [
      '建筑应该像自然一样流动，充满生命力。',
      '未来不是预测出来的，而是设计出来的。'
    ]
  },

  // ============================================================
  // 미주 거장 (Americas Masters)
  // ============================================================
  {
    id: 'americas-001',
    name: 'Frank Gehry',
    nameKo: '프랭크 게리',
    region: 'americas',
    awards: ['普利兹克建筑奖 (1989)', '美国国家艺术奖章'],
    designPhilosophy: [
      '解构主义建筑',
      '建筑作为雕塑艺术',
      '材料的创新表达',
      '城市文脉的回应'
    ],
    signatureStyles: [
      '钛金属曲面',
      '不规则几何形态',
      '建筑与艺术的融合',
      '大胆的结构表现'
    ],
    materialPreferences: [
      '钛金属板',
      '不锈钢',
      '玻璃幕墙',
      '再生材料'
    ],
    spatialConcepts: [
      '动态空间体验',
      '内外空间的模糊界限',
      '多层次空间序列',
      '光影效果的戏剧性'
    ],
    sustainabilityApproach: [
      '材料循环利用',
      '能源效率优化',
      '适应性再利用',
      '社区参与设计'
    ],
    digitalTools: ['CATIA', 'Digital Project', 'Rhino', 'Maya'],
    famousProjects: [
      '毕尔巴鄂古根海姆博物馆',
      '洛杉矶迪士尼音乐厅',
      '西雅图流行文化博物馆',
      '巴黎路易威登基金会'
    ],
    quotes: [
      '建筑应该让人感到惊喜和愉悦。',
      '每一座建筑都应该讲述一个独特的故事。'
    ]
  },
  {
    id: 'americas-002',
    name: 'Jeanne Gang',
    nameKo: '진 갱',
    region: 'americas',
    awards: ['MacArthur Fellowship', '美国建筑师协会金奖'],
    designPhilosophy: [
      '生态建筑学',
      '社区参与式设计',
      '材料科学与建筑创新',
      '城市生态系统的整合'
    ],
    signatureStyles: [
      '有机形态设计',
      '垂直森林概念',
      '参数化表皮',
      '社区中心设计'
    ],
    materialPreferences: [
      '可持续木材',
      '高性能混凝土',
      '智能玻璃',
      '再生钢材'
    ],
    spatialConcepts: [
      '垂直社区概念',
      '生态空间整合',
      '社交空间创新',
      '弹性功能分区'
    ],
    sustainabilityApproach: [
      '碳封存材料使用',
      '生物多样性整合',
      '水资源管理',
      '能源自给自足设计'
    ],
    digitalTools: ['Rhino', 'Grasshopper', 'Ladybug', 'EnergyPlus'],
    famousProjects: [
      '芝加哥 Aqua Tower',
      '纽约 Gilder Center',
      '芝加哥 Writers Theatre',
      '旧金山 Salesforce Transit Center'
    ],
    quotes: [
      '建筑应该促进人与自然的连接。',
      '好的建筑能够增强社区的凝聚力。'
    ]
  }
];

// ============================================================
// 3. 건축 설계 분야별 섹션 정의
// ============================================================

interface DesignSection {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  subSections: string[];
  designPrinciples: string[];
  softwareTools: string[];
  outputFormats: string[];
}

const DESIGN_SECTIONS: DesignSection[] = [
  {
    id: 'structural',
    name: 'Structural Design',
    nameKo: '구조 설계',
    description: '건축물의 구조 시스템 설계 및 구조 분석',
    subSections: [
      '기초 설계',
      '골조 설계',
      '지붕 구조',
      '내진 설계',
      '풍하중 해석'
    ],
    designPrinciples: [
      '구조 안정성 확보',
      '재료 효율성 최대화',
      '시공성 고려',
      '경제성 확보'
    ],
    softwareTools: ['ETABS', 'SAP2000', 'Robot Structural Analysis', 'Revit Structure'],
    outputFormats: ['구조 계산서', '구조 도면', '3D 구조 모델', '재료 명세서']
  },
  {
    id: 'mep',
    name: 'MEP Design',
    nameKo: '기계/전기/배관 설계',
    description: '건축물의 기계, 전기, 배관 시스템 설계',
    subSections: [
      'HVAC 시스템',
      '급배수 시스템',
      '전력 시스템',
      '소방 시스템',
      '통신 시스템'
    ],
    designPrinciples: [
      '에너지 효율 최적화',
      '실내 환경 쾌적성 확보',
      '유지보수 용이성',
      '안전 기준 충족'
    ],
    softwareTools: ['Revit MEP', 'AutoCAD MEP', 'IESVE', 'EnergyPlus'],
    outputFormats: ['MEP 도면', '에너지 분석 보고서', '시스템 다이어그램', '사양서']
  },
  {
    id: 'interior',
    name: 'Interior Design',
    nameKo: '인테리어 설계',
    description: '건축물 내부 공간 설계 및 마감재 선정',
    subSections: [
      '공간 계획',
      '가구 배치',
      '조명 설계',
      '마감재 선정',
      '색채 계획'
    ],
    designPrinciples: [
      '공간 기능성 확보',
      '심미적 가치 추구',
      '사용자 편의성',
      '유지관리 용이성'
    ],
    softwareTools: ['3ds Max', 'SketchUp', 'V-Ray', 'Adobe Creative Suite'],
    outputFormats: ['인테리어 도면', '3D 렌더링', '마감재 명세서', '가구 배치도']
  },
  {
    id: 'landscape',
    name: 'Landscape Design',
    nameKo: '조경 설계',
    description: '건축물 주변 외부 공간 및 조경 설계',
    subSections: [
      '대지 계획',
      '식재 설계',
      '포장 설계',
      '시설물 설계',
      '수경 설계'
    ],
    designPrinciples: [
      '생태적 조경 설계',
      '사용자 경험 디자인',
      '유지관리 효율성',
      '경관 가치 창출'
    ],
    softwareTools: ['Lumion', 'Enscape', 'AutoCAD', 'Adobe Suite'],
    outputFormats: ['조경 도면', '식재 계획서', '3D 조감도', '유지관리 매뉴얼']
  },
  {
    id: 'sustainability',
    name: 'Sustainability Design',
    nameKo: '지속가능 설계',
    description: '친환경 및 지속가능한 건축 설계',
    subSections: [
      '에너지 효율 설계',
      '친환경 재료 선정',
      '물 재이용 시스템',
      '탄소 발자국 저감',
      '건강한 실내환경'
    ],
    designPrinciples: [
      '에너지 자립 건축',
      '순환경제 원칙',
      '생태계 서비스 통합',
      '사회적 지속가능성'
    ],
    softwareTools: ['Ladybug Tools', 'EnergyPlus', 'OpenStudio', 'Sefaira'],
    outputFormats: ['에너지 분석 보고서', 'LEED 인증 서류', '탄소 배출 분석', '생태 계획서']
  }
];

// ============================================================
// 4. 건축 설계 AI 프롬프트 엔진
// ============================================================

interface DesignPrompt {
  id: string;
  section: string;
  masterArchitect?: string;
  designPhase: 'concept' | 'schematic' | 'design-development' | 'construction-documents';
  complexity: 'basic' | 'intermediate' | 'advanced' | 'master';
  promptTemplate: string;
  parameters: Record<string, any>;
  expectedOutput: string[];
}

class ArchitectureAIEngine {
  private masters: ArchitectPersona[];
  private sections: DesignSection[];
  private currentMaster: ArchitectPersona | null = null;
  private currentSection: DesignSection | null = null;
  
  constructor() {
    this.masters = ARCHITECT_MASTERS;
    this.sections = DESIGN_SECTIONS;
  }
  
  // ============================================================
  // 4.1 마스터 아키텍트 선택
  // ============================================================
  
  selectMaster(masterId: string): ArchitectPersona | null {
    const master = this.masters.find(m => m.id === masterId);
    if (master) {
      this.currentMaster = master;
      console.log(`선택된 건축 거장: ${master.nameKo} (${master.name})`);
      return master;
    }
    console.error(`건축 거장을 찾을 수 없습니다: ${masterId}`);
    return null;
  }
  
  selectMasterByRegion(region: 'domestic' | 'europe' | 'americas'): ArchitectPersona[] {
    return this.masters.filter(m => m.region === region);
  }
  
  // ============================================================
  // 4.2 설계 섹션 선택
  // ============================================================
  
  selectSection(sectionId: string): DesignSection | null {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      this.currentSection = section;
      console.log(`선택된 설계 섹션: ${section.nameKo} (${section.name})`);
      return section;
    }
    console.error(`설계 섹션을 찾을 수 없습니다: ${sectionId}`);
    return null;
  }
  
  // ============================================================
  // 4.3 프롬프트 생성 엔진
  // ============================================================
  
  generateDesignPrompt(
    projectType: string,
    location: string,
    area: number,
    requirements: string[],
    phase: DesignPrompt['designPhase'] = 'concept',
    complexity: DesignPrompt['complexity'] = 'intermediate'
  ): string {
    if (!this.currentMaster || !this.currentSection) {
      throw new Error('건축 거장과 설계 섹션을 먼저 선택해주세요.');
    }
    
    const master = this.currentMaster;
    const section = this.currentSection;
    
    // 기본 프롬프트 구조
    const basePrompt = this.buildBasePrompt(projectType, location, area, requirements);
    
    // 마스터 스타일 적용
    const masterStylePrompt = this.applyMasterStyle(master, phase);
    
    // 섹션별 전문 지식 적용
    const sectionPrompt = this.applySectionKnowledge(section, complexity);
    
    // 디자인 단계별 프롬프트
    const phasePrompt = this.generatePhaseSpecificPrompt(phase);
    
    // 통합 프롬프트 생성
    const integratedPrompt = this.integratePrompts(
      basePrompt,
      masterStylePrompt,
      sectionPrompt,
      phasePrompt
    );
    
    return integratedPrompt;
  }
  
  private buildBasePrompt(
    projectType: string,
    location: string,
    area: number,
    requirements: string[]
  ): string {
    return `
[기본 설계 정보]
- 프로젝트 유형: ${projectType}
- 대지 위치: ${location}
- 연면적: ${area}㎡
- 주요 요구사항:
${requirements.map(req => `  • ${req}`).join('\n')}
`;
  }
  
  private applyMasterStyle(master: ArchitectPersona, _phase: string): string {
    return `
[건축 거장 디자인 철학 적용]
- 건축가: ${master.nameKo} (${master.name})
- 수상 경력: ${master.awards.join(', ')}

디자인 철학:
${master.designPhilosophy.map(phil => `  • ${phil}`).join('\n')}

시그니처 스타일:
${master.signatureStyles.map(style => `  • ${style}`).join('\n')}

공간 개념:
${master.spatialConcepts.map(concept => `  • ${concept}`).join('\n')}

재료 선호:
${master.materialPreferences.map(mat => `  • ${mat}`).join('\n')}

지속가능성 접근:
${master.sustainabilityApproach.map(approach => `  • ${approach}`).join('\n')}

대표 프로젝트:
${master.famousProjects.map(project => `  • ${project}`).join('\n')}

디자인 격언:
${master.quotes.map(quote => `  • "${quote}"`).join('\n')}
`;
  }
  
  private applySectionKnowledge(section: DesignSection, complexity: string): string {
    return `
[전문 설계 섹션: ${section.nameKo}]
- 섹션 설명: ${section.description}

하위 분야:
${section.subSections.map(sub => `  • ${sub}`).join('\n')}

설계 원칙:
${section.designPrinciples.map(principle => `  • ${principle}`).join('\n')}

사용 소프트웨어:
${section.softwareTools.join(', ')}

산출물 형식:
${section.outputFormats.join(', ')}

복잡도 수준: ${complexity}
`;
  }
  
  private generatePhaseSpecificPrompt(phase: string): string {
    const phasePrompts: Record<string, string> = {
      'concept': `
[개념 설계 단계]
- 디자인 컨셉 개발
- 대지 분석 및 맥락 연구
- 공간 프로그램 정의
- 형태 생성 원칙
- 재료 및 색채 컨셉
- 에너지 전략 수립
- 3D 매스 스터디
- 스케치 및 다이어그램
`,
      'schematic': `
[설계 개요 단계]
- 평면 계획 및 공간 배치
- 입면 디자인 개발
- 단면 설계
- 구조 시스템 선정
- 재료 마감 계획
- 에너지 모델링
- 3D 렌더링
- 고객 프레젠테이션
`,
      'design-development': `
[설계 발전 단계]
- 상세 평면 설계
- 입면 상세 개발
- 단면 상세 설계
- 구조 상세 설계
- MEP 시스템 통합
- 재료 스펙 확정
- 비용 추정
- 시공 계획
`,
      'construction-documents': `
[시공 문서 단계]
- 시공 도면 작성
- 상세 도면 작성
- 사양서 작성
- 재료 명세서
- 시공 순서 계획
- 비용 산출
- 인허가 서류
- 시공 품질 관리
`
    };
    
    return phasePrompts[phase] || phasePrompts['concept'];
  }
  
  private integratePrompts(
    basePrompt: string,
    masterStylePrompt: string,
    sectionPrompt: string,
    phasePrompt: string
  ): string {
    return `
============================================================
🏗️ AI 건축 설계 마스터플랜 프롬프트
============================================================
${basePrompt}
${masterStylePrompt}
${sectionPrompt}
${phasePrompt}
============================================================
📋 설계 지시사항
============================================================

위의 정보를 바탕으로 다음을 수행해주세요:

1. **디자인 컨셉 개발**
   - 건축가의 디자인 철학을 반영한 컨셉 도출
   - 대지 맥락과의 관계 설정
   - 공간의 시적 표현 방안

2. **공간 계획**
   - 기능적 요구사항 충족
   - 공간의 순서와 흐름 설계
   - 내외부 공간의 관계 설정

3. **형태 디자인**
   - 건축가의 시그니처 스타일 적용
   - 구조적 가능성 고려
   - 재료와 형태의 관계

4. **기술적 해결**
   - 구조 시스템 설계
   - MEP 시스템 통합
   - 에너지 효율 최적화

5. **시각화 및 표현**
   - 스케치 및 다이어그램
   - 3D 렌더링
   - 프레젠테이션 자료

6. **지속가능성 통합**
   - 친환경 재료 사용
   - 에너지 자립 방안
   - 생태계 서비스 통합

============================================================
`;
  }
  
  // ============================================================
  // 4.4 특화 프롬프트 생성 함수들
  // ============================================================
  
  generateStructuralPrompt(
    structuralSystem: string,
    loadConditions: string[],
    materialSpec: string
  ): string {
    return `
[구조 설계 전문 프롬프트]

구조 시스템: ${structuralSystem}
하중 조건: ${loadConditions.join(', ')}
재료 사양: ${materialSpec}

다음 구조 설계를 수행해주세요:

1. 구조 시스템 선정 및 정당화
2. 하중 해석 및 분석
3. 구조 부재 치수 산정
4. 기초 설계
5. 내진 설계 검토
6. 구조 도면 작성
7. 구조 계산서 작성

요구사항:
- 건축 설계 기준 (KDS) 준수
- 내진 설계 기준 적용
- 구조 안정성 확보
- 시공성 고려
- 경제성 확보
`;
  }
  
  generateMEPPrompt(
    systemType: string,
    climateConditions: string,
    energyTarget: string
  ): string {
    return `
[MEP 설계 전문 프롬프트]

시스템 유형: ${systemType}
기후 조건: ${climateConditions}
에너지 목표: ${energyTarget}

다음 MEP 설계를 수행해주세요:

1. HVAC 시스템 설계
   - 냉난방 부하 계산
   - 시스템 선정
   - 덕트 및 배관 설계
   - 제어 시스템 설계

2. 급배수 시스템 설계
   - 급수 시스템
   - 배수 시스템
   - 온수 시스템
   - 빗물 재이용 시스템

3. 전력 시스템 설계
   - 수전 설비
   - 배전 시스템
   - 조명 시스템
   - 비상 전원 시스템

4. 소방 시스템 설계
   - 소화 설비
   - 경보 시스템
   - 피난 설비
   - 연동 제어 시스템

요구사항:
- 에너지 효율 최적화
- 실내 환경 쾌적성 확보
- 유지보수 용이성
- 안전 기준 충족
`;
  }
  
  generateInteriorPrompt(
    styleConcept: string,
    userNeeds: string[],
    budgetRange: string
  ): string {
    return `
[인테리어 설계 전문 프롬프트]

스타일 컨셉: ${styleConcept}
사용자 요구: ${userNeeds.join(', ')}
예산 범위: ${budgetRange}

다음 인테리어 설계를 수행해주세요:

1. 공간 계획
   - 기능적 배치
   - 동선 계획
   - 수납 공간 계획
   - 가구 배치

2. 마감재 선정
   - 바닥재
   - 벽체 마감
   - 천장 마감
   - 창호 및 문

3. 조명 설계
   - 기본 조명
   - 액센트 조명
   - 작업 조명
   - 분위기 조명

4. 색채 계획
   - 메인 컬러
   - 포인트 컬러
   - 재료별 색채
   - 빛과 색의 관계

5. 가구 및 소품
   - 가구 스타일
   - 소품 배치
   - 아트워크
   - 식물 배치

요구사항:
- 사용자 라이프스타일 반영
- 공간의 기능성 확보
- 심미적 가치 추구
- 유지관리 용이성
`;
  }
  
  generateLandscapePrompt(
    siteContext: string,
    plantPalette: string[],
    designTheme: string
  ): string {
    return `
[조경 설계 전문 프롬프트]

대지 맥락: ${siteContext}
식물 팔레트: ${plantPalette.join(', ')}
디자인 테마: ${designTheme}

다음 조경 설계를 수행해주세요:

1. 대지 계획
   - 지형 분석
   - 경관 분석
   - 접근성 계획
   - 기능 구역 설정

2. 식재 설계
   - 식물 선정 기준
   - 식재 배치 계획
   - 계절별 경관
   - 유지관리 계획

3. 시설물 설계
   - 휴게 시설
   - 놀이 시설
   - 운동 시설
   - 안내 시설

4. 포장 설계
   - 산책로
   - 광장
   - 주차장
   - 자전거 도로

5. 수경 설계
   - 분수
   - 연못
   - 폭포
   - 수로

요구사항:
- 생태적 조경 설계
- 사용자 경험 디자인
- 유지관리 효율성
- 경관 가치 창출
`;
  }
  
  generateSustainabilityPrompt(
    certificationTarget: string,
    energyStrategy: string[],
    materialApproach: string
  ): string {
    return `
[지속가능 설계 전문 프롬프트]

인증 목표: ${certificationTarget}
에너지 전략: ${energyStrategy.join(', ')}
재료 접근법: ${materialApproach}

다음 지속가능 설계를 수행해주세요:

1. 에너지 효율 설계
   - 건축 외피 설계
   - 자연 채광 최적화
   - 자연 환기 설계
   - 태양열 시스템
   - 지열 시스템

2. 친환경 재료 선정
   - 저탄소 재료
   - 재활용 재료
   - 자연 재료
   - 재료 라이프사이클

3. 물 관리 시스템
   - 빗물 수집
   - 중수도 시스템
   - 절수 설비
   - 조경 관개 시스템

4. 실내 환경 품질
   - 실내 공기질
   - 열 쾌적성
   - 음향 환경
   - 시각 쾌적성

5. 생태계 서비스
   - 생태 통로
   - 생물 다양성
   - 탄소 흡수원
   - 도시 열섬 완화

요구사항:
- 에너지 자립 건축
- 순환경제 원칙
- 생태계 서비스 통합
- 사회적 지속가능성
`;
  }
}

// ============================================================
// 5. 2025년~ 현대 건축 트렌드 통합
// ============================================================

interface ModernTrend {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  keyTechnologies: string[];
  designApplications: string[];
  sustainabilityImpact: string[];
  implementationChallenges: string[];
}

const MODERN_TRENDS_2025: ModernTrend[] = [
  {
    id: 'ai-generative-design',
    name: 'AI Generative Design',
    nameKo: 'AI 생성 설계',
    description: 'AI 알고리즘을 활용한 디자인 자동 생성 및 최적화',
    keyTechnologies: [
      'Generative Adversarial Networks (GANs)',
      'Reinforcement Learning',
      'Parametric Design Algorithms',
      'Machine Learning Optimization'
    ],
    designApplications: [
      '형태 생성 최적화',
      '구조 시스템 최적화',
      '에너지 효율 최적화',
      '공간 계획 자동화'
    ],
    sustainabilityImpact: [
      '자재 사용량 최소화',
      '에너지 소비 최적화',
      '건설 폐기물 감소',
      '수명주기 비용 절감'
    ],
    implementationChallenges: [
      '데이터 품질 확보',
      '알고리즘 편향성',
      '건축가의 역할 재정의',
      '법적 책임 소재'
    ]
  },
  {
    id: 'digital-twin',
    name: 'Digital Twin Technology',
    nameKo: '디지털 트윈 기술',
    description: '실제 건축물의 디지털 복제품을 통한 시뮬레이션 및 관리',
    keyTechnologies: [
      'IoT 센서 네트워크',
      'BIM 통합 플랫폼',
      '실시간 데이터 분석',
      '예측 유지보수 알고리즘'
    ],
    designApplications: [
      '설계 검증 시뮬레이션',
      '에너지 성능 예측',
      '사용자 행동 분석',
      '유지보수 계획 수립'
    ],
    sustainabilityImpact: [
      '에너지 소비 모니터링',
      '실내 환경 최적화',
      '설비 수명 연장',
      '운영 비용 절감'
    ],
    implementationChallenges: [
      '초기 구축 비용',
      '데이터 보안',
      '시스템 통합 복잡성',
      '표준화 부족'
    ]
  },
  {
    id: 'biophilic-design',
    name: 'Biophilic Design',
    nameKo: '생태 친화적 설계',
    description: '자연 요소를 건축에 통합하여 인간의 웰빙 향상',
    keyTechnologies: [
      '수직 정원 시스템',
      '자연 채광 시뮬레이션',
      '자연 환기 시스템',
      '생태 재료 기술'
    ],
    designApplications: [
      '실내 녹화 공간',
      '자연 채광 최적화',
      '자연 소리 통합',
      '자연 재료 사용'
    ],
    sustainabilityImpact: [
      '실내 공기질 개선',
      '스트레스 감소',
      '생산성 향상',
      '생물 다양성 증진'
    ],
    implementationChallenges: [
      '유지관리 비용',
      '식물 생육 환경',
      '공간 제약',
      '비용 대비 효과 측정'
    ]
  },
  {
    id: 'modular-construction',
    name: 'Modular Construction',
    nameKo: '모듈러 건설',
    description: '공장 제작 후 현장 조립하는 건설 방식',
    keyTechnologies: [
      'BIM 기반 설계',
      '로봇 자동화',
      '3D 프린팅',
      '디지털 팩토리'
    ],
    designApplications: [
      '표준화된 모듈 설계',
      '유연한 공간 구성',
      '빠른 시공',
      '품질 관리'
    ],
    sustainabilityImpact: [
      '건설 폐기물 감소',
      '현장 작업 시간 단축',
      '에너지 효율 향상',
      '자재 재사용'
    ],
    implementationChallenges: [
      '운송 제약',
      '디자인 유연성',
      '초기 투자 비용',
      '법적 규제'
    ]
  },
  {
    id: 'adaptive-reuse',
    name: 'Adaptive Reuse',
    nameKo: '적응적 재이용',
    description: '기존 건축물을 새로운 기능으로 전환하여 재사용',
    keyTechnologies: [
      '3D 스캐닝',
      '구조 진단 기술',
      '에너지 리모델링',
      '역사적 보존 기술'
    ],
    designApplications: [
      '기존 구조 활용',
      '새로운 기능 부여',
      '에너지 성능 개선',
      '역사적 가치 보존'
    ],
    sustainabilityImpact: [
      '건축 폐기물 감소',
      '에너지 소비 절감',
      '문화적 가치 보존',
      '지역 사회 활성화'
    ],
    implementationChallenges: [
      '구조적 안전성',
      '법적 규제',
      '비용 대비 효과',
      '원래 용도와의 충돌'
    ]
  }
];

// ============================================================
// 6. 통합 건축 AI 시스템 클래스
// ============================================================

class IntegratedArchitectureAI {
  private engine: ArchitectureAIEngine;
  private trends: ModernTrend[];
  
  constructor() {
    this.engine = new ArchitectureAIEngine();
    this.trends = MODERN_TRENDS_2025;
  }
  
  // ============================================================
  // 6.1 통합 설계 프로세스
  // ============================================================
  
  async executeDesignProcess(
    projectBrief: {
      type: string;
      location: string;
      area: number;
      requirements: string[];
      budget: string;
      timeline: string;
    },
    masterId: string,
    sectionId: string,
    phase: DesignPrompt['designPhase'],
    complexity: DesignPrompt['complexity']
  ): Promise<{
    designConcept: string;
    technicalSolution: string;
    sustainabilityPlan: string;
    visualizationBrief: string;
    implementationPlan: string;
  }> {
    // 1. 마스터 및 섹션 선택
    const master = this.engine.selectMaster(masterId);
    const section = this.engine.selectSection(sectionId);
    
    if (!master || !section) {
      throw new Error('잘못된 마스터 또는 섹션 ID입니다.');
    }
    
    // 2. 기본 설계 프롬프트 생성
    const baseDesignPrompt = this.engine.generateDesignPrompt(
      projectBrief.type,
      projectBrief.location,
      projectBrief.area,
      projectBrief.requirements,
      phase,
      complexity
    );
    
    // 3. 현대 트렌드 통합
    const modernTrendsIntegration = this.integrateModernTrends(projectBrief.type);
    
    // 4. 기술적 솔루션 생성
    const technicalSolution = await this.generateTechnicalSolution(
      section,
      projectBrief.requirements
    );
    
    // 5. 지속가능성 계획 수립
    const sustainabilityPlan = this.createSustainabilityPlan(
      master,
      projectBrief.requirements
    );
    
    // 6. 시각화 명세서 작성
    const visualizationBrief = this.createVisualizationBrief(
      master,
      phase,
      projectBrief.type
    );
    
    // 7. 구현 계획 수립
    const implementationPlan = this.createImplementationPlan(
      projectBrief.timeline,
      projectBrief.budget,
      complexity
    );
    
    return {
      designConcept: baseDesignPrompt + modernTrendsIntegration,
      technicalSolution,
      sustainabilityPlan,
      visualizationBrief,
      implementationPlan
    };
  }
  
  // ============================================================
  // 6.2 현대 트렌트 통합
  // ============================================================
  
  private integrateModernTrends(projectType: string): string {
    let trendsIntegration = `
============================================================
🚀 2025년~ 현대 건축 트렌드 통합
============================================================
`;
    
    // 프로젝트 유형에 따른 관련 트렌드 선정
    const relevantTrends = this.selectRelevantTrends(projectType);
    
    relevantTrends.forEach(trend => {
      trendsIntegration += `
[${trend.nameKo}]
${trend.description}

핵심 기술:
${trend.keyTechnologies.map(tech => `  • ${tech}`).join('\n')}

디자인 적용:
${trend.designApplications.map(app => `  • ${app}`).join('\n')}

지속가능성 영향:
${trend.sustainabilityImpact.map(impact => `  • ${impact}`).join('\n')}

구현 과제:
${trend.implementationChallenges.map(challenge => `  • ${challenge}`).join('\n')}
`;
    });
    
    return trendsIntegration;
  }
  
  private selectRelevantTrends(projectType: string): ModernTrend[] {
    // 프로젝트 유형에 따라 관련 트렌드 선정
    const trendMapping: Record<string, string[]> = {
      'commercial': ['ai-generative-design', 'digital-twin', 'biophilic-design'],
      'residential': ['biophilic-design', 'modular-construction', 'adaptive-reuse'],
      'cultural': ['ai-generative-design', 'adaptive-reuse', 'biophilic-design'],
      'industrial': ['digital-twin', 'modular-construction', 'ai-generative-design'],
      'educational': ['biophilic-design', 'digital-twin', 'ai-generative-design']
    };
    
    const trendIds = trendMapping[projectType] || ['ai-generative-design', 'biophilic-design'];
    return this.trends.filter(trend => trendIds.includes(trend.id));
  }
  
  // ============================================================
  // 6.3 기술적 솔루션 생성
  // ============================================================
  
  private async generateTechnicalSolution(
    section: DesignSection,
    requirements: string[]
  ): Promise<string> {
    let solution = `
============================================================
🔧 기술적 솔루션 (${section.nameKo})
============================================================

소프트웨어 도구: ${section.softwareTools.join(', ')}
산출물 형식: ${section.outputFormats.join(', ')}

기술적 요구사항:
${requirements.map(req => `  • ${req}`).join('\n')}

설계 원칙:
${section.designPrinciples.map(principle => `  • ${principle}`).join('\n')}

구현 전략:
`;
    
    // 섹션별 구체적인 기술 솔루션 추가
    switch (section.id) {
      case 'structural':
        solution += this.generateStructuralSolution();
        break;
      case 'mep':
        solution += this.generateMEPSolution();
        break;
      case 'interior':
        solution += this.generateInteriorSolution();
        break;
      case 'landscape':
        solution += this.generateLandscapeSolution();
        break;
      case 'sustainability':
        solution += this.generateSustainabilitySolution();
        break;
    }
    
    return solution;
  }
  
  private generateStructuralSolution(): string {
    return `
1. 구조 시스템 선정
   - 골조 시스템: 철근콘크리트, 철골, 복합 구조
   - 지붕 시스템: 트러스, 라멘, 셀
   - 기초 시계: 독립기초, 연결기초, 매트기초

2. 하중 해석
   - 정적 하중: 자중, 고정하중
   - 가변 하중: 활하중, 적재하중
   - 환경 하중: 풍하중, 지진하중

3. 구조 부재 설계
   - 기둥: 단면 결정, 배근 설계
   - 보: 휨, 전단 검토
   - 슬래브: 두께, 배근 설계

4. 구조 안정성 검토
   - 내진 설계: 응답 수정 계수, 층간변위
   - 풍하중 설계: 풍진동, 와류 유발 진동
   - 안전율 검토: 허용 응력, 극한 응력
`;
  }
  
  private generateMEPSolution(): string {
    return `
1. HVAC 시스템 설계
   - 냉난방 부하 계산: CLTD/CLF 방법
   - 시스템 선정: 개별, 중앙, 지역
   - 덕트 설계: 풍량, 속도, 소음
   - 제어 시스템: DDC, BACnet

2. 급배수 시스템
   - 급수 시스템: 직접, 간접 급수
   - 배수 시스템: 오수, 우수 분리
   - 온수 시스템: 중앙, 개별 온수
   - 소화 설비: 스프링클러, 소화전

3. 전력 시스템
   - 수전 설비: 변압기, 차단기
   - 배전 시스템: 수직, 수평 배전
   - 조명 시스템: 일반, 특수 조명
   - 통신 시스템: 전화, 인터넷, 방송

4. 특수 시스템
   - 엘리베이터: 승객, 화물
   - 소방 시스템: 경보, 소화, 피난
   - 보안 시스템: CCTV, 출입통제
`;
  }
  
  private generateInteriorSolution(): string {
    return `
1. 공간 계획
   - 기능적 배치: 업무, 휴게, 공용
   - 동선 계획: 직원, 방문객, 물류
   - 수납 공간: 문서, 개인物品
   - 가구 배치: 높이, 간격, 배치

2. 마감재 선정
   - 바닥재: 대리석, 목재, 카펫
   - 벽체: 페인트, 벽지, 패널
   - 천장: 메쉬, 패널, 노출
   - 창호: 유리, 프레임, 하드웨어

3. 조명 설계
   - 기본 조명: 300~500 lux
   - 액센트 조명: 그림, 조각
   - 작업 조명: 500~750 lux
   - 분위기 조명: 간접, 장식

4. 색채 계획
   - 메인 컬러: 60%
   - 보조 컬러: 30%
   - 포인트 컬러: 10%
   - 재료별 색채: 바닥, 벽, 천장
`;
  }
  
  private generateLandscapeSolution(): string {
    return `
1. 대지 계획
   - 지형 분석: 경사, 방위, 조망
   - 기능 구역: 진입, 주차, 활동
   - 동선 계획: 보행, 차량, 자전거
   - 경관 축: 시각적 연결

2. 식재 설계
   - 식물 선정: 수목, 관목, 초화
   - 식재 배치: 군식, 점식, 열식
   - 계절별 경관: 봄, 여름, 가을, 겨울
   - 유지관리: 전정, 시비, 관수

3. 시설물 설계
   - 휴게 시설: 벤치, 파고라, 정자
   - 놀이 시설: 모래, 놀이기구
   - 운동 시설: 체육, 운동기구
   - 안내 시설: 사인, 안내판

4. 포장 설계
   - 산책로: 폭, 재료, 단차
   - 광장: 패턴, 재료, 기능
   - 주차장: 투수성, 녹화
`;
  }
  
  private generateSustainabilitySolution(): string {
    return `
1. 에너지 효율 설계
   - 건축 외피: 단열, 기밀, 열교
   - 자연 채광: 창면적비, 채광 시뮬레이션
   - 자연 환기: 풍량, 환기 횟수
   - 신재생 에너지: 태양광, 태양열, 지열

2. 친환경 재료
   - 저탄소 콘크리트: CO2 저감
   - 재활용 강철: 고로 슬래그
   - 목재: 집성재, CLT
   - 단열재: 셀룰로오스, 면

3. 물 관리
   - 빗물 수집: 저장, 이용
   - 중수도: 세척, 관개
   - 절수 설비: 양변기, 세면대
   - 조경 관개: 점적, 스프링클러

4. 실내 환경
   - 공기질: CO2, VOC, 먼지
   - 열 쾌적: PMV, PPD
   - 음향: 잔향시간, 차음
   - 시각: 조도, 균등도
`;
  }
  
  // ============================================================
  // 6.4 지속가능성 계획
  // ============================================================
  
  private createSustainabilityPlan(
    master: ArchitectPersona,
    requirements: string[]
  ): string {
    return `
============================================================
🌿 지속가능성 계획
============================================================

건축가의 지속가능성 접근:
${master.sustainabilityApproach.map(approach => `  • ${approach}`).join('\n')}

요구사항:
${requirements.map(req => `  • ${req}`).join('\n')}

지속가능성 전략:
1. 에너지 전략
   - 패시브 하우스 기준 적용
   - 신재생 에너지 100% 공급
   - 에너지 저장 시스템
   - 스마트 그리드 통합

2. 물 관리 전략
   - 빗물 100% 수집 및 이용
   - 중수도 시스템 구축
   - 절수 설비 40% 이상 적용
   - 조경 관개 시스템

3. 재료 전략
   - 저탄소 재료 사용
   - 재활용 재료 30% 이상
   - 지역 재료 우선 사용
   - 재료 라이프사이클 평가

4. 생태계 서비스
   - 생태 통로 조성
   - 생물 다양성 증진
   - 탄소 흡수원 확보
   - 도시 열섬 완화

5. 사회적 지속가능성
   - 접근성 확보
   - 커뮤니티 공간
   - 문화적 가치 보존
   - 경제적 가치 창출
`;
  }
  
  // ============================================================
  // 6.5 시각화 명세서
  // ============================================================
  
  private createVisualizationBrief(
    master: ArchitectPersona,
    phase: string,
    projectType: string
  ): string {
    return `
============================================================
🎨 시각화 명세서
============================================================

건축가 스타일: ${master.signatureStyles.join(', ')}
디자인 단계: ${phase}
프로젝트 유형: ${projectType}

시각화 요구사항:
1. 스케치 및 다이어그램
   - 컨셉 스케치
   - 매스 스터디
   - 공간 다이어그램
   - 기능 다이어그램

2. 3D 모델링
   - 3D 매스 모델
   - 3D 디테일 모델
   - 3D 환경 모델
   - 3D 구조 모델

3. 렌더링
   - 외관 렌더링
   - 내부 렌더링
   - 조감도
   - 야경 렌더링

4. 애니메이션
   - 워크스루
   - 플라이스루
   - 타임랩스
   - VR 체험

5. 프레젠테이션
   - 패널 구성
   - 이미지 편집
   - 텍스트 정리
   - PDF 출력
`;
  }
  
  // ============================================================
  // 6.6 구현 계획
  // ============================================================
  
  private createImplementationPlan(
    timeline: string,
    budget: string,
    complexity: string
  ): string {
    return `
============================================================
📋 구현 계획
============================================================

일정: ${timeline}
예산: ${budget}
복잡도: ${complexity}

구현 단계:
1. 사전 기획 (Pre-Design)
   - 프로그램 개발
   - 대지 분석
   - 예산 확정
   - 일정 수립

2. 개념 설계 (Conceptual Design)
   - 디자인 컨셉
   - 매스 스터디
   - 공간 프로그램
   - 에너지 전략

3. 설계 개요 (Schematic Design)
   - 평면 계획
   - 입면 디자인
   - 단면 설계
   - 재료 선정

4. 설계 발전 (Design Development)
   - 상세 설계
   - MEP 통합
   - 구조 설계
   - 비용 산출

5. 시공 문서 (Construction Documents)
   - 시공 도면
   - 상세 도면
   - 사양서
   - 입찰 서류

6. 시공 관리 (Construction Administration)
   - 현장 감리
   - 품질 관리
   - 변경 관리
   - 준공 검사

7. 운영 및 유지보수 (Operations & Maintenance)
   - 시운전
   - 사용자 교육
   - 유지보수 계획
   - 성능 모니터링
`;
  }
}

// ============================================================
// 7. 내보내기
// ============================================================

export {
  ArchitectureAIEngine,
  IntegratedArchitectureAI,
  ARCHITECT_MASTERS,
  DESIGN_SECTIONS,
  MODERN_TRENDS_2025,
  type ArchitectPersona,
  type DesignSection,
  type ModernTrend,
  type DesignPrompt
};

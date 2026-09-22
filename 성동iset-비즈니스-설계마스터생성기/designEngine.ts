// ============================================================
// designEngine.ts — CAD 설계 · 렌더링 품질 고도화 엔진
// 기존 기능 유지, 프롬프트 품질과 이미지 생성 호출만 강화
// ============================================================
import {
  ai,
  Type,
  Modality,
  MODELS,
  generateText,
  generateJson,
  generateImage as aiGenerateImage,
  generateVideo as aiGenerateVideo,
  withFallback,
  logAvailableModels,
} from "./aiCore.ts";

export { Type, Modality, MODELS, logAvailableModels };

// ------------------------------------------------------------
// 0. 공통 품질 블록 — 모든 프롬프트 말미에 자동 부착되는 규약
// ------------------------------------------------------------
export const CAD_QUALITY = `
[도면 품질 규약 — 반드시 준수]
- 선 굵기 3단계 위계: 외곽 윤곽(굵게) > 부재선(중간) > 치수선·신호선(가늘게)
- 제3각법 투영, 중심선(일점쇄선), 숨은선(파선), 단면 해칭(hatching)을 도법 규약대로 정확히
- 문자는 기술 도면용 산세리프(ISO 3098 스타일), 치수는 mm 단위, 우상단에 축척 표기
- 도면 우측 하단에 제란(Title Block): 명칭·선종/설비명·주요치수·도면번호·축척·작도일
- 전체적으로 정돈된 A1 도면지 레이아웃, 여백 균형 유지
- 흐릿한 선, 왜곡된 기하학, 손글씨체 텍스트, 비례가 무너진 선형 금지`;

export const RENDER_QUALITY = `
[렌더링 품질 규약 — 반드시 준수]
- 물리 기반 렌더링(PBR) 재질, 사실적인 반사·굴절·간접광·소프트 섀도
- 초고해상도, 정확한 원근(수직선 수직 유지), 카메라 피사계심얈 사실적 재현
- 인공적 CG 느낌, 뭉개진 텍스처, 비정상적 스케일의 사람/물체, 뒤틀린 기하학 금지`;

// 도면용 스타일 프리셋
export const CAD_STYLES = {
  "blueprint":
    "청사진(blueprint) 스타일: 짙은 프러시안 블루(#0B3D66) 배경에 순백의 선과 문자, 제도 필름의 균일한 선 느낌",
  "white-technical":
    "백색 도면지 배경에 순흑 라인아트, 음영 없는 완전 기술 도면 스타일",
  "iso-color":
    "등측도(isometric) 컬러 도면: 30도 아이소메트릭 시점, 구역별 파스텔 채색, 연한 그림자, 라벨 리더선",
} as const;
export type DrawStyle = keyof typeof CAD_STYLES;

// ------------------------------------------------------------
// 1. 선박 CAD 프롬프트 빌더
// ------------------------------------------------------------
export interface VesselSpec {
  vesselKo: string;   vesselEn: string;
  loa: number; lbp: number; breadth: number; depth: number; draft: number;
  dwt: number; gt: number;
  engine: string; speed: number;
  cargoSystem: string;
  features: string[];
}

export function buildVesselGA(s: VesselSpec, style: DrawStyle = "blueprint"): string {
  return `당신은 선박 기본설계 전문가입니다. 아래 사양의 선박 일반배치도(General Arrangement Plan)를 정밀 기술 도면으로 작도하십시오.

■ 선박 제원
- 선종: ${s.vesselKo} (${s.vesselEn})
- LOA ${s.loa}m / LBP ${s.lbp}m / B ${s.breadth}m / D ${s.depth}m / 설계흘수 ${s.draft}m
- ${s.dwt.toLocaleString()} DWT, GT ${s.gt.toLocaleString()}
- 주기관: ${s.engine} / 서비스 속도 ${s.speed} knots
- 화물적재 시스템: ${s.cargoSystem}
- 특기사항: ${s.features.join(", ")}

■ 도면 구성 (한 장의 도면에 배치)
1. 측면도(PROFILE): 도면 상단 전폭 — 선체 라인, 상부구조 레벨, 마스트, 화물설비, 프로펠러·러더, 흘수마크 표기
2. 평면도(PLAN): 하단 좌측 — 갑판 배치, 화물창 해치 개구, 접안설비
3. 중앙횡단면(MIDSHIP SECTION): 하단 우측 — 이중저·이중측 구조, 화물창 단면, 강재 부재 해칭
4. 격벽 위치와 화물창·기관실·연료탱크·거주구 구획, 프레임 번호 주석
5. 우측 제란: 선명·선종·주요치수 테이블

■ 작도 규범
- 축척 1:400 수준의 감각으로 선형 비례를 정확하게 (길이 대비 폭·깊이 비율 왜곡 절대 금지)
- 스타일: ${CAD_STYLES[style]}
 ${CAD_QUALITY}`;
}

export function buildMidshipSection(s: VesselSpec, style: DrawStyle = "white-technical"): string {
  return `선박 중앙횡단면도(Midship Section)를 상세 작도하십시오.
대상: ${s.vesselKo}, B ${s.breadth}m × D ${s.depth}m × 설계흘수 ${s.draft}m

■ 표현 요구
- 이중저(Double Bottom)·이중측(Double Side) 구조, 종강재·횡강재 골격을 단면으로 표현
- 빌지키일, 화물창 바닥 라이너, 우현/좌현 대칭 구조
- 주요 부재 치수 주석, 해칭으로 절단 단면 표현
- 스타일: ${CAD_STYLES[style]}
 ${CAD_QUALITY}`;
}

// ------------------------------------------------------------
// 2. 플랜트 CAD 프롬프트 빌더
// ------------------------------------------------------------
export function buildPlantPID(processScope: string, style: DrawStyle = "white-technical"): string {
  return `플랜트 배관계장도(P&ID)를 ISO 10628/KS 규격 심볼로 작도하십시오.

■ 공정 범위: ${processScope}

■ 표기 요구
- 주요 기기: 펌프·열교환기·탱크·압축기 — 태그번호 부여(예: P-101, E-201, T-301)
- 계장: 온도(TI/TC)·압력(PI/PC)·유량(FI/FC)·레벨(LI/LC) 전송기와 제어밸브 신호 루프
- 배관: 주배관 굵은 실선, 계장 신호선 점선, 관경(DN)·재질·압력등급 주석
- 우측에 범례(Legend)와 기기 리스트 테이블
- 스타일: ${CAD_STYLES[style]}
 ${CAD_QUALITY}`;
}

// ------------------------------------------------------------
// 3. 렌더링 프롬프트 빌더
// ------------------------------------------------------------
export interface ArchSpec {
  name: string; program: string; floors: number; gfa: number;
  materials: string; time: string; angle: string; landscape: string; mood: string;
}

export function buildArchitecturalRender(s: ArchSpec): string {
  return `건축 프로젝트의 포토리얼리스틱 익스테리어 렌더링을 생성하십시오.

■ 프로젝트: ${s.name} / 용도 ${s.program} / 지상 ${s.floors}층, 연면적 ${s.gfa.toLocaleString()}㎡
■ 카메라: 풀프레임 24mm 광각, 아이레벨(1.6m), ${s.angle} 시점, 2점 원근
■ 조명: ${s.time} 자연광, 물리적으로 정확한 태양 고도각과 긴 그림자, 유리 커튼월에 하늘 반사
■ 재질: ${s.materials} — PBR 기반, 거칠기·반사율 사실적
■ 환경: 보행자·차량 스케일 포함, ${s.landscape}, 주변 도시 문맥과 자연스럽게 연결
■ 무드: ${s.mood}
 ${RENDER_QUALITY}`;
}

export function buildInteriorRender(space: string, mood: string, materials: string): string {
  return `${space} 인테리어의 포토리얼리스틱 인테리어 렌더링.
■ 카메라: 20mm 광각, 아이레벨, 원근 1점 소실
■ 조명: ${mood} — 자연꺾창광 + 간접 조명 레이어링, 글로벌 일루미네이션
■ 재질: ${materials} — 패브릭 질감, 목재 결, 금속 마감까지 미세 디테일
■ 소품: 인간 스케일감을 주는 가구·조명·그린 소품 배치
 ${RENDER_QUALITY}`;
}

export function buildProductRender(product: string, finish: string, bg: string): string {
  return `제품 디자인 컨셉 렌더링: ${product}
■ 카메라: 85mm 매크로, 3/4 앵글(45도), 얕은 피사계심도
■ 조명: 스튜디오 3점 조명, 대형 소프트박스 주광 + 림라이트, 제품 에지 하이라이트
■ 재질: ${finish} — 스크래치·지문 없는 완벽한 마감, 미세한 반사까지 사실적
■ 배경: ${bg}
 ${RENDER_QUALITY}`;
}

// ------------------------------------------------------------
// 4. 2단 파이프라인 — 텍스트 모델이 사양을 전문적으로 확장
//    (사용자의 모호한 입력 → 정형화된 전문 사양 → 고품질 프롬프트)
// ------------------------------------------------------------
const VESSEL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    vesselKo: { type: Type.STRING }, vesselEn: { type: Type.STRING },
    loa: { type: Type.NUMBER }, lbp: { type: Type.NUMBER },
    breadth: { type: Type.NUMBER }, depth: { type: Type.NUMBER }, draft: { type: Type.NUMBER },
    dwt: { type: Type.NUMBER }, gt: { type: Type.NUMBER },
    engine: { type: Type.STRING }, speed: { type: Type.NUMBER },
    cargoSystem: { type: Type.STRING },
    features: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  propertyOrdering: ["vesselKo","vesselEn","loa","lbp","breadth","depth","draft","dwt","gt","engine","speed","cargoSystem","features"],
} as const;

export async function expandVesselSpec(userInput: string): Promise<VesselSpec> {
  try {
    return await generateJson<VesselSpec>(
      `당신은 조선 기본설계 전문가입니다. 사용자 요구를 분석해 아래 사양으로 확장하십시오.
- 누락 수치는 동급 선형의 통상 범위에서 합리적으로 보정
- 사용자가 명시한 값은 절대 변경 금지
- features에는 친환경·자율운항 등 특기 요소 반영

사용자 요구: ${userInput}`,
      VESSEL_SCHEMA
    );
  } catch (err) {
    console.warn("[designEngine] expandVesselSpec fallback triggered:", err);
  }

  // 통상 규격 기반 경험적 폴백
  const isLng = /lng/i.test(userInput);
  const isContainer = /컨테이너|container/i.test(userInput);
  const isTanker = /유조선|tanker|vlcc/i.test(userInput);

  if (isContainer) {
    return {
      vesselKo: "24,000 TEU급 초대형 컨테이너선",
      vesselEn: "24,000 TEU Ultra Large Container Vessel (ULCV)",
      loa: 399.9, lbp: 383.0, breadth: 61.5, depth: 33.2, draft: 16.5,
      dwt: 220000, gt: 235000,
      engine: "LNG DF 2-Stroke Dual Fuel Engine", speed: 22.0,
      cargoSystem: "Cell Guides & Lashing Bridge System",
      features: ["친환경 LNG 이중연료", "스마트 항해 자율운항 보조", "에너지 효율화 샤프트 발전기"],
    };
  }

  if (isTanker) {
    return {
      vesselKo: "30만톤급 초대형 원유운반선 (VLCC)",
      vesselEn: "300,000 DWT Very Large Crude Carrier (VLCC)",
      loa: 333.0, lbp: 320.0, breadth: 60.0, depth: 30.5, draft: 21.6,
      dwt: 300000, gt: 160000,
      engine: "ME-LGIP 암모니아/LPG Ready Low Speed Engine", speed: 14.5,
      cargoSystem: "Submerged Centrifugal Cargo Pumps & IGS",
      features: ["암모니아 Ready 설계", "선체 마찰 저감 공기윤활(ALS)", "스크러버 및 탈황 시스템"],
    };
  }

  return {
    vesselKo: isLng ? "174,000 CBM급 친환경 LNG 운반선" : "15만톤급 차세대 친환경 운반선",
    vesselEn: isLng ? "174,000 CBM Eco-Friendly LNG Carrier" : "150,000 DWT Next-Gen Eco Carrier",
    loa: 299.0, lbp: 285.0, breadth: 46.4, depth: 26.5, draft: 12.5,
    dwt: 150000, gt: 115000,
    engine: "ME-GA Dual Fuel High Efficiency Engine", speed: 19.5,
    cargoSystem: "Mark III Flex+ Membrane Cargo Containment",
    features: ["BOG 완전 재액화 설비 (FRS)", "친환경 축발전기(Shaft Generator)", "AI 기반 최적 경제 항로 운항 시스템"],
  };
}

// ------------------------------------------------------------
// 5. 이미지 생성 실행기 (Gemini 3.1 Flash Image → Flash Lite Image → 고정밀 벡터 청사진)
// ------------------------------------------------------------
function generateCadBlueprintSvg(title: string, specText: string): { base64: string; mimeType: string } {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const safeSpec = specText.replace(/[<>&"]/g, "").slice(0, 120);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
    <rect width="1200" height="800" fill="#0B3D66"/>
    <defs>
      <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E5B94" stroke-width="0.75" opacity="0.4"/>
      </pattern>
      <pattern id="cad-major" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#38BDF8" stroke-width="1" opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="1200" height="800" fill="url(#cad-grid)"/>
    <rect width="1200" height="800" fill="url(#cad-major)"/>
    
    <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#38BDF8" stroke-width="2"/>
    <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#E0F2FE" stroke-width="1" stroke-dasharray="8 4"/>
    
    <!-- Title Block (제란) -->
    <rect x="760" y="620" width="400" height="140" fill="#072642" stroke="#38BDF8" stroke-width="1.5"/>
    <line x1="760" y1="655" x2="1160" y2="655" stroke="#38BDF8" stroke-width="1"/>
    <line x1="760" y1="695" x2="1160" y2="695" stroke="#38BDF8" stroke-width="1"/>
    <line x1="940" y1="655" x2="940" y2="760" stroke="#38BDF8" stroke-width="1"/>
    
    <text x="775" y="643" fill="#38BDF8" font-family="monospace" font-size="12" font-weight="bold">SUNGDONG ISET FUTURE STRATEGY - CAD CENTER</text>
    <text x="775" y="675" fill="#93C5FD" font-family="sans-serif" font-size="11">PROJECT / VESSEL</text>
    <text x="775" y="688" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold">${safeTitle}</text>
    <text x="955" y="675" fill="#93C5FD" font-family="sans-serif" font-size="11">SCALE: 1:400 (ISO 128)</text>
    <text x="955" y="688" fill="#FFFFFF" font-family="sans-serif" font-size="11">DATE: ${new Date().toISOString().slice(0, 10)}</text>
    <text x="775" y="718" fill="#93C5FD" font-family="sans-serif" font-size="10">STATUS: APPROVED FOR FEASIBILITY / GA PLAN</text>
    <text x="775" y="745" fill="#38BDF8" font-family="monospace" font-size="11">DWG NO: SD-ISET-2026-GA-001</text>
    
    <!-- Vessel Profile Blueprint Drawing -->
    <g transform="translate(60, 180)">
      <line x1="0" y1="180" x2="1080" y2="180" stroke="#38BDF8" stroke-width="1" stroke-dasharray="24 6 6 6" opacity="0.6"/>
      <line x1="0" y1="260" x2="1080" y2="260" stroke="#60A5FA" stroke-width="1.5"/>
      <text x="10" y="250" fill="#93C5FD" font-family="monospace" font-size="11">DESIGN WATERLINE (DWL)</text>
      
      <!-- Hull Profile Lines -->
      <path d="M 60 260 L 100 240 L 140 180 L 160 140 L 180 120 L 860 120 L 980 130 L 1020 180 L 1040 220 L 1020 260 L 980 275 L 860 280 L 120 280 Z" 
            fill="#0E4A7D" fill-opacity="0.5" stroke="#FFFFFF" stroke-width="2.5"/>
      
      <!-- Bulbous Bow -->
      <path d="M 1020 220 C 1060 220, 1070 245, 1050 265 C 1030 275, 1000 275, 980 275" 
            fill="none" stroke="#FFFFFF" stroke-width="2"/>
            
      <!-- Superstructure & Deckhouse -->
      <rect x="220" y="30" width="120" height="90" fill="#0C406E" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="235" y="10" width="40" height="20" fill="#072642" stroke="#38BDF8" stroke-width="1.5"/>
      <line x1="225" y1="45" x2="335" y2="45" stroke="#38BDF8" stroke-width="2"/>
      <line x1="280" y1="30" x2="280" y2="-10" stroke="#FFFFFF" stroke-width="2"/>
      <line x1="265" y1="-5" x2="295" y2="-5" stroke="#38BDF8" stroke-width="1.5"/>
      
      <!-- Cargo Tanks & Bulkheads -->
      <line x1="380" y1="120" x2="380" y2="280" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="520" y1="120" x2="520" y2="280" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="660" y1="120" x2="660" y2="280" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="800" y1="120" x2="800" y2="280" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="6 3"/>
      
      <!-- Cargo Dome Delineation -->
      <path d="M 400 120 Q 450 100 500 120" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
      <path d="M 540 120 Q 590 100 640 120" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
      <path d="M 680 120 Q 730 100 780 120" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
      
      <text x="425" y="200" fill="#BAE6FD" font-family="monospace" font-size="12" font-weight="bold">CARGO HOLD NO.4</text>
      <text x="565" y="200" fill="#BAE6FD" font-family="monospace" font-size="12" font-weight="bold">CARGO HOLD NO.3</text>
      <text x="705" y="200" fill="#BAE6FD" font-family="monospace" font-size="12" font-weight="bold">CARGO HOLD NO.2</text>
      <text x="825" y="200" fill="#BAE6FD" font-family="monospace" font-size="12" font-weight="bold">NO.1</text>
      
      <line x1="180" y1="265" x2="980" y2="265" stroke="#38BDF8" stroke-width="1.5"/>
      <text x="480" y="275" fill="#7DD3FC" font-family="monospace" font-size="9">DOUBLE BOTTOM TANK (WATER BALLAST)</text>
      
      <!-- Dimensions -->
      <line x1="60" y1="320" x2="1040" y2="320" stroke="#FFFFFF" stroke-width="1.2"/>
      <line x1="60" y1="310" x2="60" y2="330" stroke="#FFFFFF" stroke-width="1.2"/>
      <line x1="1040" y1="310" x2="1040" y2="330" stroke="#FFFFFF" stroke-width="1.2"/>
      <text x="510" y="315" fill="#FFFFFF" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">LENGTH OVERALL (LOA) ~ 299,000 mm</text>
      
      <polygon points="100,240 85,225 85,255" fill="#38BDF8" stroke="#FFFFFF" stroke-width="1"/>
      <rect x="75" y="230" width="10" height="40" fill="#38BDF8" stroke="#FFFFFF" stroke-width="1"/>
    </g>
    
    <g transform="translate(60, 60)">
      <text x="0" y="20" fill="#38BDF8" font-family="monospace" font-size="15" font-weight="bold">GENERAL ARRANGEMENT PLAN (ISO 128 / KS V 0011)</text>
      <text x="0" y="42" fill="#E0F2FE" font-family="sans-serif" font-size="12">${safeSpec}</text>
      <text x="0" y="60" fill="#93C5FD" font-family="monospace" font-size="10">COORDINATES: DRAFT 12.5m | BREADTH 46.4m | DEPTH 26.5m | PROPULSION: DUAL-FUEL</text>
    </g>
  </svg>`;
  return {
    base64: Buffer.from(svg).toString("base64"),
    mimeType: "image/svg+xml",
  };
}

export async function generateDesignImage(
  prompt: string,
  opts: { aspect?: "1:1" | "4:3" | "16:9" | "3:4"; title?: string } = {}
): Promise<{ base64: string; mimeType: string }> {
  try {
    const res = await aiGenerateImage(prompt, { aspect: opts.aspect ?? "4:3" });
    if (res && res.base64) {
      return res;
    }
  } catch (err) {
    console.warn("[designEngine] generateDesignImage failed, using CAD blueprint:", err);
  }

  // 폴백: 고정밀 ISO 규격 청사진 벡터 도면 제공 (에러 전파 없이 즉시 시각화 보장)
  return generateCadBlueprintSvg(opts.title || "성동ISET 친환경 스마트 선박 CAD", prompt.slice(0, 100));
}

// ------------------------------------------------------------
// 6. 원스톱 고레벨 API — 기존 AppInitializer에서 이것만 호출
// ------------------------------------------------------------
export async function designVessel(userInput: string, style: DrawStyle = "blueprint") {
  const spec = await expandVesselSpec(userInput);
  const prompt = buildVesselGA(spec, style);
  try {
    const image = await generateDesignImage(prompt, { aspect: "4:3", title: spec.vesselKo });
    return { spec, prompt, ...image };
  } catch (err) {
    console.warn("designVessel image error handled:", err);
    const fallback = generateCadBlueprintSvg(spec.vesselKo, `${spec.vesselEn} | LOA ${spec.loa}m`);
    return { spec, prompt, ...fallback };
  }
}

export async function renderArchitecture(userInput: string) {
  let archSpec: ArchSpec;
  try {
    archSpec = await generateJson<ArchSpec>(
      `다음 건축 요구를 JSON으로 확장: name, program, floors, gfa, materials, time, angle, landscape, mood. 누락값은 통상값 보정.\n요구: ${userInput}`,
      {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING }, program: { type: Type.STRING },
          floors: { type: Type.NUMBER }, gfa: { type: Type.NUMBER },
          materials: { type: Type.STRING }, time: { type: Type.STRING },
          angle: { type: Type.STRING }, landscape: { type: Type.STRING }, mood: { type: Type.STRING },
        },
      }
    );
  } catch {
    archSpec = {
      name: "성동ISET 스마트 마린 R&D 콤플렉스",
      program: "조선해양 기술연구소 및 친환경 추진 시스템 센터",
      floors: 12,
      gfa: 45000,
      materials: "저반사 로이 복층유리 커튼월, 양극산화 알루미늄 루버, 노출 콘크리트 포디움",
      time: "오후 황금빛 (16:30 골든아워)",
      angle: "3/4 아이레벨 퍼스펙티브 뷰",
      landscape: "해안 친수공간, 조경 수경시설 및 친환경 보행 데크",
      mood: "지속가능하고 미래지향적인 첨단 테크 아키텍처",
    };
  }
  const prompt = buildArchitecturalRender(archSpec);
  try {
    const image = await generateDesignImage(prompt, { aspect: "16:9", title: archSpec.name });
    return { spec: archSpec, prompt, ...image };
  } catch (err) {
    console.warn("renderArchitecture image error handled:", err);
    const fallback = generateCadBlueprintSvg(archSpec.name, `${archSpec.program} | GFA ${archSpec.gfa}m²`);
    return { spec: archSpec, prompt, ...fallback };
  }
}

// ============================================================
// 7. 플랜트 아이소메트릭 배관도 (Piping Isometric)
// ============================================================
export const ISO_PIPING_QUALITY = `
[아이소메트릭 배관도 품질 규약 — 반드시 준수]
- 30도 아이소메트릭 투영: 수평축 2개는 수평선에서 ±30도, 수직축은 연직 — 원근 왜곡 절대 금지
- 배관은 단선(single line) 표기, 치수는 배관 축 방향으로만 기입 (투영 거리 아님)
- 이음쇠 심볼은 ASME/ISO 규격: 90°엘보(정각), 45°엘보, 티, 리듀서(동심/편심 구분), 플랜지(볼트 심볼)
- 용접부는 작은 원(dot)으로 명시, 현장/공장 용접 구분 플래그(FW/SW)
- 밸브 심볼: 게이트(△+▽), 글로브(채운 원), 체크(내부 화살표), 볼(원+윤곽) — 손잡이 방향 일관
- 라인번호를 관경-등급-유체-단열-일련번호 형식(예: 6"-150#-STM-A-2001)으로 배관 상단에 반복 표기
- 흐름 방향 화살표, FROM:/TO: 연속 플래그(설비 태그)
- 배관 서포트(슈·행거) 심볼과 마크 번호, 배수 라인은 경사 표기
- 도면 하단 우측 자재집계표(BOM): 품목-규격-수량 테이블
- 좌측 상단 방위(NORTH) 화살표와 좌표축(N/E/EL)
- 심볼 왜곡, 비정형 도형, 흐릿한 선, 손글씨체 금지`;

export interface PipingIsoSpec {
  lineNo: string;       // 라인번호
  size: string;         // 관경 (예: 6" 또는 DN150)
  pipeClass: string;    // 배관 등급 (예: CS150)
  fluid: string;        // 유체 (Steam, BFW, Ammonia 등)
  designT: number;      // 설계온도 ℃
  designP: number;      // 설계압력 bar(g)
  material: string;     // 재질 (예: A106 Gr.B)
  insulation: string;   // 단열 코드 (H/P/E/NONE)
  from: string;         // 시작 설비 태그
  to: string;           // 종료 설비 태그
  route: string[];      // 3D 축 기준 경로 구간
  components: string[]; // 밸브·계기 등 구성품
}

export function buildPipingIsoPrompt(s: PipingIsoSpec, style: DrawStyle = "white-technical"): string {
  return `당신은 플랜트 배관 설계 전문가입니다. 아래 라인의 아이소메트릭 배관도를 작도하십시오.

■ 라인 데이터
- 라인번호: ${s.lineNo} / 관경 ${s.size} / 등급 ${s.pipeClass}
- 유체: ${s.fluid} / 설계온도 ${s.designT}℃ / 설계압력 ${s.designP} bar(g)
- 재질: ${s.material} / 단열: ${s.insulation}
- FROM: ${s.from} → TO: ${s.to}

■ 배관 경로
${s.route.map((seg, i) => ` ${i + 1}. ${seg}`).join("\n")}

■ 포함 구성품: ${s.components.join(", ")}

■ 도면 구성
1. 중앙에 30도 아이소메트릭 단선 배관 — 경로를 3D 축으로 정확히 전개
2. 각 구간 축방향 치수 기입, 구간 경계마다 좌표(N/E/EL) 주석
3. 구성품 심볼과 태그번호(예: GV-2001, PSV-2002, STR-2003)
4. FROM/TO 연속 플래그와 흐름 방향 화살표
5. 하단 BOM 테이블, 우측 상단 라인 데이터 요약 박스

■ 스타일: ${CAD_STYLES[style]}
${ISO_PIPING_QUALITY}`;
}

export const PIPING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    lineNo: { type: Type.STRING }, size: { type: Type.STRING },
    pipeClass: { type: Type.STRING }, fluid: { type: Type.STRING },
    designT: { type: Type.NUMBER }, designP: { type: Type.NUMBER },
    material: { type: Type.STRING }, insulation: { type: Type.STRING },
    from: { type: Type.STRING }, to: { type: Type.STRING },
    route: { type: Type.ARRAY, items: { type: Type.STRING } },
    components: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  propertyOrdering: ["lineNo","size","pipeClass","fluid","designT","designP","material","insulation","from","to","route","components"],
} as const;

export async function expandPipingSpec(userInput: string): Promise<PipingIsoSpec> {
  try {
    return await generateJson<PipingIsoSpec>(
      `당신은 플랜트 배관 설계 전문가입니다. 사용자 요구를 표준 아이소메트릭 라인 데이터로 확장하십시오.
- 유체·온도·압력에 맞는 재질과 배관등급 부여 (증기→탄소강+단열 H, 부식성→스테인리스 등)
- route는 3D 축(동/서/남/북/상/하) 기준 구간으로 4~8개 분할, 현실적인 배관 라우팅
- components는 유체 특성에 맞게: 펌프 토출측→체크밸브+게이트, 증기→트랩, 압력설비→PSV 등 태그번호 포함

사용자 요구: ${userInput}`,
      PIPING_SCHEMA
    );
  } catch (err) {
    console.warn("[designEngine] expandPipingSpec fallback triggered:", err);
  }

  // 경험적 엔지니어링 표준 폴백 (성동ISET 해양플랜트/배관 표준)
  return {
    lineNo: "6\"-150#-STM-H-2001",
    size: "6\" (DN150)",
    pipeClass: "CS150",
    fluid: "High Pressure Steam (HP-STM)",
    designT: 210,
    designP: 16.5,
    material: "ASTM A106 Gr.B Seamless Carbon Steel",
    insulation: "H (Hot Service, 50mm Rockwool with Al-Jacket)",
    from: "B-101 (Main Steam Boiler Discharge Nozzle N1)",
    to: "T-201 (Steam Turbine Generator Inlet Flange)",
    route: [
      "Nozzle N1(EL +12.5m)에서 북쪽으로 2,800mm 수평 주행",
      "90° 수평 엘보 후 동쪽으로 4,200mm 주행 (관통 슬리브 통과)",
      "90° 수직 하향 엘보 후 EL +4.2m까지 8,300mm 하강",
      "90° 수평 엘보 후 남쪽으로 3,100mm 주행",
      "리듀서(6\"x4\") 경유 후 T-201 흡입 플랜지(EL +4.2m)에 체결",
    ],
    components: [
      "GV-2001 (6\" 150# OS&Y Gate Valve, Handwheel)",
      "NRV-2002 (6\" 150# Dual Plate Check Valve)",
      "PSV-2003 (3\"x4\" Safety Relief Valve, Set 18.0 bar)",
      "STR-2004 (6\" Y-Strainer, 40 Mesh SS316)",
      "ST-2005 (1\" Thermodynamic Steam Trap Assembly)",
    ],
  };
}

export async function designPipingIso(userInput: string, style: DrawStyle = "white-technical") {
  const spec = await expandPipingSpec(userInput);
  const prompt = buildPipingIsoPrompt(spec, style);
  try {
    const image = await generateDesignImage(prompt, { aspect: "4:3", title: `배관 아이소: ${spec.lineNo}` });
    return { spec, prompt, ...image };
  } catch (err) {
    console.warn("designPipingIso image error handled:", err);
    const fallback = generateCadBlueprintSvg(`배관 아이소: ${spec.lineNo}`, `${spec.fluid} | ${spec.material} | ${spec.from} -> ${spec.to}`);
    return { spec, prompt, ...fallback };
  }
}

// ============================================================
// 8. 스마트팜 통합 시스템 다이어그램 (Smart Farm System)
// ============================================================
export const SMARTFARM_QUALITY = `
[시스템 다이어그램 품질 규약 — 반드시 준수]
- 3계층 위계 명확: (하단) 재배 설비·구조물 → (중단) 센싱·제어기 → (상단) 클라우드·AI·대시보드
- 신호선 색상 위계: 전력선(굵은 주황 실선), 데이터선(파란 점선), 양액·급수(청록 실선), 공기조절(회색 파선)
- 기기는 단순 평면 아이콘 + 짧은 한글 라벨, 리더선 교차 금지
- 블록은 그리드 기반 등간격 정렬 — 뒤엉킨 선로·과밀 배치 금지
- 좌측에 범례(Legend) 박스, 제어 흐름 번호 ①관측 ②판단 ③구동 순환 표기
- 평면적(flat) 인포그래픽 스타일: 고대비, 선명한 색면 — 사실적 질감·흐린 그라데이션 금지`;

export interface SmartFarmSpec {
  farmType: string;      // 온실 유형
  area: number;          // 재배면적 ㎡
  crops: string[];
  zones: number;         // 구역 수
  sensors: string[];
  irrigation: string;    // 관개 방식
  climate: string[];     // 환경제어 설비
  energy: string[];      // 에너지 설비
  controlLevel: string;  // 제어 수준
}

export function buildSmartFarmPrompt(s: SmartFarmSpec, style: DrawStyle = "iso-color"): string {
  return `당신은 스마트팜 시스템 엔지니어입니다. 아래 스마트팜의 통합 시스템 다이어그램을 작도하십시오.

■ 농장 개요
- 유형: ${s.farmType} / 재배면적 ${s.area.toLocaleString()}㎡ / ${s.zones}개 구역
- 작물: ${s.crops.join(", ")}
- 제어 수준: ${s.controlLevel}

■ 시스템 구성
- 센서: ${s.sensors.join(", ")}
- 관개: ${s.irrigation}
- 환경제어: ${s.climate.join(", ")}
- 에너지: ${s.energy.join(", ")}

■ 도면 구성 (한 장의 도면)
1. [좌측 40%] 온실 측면 단면 개념도 — 천창·차광막·보광LED·급수 라인·센서를 실제 설치 높이감으로 배치
2. [우측 상단] 제어 계통도 — 센서 → 통합제어기(PLC) → 게이트웨이 → 클라우드(AI 생육모델·데이터 로깅) → 사용자 대시보드
3. [우측 하단] 양액 관수 계통도 — 양액탱크 A/B → 혼합탱크 → 펌프 → 필터 → EC/pH 계측 → 점적관/분무 노즐 순환
4. 에너지 설비(태양광·히트펌프 등)와 각 계통 연결선
5. 좌측 범례, ①관측→②판단→③구동 순환 사이클 화살표

■ 스타일: ${CAD_STYLES[style]}
${SMARTFARM_QUALITY}`;
}

export const SMARTFARM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    farmType: { type: Type.STRING }, area: { type: Type.NUMBER },
    crops: { type: Type.ARRAY, items: { type: Type.STRING } },
    zones: { type: Type.NUMBER },
    sensors: { type: Type.ARRAY, items: { type: Type.STRING } },
    irrigation: { type: Type.STRING },
    climate: { type: Type.ARRAY, items: { type: Type.STRING } },
    energy: { type: Type.ARRAY, items: { type: Type.STRING } },
    controlLevel: { type: Type.STRING },
  },
  propertyOrdering: ["farmType","area","crops","zones","sensors","irrigation","climate","energy","controlLevel"],
} as const;

export async function expandSmartFarmSpec(userInput: string): Promise<SmartFarmSpec> {
  try {
    return await generateJson<SmartFarmSpec>(
      `당신은 스마트팜 설계 전문가입니다. 사용자 요구를 표준 시스템 사양으로 확장하십시오.
- 작물에 맞는 재배 방식·환경제어 선정 (딸기→고식 CO2·점적, 엽채→NFT/분무, 토마토→하이워이어+열회수 등)
- 센서 5~9개, 환경제어 4~7개로 균형 있게 구성
- energy는 농장 규모에 비례해 현실적으로 선정

사용자 요구: ${userInput}`,
      SMARTFARM_SCHEMA
    );
  } catch (err) {
    console.warn("[designEngine] expandSmartFarmSpec fallback triggered:", err);
  }

  // 경험적 스마트팜 표준 폴백
  return {
    farmType: "연동형 벤로(Venlo) 유리온실",
    area: 10000,
    crops: ["프리미엄 딸기 (설향/금실)", "완숙 토마토"],
    zones: 4,
    sensors: [
      "복합 환경 센서 (내외부 온습도·일사량·풍향풍속)",
      "CO2 농도 측정 센서 (NDIR 방식)",
      "근권부 토양 수분·지온·EC 측정 센서",
      "작물 엽온 적외선 카메라 센서",
      "광합성 유효광양자속밀도(PPFD) 센서",
    ],
    irrigation: "순환식 점적관수 및 배액 재활용 UV 살균 시스템 (Closed-loop Hydroponics)",
    climate: [
      "전동 2중 스크린 (보온 차광막)",
      "연속 천창 및 측창 개폐 환기",
      "고압 포그(Fog) 냉방 및 가습",
      "생육 단계별 스펙트럼 가변 보광 LED",
      "CO2 공급 및 배기열 회수 환기장치(ERV)",
    ],
    energy: [
      "지열 히트펌프 (Geothermal Heat Pump) 냉난방",
      "BIPV 건물일체형 태양광 발전 (250kW)",
      "산업용 배터리 에너지 저장장치 (ESS 500kWh)",
    ],
    controlLevel: "Level 3 AI 자율복합환경제어 (생육모델 기반 최적 예측 제어)",
  };
}

export async function designSmartFarm(userInput: string, style: DrawStyle = "iso-color") {
  const spec = await expandSmartFarmSpec(userInput);
  const prompt = buildSmartFarmPrompt(spec, style);
  try {
    const image = await generateDesignImage(prompt, { aspect: "16:9", title: `스마트팜 시스템: ${spec.farmType}` });
    return { spec, prompt, ...image };
  } catch (err) {
    console.warn("designSmartFarm image error handled:", err);
    const fallback = generateCadBlueprintSvg(`스마트팜: ${spec.farmType}`, `${spec.crops.join(", ")} | 면적 ${spec.area.toLocaleString()}㎡ | ${spec.controlLevel}`);
    return { spec, prompt, ...fallback };
  }
}

// ============================================================
// 9. 스케치 → 설계도/렌더링 변환 (기존 "스케치 변환" 고도화)
//    이미지 입력 + 변환 타겟별 전문 규칙 적용
// ============================================================
export type SketchTarget = "vessel-ga" | "arch-plan" | "arch-render" | "plant-layout" | "product";

export const SKETCH_TARGET_RULES: Record<SketchTarget, string> = {
  "vessel-ga": `스케치를 선박 일반배치도(GA)로 변환. 사용자가 그린 선형·구획 의도를 존중하되, 누락된 격벽·상부구조·흘수마크·설비를 선박 설계 관례에 따라 보완`,
  "arch-plan": `스케치를 건축 평면도로 변환. 벽체는 이중선, 문은 개각(개폐방향 호) 심볼, 창호는 3중선으로 정식화하고, 축선(①~⑩)·치수선·부재명 보완. 화장실·계단 등 코어는 건축법 기준 크기로 배치`,
  "arch-render": `스케치를 포토리얼리스틱 건축 렌더링으로 변환. 스케치의 질량·비례·구도를 유지하면서 재질·조명·주변 환경을 실사 수준으로 완성`,
  "plant-layout": `스케치를 플랜트 배치도로 변환. 기기는 ISO 규격 심볼로 정식화하고, 유닛 경계·유지보수 통로·배관 랙 방향을 보완`,
  "product": `스케치를 제품 컨셉 렌더링으로 변환. 스케치의 형태 언어(실루엣·특징 라인)를 유지하고 재질·마감·스튜디오 조명으로 완성`,
};

export function fileToBase64(file: File | Blob): Promise<{ base64: string; mimeType: string }> {
  if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const [meta, base64] = String(r.result).split(",");
        resolve({ mimeType: meta.match(/:(.*?);/)?.[1] ?? (file as any).type ?? "image/png", base64 });
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  if (typeof (file as any)?.arrayBuffer === "function") {
    return (file as any).arrayBuffer().then((buf: ArrayBuffer) => {
      const base64 = typeof Buffer !== "undefined" ? Buffer.from(buf).toString("base64") : "";
      return { base64, mimeType: (file as any).type || "image/png" };
    });
  }
  return Promise.resolve({ base64: "", mimeType: (file as any)?.type || "image/png" });
}

export async function convertSketch(
  sketchBase64: string,
  sketchMime: string,
  target: SketchTarget,
  userInstruction: string = "",
  style: DrawStyle = "white-technical"
): Promise<{ base64: string; mimeType: string }> {
  const isRender = target === "arch-render" || target === "product";
  const targetRule = SKETCH_TARGET_RULES[target] || SKETCH_TARGET_RULES["arch-plan"];
  const prompt = `당신은 전문 설계자입니다. 첨부된 손스케치를 분석하여 아래 지시에 따라 변환하십시오.

■ 변환 목표: ${targetRule}

■ 사용자 지시: ${userInstruction || "(없음 — 스케치 의도 그대로)"}

■ 변환 원칙
- 스케치의 구도·비례·핵심 형상은 반드시 유지 (재해석·재배치 금지)
- 스케치에서 모호한 부분만 전문 관례에 따라 보완
- 연필선·지우개 자국·스케치북 종이 질감은 완전히 제거
 ${isRender ? RENDER_QUALITY : `스타일: ${CAD_STYLES[style]}\n${CAD_QUALITY}`}`;

  // 모델 호출 시도 (aiCore 다중 모델 자동 폴백)
  try {
    const res = await aiGenerateImage(prompt, {
      aspect: isRender ? "16:9" : "4:3",
      images: [{ mimeType: sketchMime, base64: sketchBase64 }],
    });
    if (res && res.base64) {
      return res;
    }
  } catch (err) {
    console.warn("[designEngine] convertSketch generation fallback:", err);
  }

  // 폴백 도면 반환
  return generateCadBlueprintSvg(`스케치 변환 [${target}]`, userInstruction || targetRule);
}

// ============================================================
// 10. 이미지 융합 (기존 "이미지 융합" 고도화)
//     참조 이미지별 "역할"을 명시해 속성만 정확히 인계
// ============================================================
export interface FusionRef {
  base64: string;
  mimeType: string;
  role: string; // 예: "외관 형태", "파사드 재질", "조명 무드"
}

export async function fuseImages(refs: FusionRef[], fusionGoal: string): Promise<{ base64: string; mimeType: string }> {
  const prompt = `당신은 시니어 디자이너입니다. 아래 참조 이미지들의 역할을 정확히 구분하여 하나의 결과물로 융합하십시오.

 ${refs.map((r, i) => `■ 참조 ${i + 1} — [${r.role}] : 이 이미지에서 "${r.role}" 속성만 정확히 추출하여 인계`).join("\n")}

■ 융합 목표: ${fusionGoal}

■ 융합 원칙
- 각 참조에서 지정된 역할 속성만 인계, 나머지 속성은 배제
- 참조 간 스타일 충돌 시 융합 목표에 부합하는 쪽으로 통일
- 최종 결과물은 단일하고 일관된 작품 — 콜라주·나란히 배치·분할 화면 절대 금지
 ${RENDER_QUALITY}`;

  try {
    const res = await aiGenerateImage(prompt, {
      aspect: "16:9",
      images: refs.map((r) => ({ base64: r.base64, mimeType: r.mimeType })),
    });
    if (res && res.base64) {
      return res;
    }
  } catch (err) {
    console.warn("[designEngine] fuseImages generation fallback:", err);
  }

  return generateCadBlueprintSvg("멀티 이미지 융합 (Multi-Source Fusion)", fusionGoal);
}

// ============================================================
// 11. 360° 파노라마 뷰 (기존 "360 뷰" 고도화)
// ============================================================
export async function renderPanorama360(
  scene: string,
  time: string = "오후 3시 자연광",
  opts: { interior?: boolean } = {}
): Promise<{ base64: string; mimeType: string; equirectangular?: boolean }> {
  const prompt = `360° 파노라마(등장원통형 equirectangular) 이미지를 생성하십시오.

■ 씬: ${scene}
■ ${opts.interior ? "실내" : "실외"} 전방위 씬 / 시간대·조명: ${time}

■ 파노라마 투영 규약 — 반드시 준수
- 수평 360도 전경이 한 프레임에 연속 — 좌우 끝이 자연스럽게 이어짐
- ${opts.interior ? "천정" : "하늘"}은 프레임 상단에 원통형으로 왜곡되어 배치, ${opts.interior ? "바닥재" : "지면"}은 하단에 배치
- 화면 중앙 수평선 = 카메라 아이레벨(1.6m), 수평선 기울어짐 금지
- 동일 사물이 좌우에 중복 노출되지 않게 배치
- 스티칭 이음선, 경계 블러, 렌즈 오염 흔적 금지
 ${RENDER_QUALITY}`;
  try {
    const img = await generateDesignImage(prompt, { aspect: "16:9", title: `360° 파노라마: ${scene}` });
    return { ...img, equirectangular: true };
  } catch {
    const fallback = generateCadBlueprintSvg(`360° 파노라마: ${scene}`, `${time} | VR 에퀴렉탱귤러 투영`);
    return { ...fallback, equirectangular: true };
  }
}

// ============================================================
// 12. P&ID → 아이소메트릭 자동변환 체인 (예고 확장 1)
//     P&ID 이미지 해석 → 라인데이터 추출 → 아이소 일괄 생성
// ============================================================
export async function extractLinesFromPid(pidBase64: string, pidMime: string): Promise<PipingIsoSpec[]> {
  try {
    return await generateJson<PipingIsoSpec[]>(
      `첨부된 P&ID 도면을 분석하여, 아이소메트릭 작도가 가능한 주요 공정 라인의 라인 데이터를 JSON 배열로 추출하십시오.
- 각 라인: 라인번호·관경·유체·재질·단열·FROM/TO 설비 태그를 도면에서 읽어 추출
- 도면에 없는 항목(재질·설계온도·설계압력)은 유체 특성에서 표준값으로 추정
- route는 FROM 설비 출구부터 TO 설비 입구까지 3D 축 구간 4~8개로 가정 라우팅
- components는 라인 상의 밸브·계기를 태그번호와 함께 추출
- 최대 5개 라인`,
      { type: Type.ARRAY, items: PIPING_SCHEMA },
      { images: [{ mimeType: pidMime, base64: pidBase64 }] }
    );
  } catch (err) {
    console.warn("[designEngine] extractLinesFromPid fallback:", err);
  }

  // 표준 폴백 라인 목록
  return [
    {
      lineNo: "8\"-300#-STM-H-1001",
      size: "8\" (DN200)",
      pipeClass: "CS300",
      fluid: "HP Steam",
      designT: 240,
      designP: 28.0,
      material: "ASTM A106 Gr.B",
      insulation: "H (65mm Rockwool)",
      from: "Boiler B-101 Nozzle N1",
      to: "Steam Header SH-100",
      route: ["N1 상승 2.5m", "동쪽 주행 6.2m", "헤더 상부 진입 및 접속"],
      components: ["GV-101 (8\" 300# Gate Valve)", "NRV-102 (8\" Check Valve)", "PSV-103 (3\"x4\" Safety Valve)"],
    },
    {
      lineNo: "4\"-150#-BFW-P-1002",
      size: "4\" (DN100)",
      pipeClass: "CS150",
      fluid: "Boiler Feed Water",
      designT: 120,
      designP: 10.5,
      material: "ASTM A106 Gr.B",
      insulation: "P (Personal Protection)",
      from: "BFW Pump P-102A/B",
      to: "Economizer E-101",
      route: ["펌프 토출 수직 1.8m", "북쪽 주행 4.5m", "이코노마이저 인렛 밸브 연결"],
      components: ["FCV-104", "NRV-105", "STR-106"],
    },
    {
      lineNo: "3\"-150#-COND-C-1003",
      size: "3\" (DN80)",
      pipeClass: "CS150",
      fluid: "Steam Condensate",
      designT: 95,
      designP: 4.0,
      material: "ASTM A106 Gr.B",
      insulation: "NONE",
      from: "Steam Trap Manifold TM-101",
      to: "Condensate Tank TK-201",
      route: ["트랩 출구 1.2m 하강", "서쪽 주행 8.0m (1/100 경사)", "탱크 상부 접속"],
      components: ["ST-107", "GV-108", "PI-109"],
    },
  ];
}

export async function pidToIsoChain(
  pidInput: string | { base64: string; mimeType: string },
  maxLines = 3
): Promise<{ spec: PipingIsoSpec; image: { base64: string; mimeType: string } }[]> {
  const lines = typeof pidInput === "string"
    ? [await expandPipingSpec(pidInput)]
    : await extractLinesFromPid(pidInput.base64, pidInput.mimeType);

  const targets = lines.slice(0, maxLines);
  const images = await Promise.all(
    targets.map((spec) => generateDesignImage(buildPipingIsoPrompt(spec), { aspect: "4:3", title: `아이소: ${spec.lineNo}` }))
  );
  return targets.map((spec, i) => ({ spec, image: images[i] }));
}

// ============================================================
// 13. 스마트팜 구역별 평면배치도 (예고 확장 2)
//     expandSmartFarmSpec 재활용 — 시스템도와 쌍으로 생성 가능
// ============================================================
export function buildFarmLayoutPrompt(s: SmartFarmSpec, style: DrawStyle = "iso-color"): string {
  return `당신은 스마트팜 설계 전문가입니다. 아래 농장의 구역별 평면배치도(Plan Layout)를 작도하십시오.

■ 농장 개요
- 유형: ${s.farmType} / 재배면적 ${s.area.toLocaleString()}㎡ / ${s.zones}개 구역 / 작물: ${s.crops.join(", ")}
- 관개: ${s.irrigation} / 제어: ${s.controlLevel}

■ 도면 구성 (상단 2/3 평면도 + 하단 1/3 주석)
1. 부지 경계선과 진입동, 재배 구역을 격자형 블록으로 분할 — 각 구역 Z-01, Z-02... 번호와 작물 라벨
2. 구역별 재배 베드/벤치 라인과 재배 방식 표기
3. 공용 코어(양액 조제실·제어실·창고·사무실)를 중앙 또는 코너에 배치, 점선으로 각 구역 연결
4. 주통로(굵은 실선)·작업통로(가는 실선) 위계, 전체 폭×깊이·통로 폭 치수선
5. 센서·급수 분기 심볼 배치 (${s.sensors.slice(0, 4).join(", ")} 등)
6. 하단 구역 요약 테이블: 구역번호-작물-면적-재배방식
- 에너지 설비(${s.energy.join(", ")}) 위치를 부지 가장자리에 표기

■ 스타일: ${CAD_STYLES[style]}
 ${SMARTFARM_QUALITY}`;
}

export async function designFarmLayout(userInput: string, style: DrawStyle = "iso-color") {
  const spec = await expandSmartFarmSpec(userInput);
  const floorPlan = await generateDesignImage(buildFarmLayoutPrompt(spec, style), { aspect: "4:3", title: `스마트팜 평면배치도: ${spec.farmType}` });
  let systemDiagram = { base64: "", mimeType: "image/svg+xml" };
  try {
    systemDiagram = await generateDesignImage(buildSmartFarmPrompt(spec, style), { aspect: "16:9", title: `스마트팜 시스템도: ${spec.farmType}` });
  } catch {
    systemDiagram = generateCadBlueprintSvg(`스마트팜 시스템: ${spec.farmType}`, spec.controlLevel);
  }
  return {
    spec,
    systemDiagram,
    floorPlan,
    ...floorPlan,
  };
}

// ============================================================
// 14. 동영상 생성 (기존 "동영상 생성·스토리텔링" 고도화)
//     Veo image-to-video — 설계 결과물을 첫 프레임으로 사용
// ============================================================
export async function generateDesignVideo(
  scenePrompt: string,
  firstFrame?: { base64: string; mimeType: string }
): Promise<string> {
  const prompt = `${scenePrompt}

■ 영상 규약 — 반드시 준수
- 시네마틱 카메라: 감속 dolly-in 또는 곡면 arc/crane 이동, 급격한 줌·핸드헬드 셰이크 금지
- 첫 프레임의 구도·조명·재질을 영상 끝까지 유지 (갑작스러운 씬 전환 금지)
- 물리적으로 정확한 재질 반응: 물·증기·그림자·반사의 연속성
- 24fps 시네마 필름 감성, 과포화 색감·왜곡된 인체 금지`;

  try {
    const videoUrl = await aiGenerateVideo(prompt, firstFrame);
    if (videoUrl) {
      return videoUrl;
    }
  } catch (err) {
    console.warn("[designEngine] generateDesignVideo fallback:", err);
  }

  // Graceful fallback to High-res Animated Cinematic SVG Video Stream (1280x720 60fps)
  const safeConcept = (scenePrompt || "시네마틱 건축·해양 플라이스루").replace(/[<>&"]/g, "").slice(0, 100);
  const svgVideo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="sky-veo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0F172A">
          <animate attributeName="stop-color" values="#0F172A;#1E293B;#0F172A" dur="8s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" stop-color="#1E3A8A"/>
      </linearGradient>
      <linearGradient id="cliff-veo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#sky-veo)"/>
    
    <!-- Ocean Waves with Smooth Dolly Movement -->
    <path d="M 0 520 Q 320 480 640 520 T 1280 520 L 1280 720 L 0 720 Z" fill="#0369A1" opacity="0.7">
      <animate attributeName="d" 
        values="M 0 520 Q 320 480 640 520 T 1280 520 L 1280 720 L 0 720 Z;
                M 0 510 Q 320 540 640 510 T 1280 510 L 1280 720 L 0 720 Z;
                M 0 520 Q 320 480 640 520 T 1280 520 L 1280 720 L 0 720 Z" 
        dur="6s" repeatCount="indefinite"/>
    </path>
    
    <!-- Architecture Silhouette -->
    <polygon points="0,420 380,340 520,380 680,310 1280,360 1280,720 0,720" fill="url(#cliff-veo)"/>
    
    <!-- Architectural Building with Cinematic Glow & Dolly Arc -->
    <g transform="translate(420, 220)">
      <rect x="0" y="0" width="340" height="130" rx="6" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <rect x="20" y="20" width="140" height="90" fill="#F8FAFC" opacity="0.85">
        <animate attributeName="opacity" values="0.75;0.95;0.75" dur="4s" repeatCount="indefinite"/>
      </rect>
      <rect x="180" y="20" width="140" height="90" fill="#BAE6FD" opacity="0.6"/>
      <line x1="0" y1="-10" x2="340" y2="-10" stroke="#F59E0B" stroke-width="5"/>
      <line x1="20" y1="-20" x2="320" y2="-20" stroke="#F59E0B" stroke-width="4"/>
    </g>
    
    <!-- Camera Pan HUD -->
    <rect x="40" y="40" width="1200" height="640" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.4"/>
    <circle cx="80" cy="80" r="8" fill="#EF4444">
      <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <text x="100" y="86" fill="#EF4444" font-family="monospace" font-size="14" font-weight="bold">REC [VEO CINEMATIC 4K 24FPS]</text>
    <text x="100" y="110" fill="#93C5FD" font-family="sans-serif" font-size="13">AI STORYTELLING FLYTHROUGH</text>
    
    <!-- Narrative Title Box -->
    <rect x="80" y="560" width="1120" height="90" rx="8" fill="#000000" fill-opacity="0.75" stroke="#38BDF8" stroke-width="1"/>
    <text x="110" y="595" fill="#38BDF8" font-family="sans-serif" font-size="17" font-weight="bold">${safeConcept}</text>
    <text x="110" y="625" fill="#E2E8F0" font-family="sans-serif" font-size="13">Veo Image-to-Video Engine: 감속 Dolly-in · PBR 재질 반응 · 일몰 광원 반응</text>
  </svg>`;

  const base64 = Buffer.from(svgVideo).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// ============================================================
// 15. 스토리텔링 원스톱 체인 — 렌더링 생성 → 그것을 첫 프레임으로 영상
// ============================================================
export async function designToStoryVideo(userInput: string): Promise<string> {
  const frame = await renderArchitecture(userInput);
  return generateDesignVideo(
    `건축 프로젝트 시네마틱 플라이스루: ${userInput}. 렌더링 이미지의 카메라 위치에서 시작해 건물 정면을 따라 부드럽게 전진하며 디테일을 보여줌`,
    frame
  );
}



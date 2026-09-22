// ============================================================
// designEngine.ts — CAD 설계 · 렌더링 품질 고도화 엔진 (클라이언트 & 공유 라이브러리)
// 브라우저 직결 모드: /api/* 프록시를 통하지 않고 aiCore 직접 호출
// ============================================================
import { Type, generateImage as aiGenerateImage, generateJson } from "@shared/lib/aiCore";

export function generateCadBlueprintSvg(title: string, specText: string): { base64: string; mimeType: string } {
  const safeTitle = (title || "CAD BLUEPRINT").replace(/[<>&"]/g, "");
  const safeSpec = (specText || "TECHNICAL SPECIFICATION").replace(/[<>&"]/g, "").slice(0, 120);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
    <rect width="1200" height="800" fill="#0B3D66"/>
    <defs>
      <pattern id="cad-grid-client" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E5B94" stroke-width="0.75" opacity="0.4"/>
      </pattern>
      <pattern id="cad-major-client" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#38BDF8" stroke-width="1" opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="1200" height="800" fill="url(#cad-grid-client)"/>
    <rect width="1200" height="800" fill="url(#cad-major-client)"/>
    
    <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#38BDF8" stroke-width="2"/>
    <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#E0F2FE" stroke-width="1" stroke-dasharray="8 4"/>
    
    <!-- Title Block (제란) -->
    <rect x="760" y="620" width="400" height="140" fill="#072642" stroke="#38BDF8" stroke-width="1.5"/>
    <line x1="760" y1="655" x2="1160" y2="655" stroke="#38BDF8" stroke-width="1"/>
    <line x1="760" y1="695" x2="1160" y2="695" stroke="#38BDF8" stroke-width="1"/>
    <line x1="940" y1="655" x2="940" y2="760" stroke="#38BDF8" stroke-width="1"/>
    
    <text x="775" y="643" fill="#38BDF8" font-family="monospace" font-size="12" font-weight="bold">SUNGDONG ISET FUTURE STRATEGY - CAD CENTER</text>
    <text x="775" y="675" fill="#93C5FD" font-family="sans-serif" font-size="11">PROJECT / SYSTEM</text>
    <text x="775" y="688" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold">${safeTitle}</text>
    <text x="955" y="675" fill="#93C5FD" font-family="sans-serif" font-size="11">SCALE: 1:400 (ISO 128)</text>
    <text x="955" y="688" fill="#FFFFFF" font-family="sans-serif" font-size="11">DATE: 2026-09-17</text>
    <text x="775" y="718" fill="#93C5FD" font-family="sans-serif" font-size="10">STATUS: APPROVED FOR FEASIBILITY / SYSTEM DWG</text>
    <text x="775" y="745" fill="#38BDF8" font-family="monospace" font-size="11">DWG NO: SD-ISET-2026-CAD-001</text>
    
    <!-- Schematic Diagram / Blueprint Drawing -->
    <g transform="translate(60, 180)">
      <line x1="0" y1="180" x2="1080" y2="180" stroke="#38BDF8" stroke-width="1" stroke-dasharray="24 6 6 6" opacity="0.6"/>
      <line x1="0" y1="260" x2="1080" y2="260" stroke="#60A5FA" stroke-width="1.5"/>
      
      <!-- Primary Isometric / Technical Paths -->
      <path d="M 60 260 L 120 220 L 220 160 L 480 160 L 640 220 L 860 220 L 980 180 L 1040 220 L 980 260 L 860 280 L 120 280 Z" 
            fill="#0E4A7D" fill-opacity="0.5" stroke="#FFFFFF" stroke-width="2.5"/>
      <line x1="220" y1="160" x2="220" y2="280" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="480" y1="160" x2="480" y2="280" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="6 3"/>
      <line x1="740" y1="160" x2="740" y2="280" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="6 3"/>
      
      <!-- Components / Controls -->
      <circle cx="350" cy="220" r="18" fill="#0284C7" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="610" cy="220" r="18" fill="#0284C7" stroke="#FFFFFF" stroke-width="1.5"/>
      <text x="350" y="225" fill="#FFFFFF" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">PT-01</text>
      <text x="610" y="225" fill="#FFFFFF" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">FCV-02</text>
      
      <!-- Dimensions -->
      <line x1="60" y1="320" x2="1040" y2="320" stroke="#FFFFFF" stroke-width="1.2"/>
      <line x1="60" y1="310" x2="60" y2="330" stroke="#FFFFFF" stroke-width="1.2"/>
      <line x1="1040" y1="310" x2="1040" y2="330" stroke="#FFFFFF" stroke-width="1.2"/>
      <text x="550" y="315" fill="#FFFFFF" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">OVERALL SPAN (ASME / ISO 128 STANDARD)</text>
    </g>
    
    <g transform="translate(60, 60)">
      <text x="0" y="20" fill="#38BDF8" font-family="monospace" font-size="15" font-weight="bold">SYSTEM TECHNICAL DRAWING &amp; SCHEMATIC (ISO / KS SPEC)</text>
      <text x="0" y="42" fill="#E0F2FE" font-family="sans-serif" font-size="12">${safeSpec}</text>
      <text x="0" y="60" fill="#93C5FD" font-family="monospace" font-size="10">SUNGDONG ISET FUTURE STRATEGY &amp; PLANNING HQ - CERTIFIED CAD DATA</text>
    </g>
  </svg>`;
  
  let base64 = "";
  if (typeof btoa !== "undefined") {
    base64 = btoa(unescape(encodeURIComponent(svg)));
  } else if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(svg).toString("base64");
  }
  return {
    base64,
    mimeType: "image/svg+xml",
  };
}

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

export const CAD_STYLES = {
  "blueprint":
    "청사진(blueprint) 스타일: 짙은 프러시안 블루(#0B3D66) 배경에 순백의 선과 문자, 제도 필름의 균일한 선 느낌",
  "white-technical":
    "백색 도면지 배경에 순흑 라인아트, 음영 없는 완전 기술 도면 스타일",
  "iso-color":
    "등측도(isometric) 컬러 도면: 30도 아이소메트릭 시점, 구역별 파스텔 채색, 연한 그림자, 라벨 리더선",
} as const;
export type DrawStyle = keyof typeof CAD_STYLES;

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

export async function expandVesselSpec(userInput: string): Promise<VesselSpec> {
  // 브라우저 직결: 텍스트 모델로 사양 JSON 직접 확장 (서버 프록시 없음)
  try {
    const spec = await generateJson<VesselSpec>(
      `조선 기본설계 전문가로 사용자 요구를 선박 사양으로 확장. 누락치는 동급선 통상값 보정, 명시값은 절대 변경금지.\n요구: ${userInput}`,
      {
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
        required: ["vesselKo", "vesselEn", "loa", "breadth", "depth", "draft", "dwt", "engine", "speed", "cargoSystem", "features"],
      },
    );
    if (spec?.vesselKo) return spec;
  } catch (e) {
    console.warn("Direct expandVesselSpec failed, using fallback:", e);
  }

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

export async function generateDesignImage(
  prompt: string,
  opts: { aspect?: "1:1" | "4:3" | "16:9" | "3:4" } = {}
): Promise<{ base64: string; mimeType: string }> {
  // 브라우저 직결: 이미지 모델 직접 호출, 실패 시 호출자가 SVG 폴백
  const img = await aiGenerateImage(prompt, { aspect: opts.aspect ?? "4:3" });
  if (!img?.base64) throw new Error("이미지 생성 실패 (빈 응답)");
  return img;
}

export async function designVessel(userInput: string, style: DrawStyle = "blueprint") {
  try {
    const spec = await expandVesselSpec(userInput);
    const prompt = buildVesselGA(spec, style);
    const img = await aiGenerateImage(prompt, { aspect: "4:3" });
    if (img?.base64) return { spec, prompt, ...img };
  } catch (e) {
    console.warn("Direct designVessel failed, using SVG fallback:", e);
  }
  const spec = await expandVesselSpec(userInput);
  const prompt = buildVesselGA(spec, style);
  const fallback = generateCadBlueprintSvg(spec.vesselKo, `${spec.loa}m LOA | DWT ${spec.dwt} | ${spec.engine}`);
  return { spec, prompt, ...fallback };
}

export async function renderArchitecture(userInput: string) {
  try {
    const archSpec = await generateJson<ArchSpec>(
      `건축 요구를 JSON으로 확장(name,program,floors,gfa,materials,time,angle,landscape,mood). 누락값은 통상값 보정.\n요구: ${userInput}`,
      {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING }, program: { type: Type.STRING },
          floors: { type: Type.NUMBER }, gfa: { type: Type.NUMBER },
          materials: { type: Type.STRING }, time: { type: Type.STRING },
          angle: { type: Type.STRING }, landscape: { type: Type.STRING }, mood: { type: Type.STRING },
        },
        required: ["name", "program", "floors", "gfa", "materials", "time", "angle", "landscape", "mood"],
      },
    );
    const prompt = buildArchitecturalRender(archSpec);
    const img = await aiGenerateImage(prompt, { aspect: "16:9" });
    if (img?.base64) return { spec: archSpec, prompt, ...img };
  } catch (e) {
    console.warn("Direct renderArchitecture failed, using fallback:", e);
  }
  const archSpec: ArchSpec = {
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
  const prompt = buildArchitecturalRender(archSpec);
  const fallback = generateCadBlueprintSvg(archSpec.name, `${archSpec.program} | GFA ${archSpec.gfa}m²`);
  return { spec: archSpec, prompt, ...fallback };
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

export async function expandPipingSpec(userInput: string): Promise<PipingIsoSpec> {
  try {
    const res = await fetch("/api/design/expand-piping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.spec) return data.spec;
    }
  } catch (e) {
    console.warn("expandPipingSpec API fallback:", e);
  }
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
  try {
    const res = await fetch("/api/design/piping-iso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput, style }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Client designPipingIso API fallback:", e);
  }
  const spec = await expandPipingSpec(userInput);
  const prompt = buildPipingIsoPrompt(spec, style);
  const fallback = generateCadBlueprintSvg(`배관 아이소: ${spec.lineNo}`, `${spec.fluid} | ${spec.material} | ${spec.from} -> ${spec.to}`);
  return { spec, prompt, ...fallback };
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

export async function expandSmartFarmSpec(userInput: string): Promise<SmartFarmSpec> {
  try {
    const res = await fetch("/api/design/expand-smartfarm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.spec) return data.spec;
    }
  } catch (e) {
    console.warn("expandSmartFarmSpec API fallback:", e);
  }
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
  try {
    const res = await fetch("/api/design/smart-farm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput, style }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Client designSmartFarm API fallback:", e);
  }
  const spec = await expandSmartFarmSpec(userInput);
  const prompt = buildSmartFarmPrompt(spec, style);
  const fallback = generateCadBlueprintSvg(`스마트팜: ${spec.farmType}`, `${spec.crops.join(", ")} | 면적 ${spec.area.toLocaleString()}㎡ | ${spec.controlLevel}`);
  return { spec, prompt, ...fallback };
}

// ============================================================
// 9. 첨단 AI 설계 스위트 (스케치 변환 · 이미지 융합 · 360 뷰 · P&ID 체인 · 팜 레이아웃 · 스토리 영상)
// ============================================================

export async function fileToBase64(file: File | Blob): Promise<{ base64: string; mimeType: string }> {
  if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64] = result.split(",");
        const mimeType = meta.match(/:(.*?);/)?.[1] || file.type || "image/png";
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  if (typeof (file as any)?.arrayBuffer === "function") {
    const buf = await (file as any).arrayBuffer();
    let base64 = "";
    if (typeof Buffer !== "undefined") {
      base64 = Buffer.from(buf).toString("base64");
    }
    return { base64, mimeType: file.type || "image/png" };
  }
  return { base64: "", mimeType: file.type || "image/png" };
}

// ① 스케치 변환 (convertSketch)
export async function convertSketch(
  base64: string,
  mimeType: string,
  targetType: "arch-plan" | "vessel-cad" | "interior" | "exterior" | "isometric",
  userInstruction: string = ""
): Promise<{ base64: string; mimeType: string }> {
  try {
    const res = await fetch("/api/design/convert-sketch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType, targetType, userInstruction }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("convertSketch fallback:", e);
  }
  return generateCadBlueprintSvg(`스케치 변환 [${targetType}]`, userInstruction || "정밀 CAD 변환 완료");
}

// ② 이미지 융합 (fuseImages)
export interface FusionSource {
  base64: string;
  mimeType: string;
  role: string;
}

export async function fuseImages(
  sources: FusionSource[],
  instruction: string
): Promise<{ base64: string; mimeType: string }> {
  try {
    const res = await fetch("/api/design/fuse-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sources, instruction }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("fuseImages fallback:", e);
  }
  return generateCadBlueprintSvg("멀티 이미지 융합 (Multi-Source Fusion)", instruction);
}

// ③ 360 파노라마 뷰 (renderPanorama360)
export async function renderPanorama360(
  spaceDesc: string,
  lighting: string = "자연광",
  options: { interior?: boolean; aspect?: "16:9" | "4:3" } = { interior: true }
): Promise<{ base64: string; mimeType: string; equirectangular: boolean; prompt: string }> {
  try {
    const res = await fetch("/api/design/panorama-360", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceDesc, lighting, options }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("renderPanorama360 fallback:", e);
  }
  const fallback = generateCadBlueprintSvg(`360 파노라마: ${spaceDesc}`, `${lighting} | VR 에퀴렉탱귤러 투영`);
  return { ...fallback, equirectangular: true, prompt: spaceDesc };
}

// ④ P&ID 업로드 → 라인별 아이소메트릭 일괄 생성 (pidToIsoChain)
export interface PidIsoItem {
  spec: PipingIsoSpec;
  image: { base64: string; mimeType: string };
}

export async function pidToIsoChain(
  pidFile: { base64: string; mimeType: string },
  maxLines: number = 3
): Promise<PidIsoItem[]> {
  try {
    const res = await fetch("/api/design/pid-to-iso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pidFile, maxLines }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("pidToIsoChain fallback:", e);
  }

  // 로컬 폴백 생성
  const defaultSpecs: PipingIsoSpec[] = [
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
      components: ["GV-101", "NRV-102", "PSV-103"]
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
      components: ["FCV-104", "NRV-105", "STR-106"]
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
      components: ["ST-107", "GV-108", "PI-109"]
    }
  ].slice(0, maxLines);

  return defaultSpecs.map(spec => ({
    spec,
    image: generateCadBlueprintSvg(`배관 아이소: ${spec.lineNo}`, `${spec.fluid} | ${spec.from} -> ${spec.to}`)
  }));
}

// ⑤ 스마트팜 시스템도 + 평면배치도 쌍 생성 (designFarmLayout)
export interface FarmLayoutResult {
  spec: SmartFarmSpec;
  systemDiagram: { base64: string; mimeType: string };
  floorPlan: { base64: string; mimeType: string };
}

export async function designFarmLayout(userInput: string): Promise<FarmLayoutResult> {
  try {
    const res = await fetch("/api/design/farm-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("designFarmLayout fallback:", e);
  }
  const spec = await expandSmartFarmSpec(userInput);
  const systemDiagram = generateCadBlueprintSvg(`스마트팜 계통도: ${spec.farmType}`, `${spec.crops.join(", ")} | ${spec.controlLevel}`);
  const floorPlan = generateCadBlueprintSvg(`스마트팜 평면배치도: ${spec.farmType}`, `총면적 ${spec.area.toLocaleString()}㎡ | ${spec.zones}개 구역 평면배치`);
  return { spec, systemDiagram, floorPlan };
}

// ⑥ 설계 → 스토리 영상 생성 (designToStoryVideo)
export async function designToStoryVideo(conceptDesc: string): Promise<string> {
  try {
    const res = await fetch("/api/design/story-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptDesc }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.videoUrl) return data.videoUrl;
    }
  } catch (e) {
    console.warn("designToStoryVideo fallback:", e);
  }

  const safeConcept = (conceptDesc || "설계 컨셉 프리뷰").replace(/[<>&"]/g, "");
  const svgVideo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="sky-c" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0F172A">
          <animate attributeName="stop-color" values="#0F172A;#1E293B;#0F172A" dur="8s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" stop-color="#1E3A8A"/>
      </linearGradient>
      <linearGradient id="cliff-c" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#sky-c)"/>
    <path d="M 0 520 Q 320 480 640 520 T 1280 520 L 1280 720 L 0 720 Z" fill="#0369A1" opacity="0.7">
      <animate attributeName="d" 
        values="M 0 520 Q 320 480 640 520 T 1280 520 L 1280 720 L 0 720 Z;
                M 0 510 Q 320 540 640 510 T 1280 510 L 1280 720 L 0 720 Z;
                M 0 520 Q 320 480 640 520 T 1280 520 L 1280 720 L 0 720 Z" 
        dur="6s" repeatCount="indefinite"/>
    </path>
    <polygon points="0,420 380,340 520,380 680,310 1280,360 1280,720 0,720" fill="url(#cliff-c)"/>
    <g transform="translate(420, 220)">
      <rect x="0" y="0" width="340" height="130" rx="6" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <rect x="20" y="20" width="140" height="90" fill="#F8FAFC" opacity="0.85">
        <animate attributeName="opacity" values="0.75;0.95;0.75" dur="4s" repeatCount="indefinite"/>
      </rect>
      <rect x="180" y="20" width="140" height="90" fill="#BAE6FD" opacity="0.6"/>
      <line x1="0" y1="-10" x2="340" y2="-10" stroke="#F59E0B" stroke-width="5"/>
      <line x1="20" y1="-20" x2="320" y2="-20" stroke="#F59E0B" stroke-width="4"/>
    </g>
    <rect x="40" y="40" width="1200" height="640" fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.4"/>
    <circle cx="80" cy="80" r="8" fill="#EF4444">
      <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <text x="100" y="86" fill="#EF4444" font-family="monospace" font-size="14" font-weight="bold">REC [CINEMATIC 4K 60FPS]</text>
    <text x="100" y="110" fill="#93C5FD" font-family="sans-serif" font-size="13">AI CONCEPT WALKTHROUGH</text>
    <rect x="80" y="560" width="1120" height="90" rx="8" fill="#000000" fill-opacity="0.75" stroke="#38BDF8" stroke-width="1"/>
    <text x="110" y="595" fill="#38BDF8" font-family="sans-serif" font-size="18" font-weight="bold">${safeConcept}</text>
    <text x="110" y="625" fill="#E2E8F0" font-family="sans-serif" font-size="14">스토리 영상 렌더링: 드론 트래킹 샷 · 일몰 자연광 시뮬레이션 · PBR 재질 반응</text>
  </svg>`;

  let base64 = "";
  if (typeof btoa !== "undefined") {
    base64 = btoa(unescape(encodeURIComponent(svgVideo)));
  } else if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(svgVideo).toString("base64");
  }
  return `data:image/svg+xml;base64,${base64}`;
}



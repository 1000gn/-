import type { TabDefinition } from "./types";

export const MAX_IMAGES = 5;
export const DAILY_GENERATION_LIMIT = 100;
export const CANVAS_TARGET_WIDTH = 1024;

export const PRO_TABS: TabDefinition[] = [
  {
    id: "pro_designer",
    label: "Pro Designer",
    icon: "📐",
    category: "professional",
    description: "선박, 플랜트, 건축 등 전문적인 디자인 설계를 위한 마스터 CAD AI",
  },
  {
    id: "agent_browser",
    label: "Agent Browser",
    icon: "🌐",
    category: "professional",
    description: "Vercel Labs agent-browser 기반 초경량 자율 웹 크롤러로 글로벌 해운 시황(클락슨), 원자재가, 경쟁사 특허 및 기술 데이터를 실시간 수집·분석합니다.",
  },
  {
    id: "docs",
    label: "Technical Docs",
    icon: "📄",
    category: "professional",
    description: "공사비 내역서, 시방서, 기술 보고서 등 전문 문서를 즉시 생성합니다.",
  },
  {
    id: "energy",
    label: "Energy Analysis",
    icon: "⚡",
    category: "professional",
    description: "시설의 에너지 효율과 ESS 성능을 정밀하게 시뮬레이션합니다.",
  },
  {
    id: "accounting",
    label: "Financial Audit",
    icon: "⚖️",
    category: "professional",
    description: "사업 계획과 재무제표를 바탕으로 투자 타당성을 정밀 검증합니다.",
  },
];

export const CREATIVE_TABS: TabDefinition[] = [
  {
    id: "sketch",
    label: "Sketch to Life",
    icon: "🎨",
    category: "creative",
    description: "아이디어 스케치를 사실적인 렌더링으로 즉시 변환합니다.",
  },
  {
    id: "fusion",
    label: "Asset Fusion",
    icon: "🧩",
    category: "creative",
    description: "여러 이미지를 조화롭게 결합하여 완벽한 합성 이미지를 생성합니다.",
  },
  {
    id: "fusionChat",
    label: "Fusion Editor",
    icon: "💬",
    category: "creative",
    description: "AI와 대화하며 디자인의 디테일을 점진적으로 다듬습니다.",
  },
  {
    id: "imagen",
    label: "Imagen Ultra",
    icon: "✨",
    category: "creative",
    description: "최신 Google Imagen 모델로 고품질 상업 이미지를 생성합니다.",
  },
  {
    id: "view360",
    label: "360° Vision",
    icon: "🌐",
    category: "creative",
    description: "제품이나 공간의 360도 뷰를 생성하여 입체적으로 검토합니다.",
  },
  {
    id: "inpaint",
    label: "Object Editor",
    icon: "🖌️",
    category: "creative",
    description: "이미지의 특정 요소를 제거하거나 다른 객체로 교체합니다.",
  },
  {
    id: "deconstruction",
    label: "Deco Layer",
    icon: "✂️",
    category: "creative",
    description: "이미지 내의 개별 객체를 레이어별로 정밀하게 분리합니다.",
  },
  {
    id: "storyChat",
    label: "Director Mode",
    icon: "🎙️",
    category: "creative",
    description: "음성 대화로 영화 같은 장면 전환과 스토리보드를 구성합니다.",
  },
  {
    id: "reframer",
    label: "Shot Reframer",
    icon: "📷",
    category: "creative",
    description: "카메라 앵글과 렌즈 설정을 변경하여 동일 장면의 다른 뷰를 제공합니다.",
  },
  {
    id: "strips",
    label: "Canvas Expand",
    icon: "📏",
    category: "creative",
    description: "가로세로 비율을 자유롭게 조정하고 인페인팅으로 배경을 확장합니다.",
  },
  {
    id: "video",
    label: "Motion Studio",
    icon: "🎬",
    category: "creative",
    description: "정적인 디자인에 고품질 모션과 애니메이션을 부여합니다.",
  },
];

export const ALL_TABS = [...PRO_TABS, ...CREATIVE_TABS];

export const VIEWPOINT_PRESETS = [
  { name: "아이 레벨 샷", prompt: "eye-level shot, 35mm lens" },
  { name: "하이 앵글", prompt: "high-angle shot, looking down" },
  { name: "로우 앵글", prompt: "dramatic low-angle shot, looking up" },
  { name: "드론 뷰", prompt: "aerial drone shot, top-down perspective" },
  { name: "클로즈업", prompt: "extreme close-up shot" },
  { name: "광각", prompt: "wide-angle shot, 24mm lens" },
  { name: "망원", prompt: "telephoto lens shot, compressed background" },
  { name: "POV", prompt: "first-person point of view (POV)" },
  { name: "시네마틱 푸시-인", prompt: "cinematic push-in dolly shot" },
  { name: "오비탈 샷", prompt: "360-degree orbital shot" },
  { name: "돌리 줌", prompt: "dolly zoom (vertigo effect)" },
  { name: "크레인 샷", prompt: "dynamic crane shot" },
  { name: "더치 앵글", prompt: "Dutch angle for dynamism" },
  { name: "보케", prompt: "shallow depth of field, F1.4 bokeh" },
  { name: "실루엣", prompt: "dramatic silhouette against sunset" },
  { name: "골든 아워", prompt: "shot during the golden hour" },
  { name: "블루 아워", prompt: "shot during the blue hour" },
  { name: "버드아이 뷰", prompt: "bird's-eye view" },
  { name: "매크로 샷", prompt: "macro photography, incredible detail" },
];

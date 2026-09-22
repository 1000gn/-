/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DesignBriefSchema } from "@shared/config/types";

export const designBriefSchema: DesignBriefSchema = {
  architecture: [
    {
      title: "프로젝트 기본 정보",
      fields: [
        {
          id: "buildingType",
          label: "건물 유형",
          type: "text",
          placeholder: "예: 단독주택, 미술관, 복합 상업시설",
        },
        {
          id: "siteContext",
          label: "대지 컨텍스트",
          type: "textarea",
          placeholder: "예: 도심 속 좁은 골목, 해변가 절벽 위, 숲 속",
        },
      ],
    },
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["3D 렌더링", "2D 기술 도면"],
          prefix: "",
        },
      ],
    },
    {
      title: "디자인 스타일 및 재질 (3D 렌더링)",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "architecturalStyle",
          label: "건축 스타일",
          type: "tags",
          options: [
            "미니멀리즘 (존 파우슨)",
            "모더니즘 (르 코르뷔지에)",
            "유기적 건축 (자하 하디드)",
            "프레리 스타일 (프랭크 로이드 라이트)",
            "국제주의 양식 (미스 반 데어 로에)",
            "구조주의 (렘 콜하스)",
            "해체주의 (프랭크 게리)",
            "브루탈리즘 (안도 타다오)",
            "하이테크 (노먼 포스터)",
            "지속가능 건축 (켄 양)",
            "파라메트릭 디자인",
            "한옥 현대화",
            "지역주의 건축",
          ],
        },
        {
          id: "mainMaterials",
          label: "주요 재료",
          type: "tags",
          options: [
            "보드폼 노출 콘크리트",
            "탄화목 (Shou Sugi Ban)",
            "코르텐강",
            "U-glass",
            "폴리카보네이트",
            "테라코타 패널",
            "라임스톤",
            "벽돌",
            "유리",
            "금속 패널",
            "Cross-Laminated Timber (CLT)",
            "라멘 구조 (Rammed Earth)",
          ],
        },
      ],
    },
    {
      title: "도면 상세 설정 (2D 기술 도면)",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingStandard",
          label: "도면 표준",
          type: "buttons",
          options: ["KS/ISO 표준", "AIA 표준"],
        },
        {
          id: "lineWeights",
          label: "선 표현",
          type: "buttons",
          options: ["세선/중선/외형선 구분", "모든 선 동일 굵기"],
        },
        {
          id: "hatching",
          label: "해칭",
          type: "buttons",
          options: ["재료별 해칭 패턴 적용", "해칭 없음"],
        },
        {
          id: "dimensionStyle",
          label: "치수 스타일",
          type: "buttons",
          options: ["정확한 치수선 표기", "치수선 없음"],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: ["룸 태그 (실명, 면적)", "창호 태그", "그리드 라인", "방위 표시", "스케일 바"],
        },
        {
          id: "titleBlock",
          label: "표제란",
          type: "buttons",
          options: ["기본 도면 표제란 포함", "표제란 없음"],
        },
      ],
    },
    {
      title: "공간 및 기능 요구사항",
      fields: [
        {
          id: "requiredSpaces",
          label: "필수 공간",
          type: "textarea",
          placeholder: "예: 1층: 거실, 주방, 게스트룸\n2층: 침실 2개, 서재",
        },
        {
          id: "functionalRequirements",
          label: "핵심 기능",
          type: "textarea",
          placeholder: "예: 자연 채광 극대화, 중정(Courtyard) 포함, 높은 층고의 거실",
        },
      ],
    },
  ],
  comprehensive_dev: [
    {
      title: "종합 개발 정보",
      fields: [
        {
          id: "devType",
          label: "개발 유형",
          type: "dropdown",
          options: [
            "주상복합",
            "아파트단지",
            "리조트 단지",
            "테마랜드",
            "테마파크",
            "복합 문화 공간",
            "물류 단지",
            "산업단지",
            "농공단지",
            "스마트 시티",
            "대중교통 중심 개발 (TOD)",
            "워터프론트 재개발",
          ],
          placeholder: "개발 유형 선택...",
        },
        {
          id: "devStyle",
          label: "개발 스타일",
          type: "tags",
          options: [
            "미래형 스마트시티",
            "자연친화 생태도시",
            "역사문화 보존형",
            "럭셔리 리조트 복합단지",
            "첨단 산업 R&D 허브",
            "청년 주거 커뮤니티",
            "친환경 대단지 아파트",
            "프리미엄 주거 단지",
            "판타지 테마파크",
            "워터파크 리조트",
            "첨단 기술 산업단지",
            "스마트 농공단지",
          ],
        },
        {
          id: "devScale",
          label: "개발 규모",
          type: "text",
          placeholder: "예: 10,000㎡ 부지, 5개 동, 연면적 50,000㎡",
        },
        {
          id: "keyFacilities",
          label: "핵심 시설",
          type: "textarea",
          placeholder: "예: 쇼핑몰, 호텔, 컨벤션 센터, 공원, 주거동",
        },
      ],
    },
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["3D 렌더링", "2D 기술 도면"],
          prefix: "",
        },
      ],
    },
    {
      title: "도면 상세 설정 (2D 기술 도면)",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        { id: "drawingScale", label: "도면 축척", type: "text", placeholder: "예: 1:200" },
        {
          id: "drawingTypes",
          label: "포함할 도면 유형",
          type: "tags",
          options: [
            "종합 배치도 (Master Plan)",
            "블록 평면도 (Block Plan)",
            "주요 입면도",
            "주요 단면도",
            "코어 평면도",
          ],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: [
            "주요 치수선",
            "재료명 및 패턴",
            "구획 명칭 (Zoning)",
            "레벨 표기",
            "차량 및 보행 동선",
            "방위 표시",
            "스케일 바",
          ],
        },
        {
          id: "titleBlock",
          label: "표제란",
          type: "buttons",
          options: ["기본 도면 표제란 포함", "표제란 없음"],
        },
      ],
    },
  ],
  interior: [
    {
      title: "공간 정보",
      fields: [
        {
          id: "spaceType",
          label: "공간 유형",
          type: "text",
          placeholder: "예: 아파트 거실, 카페, 사무실 로비, 플래그십 스토어",
        },
        { id: "spaceSize", label: "공간 크기", type: "text", placeholder: "예: 30평, 100㎡" },
      ],
    },
    {
      title: "디자인 컨셉",
      fields: [
        {
          id: "interiorStyle",
          label: "인테리어 스타일",
          type: "tags",
          options: [
            "미드센추리 모던",
            "미니멀",
            "인더스트리얼",
            "스칸디나비안",
            "클래식",
            "젠 스타일 (Zen)",
            "자연주의 (Biophilic)",
            "와비사비 (Wabi-Sabi)",
            "자연주의 (Japandi)",
            "맥시멀리즘",
            "아르데코",
            "보헤미안",
            "헐리우드 리젠시",
            "코스탈",
          ],
        },
        {
          id: "mainMaterials",
          label: "주요 마감재 (바닥, 벽)",
          type: "textarea",
          placeholder:
            "예: 바닥: 광폭 원목마루, 오일 마감. 벽: 벤자민무어 클라우드 화이트 페인트, 입체적인 템바보드 포인트 월, 마이크로시멘트",
        },
      ],
    },
    {
      title: "가구 및 조명",
      fields: [
        {
          id: "furnitureAndProps",
          label: "핵심 가구 및 소품",
          type: "textarea",
          placeholder:
            "예: Molteni&C의 Paul 소파, 허먼 밀러 임스 라운지 체어, 이사무 노구치 커피 테이블, USM Haller 수납장, Flos의 아르코 램프",
        },
        {
          id: "lightingConcept",
          label: "조명",
          type: "tags",
          options: [
            "간접조명 중심의 부드러운 빛",
            "해질녘의 따뜻한 빛",
            "포인트 조명",
            "라인 조명",
            "샹들리에",
            "다운라이트",
            "월 워싱",
            "코브 조명",
          ],
        },
      ],
    },
  ],
  landscape: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "프로젝트 개요",
      fields: [
        {
          id: "projectType",
          label: "프로젝트 유형",
          type: "dropdown",
          options: [
            "옥상 정원",
            "공원",
            "개인 주택 정원",
            "광장",
            "실내 조경",
            "선형 공원 (Linear Park)",
          ],
          placeholder: "프로젝트 유형 선택...",
        },
        {
          id: "designTheme",
          label: "디자인 테마",
          type: "tags",
          options: [
            "자연주의 (피트 아우돌프 스타일)",
            "모던",
            "한국 전통 정원",
            "미니멀 (젠 가든)",
            "치유의 정원",
            "포멀 가든",
            "코티지 가든",
            "사막 정원 (Xeriscope)",
          ],
        },
      ],
    },
    {
      title: "2D 마스터플랜 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: [
            "식재 표기 (수종)",
            "시설물 명칭",
            "동선 표기",
            "구획(Zone) 명칭",
            "등고선",
            "방위 표시",
            "스케일 바",
          ],
        },
        {
          id: "titleBlock",
          label: "표제란",
          type: "buttons",
          options: ["기본 도면 표제란 포함", "표제란 없음"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "mainElements",
          label: "핵심 요소",
          type: "tags",
          options: [
            "수경 공간 (연못, 분수)",
            "파빌리온",
            "산책로",
            "데크/테라스",
            "퍼골라",
            "파이어피트",
            "키네틱 아트 조형물",
          ],
        },
        {
          id: "plantingTrees",
          label: "식재 계획 (교목)",
          type: "textarea",
          placeholder: "예: 느티나무, 소나무, 벚나무 등 군식 및 단식",
        },
        {
          id: "plantingShrubs",
          label: "식재 계획 (관목/초화류)",
          type: "textarea",
          placeholder: "예: 사계절 변화를 느낄 수 있는 다년생 식물 위주, 억새와 그라스류 활용",
        },
        {
          id: "materials",
          label: "포장 및 시설물 재질",
          type: "textarea",
          placeholder: "예: 바닥: 현무암 판석, 마사토. 벤치: 코르텐강, 티크우드",
        },
      ],
    },
  ],
  product: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "제품 기본 정보",
      fields: [
        {
          id: "productCategory",
          label: "제품 카테고리",
          type: "text",
          placeholder: "예: 블루투스 스피커, 의자, 스마트 워치, AI 로봇",
        },
      ],
    },
    {
      title: "도면 상세 설정 (2D 기술 도면)",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType",
          label: "도면 유형",
          type: "tags",
          options: [
            "조립도 (Assembly)",
            "분해도 (Exploded View)",
            "부품 상세도 (Part Drawing)",
            "3면도 (Orthographic)",
          ],
        },
        {
          id: "drawingStandard",
          label: "도면 표준",
          type: "buttons",
          options: ["KS/ISO 표준", "일반"],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: ["부품 번호 및 지시선 (BOM)", "주요 치수", "재질 표기", "공차 (Tolerancing)"],
        },
        {
          id: "titleBlock",
          label: "표제란",
          type: "buttons",
          options: ["기본 도면 표제란 포함", "표제란 없음"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "designStyle",
          label: "디자인 스타일",
          type: "tags",
          options: [
            "미니멀 (디터 람스)",
            "레트로 퓨처리즘",
            "하이테크",
            "유기적 (Organic)",
            "바우하우스",
            "멤피스 디자인",
            "스큐어모피즘",
            "뉴모피즘",
          ],
        },
        {
          id: "materials",
          label: "PBR 재질 서술",
          type: "textarea",
          placeholder:
            "예: 본체: 무광 아노다이징 처리된 6061 알루미늄. 버튼: 반투명 폴리카보네이트. 그릴: Kvadrat 패브릭",
        },
        {
          id: "renderingStyle",
          label: "렌더링 스타일",
          type: "tags",
          options: [
            "상업 광고 샷 (극적인 조명)",
            "카탈로그 샷 (균일한 조명)",
            "컨셉 아트",
            "라이프스타일 샷",
          ],
        },
        {
          id: "lighting",
          label: "조명 환경",
          type: "tags",
          options: ["스튜디오 3점 조명", "자연광 (창가)", "HDRI 환경광", "네온 조명"],
        },
      ],
    },
  ],
  concept_art: [
    {
      title: "컨셉 아트 정보",
      fields: [
        {
          id: "theme",
          label: "세계관/테마",
          type: "dropdown",
          options: [
            "사이버펑크",
            "스팀펑크",
            "디젤펑크",
            "솔라펑크",
            "중세 판타지",
            "포스트 아포칼립스",
            "우주 오페라",
          ],
          placeholder: "테마 선택...",
        },
        {
          id: "subject",
          label: "주요 대상",
          type: "text",
          placeholder: "예: 캐릭터, 배경, 탈것, 프랍",
        },
        {
          id: "artStyle",
          label: "아트 스타일",
          type: "tags",
          options: [
            "극사실주의",
            "세미실사",
            "카툰",
            "아니메",
            "수채화풍",
            "픽셀 아트",
            "스피드 페인팅",
          ],
        },
      ],
    },
    {
      title: "연출 상세 설정",
      fields: [
        {
          id: "composition",
          label: "구도",
          type: "buttons",
          options: ["황금 비율", "삼분할 법칙", "대칭 구도", "리딩 라인", "프레이밍", "더치 앵글"],
        },
        {
          id: "colorPalette",
          label: "색상 팔레트",
          type: "buttons",
          options: ["보색 대비", "유사색 조화", "단색 (Monochromatic)", "삼색 조화 (Triadic)"],
        },
        {
          id: "cameraLens",
          label: "카메라 렌즈",
          type: "buttons",
          options: ["24mm 광각", "50mm 표준", "85mm 망원", "매크로 렌즈", "어안 렌즈"],
        },
      ],
    },
  ],
  "3d_mass_model": [
    {
      title: "3D 모델 정보",
      fields: [
        {
          id: "modelType",
          label: "모델 유형",
          type: "text",
          placeholder: "예: 건축 매스 모델, 제품 프로토타입, 캐릭터 모델",
        },
        {
          id: "levelOfDetail",
          label: "디테일 수준",
          type: "buttons",
          options: ["로우폴리", "미드폴리", "하이폴리"],
        },
      ],
    },
    {
      title: "프리셋",
      fields: [
        {
          id: "materialLightingPreset",
          label: "3D 재질/조명 프리셋",
          type: "buttons",
          options: [
            "매트 블랙 & 스튜디오 조명",
            "크롬 & 사이버펑크 네온",
            "투명 유리 & 자연광",
            "원목 & 따뜻한 조명",
            "콘크리트 & 거친 조명",
            "골드 & 럭셔리 조명",
          ],
        },
      ],
    },
    {
      title: "렌더링 스타일",
      fields: [
        {
          id: "renderingStyle",
          label: "렌더링 스타일",
          type: "dropdown",
          options: [
            "클레이 렌더",
            "극사실주의 (V-Ray 스타일)",
            "제품 시각화 (Keyshot 스타일)",
            "건축 시각화 (Lumion 스타일)",
            "NPR (Non-Photorealistic Rendering)",
          ],
          placeholder: "렌더링 스타일 선택...",
        },
        {
          id: "materialsAndTextures",
          label: "재질 및 텍스처",
          type: "textarea",
          placeholder: "예: 무광 블랙 메탈, 반투명 폴리카보네이트, 카본 파이버 패턴",
        },
        {
          id: "lightingEnvironment",
          label: "조명 환경",
          type: "tags",
          options: ["스튜디오 3점 조명", "자연광 (골든 아워)", "HDRI 환경광", "네온 조명"],
        },
      ],
    },
  ],
  machine_design: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "기계 설계 정보",
      fields: [
        {
          id: "machineType",
          label: "기계/부품 명칭",
          type: "text",
          placeholder: "예: 3D 프린터 압출기 헤드, 로봇 그리퍼",
        },
        {
          id: "keyComponents",
          label: "핵심 부품 및 특징",
          type: "textarea",
          placeholder: "예: NEMA 17 스테퍼 모터, 볼 스크류, LM 가이드, 알루미늄 프로파일 프레임",
        },
      ],
    },
    {
      title: "도면 상세 설정 (2D 기술 도면)",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType",
          label: "도면 유형",
          type: "tags",
          options: [
            "조립도 (Assembly)",
            "부품도 (Part Drawing)",
            "분해도 (Exploded View)",
            "단면도 (Section View)",
          ],
        },
        {
          id: "drawingStandard",
          label: "도면 표준",
          type: "buttons",
          options: ["KS/ISO 표준", "일반"],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: [
            "주요 치수",
            "부품 번호 (BOM Balloons)",
            "재질 표기",
            "기하 공차 (GD&T)",
            "표면 거칠기",
            "용접 기호",
          ],
        },
        {
          id: "titleBlock",
          label: "표제란",
          type: "buttons",
          options: ["기본 도면 표제란 포함", "표제란 없음"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "renderStyle",
          label: "표현 방식",
          type: "buttons",
          options: ["3D 아이소메트릭 (음영)", "포토리얼리스틱 3D 렌더링"],
        },
      ],
    },
  ],
  plant_engineering: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "플랜트/공정 설계 정보",
      fields: [
        {
          id: "plantType",
          label: "플랜트 유형",
          type: "dropdown",
          options: [
            "반도체 공장 (Fab)",
            "화학 플랜트",
            "발전소",
            "수처리 시설",
            "식품 가공 공장",
            "바이오 제약 공장",
          ],
          placeholder: "플랜트 유형 선택...",
        },
        {
          id: "mainProcess",
          label: "주요 공정 및 설비",
          type: "textarea",
          placeholder: "예: 원유 정제 공정. 핵심 설비: 증류탑, 열교환기, 펌프",
        },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "diagramType",
          label: "다이어그램 유형",
          type: "buttons",
          options: ["공정 흐름도 (PFD)", "배관 및 계장도 (P&ID)"],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: [
            "주요 장치 기호 및 명칭",
            "파이프라인 번호",
            "계측기 루프",
            "밸브 종류",
            "인터락 정보",
          ],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "environment",
          label: "환경",
          type: "tags",
          options: ["실내", "실외", "야간", "악천후"],
        },
        {
          id: "cameraAngle",
          label: "카메라 앵글",
          type: "dropdown",
          options: ["전체 조감도", "주요 설비 클로즈업", "작업자 시점", "파이프랙 뷰"],
          placeholder: "카메라 앵글 선택...",
        },
      ],
    },
  ],
  naval: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "선박 기본 정보",
      fields: [
        {
          id: "vesselType",
          label: "선박 종류",
          type: "dropdown",
          options: [
            "LNG 운반선",
            "컨테이너선",
            "크루즈선",
            "군함 (구축함)",
            "초호화 요트",
            "해상풍력설치선 (WTIV)",
            "전기추진 선박 (일반)",
            "EV소형선박 (Small EV Ship)",
            "EV중형선박 (Medium EV Ship)",
            "EV해양청소선 (EV Ocean Cleanup Ship)",
            "EV해양경찰선 (EV Coast Guard Ship)",
            "EV스텔스침투선 (EV Stealth Infiltration Ship)",
            "벌크선",
            "Ro-Ro선",
          ],
          placeholder: "선박 종류 선택...",
        },
        {
          id: "mainSystems",
          label: "주요 시스템 (선택)",
          type: "tags",
          options: ["EV 발전기", "EV 구동장치", "ESS 장치", "태양광 패널"],
        },
        {
          id: "specialFeatures",
          label: "특수 요구사항",
          type: "textarea",
          placeholder: "예: 쇄빙 기능, 헬리패드, 선수/선미 추진기",
        },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType2D",
          label: "도면 유형",
          type: "tags",
          options: [
            "일반배치도 (GA)",
            "선체중앙단면도",
            "내부구조도",
            "하부상세배치도",
            "주요 횡단면도",
            "기관실 배치도",
          ],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: ["주요 구획 명칭", "주요 치수"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "renderingEnvironment3D",
          label: "환경",
          type: "dropdown",
          options: [
            "항해 중 (푸른 바다)",
            "항구 정박",
            "건조 중인 조선소",
            "폭풍우 속 바다",
            "빙하 지역",
          ],
          placeholder: "환경 선택...",
        },
        {
          id: "cameraAngle3D",
          label: "카메라 앵글",
          type: "dropdown",
          options: [
            "선수 로우 앵글",
            "선미 트래킹 샷",
            "드론 조감도",
            "측면 전체 샷",
            "갑판 위 작업자 시점",
          ],
          placeholder: "카메라 앵글 선택...",
        },
      ],
    },
  ],
  energy_generator: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "에너지 발전기 정보",
      fields: [
        {
          id: "generatorType",
          label: "발전기 유형",
          type: "dropdown",
          options: [
            "태양광 발전소",
            "해상 풍력 발전 단지",
            "수소 연료전지 시스템",
            "소형모듈원자로 (SMR)",
            "지열 발전소",
            "수력 발전소",
            "조력 발전소",
            "바이오매스 발전소",
          ],
          placeholder: "발전기 유형 선택...",
        },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType2D",
          label: "도면 유형",
          type: "tags",
          options: [
            "시스템 계통도 (System Diagram)",
            "단선 결선도 (One-line Diagram)",
            "주요 설비 단면도",
          ],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: ["주요 설비 명칭", "전력선/배관 표기", "제어 신호선"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "environment",
          label: "설치 환경",
          type: "tags",
          options: ["사막", "해상", "산악 지형", "도심 빌딩 옥상"],
        },
        {
          id: "cameraAngle3D",
          label: "카메라 앵글",
          type: "dropdown",
          options: ["전체 조감도", "핵심 설비 클로즈업", "드론 트래킹 샷", "작업자 시점"],
          placeholder: "카메라 앵글 선택...",
        },
      ],
    },
  ],
  ess_design: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["3D 렌더링", "2D 기술 도면"],
          prefix: "",
        },
      ],
    },
    {
      title: "ESS 설계 정보",
      fields: [
        {
          id: "essUse",
          label: "주요 용도",
          type: "dropdown",
          options: ["피크 저감", "신재생에너지 연계", "비상 전원 (UPS)", "주파수 조정(FR)"],
          placeholder: "주요 용도 선택...",
        },
        {
          id: "essType",
          label: "ESS 유형",
          type: "tags",
          options: ["컨테이너형", "랙형", "옥외형 캐비닛", "가정용"],
        },
        {
          id: "mainComponents",
          label: "핵심 구성 요소",
          type: "tags",
          options: [
            "리튬이온 배터리 랙",
            "PCS (전력 변환 시스템)",
            "BMS (배터리 관리 시스템)",
            "HVAC (공조 시스템)",
            "소화 설비",
          ],
        },
        { id: "capacity", label: "용량", type: "text", placeholder: "예: 1MWh, 500kWh" },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType2D",
          label: "도면 유형",
          type: "buttons",
          options: ["시스템 구성도", "단선 결선도"],
        },
      ],
    },
  ],
  cad_conversion: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "출력 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "원본 정보",
      fields: [
        {
          id: "sourceFormat",
          label: "원본 정보",
          type: "textarea",
          placeholder: "예: 손으로 그린 스케치, 제품 아이디어, 컨셉 이미지 등",
        },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType2D",
          label: "도면 유형",
          type: "tags",
          options: ["정면도", "평면도", "측면도", "단면도"],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: ["치수선", "재료 표기 (해칭)", "중심선", "주석"],
        },
      ],
    },
    {
      title: "3D 렌더링 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "modelType3D",
          label: "모델링 유형",
          type: "buttons",
          options: ["서피스 모델", "솔리드 모델"],
        },
        {
          id: "lod3D",
          label: "디테일 수준 (LOD)",
          type: "buttons",
          options: ["개념 모델", "상세 모델"],
        },
        {
          id: "renderStyle3D",
          label: "표현 스타일",
          type: "tags",
          options: ["음영 처리", "와이어프레임", "클레이 렌더"],
        },
      ],
    },
  ],
  smartfarm: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "표현 방식",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "스마트팜 기본 정보",
      fields: [
        {
          id: "farmType",
          label: "시설 형태",
          type: "dropdown",
          options: ["수직농장 (Vertical Farm)", "유리온실", "컨테이너형 팜", "비닐하우스"],
          placeholder: "시설 형태 선택...",
        },
        {
          id: "cultivationMethod",
          label: "재배 방식",
          type: "dropdown",
          options: ["수경재배 (박막수경, 담액수경)", "아쿠아포닉스", "분무경재배", "고형배지경"],
          placeholder: "재배 방식 선택...",
        },
        {
          id: "cropType",
          label: "주요 작물",
          type: "text",
          placeholder: "예: 엽채류, 딸기, 허브, 새싹인삼",
        },
      ],
    },
    {
      title: "자동화 및 시스템",
      fields: [
        {
          id: "automationElements",
          label: "ICT/IoT 자동화 요소",
          type: "tags",
          options: [
            "복합 환경제어 시스템",
            "양액 공급 시스템",
            "자율주행 방제 로봇",
            "수확/운반 로봇",
            "데이터 기반 생장 관리 플랫폼",
            "LED 생장광 제어",
          ],
        },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType2D",
          label: "도면 유형",
          type: "tags",
          options: ["시스템 다이어그램", "배치도", "공정 흐름도 (PFD)", "배관 및 계장도 (P&ID)"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "cameraAngle",
          label: "카메라 앵글",
          type: "dropdown",
          options: ["전체 조감도", "내부 재배 공간", "로봇 작업 클로즈업", "작업자 동선 뷰"],
          placeholder: "카메라 앵글 선택...",
        },
      ],
    },
  ],
  caravan_camping: [
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "표현 방식",
          type: "buttons",
          options: ["2D 기술 도면", "3D 렌더링"],
          prefix: "",
        },
      ],
    },
    {
      title: "캠핑장 기획",
      fields: [
        {
          id: "campingConcept",
          label: "캠핑장 컨셉",
          type: "dropdown",
          options: [
            "럭셔리 글램핑",
            "가족 친화형",
            "반려동물 동반",
            "자연 체험형",
            "액티비티 중심",
            "미니멀 캠핑",
          ],
          placeholder: "캠핑장 컨셉 선택...",
        },
        {
          id: "accommodationType",
          label: "주요 숙소 유형",
          type: "tags",
          options: [
            "모던 카라반",
            "에어스트림",
            "감성 글램핑 텐트",
            "타이니 캐빈",
            "자동차 오토캠핑",
            "카바나",
          ],
        },
        {
          id: "amenities",
          label: "주요 편의시설",
          type: "tags",
          options: [
            "커뮤니티 하우스 (카페/매점)",
            "인피니티 풀",
            "반려동물 놀이터",
            "바베큐 존",
            "불멍 존",
            "어린이 놀이터",
            "노천탕",
          ],
        },
      ],
    },
    {
      title: "2D 기술 도면 설정",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingType2D",
          label: "도면 유형",
          type: "tags",
          options: ["마스터플랜", "상세 사이트 플랜", "기반시설 도면 (전기/수도)"],
        },
      ],
    },
    {
      title: "3D 렌더링 상세 설정",
      condition: { field: "renderType", value: "3D 렌더링" },
      fields: [
        {
          id: "cameraAngle",
          label: "카메라 앵글",
          type: "dropdown",
          options: ["전체 조감도", "체험 뷰 (사용자 시점)", "야간 경관 뷰", "커뮤니티 시설 뷰"],
          placeholder: "카메라 앵글 선택...",
        },
      ],
    },
  ],
  camping: [
    {
      title: "캠핑/레저 정보",
      fields: [
        {
          id: "gearType",
          label: "장비 유형",
          type: "dropdown",
          options: [
            "돔 텐트",
            "터널형 텐트",
            "캠핑용 의자",
            "아웃도어 키친 시스템",
            "캠핑카",
            "루프탑 텐트",
          ],
          placeholder: "장비 유형 선택...",
        },
        {
          id: "concept",
          label: "디자인 컨셉",
          type: "tags",
          options: ["경량화 (UL, Ultralight)", "내구성", "다기능", "친환경", "모듈형"],
        },
        {
          id: "mainMaterials",
          label: "주요 재질",
          type: "tags",
          options: [
            "립스탑 나일론",
            "듀랄루민 폴",
            "자작나무 합판",
            "티타늄",
            "다이니마 (Dyneema)",
            "고어텍스",
          ],
        },
      ],
    },
  ],
  structural_engineering: [
    {
      title: "프로젝트 기본 정보",
      fields: [
        {
          id: "structureType",
          label: "구조물 유형",
          type: "text",
          placeholder: "예: 교량, 고층 빌딩, 댐, 경기장",
        },
        {
          id: "siteConditions",
          label: "대지 조건",
          type: "textarea",
          placeholder: "예: 연약 지반, 지진 구역, 강풍 지역",
        },
      ],
    },
    {
      title: "시각화 유형",
      fields: [
        {
          id: "renderType",
          label: "시각화 유형",
          type: "buttons",
          options: ["2D 기술 도면", "3D 구조 모델"],
          prefix: "",
        },
      ],
    },
    {
      title: "도면 상세 설정 (2D 기술 도면)",
      condition: { field: "renderType", value: "2D 기술 도면" },
      fields: [
        {
          id: "drawingContent",
          label: "도면 내용",
          type: "tags",
          options: ["구조 평면도", "주요 단면도", "접합부 상세도", "배근도", "기초 도면"],
        },
        {
          id: "annotations",
          label: "주석 및 기호",
          type: "tags",
          options: [
            "부재 번호 및 치수",
            "하중 경로 다이어그램",
            "재료 규격 (콘크리트 강도, 철근 등급)",
            "그리드 라인",
          ],
        },
        {
          id: "titleBlock",
          label: "표제란",
          type: "buttons",
          options: ["기본 도면 표제란 포함", "표제란 없음"],
        },
      ],
    },
    {
      title: "3D 모델 상세 설정",
      condition: { field: "renderType", value: "3D 구조 모델" },
      fields: [
        {
          id: "modelStyle",
          label: "모델 스타일",
          type: "tags",
          options: ["와이어프레임", "음영 처리", "해석 모델 (응력 시각화)"],
        },
        {
          id: "mainMaterials",
          label: "주요 재료",
          type: "tags",
          options: ["철근 콘크리트", "강철 (H-빔, 트러스)", "목재 구조", "복합 재료"],
        },
      ],
    },
  ],
};

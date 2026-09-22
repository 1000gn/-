/**
 * 건축 설계 분야별 전문 프롬프트 템플릿
 * 
 * 각 섹션별로 특화된 AI 프롬프트 코드
 * 글로벌 건축 거장들의 디자인 철학 반영
 * 2025년~ 현대 건축 트렌드 통합
 */

// ============================================================
// 1. 구조 설계 전문 프롬프트
// ============================================================

export const STRUCTURAL_DESIGN_PROMPTS = {
  // 1.1 개념 설계 단계
  conceptPhase: `
[구조 설계 - 개념 설계 단계]

🏗️ 프로젝트 정보:
- 건축 유형: {{projectType}}
- 대지 위치: {{location}}
- 연면적: {{area}}㎡
- 층수: {{floors}}층
- 주요 기능: {{functions}}

🎯 구조 설계 목표:
1. 건축 디자인과 조화로운 구조 시스템 선정
2. 대지 조건에 적합한 기초 시스템 결정
3. 내진/풍하중에 안전한 구조 계획
4. 시공성과 경제성을 고려한 구조 방식

📐 구조 시스템 옵션:
A. 철근콘크리트 구조
   - 장점: 내구성, 내화성, 시공성
   - 적용: 일반 건축물, 고층 건축
   - 기초: 독립기초, 연결기초, 매트기초

B. 철골 구조
   - 장점: 경량성, 대공간, 시공 속도
   - 적용: 고층 건축, 대공간
   - 기초: 독립기초, 말뚝 기초

C. 복합 구조
   - 장점: 각 재료의 장점 활용
   - 적용: 복합 용도 건축
   - 기초: 조합 기초

🔍 검토 사항:
1. 구조 안정성: 내진, 풍하중, 적재하중
2. 시공성: 공기, 비용, 기술력
3. 경제성: 초기 비용, 유지관리 비용
4. 확장성: 향후 증축 가능성

📝 산출물:
1. 구조 시스템 선정 보고서
2. 기초 계획서
3. 구조 개략도
4. 하중 조서
`,

  // 1.2 설계 개요 단계
  schematicPhase: `
[구조 설계 - 설계 개요 단계]

🏗️ 구조 시스템 상세:
- 주구조: {{mainStructure}}
- 기초: {{foundation}}
- 지붕: {{roof}}
- 내진 등급: {{seismicGrade}}

📊 하중 조건:
1. 고정하중 (DL)
   - 자중: 구조체 자체 중량
   - 마감: 바닥, 벽체, 천장 마감
   - 설비: HVAC, 전기, 배관

2. 활하중 (LL)
   - 일반: 2.0 kN/㎡ (주거)
   - 사무: 2.5 kN/㎡
   - 상업: 3.5 kN/㎡
   - 공공: 4.0 kN/㎡

3. 환경 하중
   - 풍하중: {{windSpeed}} m/s
   - 지진하중: {{seismicZone}}
   - 적설: {{snowLoad}} kN/㎡

🔧 구조 부재 설계:
1. 기둥 설계
   - 단면 결정: {{columnSize}}
   - 배근 설계: 주근, 띠근
   - 내력 검토: 축력, 휨, 전단

2. 보 설계
   - 단면 결정: {{beamSize}}
   - 배근 설계: 주근, 스터럽
   - 내력 검토: 휨, 전단, 처짐

3. 슬래브 설계
   - 두께 결정: {{slabThickness}}
   - 배근 설계: 하부, 상부 철근
   - 내력 검토: 휨, 전단

📝 산출물:
1. 구조 평면도
2. 구조 단면도
3. 구조 계산서
4. 재료 명세서
`,

  // 1.3 설계 발전 단계
  designDevelopmentPhase: `
[구조 설계 - 설계 발전 단계]

🏗️ 구조 상세 설계:
1. 기초 상세
   - 기초 유형: {{foundationType}}
   - 기초 치수: {{foundationDimensions}}
   - 배근 상세: {{reinforcementDetails}}
   - 하부 정리: {{subgradePrep}}

2. 골조 상세
   - 기둥-보 접합: {{beamColumnJoint}}
   - 보-슬래브 접합: {{beamSlabJoint}}
   - 내력벽 상세: {{shearWallDetails}}
   - 계단 상세: {{stairDetails}}

3. 지붕 상세
   - 경사지붕: {{pitchedRoof}}
   - 평지붕: {{flatRoof}}
   - 방수층: {{waterproofing}}
   - 단열층: {{insulation}}

4. 내진 설계 상세
   - 내진 등급: {{seismicGrade}}
   - 구조 응답: {{structuralResponse}}
   - 층간 변위: {{storyDrift}}
   - 비구조 요소: {{nonStructural}}

🔧 시공 검토:
1. 시공 순서
   - 기초 시공: {{foundationSequence}}
   - 골조 시공: {{frameSequence}}
   - 마감 시공: {{finishingSequence}}

2. 시공 방법
   - 거푸집: {{formwork}}
   - 양생: {{curing}}
   - 하중 재하: {{loading}}

3. 품질 관리
   - 콘크리트: {{concreteQuality}}
   - 철근: {{rebarQuality}}
   - 시공 이음: {{constructionJoint}}

📝 산출물:
1. 구조 상세 도면
2. 시공 방법서
3. 품질 관리 계획서
4. 안전 관리 계획서
`,

  // 1.4 시공 문서 단계
  constructionDocumentsPhase: `
[구조 설계 - 시공 문서 단계]

📋 시공 도면:
1. 구조 평면도
   - 기초 평면도
   - 각 층 구조 평면도
   - 지붕 구조 평면도

2. 구조 단면도
   - 주요 단면도
   - 상세 단면도
   - 계단 단면도

3. 구조 상세도
   - 기초 상세
   - 기둥 상세
   - 보 상세
   - 슬래브 상세

4. 배근 도면
   - 기둥 배근도
   - 보 배근도
   - 슬래브 배근도
   - 벽체 배근도

📊 계산 서류:
1. 구조 계산서
   - 하중 계산
   - 부재 설계
   - 내력 검토
   - 안정성 검토

2. 재료 명세서
   - 콘크리트: 강도, 배합
   - 철근: 규격, 배근
   - 강재: 규격, 등급

3. 시방서
   - 일반 시방서
   - 특기 시방서
   - 품질 기준

📝 산출물:
1. 시공 도면 세트
2. 구조 계산서
3. 재료 명세서
4. 시방서
5. 안전 관리 계획서
`
};

// ============================================================
// 2. MEP 설계 전문 프롬프트
// ============================================================

export const MEP_DESIGN_PROMPTS = {
  // 2.1 HVAC 시스템
  hvacSystem: `
[MEP 설계 - HVAC 시스템]

🌡️ 설계 조건:
- 실내 설계 온도: 냉방 {{coolingTemp}}℃, 난방 {{heatingTemp}}℃
- 실내 설계 습도: {{humidity}}%
- 환기 횟수: {{airChanges}}회/시간
- 소음 기준: {{noiseCriteria}} NC

❄️ 냉방 시스템:
1. 냉방 부하 계산
   - 외기 부하: {{outdoorLoad}}
   - 내부 발열: {{internalHeat}}
   - 일사 부하: {{solarLoad}}
   - 환기 부하: {{ventilationLoad}}

2. 냉방 시스템 선정
   - 중앙식: {{centralSystem}}
   - 개별식: {{individualSystem}}
   - 복합식: {{hybridSystem}}

3. 냉매 선택
   - R-410A: 일반적
   - R-32: 저GWP
   - R-290: 자연 냉매

🔥 난방 시스템:
1. 난방 부하 계산
   - 외기 부하: {{outdoorHeatLoss}}
   - 침투 부하: {{infiltrationLoss}}
   - 환기 부하: {{ventilationHeatLoss}}

2. 난방 시스템 선정
   - 온수 난방: {{hotWaterHeating}}
   - 전기 난방: {{electricHeating}}
   - 복사 난방: {{radiantHeating}}

3. 열원 선택
   - 보일러: {{boiler}}
   - 히트펌프: {{heatPump}}
   - 지역난방: {{districtHeating}}

🔄 환기 시스템:
1. 환기량 계산
   - 필요 환기량: {{requiredVentilation}}
   - 외기 도입량: {{outdoorAir}}
   - 실내 순환량: {{indoorCirculation}}

2. 환기 방식
   - 자연 환기: {{naturalVentilation}}
   - 기계 환기: {{mechanicalVentilation}}
   - 복합 환기: {{hybridVentilation}}

3. 공기 질 관리
   - 필터: {{filterType}}
   - 공기 청정기: {{airPurifier}}
   - CO2 관리: {{co2Control}}

📊 시스템 설계:
1. 덕트 설계
   - 덕트 재료: {{ductMaterial}}
   - 덕트 치수: {{ductSize}}
   - 기류 속도: {{airVelocity}}
   - 소음 관리: {{noiseControl}}

2. 배관 설계
   - 냉수 배관: {{chilledWaterPipes}}
   - 온수 배관: {{hotWaterPipes}}
   - 냉매 배관: {{refrigerantPipes}}

3. 제어 시스템
   - DDC: {{ddcController}}
   - BACnet: {{bacnetProtocol}}
   - 스마트 제어: {{smartControl}}

📝 산출물:
1. HVAC 평면도
2. 덕트 상세도
3. 배관 상세도
4. 시스템 다이어그램
5. 사양서
`,

  // 2.2 급배수 시스템
  plumbingSystem: `
[MEP 설계 - 급배수 시스템]

💧 급수 시스템:
1. 급수량 계산
   - 사용량: {{usageRate}} L/인/일
   - 피크 팩터: {{peakFactor}}
   - 저장 용량: {{storageCapacity}}

2. 급수 방식
   - 직접 급수: {{directSupply}}
   - 간접 급수: {{indirectSupply}}
   - 가압 급수: {{pressurizedSupply}}

3. 급수 배관
   - 주배관: {{mainPipe}}
   - 분배관: {{distributionPipe}}
   - 급수전: {{servicePipe}}

🚿 온수 시스템:
1. 온수량 계산
   - 사용량: {{hotWaterUsage}} L/인/일
   - 온도: {{hotWaterTemp}}℃
   - 순환량: {{circulationRate}}

2. 온수 방식
   - 중앙 온수: {{centralHotWater}}
   - 개별 온수: {{individualHotWater}}
   - 태양열 온수: {{solarHotWater}}

3. 온수 배관
   - 온수관: {{hotWaterPipe}}
   - 순환관: {{circulationPipe}}
   - 배관 단열: {{pipeInspection}}

🚽 배수 시스템:
1. 배수량 계산
   - 오수량: {{sewageFlow}}
   - 우수량: {{stormwaterFlow}}
   - 피크 팩터: {{peakFactor}}

2. 배수 방식
   - 오수 분리: {{sewageSeparation}}
   - 합류식: {{combinedSystem}}
   - 우수 분리: {{stormwaterSeparation}}

3. 배수 배관
   - 오수관: {{sewagePipe}}
   - 우수관: {{stormwaterPipe}}
   - 통기관: {{ventPipe}}

♻️ 중수도 시스템:
1. 중수원
   - 세척수: {{washWater}}
   - 빗물: {{rainwater}}
   - 기타: {{otherSources}}

2. 처리 공정
   - 1차 처리: {{primaryTreatment}}
   - 2차 처리: {{secondaryTreatment}}
   - 3차 처리: {{tertiaryTreatment}}

3. 중수 이용
   - 변기 세척: {{toiletFlushing}}
   - 조경 관개: {{landscapeIrrigation}}
   - 냉각수: {{coolingWater}}

🔥 소화 설비:
1. 소화 시스템
   - 스프링클러: {{sprinkler}}
   - 소화전: {{fireHydrant}}
   - 가스 소화: {{gasSuppression}}

2. 경보 시스템
   - 감지기: {{detector}}
   - 경보기: {{alarm}}
   - 연동 제어: {{interlock}}

📝 산출물:
1. 급배수 평면도
2. 배관 상세도
3. 시스템 다이어그램
4. 사양서
`,

  // 2.3 전력 시스템
  electricalSystem: `
[MEP 설계 - 전력 시스템]

⚡ 수전 설비:
1. 전력 수요 계산
   - 피크 부하: {{peakLoad}} kW
   - 역률: {{powerFactor}}
   - 수전 용량: {{serviceCapacity}} kVA

2. 수전 방식
   - 고압 수전: {{highVoltage}}
   - 저압 수전: {{lowVoltage}}
   - 비상 전원: {{emergencyPower}}

3. 변압기
   - 용량: {{transformerCapacity}} kVA
   - 전압 비: {{voltageRatio}}
   - 효율: {{efficiency}}%

🔌 배전 시스템:
1. 주배전
   - 모선 방식: {{busbarType}}
   - 차단기: {{circuitBreaker}}
   - 보호 계전: {{protectiveRelay}}

2. 분배전
   - 분전반: {{distributionPanel}}
   - 배선: {{wiring}}
   - 접지: {{grounding}}

3. 비상 전원
   - 비상 발전기: {{emergencyGenerator}}
   - UPS: {{ups}}
   - 비상 조명: {{emergencyLighting}}

💡 조명 시스템:
1. 조명 설계
   - 기준 조도: {{illuminance}} lux
   - 균등도: {{uniformity}}
   - 색온도: {{colorTemp}} K

2. 조명 방식
   - 일반 조명: {{generalLighting}}
   - 액센트 조명: {{accentLighting}}
   - 작업 조명: {{taskLighting}}

3. 조명 제어
   - ON/OFF: {{onOffControl}}
   - 디밍: {{dimming}}
   - 자동 제어: {{automaticControl}}

📡 통신 시스템:
1. 전화 시스템
   - 교환기: {{pbx}}
   - 내선: {{extension}}
   - 외선: {{outsideLine}}

2. 데이터 네트워크
   - LAN: {{lan}}
   - WLAN: {{wlan}}
   - 인터넷: {{internet}}

3. 방송 시스템
   - PA 시스템: {{paSystem}}
   - BGM: {{bgm}}
   - 방송: {{broadcast}}

🔒 보안 시스템:
1. 출입 통제
   - 카드: {{cardAccess}}
   - 생체: {{biometric}}
   - 인터폰: {{intercom}}

2. 감시 시스템
   - CCTV: {{cctv}}
   - 녹화: {{recording}}
   - 모니터링: {{monitoring}}

3. 경보 시스템
   - 침입 감지: {{intrusionDetection}}
   - 비상 호출: {{emergencyCall}}
   - 연동 제어: {{interlock}}

📝 산출물:
1. 전력 평면도
2. 조명 평면도
3. 통신 평면도
4. 단선 결선도
5. 사양서
`
};

// ============================================================
// 3. 인테리어 설계 전문 프롬프트
// ============================================================

export const INTERIOR_DESIGN_PROMPTS = {
  // 3.1 공간 계획
  spacePlanning: `
[인테리어 설계 - 공간 계획]

🏢 공간 프로그램:
- 건축 유형: {{buildingType}}
- 연면적: {{totalArea}}㎡
- 사용 인원: {{occupants}}명
- 주요 기능: {{mainFunctions}}

📐 공간 배치:
1. 기능 구분
   - 업무 공간: {{officeSpace}}㎡
   - 회의 공간: {{meetingSpace}}㎡
   - 휴게 공간: {{restSpace}}㎡
   - 지원 공간: {{supportSpace}}㎡

2. 동선 계획
   - 직원 동선: {{staffCirculation}}
   - 방문객 동선: {{visitorCirculation}}
   - 물류 동선: {{logisticsCirculation}}

3. 공간 관계
   - 인접 관계: {{adjacency}}
   - 분리 관계: {{separation}}
   - 연결 관계: {{connection}}

🪑 가구 배치:
1. 업무 가구
   - 책상: {{deskType}} {{deskSize}}
   - 의자: {{chairType}}
   - 수납: {{storageType}}

2. 회의 가구
   - 회의 테이블: {{meetingTable}}
   - 의자: {{meetingChairs}}
   - 프레젠테이션: {{presentation}}

3. 휴게 가구
   - 소파: {{sofa}}
   - 테이블: {{coffeeTable}}
   - 수납: {{cabinet}}

📊 공간 기준:
1. 1인당 면적
   - 업무: {{perPersonOffice}}㎡/인
   - 회의: {{perPersonMeeting}}㎡/인
   - 휴게: {{perPersonRest}}㎡/인

2. 동선 폭
   - 주동선: {{mainCirculation}} m
   - 보조동선: {{secondaryCirculation}} m
   - 비상동선: {{emergencyCirculation}} m

3. 천장 높이
   - 일반: {{generalCeiling}} m
   - 로비: {{lobbyCeiling}} m
   - 회의: {{meetingCeiling}} m

📝 산출물:
1. 공간 배치도
2. 가구 배치도
3. 동선 계획도
4. 공간 명세서
`,

  // 3.2 마감재 설계
  finishesDesign: `
[인테리어 설계 - 마감재 설계]

🎨 마감재 컨셉:
- 디자인 테마: {{designTheme}}
- 색채 컨셉: {{colorConcept}}
- 재료 컨셉: {{materialConcept}}
- 분위기: {{mood}}

🏢 바닥재:
1. 종류 선정
   - 대리석: {{marble}}
   - 목재: {{wood}}
   - 타일: {{tile}}
   - 카펫: {{carpet}}
   - 비닐: {{vinyl}}

2. 적용 공간
   - 로비: {{lobbyFloor}}
   - 사무실: {{officeFloor}}
   - 회의실: {{meetingFloor}}
   - 복도: {{corridorFloor}}

3. 상세 사양
   - 두께: {{thickness}} mm
   - 마감: {{finish}}
   - 색상: {{color}}
   - 패턴: {{pattern}}

🧱 벽체 마감:
1. 종류 선정
   - 페인트: {{paint}}
   - 벽지: {{wallpaper}}
   - 패널: {{panel}}
   - 타일: {{wallTile}}
   - 석재: {{stone}}

2. 적용 공간
   - 로비: {{lobbyWall}}
   - 사무실: {{officeWall}}
   - 회의실: {{meetingWall}}
   - 복도: {{corridorWall}}

3. 상세 사양
   - 두께: {{thickness}} mm
   - 마감: {{finish}}
   - 색상: {{color}}
   - 패턴: {{pattern}}

🏗️ 천장 마감:
1. 종류 선정
   - 메쉬 천장: {{meshCeiling}}
   - 패널 천장: {{panelCeiling}}
   - 노출 천장: {{exposedCeiling}}
   - 석고보드: {{gypsumBoard}}

2. 적용 공간
   - 로비: {{lobbyCeiling}}
   - 사무실: {{officeCeiling}}
   - 회의실: {{meetingCeiling}}
   - 복도: {{corridorCeiling}}

3. 상세 사양
   - 두께: {{thickness}} mm
   - 마감: {{finish}}
   - 색상: {{color}}
   - 패턴: {{pattern}}

🚪 창호 및 문:
1. 창호
   - 프레임: {{windowFrame}}
   - 유리: {{glass}}
   - 하드웨어: {{hardware}}
   - 개폐 방식: {{operatingType}}

2. 문
   - 재료: {{doorMaterial}}
   - 마감: {{doorFinish}}
   - 하드웨어: {{doorHardware}}
   - 치수: {{doorSize}}

📝 산출물:
1. 마감재 평면도
2. 마감재 상세도
3. 마감재 명세서
4. 색채 계획서
`,

  // 3.3 조명 설계
  lightingDesign: `
[인테리어 설계 - 조명 설계]

💡 조명 컨셉:
- 조명 테마: {{lightingTheme}}
- 분위기: {{mood}}
- 에너지 효율: {{energyEfficiency}}
- 스마트 기능: {{smartFeatures}}

🔆 기본 조명:
1. 조명 기준
   - 기준 조도: {{baseIlluminance}} lux
   - 균등도: {{uniformity}}
   - 색온도: {{colorTemp}} K
   - 연색성: {{cri}} Ra

2. 조명 기구
   - 형광등: {{fluorescent}}
   - LED: {{led}}
   - 할로겐: {{halogen}}

3. 배치 계획
   - 간접 조명: {{indirectLighting}}
   - 직접 조명: {{directLighting}}
   - 매입 조명: {{recessedLighting}}

✨ 액센트 조명:
1. 포인트 조명
   - 벽washing: {{wallWashing}}
   - 그림 조명: {{pictureLighting}}
   - 조각 조명: {{sculptureLighting}}

2. 장식 조명
   - 샹들리에: {{chandelier}}
   - 펜던트: {{pendant}}
   - 벽부: {{sconce}}

3. 연출 효과
   - 하이라이트: {{highlight}}
   - 실루엣: {{silhouette}}
   - 그림자: {{shadow}}

🎯 작업 조명:
1. 작업 조도
   - 사무: {{officeTask}} lux
   - 회의: {{meetingTask}} lux
   - 독서: {{readingTask}} lux

2. 작업 조명 기구
   - 데스크 램프: {{deskLamp}}
   - 스탠드: {{standLamp}}
   - 매입: {{recessedTask}}

3. 배치 계획
   - 위치: {{placement}}
   - 방향: {{direction}}
   - 높이: {{height}}

🌙 분위기 조명:
1. 간접 조명
   - 천장 간접: {{ceilingIndirect}}
   - 벽 간접: {{wallIndirect}}
   - 바닥 간접: {{floorIndirect}}

2. 장식 조명
   - 네온: {{neon}}
   - LED 스트립: {{ledStrip}}
   - 파이버: {{fiberOptic}}

3. 색상 변화
   - RGB: {{rgb}}
   - 튜닝: {{tunable}}
   - 다이나믹: {{dynamic}}

📊 조명 제어:
1. 제어 방식
   - ON/OFF: {{onOff}}
   - 디밍: {{dimming}}
   - 장면: {{scene}}
   - 자동: {{automatic}}

2. 센서
   - 점유: {{occupancy}}
   - 조도: {{daylight}}
   - 움직임: {{motion}}

3. 스마트 기능
   - 앱 제어: {{appControl}}
   - 음성 제어: {{voiceControl}}
   - 스케줄: {{schedule}}

📝 산출물:
1. 조명 평면도
2. 조명 상세도
3. 조명 명세서
4. 조명 제어 다이어그램
`,

  // 3.4 색채 계획
  colorPlanning: `
[인테리어 설계 - 색채 계획]

🎨 색채 컨셉:
- 디자인 테마: {{designTheme}}
- 분위기: {{mood}}
- 브랜드 아이덴티티: {{brandIdentity}}
- 사용자 특성: {{userCharacteristics}}

🌈 색채 체계:
1. 메인 컬러 (60%)
   - 색상: {{mainColor}}
   - 색조: {{hue}}
   - 명도: {{value}}
   - 채도: {{chroma}}

2. 보조 컬러 (30%)
   - 색상: {{secondaryColor}}
   - 색조: {{hue}}
   - 명도: {{value}}
   - 채도: {{chroma}}

3. 포인트 컬러 (10%)
   - 색상: {{accentColor}}
   - 색조: {{hue}}
   - 명도: {{value}}
   - 채도: {{chroma}}

🏢 공간별 색채:
1. 로비
   - 바닥: {{lobbyFloorColor}}
   - 벽체: {{lobbyWallColor}}
   - 천장: {{lobbyCeilingColor}}
   - 가구: {{lobbyFurnitureColor}}

2. 사무실
   - 바닥: {{officeFloorColor}}
   - 벽체: {{officeWallColor}}
   - 천장: {{officeCeilingColor}}
   - 가구: {{officeFurnitureColor}}

3. 회의실
   - 바닥: {{meetingFloorColor}}
   - 벽체: {{meetingWallColor}}
   - 천장: {{meetingCeilingColor}}
   - 가구: {{meetingFurnitureColor}}

4. 휴게실
   - 바닥: {{restFloorColor}}
   - 벽체: {{restWallColor}}
   - 천장: {{restCeilingColor}}
   - 가구: {{restFurnitureColor}}

🪑 재료별 색채:
1. 바닥재
   - 대리석: {{marbleColor}}
   - 목재: {{woodColor}}
   - 타일: {{tileColor}}

2. 벽체
   - 페인트: {{paintColor}}
   - 벽지: {{wallpaperColor}}
   - 패널: {{panelColor}}

3. 가구
   - 목재: {{woodFurnitureColor}}
   - 금속: {{metalFurnitureColor}}
   - 패브릭: {{fabricColor}}

💡 빛과 색의 관계:
1. 자연광
   - 색온도: {{naturalColorTemp}}
   - 방향: {{naturalDirection}}
   - 강도: {{naturalIntensity}}

2. 인공광
   - 색온도: {{artificialColorTemp}}
   - 방향: {{artificialDirection}}
   - 강도: {{artificialIntensity}}

3. 색상 변화
   - 주간: {{daytimeColor}}
   - 야간: {{nighttimeColor}}
   - 계절: {{seasonalColor}}

📝 산출물:
1. 색채 계획서
2. 색채 팔레트
3. 색채 적용도
4. 색채 명세서
`
};

// ============================================================
// 4. 조경 설계 전문 프롬프트
// ============================================================

export const LANDSCAPE_DESIGN_PROMPTS = {
  // 4.1 대지 계획
  sitePlanning: `
[조경 설계 - 대지 계획]

🌍 대지 분석:
- 대지 위치: {{location}}
- 대지 면적: {{siteArea}}㎡
- 지형 조건: {{topography}}
- 기후 조건: {{climate}}

📊 지형 분석:
1. 경사 분석
   - 평탄지: {{flatArea}}㎡ (0-5%)
   - 완경사: {{gentleSlope}}㎡ (5-15%)
   - 급경사: {{steepSlope}}㎡ (15% 이상)

2. 방위 분석
   - 남향: {{southFacing}}㎡
   - 북향: {{northFacing}}㎡
   - 동향: {{eastFacing}}㎡
   - 서향: {{westFacing}}㎡

3. 조망 분석
   - 주요 조망: {{mainViews}}
   - 방해 요소: {{visualBarriers}}
   - 프라이버시: {{privacy}}

🏗️ 기능 구역:
1. 진입 구역
   - 주출입구: {{mainEntrance}}
   - 차량 진입: {{vehicleAccess}}
   - 보행자 진입: {{pedestrianAccess}}

2. 주차 구역
   - 일반 주차: {{generalParking}}
   - 장애인 주차: {{disabledParking}}
   - 자전거 주차: {{bicycleParking}}

3. 활동 구역
   - 놀이 공간: {{playArea}}
   - 운동 공간: {{exerciseArea}}
   - 휴게 공간: {{restArea}}

4. 서비스 구역
   - 쓰레기 처리: {{wasteManagement}}
   - 설비 공간: {{serviceArea}}
   - 보안 시설: {{securityFacilities}}

🚶 동선 계획:
1. 보행 동선
   - 주동선: {{mainWalkway}} m
   - 보조동선: {{secondaryWalkway}} m
   - 산책로: {{trail}} m

2. 차량 동선
   - 진입로: {{accessRoad}} m
   - 주차장: {{parkingLot}} m
   - 서비스 도로: {{serviceRoad}} m

3. 자전거 동선
   - 자전거 도로: {{bicyclePath}} m
   - 자전거 주차: {{bicycleParking}}

🌿 식재 계획:
1. 식물 선정 기준
   - 토양 조건: {{soilCondition}}
   - 일조 조건: {{sunCondition}}
   - 풍향 조건: {{windCondition}}
   - 관리 수준: {{maintenanceLevel}}

2. 식재 유형
   - 교목: {{trees}}
   - 관목: {{shrubs}}
   - 초화: {{flowers}}
   - 지피: {{groundCover}}

3. 계절별 경관
   - 봄: {{spring경관}}
   - 여름: {{summer경관}}
   - 가을: {{autumn경관}}
   - 겨울: {{winter경관}}

📝 산출물:
1. 대지 분석도
2. 기능 구역도
3. 동선 계획도
4. 식재 계획도
`,

  // 4.2 시설물 설계
  facilitiesDesign: `
[조경 설계 - 시설물 설계]

🪑 휴게 시설:
1. 벤치
   - 재료: {{benchMaterial}}
   - 크기: {{benchSize}}
   - 배치: {{benchPlacement}}
   - 수량: {{benchQuantity}}

2. 파고라
   - 재료: {{pergolaMaterial}}
   - 크기: {{pergolaSize}}
   - 형태: {{pergolaForm}}
   - 기능: {{pergolaFunction}}

3. 정자
   - 재료: {{pavilionMaterial}}
   - 크기: {{pavilionSize}}
   - 형태: {{pavilionForm}}
   - 기능: {{pavilionFunction}}

🎪 놀이 시설:
1. 모래 놀이
   - 크기: {{sandboxSize}}
   - 형태: {{sandboxForm}}
   - 안전: {{sandboxSafety}}
   - 관리: {{sandboxMaintenance}}

2. 놀이기구
   - 종류: {{playEquipment}}
   - 연령: {{ageGroup}}
   - 안전: {{safetyStandards}}
   - 설치: {{installation}}

3. 물놀이
   - 종류: {{waterPlay}}
   - 크기: {{waterPlaySize}}
   - 안전: {{waterSafety}}
   - 관리: {{waterMaintenance}}

🏋️ 운동 시설:
1. 체육 시설
   - 종류: {{sportsFacility}}
   - 크기: {{facilitySize}}
   - 포장: {{surface}}
   - 안전: {{safety}}

2. 운동기구
   - 종류: {{exerciseEquipment}}
   - 수량: {{quantity}}
   - 배치: {{placement}}
   - 관리: {{maintenance}}

3. 산책로
   - 폭: {{trailWidth}}
   - 포장: {{trailSurface}}
   - 경사: {{trailSlope}}
   - 안전: {{trailSafety}}

🪧 안내 시설:
1. 사인 시스템
   - 종류: {{signageType}}
   - 재료: {{signageMaterial}}
   - 디자인: {{signageDesign}}
   - 배치: {{signagePlacement}}

2. 안내판
   - 종류: {{informationBoard}}
   - 재료: {{boardMaterial}}
   - 내용: {{boardContent}}
   - 배치: {{boardPlacement}}

3. 조명 시설
   - 가로등: {{streetLamp}}
   - 보안등: {{securityLight}}
   - 장식등: {{decorativeLight}}
   - 경관등: {{landscapeLight}}

♻️ 환경 시설:
1. 쓰레기통
   - 종류: {{wasteBin}}
   - 재료: {{binMaterial}}
   - 배치: {{binPlacement}}
   - 관리: {{binMaintenance}}

2. 재활용 시설
   - 종류: {{recyclingFacility}}
   - 분류: {{wasteSorting}}
   - 배치: {{recyclingPlacement}}
   - 관리: {{recyclingMaintenance}}

3. 화장실
   - 위치: {{toiletLocation}}
   - 시설: {{toiletFacilities}}
   - 접근성: {{accessibility}}
   - 관리: {{toiletMaintenance}}

📝 산출물:
1. 시설물 배치도
2. 시설물 상세도
3. 시설물 명세서
4. 시설물 관리 계획서
`,

  // 4.3 수경 설계
  waterFeatureDesign: `
[조경 설계 - 수경 설계]

⛲ 분수 설계:
1. 분수 유형
   - 장식 분수: {{decorativeFountain}}
   - 음악 분수: {{musicalFountain}}
   - 인터랙티브: {{interactiveFountain}}
   - 안개 분수: {{mistFountain}}

2. 분수 규모
   - 직경: {{fountainDiameter}} m
   - 높이: {{fountainHeight}} m
   - 수량: {{fountainQuantity}}
   - 유량: {{waterFlow}} L/min

3. 분수 시스템
   - 펌프: {{pumpType}}
   - 노즐: {{nozzleType}}
   - 필터: {{filterType}}
   - 제어: {{controlSystem}}

🌊 연못 설계:
1. 연못 유형
   - 자연 연못: {{naturalPond}}
   - 인공 연못: {{artificialPond}}
   - 생태 연못: {{ecologicalPond}}
   - 관상 연못: {{ornamentalPond}}

2. 연못 규모
   - 면적: {{pondArea}}㎡
   - 깊이: {{pondDepth}} m
   - 수량: {{pondQuantity}}
   - 형태: {{pondShape}}

3. 연못 시스템
   - 방수: {{waterproofing}}
   - 여과: {{filtration}}
   - 순환: {{circulation}}
   - 관리: {{maintenance}}

💧 폭포 설계:
1. 폭포 유형
   - 자연 폭포: {{naturalWaterfall}}
   - 인공 폭포: {{artificialWaterfall}}
   - 벽 폭포: {{wallWaterfall}}
   - 계단 폭포: {{cascadingWaterfall}}

2. 폭포 규모
   - 폭: {{waterfallWidth}} m
   - 높이: {{waterfallHeight}} m
   - 유량: {{waterfallFlow}} L/min
   - 수량: {{waterfallQuantity}}

3. 폭포 시스템
   - 펌프: {{waterfallPump}}
   - 물받이: {{catchBasin}}
   - 배수: {{drainage}}
   - 관리: {{waterfallMaintenance}}

🌊 수로 설계:
1. 수로 유형
   - 개수로: {{openChannel}}
   - 폐수로: {{closedChannel}}
   - 자연 수로: {{naturalStream}}
   - 인공 수로: {{artificialStream}}

2. 수로 규모
   - 폭: {{channelWidth}} m
   - 깊이: {{channelDepth}} m
   - 경사: {{channelSlope}}
   - 길이: {{channelLength}} m

3. 수로 시스템
   - 포장: {{channelPaving}}
   - 여과: {{channelFiltration}}
   - 순환: {{channelCirculation}}
   - 관리: {{channelMaintenance}}

📊 수질 관리:
1. 수질 기준
   - pH: {{phLevel}}
   - 탁도: {{turbidity}}
   - 잔류염소: {{residualChlorine}}
   - 대장균: {{coliform}}

2. 수질 처리
   - 여과: {{waterFiltration}}
   - 소독: {{disinfection}}
   - 조류 방지: {{algaePrevention}}
   - pH 조절: {{phAdjustment}}

3. 수질 모니터링
   - 자동 측정: {{automaticMonitoring}}
   - 수동 측정: {{manualMonitoring}}
   - 기록: {{dataRecording}}
   - 경보: {{alarmSystem}}

📝 산출물:
1. 수경 설계도
2. 수경 상세도
3. 수질 관리 계획서
4. 유지관리 매뉴얼
`
};

// ============================================================
// 5. 지속가능 설계 전문 프롬프트
// ============================================================

export const SUSTAINABILITY_DESIGN_PROMPTS = {
  // 5.1 에너지 효율 설계
  energyEfficiency: `
[지속가능 설계 - 에너지 효율 설계]

⚡ 에너지 목표:
- 에너지 등급: {{energyGrade}}
- 에너지 절감률: {{energySaving}}%
- 탄소 배출 감축: {{carbonReduction}}%
- 신재생 에너지 비율: {{renewableRatio}}%

🏗️ 건축 외피 설계:
1. 단열 설계
   - 벽체 단열: {{wallInsulation}} mm
   - 지붕 단열: {{roofInsulation}} mm
   - 바닥 단열: {{floorInsulation}} mm
   - 창호 단열: {{windowInsulation}}

2. 기밀 설계
   - 기밀 등급: {{airtightness}}
   - 기밀 시공: {{airtightnessConstruction}}
   - 기밀 측정: {{airtightnessMeasurement}}

3. 열교 방지
   - 열교 부위: {{thermalBridge}}
   - 열교 방지 대책: {{thermalBridgePrevention}}
   - 열교 해석: {{thermalBridgeAnalysis}}

🌞 자연 채광 최적화:
1. 창면적 비율
   - 남측: {{southWindowRatio}}%
   - 북측: {{northWindowRatio}}%
   - 동측: {{eastWindowRatio}}%
   - 서측: {{westWindowRatio}}%

2. 채광 시뮬레이션
   - 채광률: {{daylightFactor}}%
   - 균등도: {{daylightUniformity}}
   - 글레어 지수: {{glareIndex}}

3. 채광 개선 대책
   - 라이트 셰프: {{lightShelf}}
   - 샤닝: {{shading}}
   - 반사판: {{reflector}}

🌬️ 자연 환기 설계:
1. 환기 전략
   - 자연 환기: {{naturalVentilation}}
   - 기계 환기: {{mechanicalVentilation}}
   - 복합 환기: {{hybridVentilation}}

2. 환기량 계산
   - 필요 환기량: {{requiredVentilation}} ㎥/h
   - 환기 횟수: {{airChanges}} 회/시간
   - 외기 도입량: {{outdoorAir}} ㎥/h

3. 환기 개선 대책
   - 환기 유도: {{ventilationInduction}}
   - 온도 차이: {{temperatureDifference}}
   - 풍압: {{windPressure}}

🔋 태양열 시스템:
1. 태양광 시스템
   - 설치 용량: {{pvCapacity}} kW
   - 연간 발전량: {{annualGeneration}} kWh
   - 설치 면적: {{pvArea}} ㎡

2. 태양열 시스템
   - 설치 용량: {{thermalCapacity}} kW
   - 연간 열 생산: {{annualHeatProduction}} kWh
   - 설치 면적: {{thermalArea}} ㎡

3. 태양열 저장
   - 저장 방식: {{storageType}}
   - 저장 용량: {{storageCapacity}} kWh
   - 효율: {{storageEfficiency}}%

🌍 지열 시스템:
1. 지열 히트펌프
   - 용량: {{geothermalCapacity}} kW
   - COP: {{cop}}
   - 설치 깊이: {{installationDepth}} m

2. 지열 시스템
   - 수직형: {{verticalSystem}}
   - 수평형: {{horizontalSystem}}
   - 수열형: {{waterSourceSystem}}

3. 지열 저장
   - 저장 방식: {{geothermalStorage}}
   - 저장 용량: {{geothermalStorageCapacity}} kWh
   - 효율: {{geothermalEfficiency}}%

📊 에너지 시뮬레이션:
1. 시뮬레이션 도구
   - EnergyPlus: {{energyPlus}}
   - DesignBuilder: {{designBuilder}}
   - IESVE: {{iesve}}

2. 시뮬레이션 결과
   - 에너지 소비: {{energyConsumption}} kWh/㎡
   - CO2 배출: {{co2Emission}} kgCO2/㎡
   - 에너지 비용: {{energyCost}} 원/㎡

3. 최적화 방안
   - 설계 최적화: {{designOptimization}}
   - 시스템 최적화: {{systemOptimization}}
   - 운영 최적화: {{operationOptimization}}

📝 산출물:
1. 에너지 분석 보고서
2. 에너지 모델링 결과
3. 에너지 절감 방안
4. 신재생 에너지 계획서
`,

  // 5.2 친환경 재료 설계
  sustainableMaterials: `
[지속가능 설계 - 친환경 재료 설계]

🌿 재료 선정 기준:
- 환경 영향: {{environmentalImpact}}
- 건강 영향: {{healthImpact}}
- 사회적 영향: {{socialImpact}}
- 경제적 영향: {{economicImpact}}

🏗️ 구조 재료:
1. 콘크리트
   - 저탄소 콘크리트: {{lowCarbonConcrete}}
   - 재활용 골재: {{recycledAggregate}}
   - 고로 슬래그: {{blastFurnaceSlag}}
   - 플라이 애시: {{flyAsh}}

2. 강재
   - 재활용 강철: {{recycledSteel}}
   - 고로 슬래그 강철: {{slagSteel}}
   - 전기로 강철: {{electricArcFurnace}}
   - 고성능 강재: {{highPerformanceSteel}}

3. 목재
   - 집성재: {{glulam}}
   - CLT: {{crossLaminatedTimber}}
   - LVL: {{laminatedVeneerLumber}}
   - 목섬유 단열재: {{woodFiberInsulation}}

🧱 마감 재료:
1. 단열재
   - 셀룰로오스: {{cellulose}}
   - 면 단열재: {{cottonInsulation}}
   - 목섬유: {{woodFiber}}
   - 양모 단열재: {{woolInsulation}}

2. 바닥재
   - 대나무: {{bamboo}}
   - 코르크: {{cork}}
   - 재생 고무: {{recycledRubber}}
   - 리놀륨: {{linoleum}}

3. 벽체 재료
   - 석고보드: {{gypsumBoard}}
   - 목재 패널: {{woodPanel}}
   - 재생 패널: {{recycledPanel}}
   - 천연 석재: {{naturalStone}}

💧 배관 재료:
1. 급수 배관
   - 구리: {{copper}}
   - 스테인리스: {{stainlessSteel}}
   - PEX: {{pex}}
   - PP: {{polypropylene}}

2. 배수 배관
   - 주철: {{castIron}}
   - PVC: {{pvc}}
   - HDPE: {{hdpe}}
   - 재생 PVC: {{recycledPvc}}

3. 가스 배관
   - 강관: {{steelPipe}}
   - 구리: {{copperGas}}
   - 스테인리스: {{stainlessSteelGas}}

🔌 전기 재료:
1. 배선
   - 구리: {{copperWire}}
   - 알루미늄: {{aluminumWire}}
   - 재활용 구리: {{recycledCopper}}

2. 기구
   - 재생 플라스틱: {{recycledPlastic}}
   - 금속: {{metal}}
   - 세라믹: {{ceramic}}

3. 조명
   - LED: {{led}}
   - 형광등: {{fluorescent}}
   - 자연 채광: {{naturalLighting}}

📊 재료 평가:
1. 환경 성적 표지
   - EPD: {{environmentalProductDeclaration}}
   - 탄소 발자국: {{carbonFootprint}}
   - 에너지 소비: {{energyConsumption}}

2. 건강 성적 표지
   - HPD: {{healthProductDeclaration}}
   - VOC: {{volatileOrganicCompounds}}
   - 유해 물질: {{hazardousMaterials}}

3. 사회적 책임
   - 공정 무역: {{fairTrade}}
   - 지역 사회: {{localCommunity}}
   - 노동 기준: {{laborStandards}}

📝 산출물:
1. 친환경 재료 명세서
2. 재료 평가 보고서
3. 재료 선정 기준
4. 재료 시공 지침
`,

  // 5.3 물 관리 시스템
  waterManagement: `
[지속가능 설계 - 물 관리 시스템]

💧 물 관리 목표:
- 물 절감률: {{waterSaving}}%
- 빗물 이용률: {{rainwaterUtilization}}%
- 중수도 비율: {{greywaterRatio}}%
- 물 재이용률: {{waterReuse}}%

🌧️ 빗물 수집 시스템:
1. 수집 면적
   - 지붕: {{roofArea}} ㎡
   - 포장: {{pavedArea}} ㎡
   - 녹지: {{greenArea}} ㎡

2. 수집 시스템
   - 집수 시설: {{collectionFacility}}
   - 여과 시설: {{filtrationFacility}}
   - 저장 시설: {{storageFacility}}
   - 분배 시설: {{distributionFacility}}

3. 저장 용량
   - 저장 탱크: {{storageTank}} ㎥
   - 지하 저장: {{undergroundStorage}} ㎥
   - 저류조: {{retentionPond}} ㎥

♻️ 중수도 시스템:
1. 중수원
   - 세척수: {{washWater}}
   - 샤워수: {{showerWater}}
   - 세탁수: {{laundryWater}}
   - 기타: {{otherSources}}

2. 처리 공정
   - 1차 처리: {{primaryTreatment}}
   - 2차 처리: {{secondaryTreatment}}
   - 3차 처리: {{tertiaryTreatment}}
   - 소독: {{disinfection}}

3. 중수 이용
   - 변기 세척: {{toiletFlushing}}
   - 조경 관개: {{landscapeIrrigation}}
   - 냉각수: {{coolingWater}}
   - 세척: {{cleaning}}

🚿 절수 설비:
1. 양변기
   - 절수형: {{waterSavingToilet}}
   - 이중 플러시: {{dualFlush}}
   - 진공 변기: {{vacuumToilet}}

2. 세면대
   - 절수형 수전: {{waterSavingFaucet}}
   - 센서 수전: {{sensorFaucet}}
   - 공기 혼합: {{aeratedFaucet}}

3. 샤워기
   - 절수형: {{waterSavingShower}}
   - 공기 혼합: {{aeratedShower}}
   - 타이머: {{timerShower}}

🌱 조경 관개 시스템:
1. 관개 방식
   - 점적 관개: {{dripIrrigation}}
   - 스프링클러: {{sprinkler}}
   - 지하 관개: {{subsurfaceIrrigation}}
   - 수동 관개: {{manualIrrigation}}

2. 관개 제어
   - 자동 제어: {{automaticControl}}
   - 토양 수분: {{soilMoisture}}
   - 기상 데이터: {{weatherData}}
   - 스케줄: {{schedule}}

3. 관개 수원
   - 수돗물: {{tapWater}}
   - 빗물: {{rainwater}}
   - 중수: {{greywater}}
   - 복합: {{mixedWater}}

📊 수자원 관리:
1. 수자원 평가
   - 사용량: {{waterUsage}} L/일
   - 절감량: {{waterSavingAmount}} L/일
   - 재이용량: {{waterReuseAmount}} L/일

2. 수질 관리
   - 수질 기준: {{waterQuality}}
   - 모니터링: {{monitoring}}
   - 관리: {{maintenance}}

3. 비용 분석
   - 초기 비용: {{initialCost}}
   - 운영 비용: {{operatingCost}}
   - 절감 비용: {{savingCost}}

📝 산출물:
1. 물 관리 계획서
2. 빗물 수집 설계도
3. 중수도 시스템 설계도
4. 절수 설비 명세서
`
};

// ============================================================
// 6. 통합 프롬프트 생성 함수
// ============================================================

export function generateIntegratedPrompt(
  section: string,
  phase: string,
  masterArchitect: string,
  projectData: Record<string, any>
): string {
  // 섹션별 프롬프트 선택
  let sectionPrompt = '';
  switch (section) {
    case 'structural':
      sectionPrompt = STRUCTURAL_DESIGN_PROMPTS[`${phase}Phase` as keyof typeof STRUCTURAL_DESIGN_PROMPTS] || '';
      break;
    case 'mep':
      sectionPrompt = MEP_DESIGN_PROMPTS.hvacSystem;
      break;
    case 'interior':
      sectionPrompt = INTERIOR_DESIGN_PROMPTS.spacePlanning;
      break;
    case 'landscape':
      sectionPrompt = LANDSCAPE_DESIGN_PROMPTS.sitePlanning;
      break;
    case 'sustainability':
      sectionPrompt = SUSTAINABILITY_DESIGN_PROMPTS.energyEfficiency;
      break;
    default:
      sectionPrompt = '프롬프트를 찾을 수 없습니다.';
  }
  
  // 건축 거장 스타일 적용
  const masterStyle = `
[건축 거장 디자인 철학: ${masterArchitect}]
- 디자인 철학: {{designPhilosophy}}
- 시그니처 스타일: {{signatureStyles}}
- 공간 개념: {{spatialConcepts}}
- 재료 선호: {{materialPreferences}}
- 지속가능성 접근: {{sustainabilityApproach}}
`;
  
  // 프로젝트 데이터 치환
  let finalPrompt = sectionPrompt + masterStyle;
  
  Object.entries(projectData).forEach(([key, value]) => {
    finalPrompt = finalPrompt.replace(`{{${key}}}`, String(value));
  });
  
  return finalPrompt;
}

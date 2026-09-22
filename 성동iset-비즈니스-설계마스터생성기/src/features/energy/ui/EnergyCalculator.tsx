/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateEnergyUsage,
  calculateEssEfficiency,
  type EnergyReport,
} from "@shared/api/geminiService";
import { generatePreviewImage } from "@shared/lib/downloadUtils";
import { addHistory, type HistoryItem } from "@shared/lib/historyDb";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { type FormEvent, useEffect, useRef, useState } from "react";

const primaryButtonClasses =
  "font-bold text-xl w-full text-center text-black bg-yellow-400 py-4 px-8 rounded-md transform transition-all duration-200 hover:scale-105 hover:bg-yellow-300 shadow-lg disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
const secondaryButtonClasses =
  "font-bold text-lg text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-white hover:text-black";
const analysisButtonClasses =
  "font-bold text-lg text-center text-black bg-cyan-400 py-3 px-8 rounded-md transform transition-transform duration-200 hover:scale-105 hover:bg-cyan-300";

// Chart.js is loaded from a script tag in index.html
declare const Chart: any;

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center text-center gap-4 h-96">
    <svg
      className="animate-spin h-12 w-12 text-yellow-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <p className="font-bold text-xl text-neutral-300 animate-pulse">AI 전문가가 분석 중입니다...</p>
  </div>
);

const promptLibrary: {
  usage: { label: string; prompt: string }[];
  ess: { label: string; prompt: string }[];
} = {
  usage: [
    {
      label: "스마트팜",
      prompt:
        "시설 유형: 스마트팜 (1,500평 규모)\n계약전력: 150kW (농사용 전력 을, 고압 A)\n월간 전력 사용량: 25,000 kWh\n주요 설비: LED 생장등 500개 (개당 200W, 일 14시간), 복합 환경제어 시스템, 냉난방 공조 (50kW)",
    },
    {
      label: "제조공장",
      prompt:
        "시설 유형: 중소규모 금속 가공 공장\n계약전력: 400kW (산업용 갑 II, 고압 A, 선택 II 요금제)\n월간 전력 사용량: 80,000 kWh\n주요 설비: 레이저 커팅기 (50kW), CNC 머신 5대 (대당 20kW), 용접 로봇 3대",
    },
    {
      label: "데이터센터",
      prompt:
        "시설 유형: 소규모 데이터센터 (IDC)\n계약전력: 1,000kW (일반용 갑 II, 고압 A)\n월간 전력 사용량: 500,000 kWh\n주요 설비: 서버 랙 100개 (랙당 5kW), 항온항습기 (CRAC) 10대, UPS 시스템",
    },
    {
      label: "대형 오피스",
      prompt:
        "시설 유형: 20층 오피스 빌딩\n계약전력: 800kW (일반용 갑 II, 고압 B)\n월간 전력 사용량: 120,000 kWh\n주요 설비: 중앙 냉난방 시스템, 엘리베이터 5대, 사무용 기기 및 조명",
    },
    {
      label: "EV 충전소",
      prompt:
        "시설 유형: EV 급속 충전소\n계약전력: 500kW (일반용 갑 II, 고압 A)\n월간 전력 사용량: 60,000 kWh\n주요 설비: 100kW 급속 충전기 4기 (일 평균 10대 충전, 대당 50kWh)",
    },
    {
      label: "종합병원",
      prompt:
        "시설 유형: 300병상 종합병원\n계약전력: 1,200kW (일반용 을, 고압 A)\n월간 전력 사용량: 250,000 kWh\n주요 설비: MRI, CT 등 의료장비, 수술실 공조 시스템, 24시간 운영 조명 및 설비",
    },
    {
      label: "리조트/호텔",
      prompt:
        "시설 유형: 200객실 리조트\n계약전력: 700kW (일반용 갑 II, 고압 B)\n월간 전력 사용량: 90,000 kWh (성수기 기준)\n주요 설비: 객실 냉난방, 수영장 펌프 및 히터, 주방 설비, 야간 경관 조명",
    },
    {
      label: "가정용",
      prompt:
        "시설 유형: 가정용 (4인 가구, 34평 아파트)\n전기 계약: 주택용 전력 (저압)\n월간 전력 사용량: 450 kWh (하계 에어컨 사용 기준)\n주요 가전: TV, 냉장고, 세탁기, 건조기, 에어컨, 인덕션",
    },
    {
      label: "일반상가",
      prompt:
        "시설 유형: 일반상가 (50평 규모 소매점)\n계약전력: 20kW (일반용 갑 I, 저압)\n월간 전력 사용량: 3,000 kWh\n주요 설비: 냉장/냉동 쇼케이스 5대, 시스템 에어컨, POS 시스템, 실내외 조명",
    },
    {
      label: "복합상가",
      prompt:
        "시설 유형: 복합상가 (5층, 연면적 3,000평)\n계약전력: 300kW (일반용 갑 II, 고압A)\n월간 전력 사용량: 50,000 kWh\n주요 설비: 공용 냉난방, 엘리베이터 3대, 에스컬레이터 2대, 다수 입점 매장",
    },
    {
      label: "일반사무실",
      prompt:
        "시설 유형: 일반사무실 (100평, 직원 50명)\n계약전력: 40kW (일반용 갑 I, 저압)\n월간 전력 사용량: 6,000 kWh\n주요 설비: 컴퓨터 50대, 복합기 3대, 소형 서버, 시스템 냉난방",
    },
    {
      label: "대규모테마파크",
      prompt:
        "시설 유형: 대규모 테마파크 (연면적 5만평)\n계약전력: 2,000kW (일반용 을, 고압B)\n월간 전력 사용량: 300,000 kWh\n주요 설비: 대형 놀이기구 10종, 야간 퍼레이드용 조명, 식당가 및 기념품점 설비",
    },
    {
      label: "미술관",
      prompt:
        "시설 유형: 현대 미술관 (연면적 10,000㎡)\n계약전력: 500kW (일반용 갑 II, 고압 A)\n월간 전력 사용량: 70,000 kWh\n주요 설비: 항온항습 시스템(HVAC), 전문 트랙 조명, 대형 미디어아트 전시",
    },
    {
      label: "아파트단지",
      prompt:
        "시설 유형: 1,000세대 아파트단지\n계약전력: 2,000kW (주택용 전력, 고압)\n월간 전력 사용량: 450,000 kWh (세대 평균 450kWh)\n주요 설비: 공용부(엘리베이터, 지하주차장), 세대별 전력, 커뮤니티 시설(피트니스, 도서관)",
    },
    {
      label: "산업단지",
      prompt:
        "시설 유형: 일반 산업단지 (10개 입주사)\n계약전력: 5,000kW (산업용 을, 고압 B)\n월간 전력 사용량: 1,500,000 kWh\n주요 설비: 단지 공용 설비, 입주사별 생산 설비 부하",
    },
    {
      label: "카페",
      prompt:
        "시설 유형: 대형 카페 (80평)\n계약전력: 50kW (일반용 갑 I, 저압)\n월간 전력 사용량: 8,000 kWh\n주요 설비: 에스프레소 머신 2대, 대형 제빵 오븐, 쇼케이스 냉장고, 시스템 에어컨",
    },
    {
      label: "도시 공원",
      prompt:
        "시설 유형: 도시 근린공원 (면적 30,000㎡)\n계약전력: 100kW (일반용 갑 I, 저압)\n월간 전력 사용량: 12,000 kWh\n주요 설비: 야간 경관 조명, 분수 펌프, 관리사무소",
    },
    {
      label: "반도체 공장",
      prompt:
        "시설 유형: 반도체 팹(Fab)\n계약전력: 50,000kW (산업용 을, 초고압)\n월간 전력 사용량: 25,000,000 kWh\n주요 설비: 클린룸, 생산 장비(노광, 식각 등), 초순수(UPW) 생산 설비, 24시간 가동",
    },
    {
      label: "컨테이너선 (정박중)",
      prompt:
        "시설 유형: 14,000 TEU 컨테이너선 (정박 중, 육상전원공급(AMP) 사용)\n계약전력: 1,500kW (산업용 을)\n월간 전력 사용량: 150,000 kWh (월 10일 정박 기준)\n주요 설비: 냉동 컨테이너 100개, 선내 조명 및 생활 설비",
    },
    {
      label: "카라반 캠핑장",
      prompt:
        "시설 유형: 카라반 캠핑장 (50개 사이트)\n계약전력: 200kW (일반용 갑 II)\n월간 전력 사용량: 30,000 kWh (성수기 기준)\n주요 설비: 사이트별 전력 공급(카라반 에어컨 등), 관리동, 공용 시설(수영장, 샤워실)",
    },
  ],
  ess: [
    {
      label: "공장 피크 저감",
      prompt:
        "목적: 최대 부하 전력(피크) 저감\n시설: 제조공장 (계약전력 500kW)\n피크 시간: 14:00-16:00 (평균 480kW 사용)\n목표 피크: 430kW (50kW 저감)\nESS 용량: 100 kWh (50kW 출력으로 2시간 방전)\n초기 투자 비용: 6,000만원",
    },
    {
      label: "병원 비상 전원",
      prompt:
        "목적: 정전 시 필수 부하 전원 공급\n시설: 종합병원 (필수 부하 200kW)\n비상 전원 유지 시간: 1시간\nESS 용량: 200 kWh (200kW 출력)\n초기 투자 비용: 1억 2,000만원 (UPS 기능 포함)",
    },
    {
      label: "태양광 수익 증대",
      prompt:
        "목적: REC 가중치 확보 및 잉여 전력 판매\n시설: 1MW 태양광 발전소\nESS 용량: 2.5 MWh\n초기 투자 비용: 10억원\n예상 시나리오: 낮에 충전, 저녁 피크 시간대에 SMP가 높을 때 방전하여 수익 극대화",
    },
    {
      label: "EV충전소 부하관리",
      prompt:
        "목적: 충전 수요 피크 시 전력 계통 부하 분산\n시설: EV 급속 충전소 (100kW 충전기 4대)\n시나리오: 심야 경부하 시간대에 ESS 충전, 낮 시간대 충전 수요 몰릴 때 ESS에서 전력 공급하여 계약 전력 초과 방지\nESS 용량: 300 kWh\n초기 투자 비용: 1억 8,000만원",
    },
    {
      label: "주파수 조정(FR)",
      prompt:
        "목적: 전력 시장 참여를 통한 추가 수익 창출\n시설: 대규모 ESS 스테이션\nESS 용량: 10 MWh\n초기 투자 비용: 40억원\n시나리오: 전력 계통의 주파수 변동에 따라 실시간으로 충/방전하여 계통 안정화에 기여하고 정산금 수령",
    },
    {
      label: "캠퍼스 마이크로그리드",
      prompt:
        "목적: 에너지 자립 및 효율 향상\n시설: 대학교 캠퍼스 (태양광 500kW 설치)\n시나리오: 태양광 발전량과 교내 전력 소비 패턴을 분석, ESS를 활용해 잉여 전력 저장 및 피크 시간대 사용\nESS 용량: 1 MWh\n초기 투자 비용: 6억원",
    },
    {
      label: "빌딩 수요관리(DR)",
      prompt:
        "목적: 정부의 수요 감축 요청 시 인센티브 확보\n시설: 대형 상업 빌딩\n시나리오: 전력거래소로부터 DR 요청 시, ESS를 방전하여 빌딩 부하를 감축하고 정산금 수령\nESS 용량: 800 kWh\n초기 투자 비용: 5억원",
    },
    {
      label: "휴대용 ESS",
      prompt:
        "목적: 캠핑 및 야외활동용 전원 확보\nESS 용량: 1kWh\n초기 투자 비용: 100만원\n사용 시나리오: 100W 태양광 패널로 주간 충전, 야간에 스마트폰, 노트북, 소형 빔프로젝터 등 사용",
    },
    {
      label: "카라반 ESS",
      prompt:
        "목적: 카라반 내부 전원 자립\nESS 용량: 5kWh\n초기 투자 비용: 500만원\n사용 시나리오: 주행 중 알터네이터 및 태양광으로 충전, 정박 시 냉장고, TV, 조명 등 내부 가전제품 1박 2일 사용",
    },
    {
      label: "가정용 ESS",
      prompt:
        "목적: 누진제 완화 및 비상전원\n시설: 가정용 태양광 5kW 연계\nESS 용량: 10kWh\n초기 투자 비용: 1,000만원\n사용 시나리오: 주간에 태양광 잉여 전력 저장, 전력 소비 많은 저녁 시간대 사용. 월 500kWh 이상 사용 가구",
    },
    {
      label: "편의점 ESS",
      prompt:
        "목적: 피크 저감 및 비상전원\n시설: 24시간 편의점 (계약전력 30kW)\nESS 용량: 50kWh\n초기 투자 비용: 3,000만원\n사용 시나리오: 심야 시간대 충전, 주간 냉장/냉동 설비 피크 시간대 방전. 정전 시 POS 및 필수 설비 2시간 운영",
    },
    {
      label: "RE100 공장 ESS",
      prompt:
        "목적: RE100 이행 및 피크 저감\n시설: RE100 이행 선언 공장 (자체 태양광 500kW)\nESS 용량: 1.5MWh\n초기 투자 비용: 8억원\n사용 시나리오: 재생에너지 사용률 극대화 및 공장 피크 시간대 부하 저감",
    },
    {
      label: "산업기계 ESS",
      prompt:
        "목적: 순간적인 대규모 전력수요 대응\n시설: 프레스, 용접기 등 순간 전력소비가 큰 산업기계\nESS 용량: 200kWh (고출력 C-rate)\n초기 투자 비용: 1억원\n사용 시나리오: 기계 가동 시 발생하는 순간 피크 전력을 ESS에서 공급하여 공장 전체 계약전력 초과 방지",
    },
    {
      label: "EV선박 ESS",
      prompt:
        "목적: 전기 추진 선박 운용비용 분석\n시설: 50톤급 완전 전기추진 어선\nESS 용량: 500kWh\n초기 투자 비용: 3억원 (선박 건조비 제외)\n사용 시나리오: 야간에 항구에서 충전 후 주간 조업. 기존 디젤유 사용 대비 연료비 절감 효과 분석",
    },
    {
      label: "하이브리드 선박 ESS",
      prompt:
        "목적: 엔진 효율 최적화 및 연료비 절감\n시설: 500톤급 디젤-전기 하이브리드 여객선\nESS 용량: 1MWh\n초기 투자 비용: 6억원\n사용 시나리오: 입출항/저속 운항 시 전기 모드 사용, 고속 항해 시 엔진 발전 잉여 전력 저장",
    },
    {
      label: "자동차 ESS (V2G)",
      prompt:
        "목적: V2G(Vehicle-to-Grid) 참여 수익 분석\n시설: V2G 기능 탑재 전기차 (아이오닉5, 배터리 77.4kWh) 및 V2G 충전기\n초기 투자 비용: 500만원 (V2G 충전기)\n사용 시나리오: 전기요금이 저렴한 밤에 충전, 전력 수요가 많은 피크 시간대에 한전 계통으로 역송전하여 수익 창출",
    },
    {
      label: "미술관 BEMS 연계 ESS",
      prompt:
        "목적: 피크 저감 및 BEMS 연계\n시설: 현대 미술관 (피크 500kW)\n목표 피크: 450kW (50kW 저감)\nESS 용량: 150kWh\n초기 투자 비용: 9,000만원\n시나리오: BEMS와 연동하여 건물 부하 예측 기반으로 최적 충/방전 스케줄링",
    },
    {
      label: "테마파크 피크 저감 ESS",
      prompt:
        "목적: 놀이기구 가동 피크 저감\n시설: 대규모 테마파크 (피크 2,000kW)\n목표 피크: 1,800kW (200kW 저감)\nESS 용량: 500kWh\n초기 투자 비용: 3억원\n시나리오: 순간 전력소비가 큰 놀이기구 가동 시 ESS에서 전력 공급",
    },
    {
      label: "산업단지 마이크로그리드 ESS",
      prompt:
        "목적: 단지 내 전력 자립 및 안정성 향상\n시설: 산업단지 (자체 태양광 1MW 보유)\nESS 용량: 3MWh\n초기 투자 비용: 15억원\n시나리오: 태양광 발전량과 입주사 부하 패턴을 분석하여 전력 거래 및 피크 저감에 활용",
    },
    {
      label: "카라반 캠핑장 ESS",
      prompt:
        "목적: 피크 저감 및 친환경 이미지 제고\n시설: 카라반 캠핑장 (피크 200kW, 태양광 50kW 설치)\nESS 용량: 100kWh\n초기 투자 비용: 6,000만원\n시나리오: 주간 태양광 잉여 전력 저장 후, 저녁 시간대 캠핑객 전력 사용 피크 시 방전",
    },
  ],
};

type AnalysisType = "usage" | "ess";

interface EnergyCalculatorProps {
  restoredState: HistoryItem | null;
  onRestoreComplete: () => void;
  onForwardToAccounting: (prompt: string) => void;
}

export default function EnergyCalculator({
  restoredState,
  onRestoreComplete,
  onForwardToAccounting,
}: EnergyCalculatorProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("usage");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EnergyReport | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (restoredState?.inputs) {
      setAnalysisType(restoredState.inputs.analysisType || "usage");
      setPrompt(restoredState.inputs.prompt || "");
      onRestoreComplete();
    }
  }, [restoredState, onRestoreComplete]);

  useEffect(() => {
    if (report?.chartData && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const chartColors = [
        "rgba(250, 204, 21, 0.7)",
        "rgba(59, 130, 246, 0.7)",
        "rgba(34, 197, 94, 0.7)",
        "rgba(239, 68, 68, 0.7)",
        "rgba(168, 85, 247, 0.7)",
        "rgba(236, 72, 153, 0.7)",
      ];
      const chartBorderColors = chartColors.map((c) => c.replace("0.7", "1"));

      const datasets = report.chartData.datasets.map((ds, index) => ({
        ...ds,
        backgroundColor:
          ds.backgroundColor ||
          (report.chartData?.type === "pie"
            ? chartColors
            : chartColors[index % chartColors.length]),
        borderColor:
          report.chartData?.type === "pie"
            ? chartBorderColors
            : chartBorderColors.map((c) => c.replace("0.7", "1"))[index % chartColors.length],
        borderWidth: 1,
      }));

      chartInstance.current = new Chart(chartRef.current, {
        type: report.chartData.type,
        data: {
          labels: report.chartData.labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top", labels: { color: "#d4d4d4" } },
            title: {
              display: true,
              text: report.chartData.title,
              color: "#fafafa",
              font: { size: 16 },
            },
          },
          scales:
            report.chartData.type !== "pie"
              ? {
                  x: { ticks: { color: "#a3a3a3" }, grid: { color: "#404040" } },
                  y: { ticks: { color: "#a3a3a3" }, grid: { color: "#404040" } },
                }
              : undefined,
        },
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [report]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      let result;
      if (analysisType === "usage") {
        result = await calculateEnergyUsage(prompt);
      } else {
        result = await calculateEssEfficiency(prompt);
      }
      setReport(result);

      setTimeout(async () => {
        if (reportRef.current) {
          try {
            const previewImage = await generatePreviewImage(reportRef.current);
            await addHistory({
              id: Date.now(),
              tool: "energy",
              output: previewImage,
              prompt,
              inputs: {
                analysisType,
                prompt,
                result,
              },
            });
          } catch (historyError) {
            console.error("기록 저장에 실패했습니다:", historyError);
          }
        }
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setReport(null);
    setError(null);
    setIsLoading(false);
  };

  const handleAccountingAnalysis = () => {
    if (!report) return;
    const analysisPrompt = `다음 에너지 분석 보고서에 대한 재무 타당성 검토를 요청합니다:\n\n--- 보고서 내용 ---\n제목: ${report.title}\n요약: ${report.summary}\n상세 분석:\n${report.details}\n전문가 제안:\n${report.recommendations}\n--- 보고서 끝 ---\n\n위 보고서를 바탕으로 투자수익률(ROI), 정부 보조금 적용 가능성, 그리고 관련 비용 및 절감액에 대한 회계 처리 방안(자산화, 비용 처리 등)을 포함한 종합적인 재무 분석을 제공해주세요.`;
    onForwardToAccounting(analysisPrompt);
  };

  const renderReport = (reportData: EnergyReport) => (
    <div ref={reportRef} className="w-full glass-card p-8 border-slate-700/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-700 pb-6">
        <div>
          <h2 className="text-3xl font-display font-black text-white">{reportData.title}</h2>
          <p className="text-slate-400 mt-1 font-mono text-sm">
            REPORT ID: ENG-{Date.now().toString().slice(-6)} | ANALYZED BY CREATIVE AI
          </p>
        </div>
        <div className="px-4 py-2 bg-brand-600/20 border border-brand-500/30 rounded-lg">
          <span className="text-xs font-bold text-brand-300 uppercase tracking-widest block">
            Confidence Rating
          </span>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn("h-1.5 w-6 rounded-full", s <= 4 ? "bg-brand-400" : "bg-slate-700")}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800/40 p-5 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Executive Summary
            </h4>
            <p className="text-lg text-slate-200 leading-relaxed italic">"{reportData.summary}"</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Technical Deep Dive
            </h4>
            <div
              className="text-slate-300 leading-relaxed text-sm space-y-3"
              dangerouslySetInnerHTML={{ __html: reportData.details.replace(/\n/g, "<br />") }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {reportData.chartData && (
            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 shadow-inner">
              <canvas ref={chartRef}></canvas>
            </div>
          )}

          <div className="bg-gold-900/10 p-5 rounded-xl border border-gold-500/20">
            <h4 className="text-xs font-bold text-gold-400 uppercase tracking-widest mb-3">
              Strategic Recommendations
            </h4>
            <div
              className="text-xs text-gold-200/80 leading-relaxed space-y-2"
              dangerouslySetInnerHTML={{
                __html: (reportData.recommendations || "").replace(/\n/g, "<br />"),
              }}
            />
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Analysis Date</span>
              <span className="text-slate-200">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Engine Version</span>
              <span className="text-slate-200">v4.2-Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center max-w-4xl"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading">
            <LoadingState />
          </motion.div>
        ) : report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            {renderReport(report)}
            <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
              <button onClick={handleAccountingAnalysis} className={analysisButtonClasses}>
                AI 회계 분석
              </button>
              <button
                onClick={() => {
                  setReport(null);
                  setError(null);
                }}
                className={cn(secondaryButtonClasses, "w-auto")}
              >
                다시 생성하기
              </button>
              <button onClick={handleReset} className={cn(secondaryButtonClasses, "w-auto")}>
                새로운 계산 시작
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="grid grid-cols-2 gap-2 w-full max-w-md bg-neutral-800/50 p-1 rounded-md">
              <button
                onClick={() => setAnalysisType("usage")}
                className={cn(
                  "py-3 rounded text-md font-bold transition-colors",
                  analysisType === "usage" ? "bg-yellow-400 text-black" : "hover:bg-neutral-700/50",
                )}
              >
                전력사용량/비용계산
              </button>
              <button
                onClick={() => setAnalysisType("ess")}
                className={cn(
                  "py-3 rounded text-md font-bold transition-colors",
                  analysisType === "ess" ? "bg-yellow-400 text-black" : "hover:bg-neutral-700/50",
                )}
              >
                ESS 에너지저장량/효율
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center w-full">
                <p className="font-bold">분석 실패</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <label
                htmlFor="energy-prompt"
                className="font-bold text-2xl text-neutral-300 text-center"
              >
                {analysisType === "usage" ? "시설 정보 및 전력 사용량" : "ESS 시스템 정보"}
              </label>
              <textarea
                id="energy-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  analysisType === "usage"
                    ? "시설 유형, 월간 사용량, 주요 설비 등 상세 정보를 입력하세요..."
                    : "ESS 용량, 초기 투자 비용, 도입 전 전기 요금 등 상세 정보를 입력하세요..."
                }
                className="w-full h-48 p-4 rounded-lg bg-neutral-900/50 border-2 border-neutral-700 focus:border-yellow-400 focus:ring-yellow-400 focus:ring-1 outline-none transition-colors"
              />

              <div className="my-2 p-4 bg-neutral-800/40 border border-neutral-700 rounded-lg">
                <p className="text-sm font-bold text-neutral-400 mb-2">
                  모범 예시 프롬프트 라이브러리
                </p>
                <div className="flex flex-wrap gap-2">
                  {promptLibrary[analysisType].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setPrompt(item.prompt)}
                      className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-200 py-1 px-3 rounded-full"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!prompt.trim()} className={primaryButtonClasses}>
                AI 분석 요청
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

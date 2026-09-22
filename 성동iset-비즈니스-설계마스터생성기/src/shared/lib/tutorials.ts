/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ActiveTab } from "@shared/config/types";

export interface TutorialStep {
  selector?: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export const tutorials: Record<string, TutorialStep[]> = {
  pro_designer: [
    {
      selector: '[data-tutorial-id="project-types"]',
      title: "1. 프로젝트 유형 선택",
      content:
        "먼저, 생성하려는 디자인의 종류(건축, 인테리어 등)를 선택하세요. AI가 유형에 맞는 최적의 결과를 생성해줍니다.",
      placement: "bottom",
    },
    {
      selector: '[data-tutorial-id="pro-prompt"]',
      title: "2. 요청사항 입력",
      content:
        "만들고 싶은 디자인에 대해 구체적으로 설명해주세요. 상세할수록 AI가 더 정확하게 이해합니다.",
      placement: "bottom",
    },
    {
      selector: '[data-tutorial-id="pro-image-upload"]',
      title: "3. 참고 이미지 (선택)",
      content:
        "원하는 스타일이나 구성을 보여주는 이미지를 업로드하면 AI가 이를 참고하여 디자인합니다.",
      placement: "top",
    },
    {
      selector: '[data-tutorial-id="pro-generate-button"]',
      title: "4. 디자인 생성",
      content: "모든 준비가 끝났습니다! 이 버튼을 눌러 전문가 수준의 디자인 시안을 만들어보세요.",
      placement: "top",
    },
  ],
  fusionChat: [
    {
      selector: '[data-tutorial-id="fusion-chat-upload"]',
      title: "시작 방법 1: 이미지 업로드",
      content:
        "편집하고 싶은 이미지를 업로드하여 AI와의 대화를 시작하세요. 이미지를 붙여넣어도 됩니다.",
      placement: "bottom",
    },
    {
      selector: '[data-tutorial-id="fusion-chat-prompt-start"]',
      title: "시작 방법 2: 프롬프트로 시작",
      content: "이미지 없이, 만들고 싶은 장면에 대한 설명만으로 첫 이미지를 생성할 수도 있습니다.",
      placement: "top",
    },
    {
      title: "대화하며 편집하기",
      content:
        '첫 이미지가 생성되면, 채팅을 통해 "자동차를 빨간색으로 바꿔줘"처럼 계속해서 수정하고 발전시켜 나갈 수 있습니다. 즐겨보세요!',
    },
  ],
  sketch: [
    {
      selector: '[data-tutorial-id="sketch-upload"]',
      title: "1. 스케치 업로드",
      content: "변환하고 싶은 스케치나 간단한 도면 이미지를 여기에 업로드하거나 붙여넣으세요.",
      placement: "bottom",
    },
    {
      selector: '[data-tutorial-id="sketch-output-type"]',
      title: "2. 출력 유형 선택",
      content:
        "스케치를 어떤 결과물로 만들지 선택하세요. 예술적인 렌더링부터 전문적인 CAD 도면까지 가능합니다.",
      placement: "bottom",
    },
    {
      selector: '[data-tutorial-id="sketch-prompt"]',
      title: "3. 상세 내용 입력",
      content: "원하는 스타일, 재질, 분위기 등 최종 결과물에 대한 설명을 입력해주세요.",
      placement: "bottom",
    },
    {
      selector: '[data-tutorial-id="sketch-generate-button"]',
      title: "4. 변환 시작",
      content: "버튼을 눌러 당신의 스케치를 멋진 결과물로 변환해보세요!",
      placement: "top",
    },
  ],
  inpaint: [
    {
      selector: '[data-tutorial-id="inpaint-scene-upload"]',
      title: "1. 배경 이미지 업로드",
      content: "먼저, 객체를 추가하거나 수정하고 싶은 기본 배경 이미지를 업로드하세요.",
      placement: "bottom",
    },
    {
      title: "2. 위치 지정 및 객체 추가",
      content:
        "이미지가 로드되면, 객체를 추가할 위치를 클릭하여 표시하세요. 그 다음, 추가할 다른 이미지를 업로드하거나 텍스트로 설명을 입력하여 이미지를 생성할 수 있습니다.",
    },
  ],
};

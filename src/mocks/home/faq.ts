import type { FAQItem } from "../../types/home";

/** 실제 답변 콘텐츠가 아직 없어 전부 같은 임시 문구를 쓴다. 콘텐츠가 정해지면 교체한다. */
const PLACEHOLDER_ANSWER = "정확한 답변을 준비하고 있어요. 곧 업데이트할 예정입니다.";

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "activity-hours",
    question: "동아리 활동 시간은 어떻게 되나요?",
    answer: PLACEHOLDER_ANSWER,
  },
  {
    id: "beginner-friendly",
    question: "프로그래밍을 처음 배우는데 괜찮을까요?",
    answer: PLACEHOLDER_ANSWER,
  },
  {
    id: "membership-fee",
    question: "회비가 있나요?",
    answer: PLACEHOLDER_ANSWER,
  },
  {
    id: "eligible-majors",
    question: "어떤 학과 학생들이 지원하나요?",
    answer: PLACEHOLDER_ANSWER,
  },
];

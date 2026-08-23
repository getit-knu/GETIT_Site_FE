import type { Project } from "../../types/home";

/** 실제 프로젝트 API 연동 전까지는 목업 3건과 장식용 그라디언트 썸네일을 보여준다. */
export const PROJECTS: Project[] = [
  {
    id: "portfolio-recommender",
    title: "주식 포트폴리오 추천 시스템",
    description: "AI 기반 맞춤형 포트폴리오 추천",
    gradient: "linear-gradient(150deg, #ad46ff 0%, #f6339a 100%)",
  },
  {
    id: "crypto-trading-bot",
    title: "암호화폐 트레이딩 봇",
    description: "자동화된 거래 시스템 구축",
    gradient: "linear-gradient(150deg, #2b7fff 0%, #00b8db 100%)",
  },
  {
    id: "news-sentiment-analysis",
    title: "금융 뉴스 감성 분석",
    description: "NLP를 활용한 시장 동향 분석",
    gradient: "linear-gradient(150deg, #ff6900 0%, #fb2c36 100%)",
  },
];

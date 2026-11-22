/**
 * 모의투자 FESTA 가상 투자(#364, BE#222). openapi 생성본에 아직 없어 BE `FestaPortfolioResult`·
 * `FestaPortfolioRequest`를 보고 손으로 옮겼다.
 */

export interface FestaInvestment {
  projectId: number;
  /** 원 단위. `unit`의 배수다. */
  amount: number;
}

/** `GET`·`PUT /api/festa/portfolio` 응답. */
export interface FestaPortfolio {
  /** 1인당 투자금(원). */
  budget: number;
  /** 투자금을 넣는 단위(원). 입력 단위로 그대로 쓴다. */
  unit: number;
  remaining: number;
  /** `010-****-1234`. 아직 번호를 낸 적이 없으면 `null`. */
  maskedPhoneNumber: string | null;
  /** 금액이 0보다 큰 투자만 온다. */
  investments: FestaInvestment[];
  /** 내 조의 출전 프로젝트(BE#228). 아직 배포 전이라 없을 수 있다. */
  ownProjectIds?: number[];
}

/** 기존 투자를 이 내용으로 통째로 바꾼다. 번호를 안 보내면 저장된 번호를 그대로 쓴다. */
export interface FestaPortfolioPayload {
  phoneNumber?: string;
  /** 번호를 보낼 때만 검사한다. */
  privacyConsent?: boolean;
  investments: FestaInvestment[];
}

/** `GET /api/admin/festa/results` 의 프로젝트 한 줄(#365). 투자가 없는 출전 프로젝트도 0 으로 온다. */
export interface FestaProjectResult {
  projectId: number;
  title: string;
  teamName: string;
  totalAmount: number;
  investorCount: number;
}

/** 어드민 투자 집계. `projects`는 서버가 총액 내림차순으로 준다. */
export interface FestaResults {
  /** 한 곳이라도 투자한 사람 수. */
  investorCount: number;
  projects: FestaProjectResult[];
}

/**
 * 1인 1팀 투표(#373, BE#232). 이번 학기는 투자 대신 투표로 한다. 계약은 BE 이슈 기준이라
 * BE 구현이 머지되면 실제 코드와 다시 맞춘다.
 *
 * `GET`·`PUT /api/festa/vote` 응답.
 */
export interface FestaVote {
  /** 투표한 프로젝트. 아직 안 했으면 `null`. */
  projectId: number | null;
  maskedPhoneNumber: string | null;
  ownProjectIds: number[];
}

/** 다시 보내면 투표한 팀이 바뀐다. 번호·동의 규칙은 포트폴리오와 같다. */
export interface FestaVotePayload {
  projectId: number;
  phoneNumber?: string;
  privacyConsent?: boolean;
}

/** `GET /api/admin/festa/vote-results`. 서버가 득표 내림차순으로 준다. */
export interface FestaVoteResults {
  voterCount: number;
  projects: { projectId: number; title: string; teamName: string; voteCount: number }[];
}

/**
 * FESTA 투표 기간(#379, BE#234). 오프셋 붙은 ISO 8601. 이 기간 밖에는 모의투자 토글이 켜져 있어도
 * 투표(투자)를 받지 않는다. 토글은 쇼케이스를 띄우는 스위치로만 남는다.
 */
export interface FestaSchedule {
  startAt: string;
  endAt: string;
}

/** `GET /api/admin/festa/schedule`. 아직 정하지 않았으면 둘 다 `null`이다. */
export interface FestaScheduleSetting {
  startAt: string | null;
  endAt: string | null;
}

/**
 * 경품 당첨자 한 명(#412, BE#238). 서버가 번호를 낸 참여자 중에서 뽑는다.
 * `phoneNumber`는 전체 번호다. 번호를 파기했으면 `null`.
 */
export interface FestaWinner {
  /** 뽑힌 순서(1부터). 추가 추첨은 앞 순번에 이어진다. */
  drawOrder: number;
  userId: number;
  name: string;
  phoneNumber: string | null;
  drawnAt: string;
}

/** `POST /api/admin/festa/draw`, `GET /api/admin/festa/winners` 응답. */
export interface FestaWinners {
  winners: FestaWinner[];
}

/** `count`를 비우면 서버가 5명을 뽑는다. `additional`이면 이미 뽑은 사람을 빼고 이어서 뽑는다. */
export interface FestaDrawPayload {
  count?: number;
  additional?: boolean;
}

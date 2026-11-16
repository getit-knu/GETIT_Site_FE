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

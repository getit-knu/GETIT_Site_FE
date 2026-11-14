import type { FestaPortfolio, FestaPortfolioPayload } from "../../types/festa";
import { client } from "../client";

/** 내 가상 투자 현황(#364). 로그인만 하면 GUEST 도 부른다. 토글이 꺼져 있어도 읽을 수는 있다. */
export async function getPortfolio(): Promise<FestaPortfolio> {
  const { data } = await client.get<FestaPortfolio>("/api/festa/portfolio");
  return data;
}

/** 투자를 통째로 바꿔 저장한다. 응답은 저장 뒤 현황이다. */
export async function savePortfolio(payload: FestaPortfolioPayload): Promise<FestaPortfolio> {
  const { data } = await client.put<FestaPortfolio>("/api/festa/portfolio", payload);
  return data;
}

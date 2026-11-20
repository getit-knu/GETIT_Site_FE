import { downloadFile } from "../../libs/downloadFile";
import type { FestaResults, FestaVoteResults } from "../../types/festa";
import { client } from "../client";

/** 프로젝트별 투자 집계(#365). 행사 중에는 공개하지 않아 어드민만 본다. */
export async function getFestaResults(): Promise<FestaResults> {
  const { data } = await client.get<FestaResults>("/api/admin/festa/results");
  return data;
}

/** 프로젝트별 득표 집계(#373). */
export async function getFestaVoteResults(): Promise<FestaVoteResults> {
  const { data } = await client.get<FestaVoteResults>("/api/admin/festa/vote-results");
  return data;
}

/**
 * 추첨용 투자자 명단(이름·전체 전화번호·마지막 투자 시각). 파일 응답이라 `ApiResponse`로 감싸지
 * 않는다 — `client`의 blob 예외 처리를 그대로 탄다.
 */
export const downloadFestaInvestors = (): Promise<void> =>
  downloadFile("/api/admin/festa/investors.csv", "festa-investors.csv");

/** 전화번호와 동의 기록만 지운다. 투자 내역과 집계는 남는다. */
export async function destroyFestaPhoneNumbers(): Promise<{ destroyedCount: number }> {
  const { data } = await client.delete<{ destroyedCount: number }>("/api/admin/festa/investors/phones");
  return data;
}

/** 리허설 데이터 초기화(BE#229). 투자 내역과 전화번호를 모두 지운다. 토글이 켜져 있으면 거절된다. */
export async function resetFestaInvestments(): Promise<{ deletedInvestorCount: number }> {
  const { data } = await client.delete<{ deletedInvestorCount: number }>("/api/admin/festa/investments");
  return data;
}

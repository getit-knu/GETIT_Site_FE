import { downloadFile } from "../../libs/downloadFile";
import type {
  FestaDrawPayload,
  FestaResults,
  FestaSchedule,
  FestaScheduleSetting,
  FestaVoteResults,
  FestaWinners,
} from "../../types/festa";
import { client } from "../client";

/** 프로젝트별 투자 집계(#365). 행사 중에는 공개하지 않아 어드민만 본다. */
export async function getFestaResults(): Promise<FestaResults> {
  const { data } = await client.get<FestaResults>("/api/admin/festa/results");
  return data;
}

/** 투표 기간(#379, BE#234). 정하지 않았으면 둘 다 `null`이다. */
export async function getFestaSchedule(): Promise<FestaScheduleSetting> {
  const { data } = await client.get<FestaScheduleSetting>("/api/admin/festa/schedule");
  return data;
}

/** 투표 기간 저장. 시작이 종료보다 늦거나 같으면 서버가 `INVALID_FESTA_SCHEDULE`로 거절한다. */
export async function updateFestaSchedule(payload: FestaSchedule): Promise<FestaScheduleSetting> {
  const { data } = await client.put<FestaScheduleSetting>("/api/admin/festa/schedule", payload);
  return data;
}

/** 프로젝트별 득표 집계(#373). */
export async function getFestaVoteResults(): Promise<FestaVoteResults> {
  const { data } = await client.get<FestaVoteResults>("/api/admin/festa/vote-results");
  return data;
}

/**
 * 경품 추첨(#412, BE#238). 투표가 끝난 뒤에만 된다(`FESTA_DRAW_BEFORE_END`). 이미 뽑았으면
 * `additional` 없이는 거절된다(`FESTA_ALREADY_DRAWN`) — 두 번 눌러 당첨자가 늘어나는 것을 막는다.
 */
export async function drawFestaWinners(payload: FestaDrawPayload): Promise<FestaWinners> {
  const { data } = await client.post<FestaWinners>("/api/admin/festa/draw", payload);
  return data;
}

/** 당첨자와 전체 번호. 부를 때마다 서버에 열람 기록이 남는다. */
export async function getFestaWinners(): Promise<FestaWinners> {
  const { data } = await client.get<FestaWinners>("/api/admin/festa/winners");
  return data;
}

/**
 * 참여자 명단(이름·가린 번호·마지막 참여 시각, BE#238). 투표가 끝난 뒤에만 받을 수 있다
 * (`FESTA_EXPORT_BEFORE_END`). 파일 응답이라 `ApiResponse`로 감싸지 않는다 — `client`의 blob
 * 예외 처리를 그대로 탄다.
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

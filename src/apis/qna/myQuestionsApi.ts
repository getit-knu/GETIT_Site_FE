import { client } from "../client";
import type { Page } from "../../types/qna";
import type { MyQuestion } from "../../types/lecture";

/**
 * 부원 본인 질문 전체 조회(#279).
 *
 * **서버에 아직 없다** — `getit-knu/GETIT_Site_BE#185` 가 나가야 동작한다. 강의별
 * 조회(4.6)를 강의 수만큼 부르는 대신 이 하나를 기다린다.
 */

/** `GET /api/member/questions?page=&size=` */
export async function getMyQuestions(params: { page?: number; size?: number } = {}): Promise<Page<MyQuestion>> {
  const { data } = await client.get<Page<MyQuestion>>("/api/member/questions", { params });
  return data;
}

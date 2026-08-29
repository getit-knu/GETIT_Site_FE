import { client } from "../client";
import type {
  CriteriaBoard,
  CriterionDraft,
  CriterionPayload,
  QuestionOrderPayload,
  QuestionPayload,
  RecruitmentQuestion,
  RecruitmentSchedule,
  SchedulePayload,
} from "../../types/recruitment";

/** 지원 시스템 설정 API. 명세서 6.1 ~ 6.11. */

/** `GET /api/admin/recruitment/schedule` */
export async function getSchedule(): Promise<RecruitmentSchedule> {
  const { data } = await client.get<RecruitmentSchedule>("/api/admin/recruitment/schedule");
  return data;
}

/** `PUT /api/admin/recruitment/schedule` */
export async function saveSchedule(payload: SchedulePayload): Promise<RecruitmentSchedule> {
  const { data } = await client.put<RecruitmentSchedule>("/api/admin/recruitment/schedule", payload);
  return data;
}

/** `GET /api/admin/recruitment/questions` */
export async function getQuestions(): Promise<RecruitmentQuestion[]> {
  const { data } = await client.get<RecruitmentQuestion[]>("/api/admin/recruitment/questions");
  return data;
}

/** `POST /api/admin/recruitment/questions` */
export async function createQuestion(payload: QuestionPayload): Promise<void> {
  await client.post("/api/admin/recruitment/questions", payload);
}

/** `PUT /api/admin/recruitment/questions/{id}` */
export async function updateQuestion(id: number, payload: QuestionPayload): Promise<void> {
  await client.put(`/api/admin/recruitment/questions/${id}`, payload);
}

/** `DELETE /api/admin/recruitment/questions/{id}` */
export async function deleteQuestion(id: number): Promise<void> {
  await client.delete(`/api/admin/recruitment/questions/${id}`);
}

/** `PUT /api/admin/recruitment/questions/order` */
export async function reorderQuestions(orderedIds: number[]): Promise<void> {
  const payload: QuestionOrderPayload = { orderedIds };
  await client.put("/api/admin/recruitment/questions/order", payload);
}

/** `GET /api/admin/recruitment/criteria` */
export async function getCriteria(): Promise<CriteriaBoard> {
  const { data } = await client.get<CriteriaBoard>("/api/admin/recruitment/criteria");
  return data;
}

function toCriterionPayload(draft: CriterionDraft): CriterionPayload {
  return { name: draft.name, guideline: draft.guideline, maxScore: draft.maxScore };
}

/**
 * 평가 기준 저장.
 *
 * 화면은 여러 줄을 "저장" 버튼 하나로 한 번에 편집하지만, 실제 BE엔 일괄 저장
 * 엔드포인트가 없다 — 항목별 `POST`(추가)/`PUT`(수정)/`DELETE`(삭제)뿐이다. 여기서
 * 초안을 최신 서버 상태와 diff해서 여러 요청으로 나눠 보낸다.
 *
 * **순서가 중요하다.** BE는 매 쓰기마다 "합계가 100을 넘는지"만 검사한다(정확히
 * 100인지는 강제하지 않는다 — 그러면 기준을 하나씩 추가하는 중간 상태를 저장할 수
 * 없어서다, `EvaluationCriterionService.validateTotal` 참고). 화면에서 이미 최종
 * 합계가 100이 되도록 막아뒀지만, 배점이 늘어나는 수정을 줄어드는 수정보다 먼저
 * 보내면 중간 합계가 100을 넘어 그 요청만 거절당할 수 있다. 그래서 삭제 → 배점이
 * 줄어드는 수정부터 오름차순 → 마지막에 추가 순으로 보낸다.
 */
export async function saveCriteria(drafts: CriterionDraft[]): Promise<void> {
  const current = await getCriteria();
  const currentById = new Map(current.criteria.map((criterion) => [criterion.id, criterion]));
  const draftIds = new Set(drafts.flatMap((draft) => (draft.id !== undefined ? [draft.id] : [])));

  const toDelete = current.criteria.filter((criterion) => !draftIds.has(criterion.id));
  for (const criterion of toDelete) {
    await client.delete(`/api/admin/recruitment/criteria/${criterion.id}`);
  }

  const toUpdate = drafts.filter((draft): draft is CriterionDraft & { id: number } => draft.id !== undefined);
  const toCreate = drafts.filter((draft) => draft.id === undefined);

  const sortedUpdates = [...toUpdate].sort((a, b) => {
    const deltaA = a.maxScore - (currentById.get(a.id)?.maxScore ?? 0);
    const deltaB = b.maxScore - (currentById.get(b.id)?.maxScore ?? 0);
    return deltaA - deltaB;
  });

  for (const draft of sortedUpdates) {
    await client.put(`/api/admin/recruitment/criteria/${draft.id}`, toCriterionPayload(draft));
  }

  for (const draft of toCreate) {
    await client.post("/api/admin/recruitment/criteria", toCriterionPayload(draft));
  }
}

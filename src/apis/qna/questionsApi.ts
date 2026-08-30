import { client } from "../client";
import type { AnswerPayload, Page, QuestionDetail, QuestionListItem, QuestionListParams } from "../../types/qna";

/** 어드민 Q&A API. 명세서 11.1 ~ 11.4. */

/** `GET /api/admin/questions?status=&lectureId=&keyword=&page=&size=` */
export function getQuestions(params: QuestionListParams): Promise<Page<QuestionListItem>> {
  return client.get<Page<QuestionListItem>>("/api/admin/questions", { params }).then(({ data }) => data);
}

/** `GET /api/admin/questions/{id}` */
export function getQuestion(id: number): Promise<QuestionDetail> {
  return client.get<QuestionDetail>(`/api/admin/questions/${id}`).then(({ data }) => data);
}

/**
 * 답변 작성·수정.
 *
 * 명세서는 작성(`POST`)과 수정(`PUT`)을 나누고, 이미 답변이 있는데 `POST` 하면
 * `409 ALREADY_ANSWERED` 를 준다. 화면은 답변 존재 여부를 이미 알고 있으므로
 * 여기서 갈라 호출부가 신경 쓰지 않게 한다.
 */
export function saveAnswer(id: number, content: string, isEdit: boolean): Promise<void> {
  const payload: AnswerPayload = { content };
  const request = isEdit
    ? client.put(`/api/admin/questions/${id}/answer`, payload)
    : client.post(`/api/admin/questions/${id}/answer`, payload);
  return request.then(() => undefined);
}

import * as mock from "../../mocks/qna/questions";
import type { Page, QuestionDetail, QuestionListItem, QuestionListParams } from "../../types/qna";

/**
 * Admin Q&A API. 명세서 11.1 ~ 11.4.
 *
 * **아직 목 데이터를 돌려준다.** BE 의 qna 도메인이 골격만 있어서다.
 * 화면이 쓰는 함수 모양은 실제 계약과 같게 맞춰 두었으므로, 연동 이슈에서는
 * 이 파일 안의 `mock.*` 호출만 `client.*` 로 바꾸면 된다. 아래 주석이 그 대응이다.
 */

/** `GET /api/admin/questions?status=&keyword=&page=&size=` */
export function getQuestions(params: QuestionListParams): Promise<Page<QuestionListItem>> {
  return mock.fetchQuestions(params);
}

/** `GET /api/admin/questions/{id}` */
export function getQuestion(id: number): Promise<QuestionDetail> {
  return mock.fetchQuestionDetail(id);
}

/**
 * 답변 작성·수정.
 *
 * 명세서는 작성(`POST`)과 수정(`PUT`)을 나누고, 이미 답변이 있는데 `POST` 하면
 * `409 ALREADY_ANSWERED` 를 준다. 화면은 답변 존재 여부를 이미 알고 있으므로
 * 여기서 갈라 호출부가 신경 쓰지 않게 한다.
 */
export function saveAnswer(id: number, content: string, isEdit: boolean): Promise<void> {
  void isEdit; // 연동 시 isEdit ? client.put(...) : client.post(...)
  return mock.saveAnswer(id, content);
}

import * as mock from "../../mocks/recruitment/recruitment";
import type {
  CriteriaBoard,
  CriterionDraft,
  QuestionPayload,
  RecruitmentQuestion,
  RecruitmentSchedule,
  SchedulePayload,
} from "../../types/recruitment";

/**
 * 지원 시스템 설정 API. 명세서 6.1 ~ 6.11.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 */

/** `GET /api/admin/recruitment/schedule` */
export const getSchedule = (): Promise<RecruitmentSchedule> => mock.fetchSchedule();

/** `PUT /api/admin/recruitment/schedule` */
export const saveSchedule = (payload: SchedulePayload): Promise<RecruitmentSchedule> => mock.saveSchedule(payload);

/** `GET /api/admin/recruitment/questions` */
export const getQuestions = (): Promise<RecruitmentQuestion[]> => mock.fetchQuestions();

/** `POST /api/admin/recruitment/questions` */
export const createQuestion = (payload: QuestionPayload): Promise<void> => mock.createQuestion(payload);

/** `PUT /api/admin/recruitment/questions/{id}` */
export const updateQuestion = (id: number, payload: QuestionPayload): Promise<void> => mock.updateQuestion(id, payload);

/** `DELETE /api/admin/recruitment/questions/{id}` */
export const deleteQuestion = (id: number): Promise<void> => mock.deleteQuestion(id);

/** `PUT /api/admin/recruitment/questions/order` */
export const reorderQuestions = (orderedIds: number[]): Promise<void> => mock.reorderQuestions(orderedIds);

/** `GET /api/admin/recruitment/criteria` */
export const getCriteria = (): Promise<CriteriaBoard> => mock.fetchCriteria();

/**
 * 평가 기준 일괄 저장.
 *
 * **명세서에 없는 엔드포인트다.** 6.9 ~ 6.11 은 쓰기마다 합계 100 을 강제해
 * 기준을 하나도 편집할 수 없다(어느 순서로 바꿔도 중간 합계가 100 이 아니다).
 * 명세서 본문도 이를 지적하며 일괄 저장을 권장한다.
 *
 * TODO: BE 에 `PUT /api/admin/recruitment/criteria` 를 요청한다.
 */
export const saveCriteria = (drafts: CriterionDraft[]): Promise<void> => mock.saveCriteria(drafts);

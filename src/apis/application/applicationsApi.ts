import { client } from "../client";
import { downloadFile } from "../../libs/downloadFile";
import { getQuestions } from "../recruitment/recruitmentApi";
import type {
  AdjacentApplicants,
  ApplicantBoard,
  ApplicantListParams,
  ApplicationAnswer,
  ApplicationDetail,
  BulkDecisionPayload,
  BulkDecisionResult,
  DocumentDecisionResult,
  EvaluationPayload,
  EvaluationSummary,
} from "../../types/application";

/**
 * 지원자 관리 API. 명세서 7.1 ~ 7.6.
 */

const BASE = "/api/admin/recruitment/applications";

/** `GET /api/admin/recruitment/applications?generationId=&status=&page=&size=` */
export async function getApplicants(params: ApplicantListParams): Promise<ApplicantBoard> {
  const { data } = await client.get<ApplicantBoard>(BASE, { params });
  return data;
}

interface RawAnswer {
  questionId: number;
  answerText: string | null;
  selectedOptions: string[] | null;
}

interface RawApplicantDetail {
  id: number;
  status: ApplicationDetail["status"];
  basicInfo: ApplicationDetail["basicInfo"];
  answers: RawAnswer[];
  submittedAt: string;
}

/**
 * `GET /api/admin/recruitment/applications/{id}`
 *
 * **응답 자체엔 문항 텍스트·타입·옵션 라벨이 없다** — `questionId`·`answerText`·
 * `selectedOptions`만 온다. `GET /api/admin/recruitment/questions`(6.3)와 `questionId`로
 * 조인해서 화면에 필요한 형태로 만든다.
 */
export async function getApplicationDetail(id: number): Promise<ApplicationDetail> {
  const [{ data: raw }, questions] = await Promise.all([
    client.get<RawApplicantDetail>(`${BASE}/${id}`),
    getQuestions(),
  ]);

  const answers: ApplicationAnswer[] = raw.answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    return {
      questionId: answer.questionId,
      answerText: answer.answerText,
      selectedOptions: answer.selectedOptions,
      order: question?.order ?? 0,
      question: question?.content ?? "(삭제된 문항)",
      type: question?.type ?? "TEXT",
      options: question?.options ?? null,
    };
  });
  answers.sort((a, b) => a.order - b.order);

  return { id: raw.id, status: raw.status, basicInfo: raw.basicInfo, answers, submittedAt: raw.submittedAt };
}

/** `GET /api/admin/recruitment/applications/{id}/adjacent?generationId=&status=` */
export async function getAdjacentApplicants(id: number, params: ApplicantListParams): Promise<AdjacentApplicants> {
  const { generationId, status } = params;
  const { data } = await client.get<{ previousApplicationId: number | null; nextApplicationId: number | null }>(
    `${BASE}/${id}/adjacent`,
    { params: { generationId, status } },
  );
  return { previousId: data.previousApplicationId, nextId: data.nextApplicationId };
}

/** `GET /api/admin/recruitment/applications/{id}/scores` */
export async function getEvaluationSummary(id: number): Promise<EvaluationSummary> {
  const { data } = await client.get<EvaluationSummary>(`${BASE}/${id}/scores`);
  return data;
}

/** `PUT /api/admin/recruitment/applications/{id}/scores` — 로그인한 운영진 본인 점수로 저장. */
export async function saveEvaluation(id: number, payload: EvaluationPayload): Promise<EvaluationSummary> {
  const { data } = await client.put<EvaluationSummary>(`${BASE}/${id}/scores`, payload);
  return data;
}

/** `PATCH /api/admin/recruitment/applications/{id}/decision` — 서류·최종 둘 다 이 엔드포인트다(BE가 현재 상태로 판단). */
export async function decideApplication(id: number, passed: boolean): Promise<DocumentDecisionResult> {
  const { data } = await client.patch<DocumentDecisionResult>(`${BASE}/${id}/decision`, { passed });
  return data;
}

/** `PUT /api/admin/recruitment/applications/status` — 일괄 합불 처리. */
export async function decideApplicationsBulk(payload: BulkDecisionPayload): Promise<BulkDecisionResult> {
  const { data } = await client.put<BulkDecisionResult>(`${BASE}/status`, payload);
  return data;
}

/** `GET /api/admin/recruitment/applications/excel?generationId=&status=` */
export const exportApplicants = (params: ApplicantListParams): Promise<void> =>
  downloadFile(`${BASE}/excel`, "getit-applicants.xlsx", { generationId: params.generationId, status: params.status });

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/application/applicationsApi";
import * as publicApi from "../../apis/public/publicApi";
import type { ApplicationAnswer, ApplicationDetail, EvaluationSummary } from "../../types/application";

import { ApplicationDetailModal } from "./ApplicationDetailModal";

vi.mock("../../apis/application/applicationsApi");
vi.mock("../../apis/public/publicApi");

function answer(over: Partial<ApplicationAnswer> = {}): ApplicationAnswer {
  return {
    questionId: 1,
    order: 1,
    question: "지원 동기를 작성해주세요",
    type: "TEXT",
    answerText: "금융과 IT의 융합에 관심이 많습니다.",
    selectedOptions: null,
    options: null,
    ...over,
  };
}

function detail(over: Partial<ApplicationDetail> = {}): ApplicationDetail {
  return {
    id: 42,
    status: "SUBMITTED",
    basicInfo: {
      name: "김지원",
      email: "kim@gmail.com",
      phoneNumber: "010-1234-5678",
      collegeId: 1,
      majorId: 1,
      grade: 2,
      studentNumber: "202012345",
    },
    submittedAt: "2026-09-08T12:03:44.000Z",
    answers: [answer(), answer({ questionId: 2, order: 2, question: "하고 싶은 프로젝트는?", answerText: null })],
    ...over,
  };
}

function evaluationSummary(over: Partial<EvaluationSummary> = {}): EvaluationSummary {
  return {
    applicationId: 42,
    criteria: [
      {
        criterionId: 1,
        criterionName: "전공 적합성",
        maxScore: 20,
        averageScore: null,
        myScore: null,
        evaluatorScores: [],
      },
      {
        criterionId: 2,
        criterionName: "지원 동기",
        maxScore: 30,
        averageScore: null,
        myScore: null,
        evaluatorScores: [],
      },
    ],
    totalScore: null,
    evaluatorCount: 0,
    myTotalScore: null,
    ...over,
  };
}

const onNavigate = vi.fn();
const onClose = vi.fn();

function renderModal(listParams = {}, applicationId = 42) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { rerender } = render(
    <QueryClientProvider client={queryClient}>
      <ApplicationDetailModal
        applicationId={applicationId}
        listParams={listParams}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );

  /** 이전·다음으로 옮긴 것과 같다. 부모가 id 만 바꿔 다시 그린다. */
  return (nextId: number) =>
    rerender(
      <QueryClientProvider client={queryClient}>
        <ApplicationDetailModal
          applicationId={nextId}
          listParams={listParams}
          onNavigate={onNavigate}
          onClose={onClose}
        />
      </QueryClientProvider>,
    );
}

describe("ApplicationDetailModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getApplicationDetail).mockResolvedValue(detail());
    vi.mocked(api.getAdjacentApplicants).mockResolvedValue({ previousId: null, nextId: 43 });
    vi.mocked(api.getEvaluationSummary).mockResolvedValue(evaluationSummary());
    vi.mocked(api.saveEvaluation).mockResolvedValue(evaluationSummary());
    vi.mocked(publicApi.getColleges).mockResolvedValue([{ id: 1, name: "경영대학" }]);
    vi.mocked(publicApi.getMajors).mockResolvedValue([{ id: 1, collegeId: 1, name: "경영학과" }]);
  });

  it("소속 이름을 collegeId·majorId로 조인해서 보여준다", async () => {
    renderModal();

    expect(await screen.findByText("경영대학 경영학과 2학년")).toBeInTheDocument();
  });

  it("연락처엔 전화번호를, 이메일은 따로 보여준다", async () => {
    // 예전엔 "연락처" 라벨 아래 전화번호 대신 이메일이 나왔다(0831 QA).
    renderModal();

    await screen.findByText("경영대학 경영학과 2학년");
    expect(screen.getByText("010-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("kim@gmail.com")).toBeInTheDocument();
  });

  it("전화번호가 없으면 대시로 보여준다", async () => {
    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({ basicInfo: { ...detail().basicInfo, phoneNumber: null } }),
    );
    renderModal();

    await screen.findByText("경영대학 경영학과 2학년");
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("지원서 내용을 문항별로 보여준다", async () => {
    renderModal();

    expect(await screen.findByText("지원 동기를 작성해주세요")).toBeInTheDocument();
    expect(screen.getByText("금융과 IT의 융합에 관심이 많습니다.")).toBeInTheDocument();
  });

  it("비워 둔 문항은 '답변 없음' 으로 채운다", async () => {
    // 빈 자리로 두면 화면이 깨진 것처럼 보인다.
    renderModal();

    expect(await screen.findByText("답변 없음")).toBeInTheDocument();
  });

  it("객관식 답변은 선택된 선택지의 라벨을 보여준다", async () => {
    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({
        answers: [
          answer({
            questionId: 3,
            order: 3,
            question: "희망 트랙을 선택해주세요",
            type: "CHOICE",
            answerText: null,
            selectedOptions: ["sw"],
            options: [
              { id: "sw", label: "SW 개발" },
              { id: "startup", label: "창업" },
            ],
          }),
        ],
      }),
    );
    renderModal();

    expect(await screen.findByText("SW 개발")).toBeInTheDocument();
  });

  it("체크박스에 동의했으면 '동의함' 을 보여준다", async () => {
    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({
        answers: [
          answer({
            questionId: 4,
            order: 4,
            question: "개인정보 수집 및 이용에 동의해주세요",
            type: "CHECKBOX",
            answerText: null,
            selectedOptions: ["agree"],
            options: [{ id: "agree", label: "동의합니다" }],
          }),
        ],
      }),
    );
    renderModal();

    expect(await screen.findByText("동의함")).toBeInTheDocument();
  });

  it("체크박스에 동의하지 않았으면 '답변 없음' 을 보여준다", async () => {
    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({
        answers: [
          answer({
            questionId: 4,
            order: 4,
            question: "개인정보 수집 및 이용에 동의해주세요",
            type: "CHECKBOX",
            answerText: null,
            selectedOptions: null,
            options: [{ id: "agree", label: "동의합니다" }],
          }),
        ],
      }),
    );
    renderModal();

    expect(await screen.findByText("답변 없음")).toBeInTheDocument();
  });

  it("서버가 개수를 안 주므로(7.5) 카운터는 안 보여준다", async () => {
    renderModal();

    await screen.findByText("지원 동기를 작성해주세요");
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });

  it("이전이 없으면 그쪽으로 넘어갈 수 없다", async () => {
    renderModal();

    await screen.findByText("지원 동기를 작성해주세요");
    expect(screen.getByRole("button", { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /다음/ })).toBeEnabled();
  });

  it("다음을 누르면 서버가 준 id 로 이동한다", async () => {
    renderModal();

    await userEvent.click(await screen.findByRole("button", { name: /다음/ }));

    expect(onNavigate).toHaveBeenCalledWith(43);
  });

  it("순차 탐색에 목록 필터를 그대로 넘겨 조회한다", async () => {
    // 커서 기반 탐색이라 같은 조건에서 계산해야 순서가 목록과 맞는다(명세서 7.5).
    renderModal({ status: "DOC_PASS" });

    await screen.findByText("지원 동기를 작성해주세요");
    expect(api.getApplicationDetail).toHaveBeenCalledWith(42);
    expect(api.getAdjacentApplicants).toHaveBeenCalledWith(42, { status: "DOC_PASS" });
  });

  it("서류 제출 상태면 서류 합·불 버튼을 함께 보여준다", async () => {
    renderModal();

    expect(await screen.findByRole("button", { name: "김지원 서류 합격 처리" })).toBeInTheDocument();
  });

  it("합·불 버튼을 누르면 처리 후 모달을 닫는다", async () => {
    vi.mocked(api.decideApplication).mockResolvedValue({ applicationId: 42, status: "DOC_PASS" });
    renderModal();

    await userEvent.click(await screen.findByRole("button", { name: "김지원 서류 합격 처리" }));

    expect(api.decideApplication).toHaveBeenCalledWith(42, true);
    expect(onClose).toHaveBeenCalled();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getApplicationDetail).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderModal();

    expect(await screen.findByRole("alert")).toHaveTextContent("지원서를 볼 권한이 없습니다.");
  });
});

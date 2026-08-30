import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/application/applicationsApi";
import * as publicApi from "../../apis/public/publicApi";
import type { ApplicationDetail, EvaluationSummary } from "../../types/application";

import { ApplicationDetailModal } from "./ApplicationDetailModal";

vi.mock("../../apis/application/applicationsApi");
vi.mock("../../apis/public/publicApi");

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
    answers: [],
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

/** 상세가 도착한 뒤에 나타난다. */
const scoreBox = (name: string) => screen.findByRole("spinbutton", { name: `${name} 내 점수` });

describe("ApplicationDetailModal - 서류 평가", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getApplicationDetail).mockResolvedValue(detail());
    vi.mocked(api.getAdjacentApplicants).mockResolvedValue({ previousId: null, nextId: 43 });
    vi.mocked(api.getEvaluationSummary).mockResolvedValue(evaluationSummary());
    vi.mocked(api.saveEvaluation).mockResolvedValue(evaluationSummary());
    vi.mocked(publicApi.getColleges).mockResolvedValue([{ id: 1, name: "경영대학" }]);
    vi.mocked(publicApi.getMajors).mockResolvedValue([{ id: 1, collegeId: 1, name: "경영학과" }]);
  });

  it("기존 점수를 채워 수정 모드로 연다", async () => {
    vi.mocked(api.getEvaluationSummary).mockResolvedValue(
      evaluationSummary({
        criteria: [
          {
            criterionId: 1,
            criterionName: "전공 적합성",
            maxScore: 20,
            averageScore: 18,
            myScore: 18,
            evaluatorScores: [{ evaluatorId: 1, evaluatorName: "나", score: 18 }],
          },
          {
            criterionId: 2,
            criterionName: "지원 동기",
            maxScore: 30,
            averageScore: 27,
            myScore: 27,
            evaluatorScores: [{ evaluatorId: 1, evaluatorName: "나", score: 27 }],
          },
        ],
        totalScore: 45,
        evaluatorCount: 1,
        myTotalScore: 45,
      }),
    );
    renderModal();

    expect(await scoreBox("전공 적합성")).toHaveValue(18);
    expect(screen.getByRole("button", { name: "평가 수정" })).toBeInTheDocument();
  });

  it("다른 평가자의 점수와 평균을 함께 보여준다", async () => {
    vi.mocked(api.getEvaluationSummary).mockResolvedValue(
      evaluationSummary({
        criteria: [
          {
            criterionId: 1,
            criterionName: "전공 적합성",
            maxScore: 20,
            averageScore: 16.5,
            myScore: null,
            evaluatorScores: [
              { evaluatorId: 1, evaluatorName: "운영진A", score: 15 },
              { evaluatorId: 2, evaluatorName: "운영진B", score: 18 },
            ],
          },
        ],
      }),
    );
    renderModal();

    expect(await screen.findByText(/운영진A 15점 · 운영진B 18점/)).toBeInTheDocument();
    expect(screen.getByText(/평균 16.5점/)).toBeInTheDocument();
  });

  it("합계를 입력에 맞춰 보여준다", async () => {
    renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "18");
    await userEvent.type(await scoreBox("지원 동기"), "27");

    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("배점을 넘으면 저장할 수 없고 이유를 알려 준다", async () => {
    renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "25");
    await userEvent.type(await scoreBox("지원 동기"), "27");

    expect(screen.getByText(/전공 적합성은\(는\) 0 ~ 20점/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "평가 저장" })).toBeDisabled();
  });

  it("음수도 막는다", async () => {
    renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "-5");
    await userEvent.type(await scoreBox("지원 동기"), "27");

    expect(screen.getByRole("button", { name: "평가 저장" })).toBeDisabled();
  });

  it("빈 칸이 남아 있으면 저장할 수 없다", async () => {
    renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "18");

    expect(screen.getByText("모든 기준에 점수를 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "평가 저장" })).toBeDisabled();
  });

  it("범위 안이면 저장한다 — 모달은 닫지 않는다(합불은 별도 버튼)", async () => {
    renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "18");
    await userEvent.type(await scoreBox("지원 동기"), "27");
    await userEvent.click(screen.getByRole("button", { name: "평가 저장" }));

    expect(api.saveEvaluation).toHaveBeenCalledWith(42, {
      scores: [
        { criterionId: 1, score: 18 },
        { criterionId: 2, score: 27 },
      ],
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("다음 지원자로 넘어가면 앞 사람 점수가 남지 않는다", async () => {
    // 남으면 엉뚱한 사람에게 앞 사람 점수를 저장하게 된다.
    const goTo = renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "18");
    expect(await scoreBox("전공 적합성")).toHaveValue(18);

    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({ id: 43, basicInfo: { ...detail().basicInfo, name: "이준호" } }),
    );
    vi.mocked(api.getEvaluationSummary).mockResolvedValue(evaluationSummary({ applicationId: 43 }));
    goTo(43);

    await screen.findByText("이준호 지원서", { exact: false });
    expect(await scoreBox("전공 적합성")).toHaveValue(null);
  });
});

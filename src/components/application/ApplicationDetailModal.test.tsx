import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/application/applicationsApi";
import type { ApplicationDetail } from "../../types/application";

import { ApplicationDetailModal } from "./ApplicationDetailModal";

vi.mock("../../apis/application/applicationsApi");

function detail(over: Partial<ApplicationDetail> = {}): ApplicationDetail {
  return {
    id: 42,
    applicantName: "김지원",
    email: "kim@gmail.com",
    phoneNumber: "010-1234-5678",
    college: "경영대학",
    major: "경영학과",
    grade: 2,
    status: "SUBMITTED",
    submittedAt: "2026-09-08T12:03:44.000Z",
    answers: [
      {
        questionId: 1,
        order: 1,
        question: "지원 동기를 작성해주세요",
        type: "TEXT",
        answerText: "금융과 IT의 융합에 관심이 많습니다.",
        selectedOptions: null,
      },
      {
        questionId: 2,
        order: 2,
        question: "하고 싶은 프로젝트는?",
        type: "TEXT",
        answerText: null,
        selectedOptions: null,
      },
    ],
    evaluation: {
      evaluated: false,
      totalScore: null,
      scores: [
        { criterionId: 1, name: "전공 적합성", guideline: "가이드", maxScore: 20, score: null },
        { criterionId: 2, name: "지원 동기", guideline: "가이드", maxScore: 30, score: null },
      ],
    },
    navigation: { current: 1, total: 2, prevId: null, nextId: 43 },
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

/** 상세가 도착한 뒤에 나타난다. 동기 조회는 바로 던진다. */
const scoreBox = (name: string) => screen.findByRole("spinbutton", { name: `${name} 점수` });

describe("ApplicationDetailModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getApplicationDetail).mockResolvedValue(detail());
    vi.mocked(api.saveEvaluation).mockResolvedValue();
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

  it("현재 위치와 전체 개수를 보여준다", async () => {
    renderModal();

    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
  });

  it("끝에서는 그쪽으로 넘어갈 수 없다", async () => {
    renderModal();

    await screen.findByText("1 / 2");
    expect(screen.getByRole("button", { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /다음/ })).toBeEnabled();
  });

  it("다음을 누르면 서버가 준 id 로 이동한다", async () => {
    renderModal();

    await userEvent.click(await screen.findByRole("button", { name: /다음/ }));

    expect(onNavigate).toHaveBeenCalledWith(43);
  });

  it("목록 필터를 그대로 넘겨 조회한다", async () => {
    // 커서 기반 탐색이라 같은 조건에서 계산해야 순서가 목록과 맞는다(명세서 7.5).
    renderModal({ status: "DOC_PASS", evaluated: true, keyword: "김" });

    await screen.findByText("1 / 2");
    expect(api.getApplicationDetail).toHaveBeenCalledWith(42, {
      status: "DOC_PASS",
      evaluated: true,
      keyword: "김",
    });
  });

  it("기존 점수를 채워 수정 모드로 연다", async () => {
    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({
        evaluation: {
          evaluated: true,
          totalScore: 45,
          scores: [
            { criterionId: 1, name: "전공 적합성", guideline: "가", maxScore: 20, score: 18 },
            { criterionId: 2, name: "지원 동기", guideline: "가", maxScore: 30, score: 27 },
          ],
        },
      }),
    );
    renderModal();

    expect(await scoreBox("전공 적합성")).toHaveValue(18);
    expect(screen.getByRole("button", { name: "평가 수정" })).toBeInTheDocument();
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

  it("범위 안이면 저장하고 모달을 닫는다", async () => {
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
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getApplicationDetail).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderModal();

    expect(await screen.findByRole("alert")).toHaveTextContent("지원서를 볼 권한이 없습니다.");
  });

  it("다음 지원자로 넘어가면 앞 사람 점수가 남지 않는다", async () => {
    // 남으면 엉뚱한 사람에게 앞 사람 점수를 저장하게 된다.
    vi.mocked(api.getApplicationDetail).mockResolvedValueOnce(detail());
    const goTo = renderModal();

    await userEvent.type(await scoreBox("전공 적합성"), "18");
    expect(await scoreBox("전공 적합성")).toHaveValue(18);

    vi.mocked(api.getApplicationDetail).mockResolvedValue(
      detail({ id: 43, applicantName: "이준호", navigation: { current: 2, total: 2, prevId: 42, nextId: null } }),
    );
    goTo(43);

    await screen.findByText("2 / 2");
    expect(await scoreBox("전공 적합성")).toHaveValue(null);
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/recruitment/recruitmentApi";
import type { CriteriaBoard } from "../../types/recruitment";

import { CriteriaSection } from "./CriteriaSection";

vi.mock("../../apis/recruitment/recruitmentApi");

function board(over: Partial<CriteriaBoard> = {}): CriteriaBoard {
  return {
    criteria: [
      { id: 1, order: 1, name: "전공 적합성", guideline: "가", maxScore: 40 },
      { id: 2, order: 2, name: "지원 동기", guideline: "나", maxScore: 60 },
    ],
    totalScore: 100,
    valid: true,
    ...over,
  };
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <CriteriaSection />
    </QueryClientProvider>,
  );
}

const score = (n: number) => screen.findByRole("spinbutton", { name: `${n}번 기준 배점` });
const saveButton = () => screen.getByRole("button", { name: "저장" });

describe("CriteriaSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getCriteria).mockResolvedValue(board());
    vi.mocked(api.saveCriteria).mockResolvedValue();
  });

  it("기준과 총점을 보여준다", async () => {
    renderSection();

    expect(await screen.findByDisplayValue("전공 적합성")).toBeInTheDocument();
    expect(screen.getByText("총점 100 / 100점")).toBeInTheDocument();
  });

  it("합계가 100 이면 저장할 수 있다", async () => {
    renderSection();

    await screen.findByDisplayValue("전공 적합성");
    expect(saveButton()).toBeEnabled();
  });

  it("합계가 100 이 아니면 저장을 막고 현재 점수를 알려 준다", async () => {
    renderSection();

    await userEvent.clear(await score(1));
    await userEvent.type(await score(1), "30");

    expect(screen.getByText(/배점 합계는 100점이어야 합니다\. \(현재 90점\)/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("기준을 늘려도 합계만 맞으면 저장된다", async () => {
    // 명세서대로 쓰기마다 검증하면 이 흐름이 아예 불가능하다.
    // 40 → 30 으로 줄이고 10점짜리를 더한다. 중간 합계 90 은 화면 안에서만 존재한다.
    renderSection();

    await userEvent.clear(await score(1));
    await userEvent.type(await score(1), "30");
    await userEvent.click(screen.getByRole("button", { name: "+ 기준 추가" }));

    await userEvent.type(screen.getByRole("textbox", { name: "3번 기준 이름" }), "커뮤니케이션");
    await userEvent.clear(await score(3));
    await userEvent.type(await score(3), "10");

    expect(saveButton()).toBeEnabled();
    await userEvent.click(saveButton());

    expect(api.saveCriteria).toHaveBeenCalledWith([
      { id: 1, name: "전공 적합성", guideline: "가", maxScore: 30 },
      { id: 2, name: "지원 동기", guideline: "나", maxScore: 60 },
      { id: undefined, name: "커뮤니케이션", guideline: "", maxScore: 10 },
    ]);
  });

  it("이름이 비면 저장할 수 없다", async () => {
    renderSection();

    await userEvent.clear(await screen.findByRole("textbox", { name: "1번 기준 이름" }));

    expect(screen.getByText("기준 이름을 입력해 주세요.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("배점이 0 이면 저장할 수 없다", async () => {
    renderSection();

    await userEvent.clear(await score(1));
    await userEvent.type(await score(1), "0");

    expect(screen.getByText("배점은 1 이상의 정수여야 합니다.")).toBeInTheDocument();
  });

  it("기준을 지우면 합계가 다시 계산된다", async () => {
    renderSection();

    await userEvent.click(await screen.findByRole("button", { name: "전공 적합성 삭제" }));

    expect(screen.getByText("총점 60 / 100점")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("서버가 합계를 거절하면 그 문구를 그대로 보여준다", async () => {
    // 서버는 현재 점수까지 알려 준다. 그 쪽이 더 쓸모 있다.
    vi.mocked(api.saveCriteria).mockRejectedValue({
      code: "INVALID_CRITERIA_TOTAL",
      message: "평가 기준 배점 합계는 100점이어야 합니다. (현재 110점)",
    });
    renderSection();

    await screen.findByDisplayValue("전공 적합성");
    await userEvent.click(saveButton());

    expect(await screen.findByText(/현재 110점/)).toBeInTheDocument();
  });

  it("저장이 실패해도 초안을 비워 다시 받아온 서버 상태를 보여준다", async () => {
    /*
      saveCriteria 는 요청을 여러 번 나눠 보낸다 — 중간에 하나가 실패하면 서버는 이미
      일부만 반영된 상태다. 실패했다고 쓰던 초안을 그대로 두면 방금 무엇까지 반영됐는지
      모른 채 다시 저장을 누르게 된다.
    */
    vi.mocked(api.saveCriteria).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    const name = await screen.findByDisplayValue("전공 적합성");
    await userEvent.clear(name);
    await userEvent.type(name, "고친 이름");
    await userEvent.click(saveButton());

    // 실패 후에는 다시 조회해 초안(고친 이름)이 아니라 서버 값(원래 이름)을 보여준다.
    expect(await screen.findByDisplayValue("전공 적합성")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("고친 이름")).not.toBeInTheDocument();
    expect(api.getCriteria).toHaveBeenCalledTimes(2);
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getCriteria).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("설정을 볼 권한이 없습니다.");
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { drawFestaWinners, getFestaWinners } from "../../apis/festa/festaAdminApi";
import type { FestaWinner } from "../../types/festa";

import { FestaDrawCard } from "./FestaDrawCard";

vi.mock("../../apis/festa/festaAdminApi");

function winner(over: Partial<FestaWinner> = {}): FestaWinner {
  return {
    drawOrder: 1,
    userId: 7,
    name: "김참여",
    phoneNumber: "010-1234-5678",
    drawnAt: "2026-11-30T10:00:00+09:00",
    ...over,
  };
}

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FestaDrawCard />
    </QueryClientProvider>,
  );
}

const button = (name: string) => screen.getByRole("button", { name });

describe("FestaDrawCard (#412)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("페이지를 여는 것만으로는 당첨자를 부르지 않는다", () => {
    // 당첨자 조회는 볼 때마다 서버에 기록이 남는다.
    renderCard();

    expect(getFestaWinners).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("확인하면 적은 인원으로 추첨하고, 당첨자와 번호를 표로 보여준다", async () => {
    vi.mocked(drawFestaWinners).mockResolvedValue({
      winners: [winner(), winner({ drawOrder: 2, userId: 8, name: "이참여", phoneNumber: null })],
    });
    renderCard();

    await userEvent.clear(screen.getByLabelText("뽑을 인원"));
    await userEvent.type(screen.getByLabelText("뽑을 인원"), "2");
    await userEvent.click(button("추첨하기"));

    expect(vi.mocked(drawFestaWinners).mock.lastCall?.[0]).toEqual({ count: 2 });
    const table = await screen.findByRole("table", { name: "경품 당첨자" });
    expect(within(table).getByText("010-1234-5678")).toBeInTheDocument();
    // 번호를 파기한 뒤에도 당첨 기록은 남는다.
    expect(within(table).getByText("파기됨")).toBeInTheDocument();
  });

  it("확인창에서 취소하면 추첨하지 않는다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderCard();

    await userEvent.click(button("추첨하기"));

    expect(drawFestaWinners).not.toHaveBeenCalled();
  });

  it("인원이 1~50명 밖이면 추첨 버튼을 잠근다", async () => {
    renderCard();

    await userEvent.clear(screen.getByLabelText("뽑을 인원"));
    await userEvent.type(screen.getByLabelText("뽑을 인원"), "51");

    expect(button("추첨하기")).toBeDisabled();
    expect(screen.getByText("1~50명 사이로 입력해 주세요.")).toBeInTheDocument();
  });

  it("투표가 끝나기 전에 누르면 서버가 거절한 이유를 보여준다", async () => {
    vi.mocked(drawFestaWinners).mockRejectedValue({ code: "FESTA_DRAW_BEFORE_END", message: "?" });
    renderCard();

    await userEvent.click(button("추첨하기"));

    expect(await screen.findByRole("alert")).toHaveTextContent("투표가 끝난 뒤에 추첨할 수 있어요.");
  });

  it("'당첨자 보기'로 뽑힌 사람을 보고, '1명 더 뽑기'는 추가 추첨으로 보낸다", async () => {
    vi.mocked(getFestaWinners).mockResolvedValue({ winners: [winner()] });
    vi.mocked(drawFestaWinners).mockResolvedValue({
      winners: [winner(), winner({ drawOrder: 2, userId: 8, name: "이참여" })],
    });
    renderCard();

    await userEvent.click(button("당첨자 보기"));
    expect(await screen.findByText("김참여")).toBeInTheDocument();

    await userEvent.click(button("1명 더 뽑기"));
    expect(vi.mocked(drawFestaWinners).mock.lastCall?.[0]).toEqual({ count: 1, additional: true });
    expect(await screen.findByText("이참여")).toBeInTheDocument();

    await userEvent.click(button("당첨자 숨기기"));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("아직 추첨하지 않았으면 그렇게 알려 준다", async () => {
    vi.mocked(getFestaWinners).mockResolvedValue({ winners: [] });
    renderCard();

    await userEvent.click(button("당첨자 보기"));

    expect(await screen.findByText("아직 추첨하지 않았습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1명 더 뽑기" })).not.toBeInTheDocument();
  });
});

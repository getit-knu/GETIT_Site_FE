import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/festa/festaAdminApi";
import type { FestaResults } from "../../types/festa";

import FestaPage from "./FestaPage";

vi.mock("../../apis/festa/festaAdminApi");

const results: FestaResults = {
  investorCount: 4,
  projects: [
    { projectId: 3, title: "강의실 예약 봇", teamName: "1조", totalAmount: 12_000_000, investorCount: 3 },
    { projectId: 1, title: "동아리 회계 장부", teamName: "2조", totalAmount: 12_000_000, investorCount: 2 },
    { projectId: 4, title: "스터디 매칭", teamName: "3조", totalAmount: 0, investorCount: 0 },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FestaPage mode="investment" />
    </QueryClientProvider>,
  );
}

describe("FestaPage (#365)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getFestaResults).mockResolvedValue(results);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("총액 순서대로 순위·총액·투자자 수를 보여주고, 총액이 같으면 같은 순위다", async () => {
    renderPage();

    const rows = within(await screen.findByRole("table"))
      .getAllByRole("row")
      .slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0].textContent)).toEqual(["1", "1", "3"]);
    expect(within(rows[0]).getByText("1,200만 원")).toBeInTheDocument();
    expect(within(rows[0]).getByText("3명")).toBeInTheDocument();
    expect(screen.getByText("투자자 4명")).toBeInTheDocument();
  });

  it("출전 프로젝트가 없으면 빈 상태를 보여준다", async () => {
    vi.mocked(api.getFestaResults).mockResolvedValue({ investorCount: 0, projects: [] });
    renderPage();
    expect(await screen.findByText(/출전한 프로젝트가 없습니다/)).toBeInTheDocument();
  });

  it("투자자가 없으면 표 위에 안내를 띄운다", async () => {
    vi.mocked(api.getFestaResults).mockResolvedValue({
      investorCount: 0,
      projects: results.projects.map((p) => ({ ...p, totalAmount: 0, investorCount: 0 })),
    });
    renderPage();
    expect(await screen.findByText("아직 투자한 사람이 없습니다.")).toBeInTheDocument();
  });

  it("명단 내려받기 버튼이 CSV 를 받는다", async () => {
    vi.mocked(api.downloadFestaInvestors).mockResolvedValue();
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "참여자 명단 내려받기 (CSV)" }));
    expect(api.downloadFestaInvestors).toHaveBeenCalledTimes(1);
  });

  it("전화번호 파기는 확인을 거치고, 파기한 수를 알려준다", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.mocked(api.destroyFestaPhoneNumbers).mockResolvedValue({ destroyedCount: 4 });
    renderPage();

    const button = await screen.findByRole("button", { name: "전화번호 파기" });
    await userEvent.click(button);
    expect(api.destroyFestaPhoneNumbers).not.toHaveBeenCalled();

    await userEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("4명의 전화번호를 파기했습니다.")).toBeInTheDocument();
  });

  it("토글이 켜져 있어 초기화가 거절되면 끄라고 안내한다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(api.resetFestaInvestments).mockRejectedValue({ code: "FESTA_RESET_WHILE_OPEN", message: "" });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "참여 데이터 초기화" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/토글이 켜져 있어 초기화할 수 없습니다/);
  });
});

describe("FestaPage 득표 집계 (#373)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function renderVotePage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <FestaPage mode="vote" />
      </QueryClientProvider>,
    );
  }

  it("득표수 순서대로 순위를 매기고 전체 투표자 수를 보여준다", async () => {
    vi.mocked(api.getFestaVoteResults).mockResolvedValue({
      voterCount: 7,
      projects: [
        { projectId: 1, title: "강의실 예약 봇", teamName: "1조", voteCount: 4 },
        { projectId: 2, title: "동아리 회계 장부", teamName: "2조", voteCount: 3 },
        { projectId: 3, title: "스터디 매칭", teamName: "3조", voteCount: 0 },
      ],
    });
    renderVotePage();

    const rows = within(await screen.findByRole("table"))
      .getAllByRole("row")
      .slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0].textContent)).toEqual(["1", "2", "3"]);
    expect(within(rows[0]).getByText("4표")).toBeInTheDocument();
    expect(screen.getByText("투표자 7명")).toBeInTheDocument();
    expect(api.getFestaResults).not.toHaveBeenCalled();
  });

  it("투표자가 없으면 표 위에 안내를 띄운다", async () => {
    vi.mocked(api.getFestaVoteResults).mockResolvedValue({
      voterCount: 0,
      projects: [{ projectId: 1, title: "강의실 예약 봇", teamName: "1조", voteCount: 0 }],
    });
    renderVotePage();

    expect(await screen.findByText("아직 투표한 사람이 없습니다.")).toBeInTheDocument();
  });
});

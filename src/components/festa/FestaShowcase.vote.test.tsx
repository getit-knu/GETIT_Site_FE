import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import { getPortfolio, getVote, saveVote } from "../../apis/festa/festaApi";
import { getFestaProjects } from "../../apis/public/publicApi";
import type { Me } from "../../types/auth";
import type { FestaSchedule, FestaVote } from "../../types/festa";
import type { PublicProject } from "../../types/project";
import { NO_PROJECT_DETAILS } from "../../mocks/projectDetails";

import { formatKstDateTime } from "./festaDeadline";
import { FestaShowcase } from "./FestaShowcase";

vi.mock("../../apis/auth/authApi");
vi.mock("../../apis/festa/festaApi");
vi.mock("../../apis/public/publicApi");

function project(id: number): PublicProject {
  return {
    id,
    title: `프로젝트 ${id}`,
    teamName: `TEAM ${id}`,
    semester: "2026-FALL",
    semesterLabel: "2026 Fall",
    description: "",
    techStacks: [],
    codeUrl: "",
    demoUrl: "",
    thumbnailUrl: null,
    ...NO_PROJECT_DETAILS,
    galleryImageUrls: [],
  };
}

function vote(over: Partial<FestaVote> = {}): FestaVote {
  return { projectId: null, maskedPhoneNumber: null, ownProjectIds: [], ...over };
}

function card(title: string) {
  const heading = screen.getByRole("heading", { level: 3, name: title });
  const article = heading.closest("article");
  if (article === null) throw new Error("카드를 찾지 못했다");
  return within(article);
}

function renderShowcase(schedule: FestaSchedule | null = null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FestaShowcase mode="vote" schedule={schedule} />
    </QueryClientProvider>,
  );
}

const voteButton = (title: string) => card(title).getByRole("button", { name: `${title}에 투표` });

describe("FestaShowcase 1인 1팀 투표 (#373)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFestaProjects).mockResolvedValue([project(1), project(2), project(3)]);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("비로그인이면 투표 로그인 버튼만 보여주고 투표 현황은 부르지 않는다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "" });
    renderShowcase();

    expect(await screen.findByRole("link", { name: "구글 로그인하고 투표하기" })).toBeInTheDocument();
    expect(screen.getByText("써 보고 가장 마음에 드는 팀 하나에 투표해 주세요.")).toBeInTheDocument();
    expect(getVote).not.toHaveBeenCalled();
    expect(getPortfolio).not.toHaveBeenCalled();
  });

  it("처음 투표하면 팀 하나를 고르고 번호와 동의를 받아 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue({ role: "GUEST" } as Me);
    vi.mocked(getVote).mockResolvedValue(vote());
    vi.mocked(saveVote).mockResolvedValue(vote({ projectId: 2, maskedPhoneNumber: "010-****-5678" }));
    renderShowcase();

    expect(await screen.findByText("아직 고른 팀이 없어요")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "투표하기" });
    expect(submit).toBeDisabled();

    await userEvent.click(voteButton("프로젝트 1"));
    await userEvent.click(voteButton("프로젝트 2"));
    expect(voteButton("프로젝트 1")).toHaveAttribute("aria-pressed", "false");
    expect(voteButton("프로젝트 2")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("고른 팀")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("추첨 연락처 (휴대전화)"), "01012345678");
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/));
    await userEvent.click(submit);

    expect(saveVote).toHaveBeenCalledWith({ projectId: 2, phoneNumber: "010-1234-5678", privacyConsent: true });
    expect(await screen.findByText("투표했어요.")).toBeInTheDocument();
    expect(screen.getByText("투표한 팀")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "투표 바꾸기" })).toBeInTheDocument();
  });

  it("이미 투표했으면 다른 팀을 골라야 바꿀 수 있고, 번호 없이 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue({ role: "GUEST" } as Me);
    vi.mocked(getVote).mockResolvedValue(vote({ projectId: 1, maskedPhoneNumber: "010-****-5678" }));
    vi.mocked(saveVote).mockResolvedValue(vote({ projectId: 3, maskedPhoneNumber: "010-****-5678" }));
    renderShowcase();

    const change = await screen.findByRole("button", { name: "투표 바꾸기" });
    expect(voteButton("프로젝트 1")).toHaveAttribute("aria-pressed", "true");
    expect(change).toBeDisabled();
    expect(screen.getByText("다른 팀을 고르면 투표를 바꿀 수 있어요.")).toBeInTheDocument();

    await userEvent.click(voteButton("프로젝트 3"));
    await userEvent.click(change);

    expect(saveVote).toHaveBeenCalledWith({ projectId: 3 });
  });

  it("우리 팀 카드는 투표 버튼 대신 안내를 보여준다", async () => {
    vi.mocked(getMe).mockResolvedValue({ role: "MEMBER" } as Me);
    vi.mocked(getVote).mockResolvedValue(vote({ ownProjectIds: [2] }));
    renderShowcase();

    await screen.findByText("아직 고른 팀이 없어요");
    expect(card("프로젝트 2").getByText("우리 팀 프로젝트라 투표할 수 없어요")).toBeInTheDocument();
    expect(card("프로젝트 2").queryByRole("button", { name: /에 투표$/ })).not.toBeInTheDocument();
  });

  it("투표가 거절되면 에러 코드에 맞는 문구를 보여준다", async () => {
    vi.mocked(getMe).mockResolvedValue({ role: "GUEST" } as Me);
    vi.mocked(getVote).mockResolvedValue(vote({ projectId: 1, maskedPhoneNumber: "010-****-5678" }));
    vi.mocked(saveVote).mockRejectedValue({ code: "FESTA_CLOSED", message: "" });
    renderShowcase();

    await screen.findByRole("button", { name: "투표 바꾸기" });
    await userEvent.click(voteButton("프로젝트 2"));
    await userEvent.click(screen.getByRole("button", { name: "투표 바꾸기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("지금은 참여 기간이 아니에요.");
  });

  describe("투표 기간(#379)", () => {
    const HOUR = 3_600_000;
    const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

    it("시작 전이면 투표 버튼과 카드 고르기를 잠그고 언제 시작하는지 알려준다", async () => {
      const startAt = iso(50 * HOUR);
      vi.mocked(getMe).mockResolvedValue({ role: "GUEST" } as Me);
      vi.mocked(getVote).mockResolvedValue(vote({ maskedPhoneNumber: "010-****-5678" }));
      renderShowcase({ startAt, endAt: iso(200 * HOUR) });

      expect(
        await screen.findByText(`투표는 ${formatKstDateTime(Date.parse(startAt))}에 시작해요.`),
      ).toBeInTheDocument();
      expect(screen.getByText(/^투표 시작 D-/)).toBeInTheDocument();
      expect(voteButton("프로젝트 1")).toBeDisabled();
      expect(screen.getByRole("button", { name: "투표하기" })).toBeDisabled();
    });

    it("마감 뒤에는 잠그되 투표한 팀은 그대로 보여준다", async () => {
      vi.mocked(getMe).mockResolvedValue({ role: "GUEST" } as Me);
      vi.mocked(getVote).mockResolvedValue(vote({ projectId: 2, maskedPhoneNumber: "010-****-5678" }));
      renderShowcase({ startAt: iso(-200 * HOUR), endAt: iso(-HOUR) });

      expect(await screen.findByText("투표가 마감됐어요.")).toBeInTheDocument();
      expect(screen.getByText(/^투표 마감 · 3팀 출전$/)).toBeInTheDocument();
      expect(screen.getByText("투표한 팀")).toBeInTheDocument();
      expect(voteButton("프로젝트 2")).toBeDisabled();
      expect(screen.getByRole("button", { name: "투표 바꾸기" })).toBeDisabled();
    });

    it("기간 안이면 마감 D-day를 보여주고 투표할 수 있다", async () => {
      vi.mocked(getMe).mockResolvedValue({ role: "GUEST" } as Me);
      vi.mocked(getVote).mockResolvedValue(vote({ maskedPhoneNumber: "010-****-5678" }));
      renderShowcase({ startAt: iso(-HOUR), endAt: iso(100 * HOUR) });

      await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1에 투표" }));
      expect(screen.getByText(/^투표 마감 D-/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "투표하기" })).toBeEnabled();
    });
  });
});

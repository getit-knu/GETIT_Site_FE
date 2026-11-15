import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import { getPortfolio, savePortfolio } from "../../apis/festa/festaApi";
import { getMyProjects } from "../../apis/project/memberProjectsApi";
import { getFestaProjects } from "../../apis/public/publicApi";
import type { Me, Role } from "../../types/auth";
import type { FestaPortfolio } from "../../types/festa";
import type { MemberProject, PublicProject } from "../../types/project";

import { FestaShowcase } from "./FestaShowcase";

vi.mock("../../apis/auth/authApi");
vi.mock("../../apis/festa/festaApi");
vi.mock("../../apis/project/memberProjectsApi");
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
  };
}

function me(role: Role): Me {
  return {
    id: 1,
    email: "user@getit.com",
    name: "김방문",
    phoneNumber: null,
    college: null,
    major: null,
    studentYear: null,
    studentNumber: null,
    profileImageUrl: null,
    role,
    generationNo: null,
    status: "ACTIVE",
  };
}

function portfolio(over: Partial<FestaPortfolio> = {}): FestaPortfolio {
  return {
    budget: 10_000_000,
    unit: 100_000,
    remaining: 10_000_000,
    maskedPhoneNumber: null,
    investments: [],
    ...over,
  };
}

function renderShowcase() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FestaShowcase />
    </QueryClientProvider>,
  );
}

function card(title: string) {
  const heading = screen.getByRole("heading", { level: 3, name: title });
  const article = heading.closest("article");
  if (article === null) throw new Error("카드를 찾지 못했다");
  return within(article);
}

describe("FestaShowcase 가상 투자 (#364)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFestaProjects).mockResolvedValue([project(1), project(2)]);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("비로그인이면 로그인 버튼을 보여주고, 누르면 쇼케이스로 돌아오도록 경로를 남긴다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "" });
    renderShowcase();

    const login = await screen.findByRole("link", { name: "구글 로그인하고 투자하기" });
    expect(login).toHaveAttribute("href", expect.stringContaining("/oauth2/authorization/google"));
    login.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(login);

    expect(sessionStorage.getItem("getit.loginReturnPath")).toBe("/");
    expect(getPortfolio).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "투자 저장" })).not.toBeInTheDocument();
  });

  it("처음 투자하면 번호와 동의를 받아 금액과 함께 저장한다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("GUEST"));
    vi.mocked(getPortfolio).mockResolvedValue(portfolio());
    vi.mocked(savePortfolio).mockResolvedValue(
      portfolio({
        remaining: 9_800_000,
        maskedPhoneNumber: "010-****-5678",
        investments: [{ projectId: 2, amount: 200_000 }],
      }),
    );
    renderShowcase();

    await screen.findByText(/남은 투자금/);
    const plus = card("프로젝트 2").getByRole("button", { name: "프로젝트 2 투자금 10만 원 더하기" });
    await userEvent.click(plus);
    await userEvent.click(plus);
    expect(screen.getByText("980만 원")).toBeInTheDocument();

    const save = screen.getByRole("button", { name: "투자 저장" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText("추첨 연락처 (휴대전화)"), "01012345678");
    expect(screen.getByText("전화번호 수집·이용에 동의해 주세요.")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/));
    await userEvent.click(save);

    expect(savePortfolio).toHaveBeenCalledWith({
      phoneNumber: "010-1234-5678",
      privacyConsent: true,
      investments: [{ projectId: 2, amount: 200_000 }],
    });
    expect(await screen.findByText("저장했어요.")).toBeInTheDocument();
    expect(screen.getByText("010-****-5678")).toBeInTheDocument();
  });

  it("번호를 이미 냈으면 가린 번호만 보여주고 번호 없이 투자만 바꿔 저장한다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("GUEST"));
    vi.mocked(getPortfolio).mockResolvedValue(
      portfolio({
        remaining: 9_000_000,
        maskedPhoneNumber: "010-****-5678",
        investments: [{ projectId: 1, amount: 1_000_000 }],
      }),
    );
    vi.mocked(savePortfolio).mockResolvedValue(portfolio({ maskedPhoneNumber: "010-****-5678" }));
    renderShowcase();

    expect(await screen.findByText("010-****-5678")).toBeInTheDocument();
    expect(screen.queryByLabelText("추첨 연락처 (휴대전화)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "투자 저장" })).toBeDisabled();

    const input = card("프로젝트 1").getByLabelText("프로젝트 1 투자금(만 원)");
    expect(input).toHaveValue("100");
    await userEvent.clear(input);
    await userEvent.type(input, "35{Enter}");
    expect(input).toHaveValue("30");

    await userEvent.click(screen.getByRole("button", { name: "투자 저장" }));
    expect(savePortfolio).toHaveBeenCalledWith({ investments: [{ projectId: 1, amount: 300_000 }] });
  });

  it("남은 투자금보다 많이 넣을 수 없다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("GUEST"));
    vi.mocked(getPortfolio).mockResolvedValue(
      portfolio({ remaining: 0, investments: [{ projectId: 1, amount: 10_000_000 }] }),
    );
    renderShowcase();

    await screen.findByText(/남은 투자금/);
    expect(card("프로젝트 2").getByRole("button", { name: "프로젝트 2 투자금 10만 원 더하기" })).toBeDisabled();

    const input = card("프로젝트 2").getByLabelText("프로젝트 2 투자금(만 원)");
    await userEvent.type(input, "50{Enter}");
    expect(input).toHaveValue("0");
  });

  it("부원은 우리 조가 낸 프로젝트에 투자할 수 없고, 저장 요청에서도 뺀다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("MEMBER"));
    vi.mocked(getPortfolio).mockResolvedValue(portfolio({ maskedPhoneNumber: "010-****-5678" }));
    vi.mocked(getMyProjects).mockResolvedValue([{ id: 1 } as MemberProject]);
    vi.mocked(savePortfolio).mockResolvedValue(portfolio({ maskedPhoneNumber: "010-****-5678" }));
    renderShowcase();

    await screen.findByText(/남은 투자금/);
    expect(await card("프로젝트 1").findByText("우리 팀 프로젝트라 투자할 수 없어요")).toBeInTheDocument();
    await userEvent.click(card("프로젝트 2").getByRole("button", { name: "프로젝트 2 투자금 10만 원 더하기" }));
    await userEvent.click(screen.getByRole("button", { name: "투자 저장" }));

    expect(savePortfolio).toHaveBeenCalledWith({ investments: [{ projectId: 2, amount: 100_000 }] });
  });

  it("서버가 ownProjectIds 를 주면(BE#228) 그걸로 우리 팀을 가리고 부원 API 는 부르지 않는다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("MEMBER"));
    vi.mocked(getPortfolio).mockResolvedValue(portfolio({ ownProjectIds: [2] }));
    renderShowcase();

    await screen.findByText(/남은 투자금/);
    expect(await card("프로젝트 2").findByText("우리 팀 프로젝트라 투자할 수 없어요")).toBeInTheDocument();
    expect(getMyProjects).not.toHaveBeenCalled();
  });

  it("저장이 거절되면 에러 코드에 맞는 문구를 보여준다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("GUEST"));
    vi.mocked(getPortfolio).mockResolvedValue(portfolio({ maskedPhoneNumber: "010-****-5678" }));
    vi.mocked(savePortfolio).mockRejectedValue({ code: "FESTA_CLOSED", message: "" });
    renderShowcase();

    await screen.findByText(/남은 투자금/);
    await userEvent.click(card("프로젝트 1").getByRole("button", { name: "프로젝트 1 투자금 10만 원 더하기" }));
    await userEvent.click(screen.getByRole("button", { name: "투자 저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("모의투자가 마감되어 더는 바꿀 수 없어요.");
  });

  it("번호 바꾸기를 누르면 새 번호와 동의를 다시 받는다", async () => {
    vi.mocked(getMe).mockResolvedValue(me("GUEST"));
    vi.mocked(getPortfolio).mockResolvedValue(portfolio({ maskedPhoneNumber: "010-****-5678" }));
    renderShowcase();

    await userEvent.click(await screen.findByRole("button", { name: "번호 바꾸기" }));

    expect(screen.getByLabelText("추첨 연락처 (휴대전화)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "투자 저장" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "번호 그대로 두기" }));
    expect(screen.queryByLabelText("추첨 연락처 (휴대전화)")).not.toBeInTheDocument();
  });
});

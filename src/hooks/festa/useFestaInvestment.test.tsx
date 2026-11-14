import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import { getPortfolio, savePortfolio } from "../../apis/festa/festaApi";
import { getMyProjects } from "../../apis/project/memberProjectsApi";
import type { Me } from "../../types/auth";
import type { FestaPortfolio } from "../../types/festa";
import type { MemberProject, PublicProject } from "../../types/project";

import { useFestaInvestment } from "./useFestaInvestment";

vi.mock("../../apis/auth/authApi");
vi.mock("../../apis/festa/festaApi");
vi.mock("../../apis/project/memberProjectsApi");

const projects = [1, 2].map((id) => ({ id }) as PublicProject);

function portfolio(over: Partial<FestaPortfolio> = {}): FestaPortfolio {
  return { budget: 1_000_000, unit: 100_000, remaining: 1_000_000, maskedPhoneNumber: null, investments: [], ...over };
}

function renderInvestment() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useFestaInvestment(projects), { wrapper });
}

async function ready(role: Me["role"], data: FestaPortfolio) {
  vi.mocked(getMe).mockResolvedValue({ role } as Me);
  vi.mocked(getPortfolio).mockResolvedValue(data);
  const hook = renderInvestment();
  await waitFor(() => expect(hook.result.current.phase).toBe("ready"));
  return hook;
}

describe("useFestaInvestment (#364)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("비로그인이면 포트폴리오를 부르지 않는다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "" });
    const { result } = renderInvestment();

    await waitFor(() => expect(result.current.phase).toBe("signedOut"));
    expect(getPortfolio).not.toHaveBeenCalled();
  });

  it("금액은 단위로 내림하고 남은 투자금을 넘지 않는다", async () => {
    const { result } = await ready("GUEST", portfolio({ investments: [{ projectId: 1, amount: 700_000 }] }));

    act(() => result.current.setAmount(2, 250_000));
    expect(result.current.amountOf(2)).toBe(200_000);

    act(() => result.current.setAmount(2, 900_000));
    expect(result.current.amountOf(2)).toBe(300_000);
    expect(result.current.remaining).toBe(0);
  });

  it("처음 저장할 때는 형식에 맞는 번호와 동의가 있어야 저장할 수 있다", async () => {
    const { result } = await ready("GUEST", portfolio());

    act(() => result.current.setAmount(1, 100_000));
    expect(result.current.blockReason).toMatch(/형식/);

    act(() => result.current.contact.setPhone("01012345678"));
    expect(result.current.contact.phone).toBe("010-1234-5678");
    expect(result.current.blockReason).toBe("전화번호 수집·이용에 동의해 주세요.");

    act(() => result.current.contact.setConsent(true));
    expect(result.current.blockReason).toBeNull();
  });

  it("부원은 우리 조 프로젝트를 저장 요청에서 빼고, 번호를 이미 냈으면 번호 없이 보낸다", async () => {
    vi.mocked(getMyProjects).mockResolvedValue([{ id: 1 } as MemberProject]);
    vi.mocked(savePortfolio).mockResolvedValue(portfolio());
    const { result } = await ready(
      "MEMBER",
      portfolio({ maskedPhoneNumber: "010-****-5678", investments: [{ projectId: 1, amount: 100_000 }] }),
    );
    await waitFor(() => expect(result.current.isOwn(1)).toBe(true));

    act(() => result.current.setAmount(2, 300_000));
    act(() => result.current.submit());

    await waitFor(() => expect(savePortfolio).toHaveBeenCalled());
    expect(vi.mocked(savePortfolio).mock.calls[0]?.[0]).toEqual({ investments: [{ projectId: 2, amount: 300_000 }] });
  });
});

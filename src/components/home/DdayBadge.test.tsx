import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { getRecruitmentStatus } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import type { RecruitmentStatus } from "../../types/recruitment";

import { DdayBadge } from "./DdayBadge";

vi.mock("../../apis/public/publicApi");

const SCHEDULE = {
  totalStartAt: "2026-09-01T00:00",
  totalEndAt: "2026-09-30T23:59",
  documentStartAt: "2026-09-01T00:00",
  documentEndAt: "2026-09-10T23:59",
  interviewStartAt: "2026-09-15T00:00",
  interviewEndAt: "2026-09-30T23:59",
};

function status(overrides: Partial<RecruitmentStatus>): RecruitmentStatus {
  return {
    generationNo: 9,
    year: 2026,
    phase: "DOCUMENT_OPEN",
    dDay: 2,
    message: "",
    applyEnabled: true,
    schedule: SCHEDULE,
    ...overrides,
  };
}

/**
 * 조회가 끝났다는 신호.
 *
 * "안 보인다" 를 확인하는 테스트가 **조회가 끝나기도 전에** 통과해 버리면 로직이 어떻든
 * 늘 통과한다(실제로 그랬다 — 배지를 모든 단계에서 띄우도록 고쳐도 통과했다). 배지와
 * 같은 캐시를 보는 표식을 옆에 두고, 그것이 뜬 뒤에 없음을 확인한다.
 */
function Loaded() {
  const { isSuccess } = useQuery({
    queryKey: queryKeys.public.recruitmentStatus(),
    queryFn: getRecruitmentStatus,
  });
  return isSuccess ? <span>조회 완료</span> : null;
}

function renderBadge() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <>
            <DdayBadge />
            <Loaded />
          </>
        ),
      },
    ],
    { initialEntries: ["/"] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("DdayBadge", () => {
  it("접수 중이면 마감까지 남은 일수와 지원하기 링크를 보여준다", async () => {
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ dDay: 2 }));
    renderBadge();

    expect(await screen.findByText("지원 마감까지 D-2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /지원하기/ })).toHaveAttribute("href", "/apply");
  });

  it("접수 시작 전이면 시작까지 남은 일수를 보여준다", async () => {
    /*
      같은 `D-4` 라도 "나흘 뒤에 열린다" 와 "나흘 뒤에 닫힌다" 는 정반대다.
      BE 가 단계마다 다른 마일스톤까지 세어 주므로, 무엇까지인지는 화면이 붙여야 한다.
    */
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ phase: "BEFORE_OPEN", applyEnabled: false, dDay: 4 }));
    renderBadge();

    expect(await screen.findByText("지원 시작까지 D-4")).toBeInTheDocument();
  });

  it("접수 시작 전에는 누를 수 없다", async () => {
    // 아직 낼 수 없다. 눌러서 "안 열렸습니다" 를 보게 하지 않는다.
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ phase: "BEFORE_OPEN", applyEnabled: false, dDay: 4 }));
    renderBadge();

    expect(await screen.findByText("지원 예정")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("접수 기간인데 스위치가 내려가 있으면 누를 수 없다", async () => {
    // 운영진이 일시 중지한 상태(#170). 마감까지 남은 일수는 그대로 알린다.
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ applyEnabled: false, dDay: 2 }));
    renderBadge();

    expect(await screen.findByText("지원 마감까지 D-2")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("지원할 수 없는 동안에는 CTA 가 눌리지 않는다는 것을 보조기기에도 알린다", async () => {
    /*
      링크가 아니어서 눈으로는 비활성인 게 보이지만, 표식이 없으면 스크린리더에는 그냥
      "지원 예정" 이라는 글자로만 읽혀 누를 수 있는 것처럼 들린다.
    */
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ applyEnabled: false, dDay: 2 }));
    renderBadge();

    const cta = await screen.findByText("지원 예정");
    expect(cta).toHaveAttribute("aria-disabled", "true");
    expect(cta).toHaveAttribute("title", "아직 지원할 수 없습니다");
  });

  it("dDay가 0이면 D-DAY로 보여준다", async () => {
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ dDay: 0 }));
    renderBadge();

    expect(await screen.findByText("지원 마감까지 D-DAY")).toBeInTheDocument();
  });

  it("서류 접수가 끝난 단계에서는 배지를 띄우지 않는다", async () => {
    /*
      BE 는 이 단계에서도 dDay 를 준다(면접 시작까지). 그대로 "지원 마감까지" 라고
      붙이면 이미 끝난 지원을 아직 받는 것처럼 보인다.
    */
    vi.mocked(getRecruitmentStatus).mockResolvedValue(
      status({ phase: "DOCUMENT_REVIEW", applyEnabled: false, dDay: 5 }),
    );
    renderBadge();

    await screen.findByText("조회 완료");
    expect(screen.queryByText(/D-/)).not.toBeInTheDocument();
  });

  it("보여줄 단계인데 남은 일수가 없으면 아무것도 보여주지 않는다", async () => {
    /*
      BE 는 이 단계에서 `dDay` 를 항상 채워 주지만(`resolveDDay`), 비어 오면 화면이
      "D-null" 을 그린다. 단계 검사만으로는 이걸 못 막아서 따로 막고 여기서 잠근다.
    */
    vi.mocked(getRecruitmentStatus).mockResolvedValue(
      status({ phase: "BEFORE_OPEN", applyEnabled: false, dDay: null }),
    );
    renderBadge();

    await screen.findByText("조회 완료");
    expect(screen.queryByText(/D-/)).not.toBeInTheDocument();
  });
});

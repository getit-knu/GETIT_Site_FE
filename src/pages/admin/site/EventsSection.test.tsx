import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../apis/site/siteApi";
import type { SiteEvent } from "../../../types/site";

import { EventsSection } from "./EventsSection";

vi.mock("../../../apis/site/siteApi");

const EVENTS: SiteEvent[] = [
  {
    id: 11,
    title: "창업 프로젝트 개발 대회",
    place: "대강당",
    startDate: "2026-09-27",
    endDate: "2026-11-11",
    type: "COMPETITION",
    isVisible: true,
  },
];

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <EventsSection generationId={9} />
    </QueryClientProvider>,
  );
}

describe("EventsSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getEvents).mockResolvedValue(EVENTS);
    vi.mocked(api.deleteEvent).mockResolvedValue();
  });

  it("목록을 보여준다", async () => {
    renderSection();
    expect(await screen.findByText("창업 프로젝트 개발 대회")).toBeInTheDocument();
  });

  it("비공개 행사를 표시한다", async () => {
    vi.mocked(api.getEvents).mockResolvedValue([{ ...EVENTS[0], isVisible: false }]);
    renderSection();
    expect(await screen.findByText("(비공개)")).toBeInTheDocument();
  });

  it("빈 목록은 안내를 보여준다", async () => {
    vi.mocked(api.getEvents).mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText("등록된 행사가 없습니다.")).toBeInTheDocument();
  });

  it("종료일이 시작일보다 빠르면 저장을 막는다", async () => {
    renderSection();
    await screen.findByText("창업 프로젝트 개발 대회");

    await userEvent.click(screen.getByRole("button", { name: "+ 행사 추가" }));
    await userEvent.type(screen.getByLabelText("제목 *"), "새 행사");
    await userEvent.type(screen.getByLabelText("장소 *"), "온라인");
    await userEvent.type(screen.getByLabelText("시작일 *"), "2026-10-05");
    await userEvent.type(screen.getByLabelText("종료일 *"), "2026-10-01");

    expect(screen.getByText("종료일이 시작일보다 빠릅니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("추가는 기수 id 를 실어 보낸다", async () => {
    vi.mocked(api.createEvent).mockResolvedValue({
      id: 20,
      title: "새 행사",
      place: "온라인",
      startDate: "2026-10-01",
      endDate: "2026-10-01",
      type: "EVENT",
      isVisible: true,
    });
    renderSection();
    await screen.findByText("창업 프로젝트 개발 대회");

    await userEvent.click(screen.getByRole("button", { name: "+ 행사 추가" }));
    await userEvent.type(screen.getByLabelText("제목 *"), "새 행사");
    await userEvent.type(screen.getByLabelText("장소 *"), "온라인");
    await userEvent.type(screen.getByLabelText("시작일 *"), "2026-10-01");
    await userEvent.type(screen.getByLabelText("종료일 *"), "2026-10-01");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createEvent).toHaveBeenCalled());
    expect(vi.mocked(api.createEvent).mock.lastCall?.[0]).toMatchObject({ generationId: 9, title: "새 행사" });
  });

  it("삭제는 확인을 묻고, 확인하면 지운다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderSection();
    await screen.findByText("창업 프로젝트 개발 대회");

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(api.deleteEvent).toHaveBeenCalledWith(11);
    vi.unstubAllGlobals();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getEvents).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});

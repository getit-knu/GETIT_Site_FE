import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/site/siteApi";
import type { SiteSettings } from "../../types/site";

import SitePage from "./SitePage";

vi.mock("../../apis/site/siteApi");

const TRACKS = [{ id: 1, name: "SW", subCategories: [{ id: 1, name: "웹기초" }] }];
const CURRICULUMS = [{ id: 1, title: "Python & 데이터 분석", subtitle: "기초부터" }];
const EVENTS = [
  { id: 11, title: "개발 대회", startDate: "2026-09-27", endDate: "2026-11-11", type: "COMPETITION" as const },
];
const FAQS = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시" }];

function settings(over: Partial<SiteSettings> = {}): SiteSettings {
  return {
    generation: { id: 9, generationNo: 9, year: 2026, isActive: true },
    schedule: {
      totalStartAt: "2026-09-01T00:00:00+09:00",
      totalEndAt: "2026-09-30T23:59:00+09:00",
      documentStartAt: "2026-09-01T00:00:00+09:00",
      documentEndAt: "2026-09-10T23:59:00+09:00",
      interviewStartAt: "2026-09-15T00:00:00+09:00",
    },
    tracks: TRACKS,
    curriculums: CURRICULUMS,
    events: EVENTS,
    faqs: FAQS,
    ...over,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SitePage />
    </QueryClientProvider>,
  );
}

const saveButton = () => screen.getByRole("button", { name: "저장하기" });
const lastPayload = () => vi.mocked(api.saveSiteSettings).mock.lastCall?.[0];

describe("SitePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getSiteSettings).mockResolvedValue(settings());
    vi.mocked(api.saveSiteSettings).mockResolvedValue(settings());
  });

  it("기존 기수와 일정을 채운다", async () => {
    renderPage();

    expect(await screen.findByLabelText("기수")).toHaveValue(9);
    expect(screen.getByLabelText("연도")).toHaveValue(2026);
    expect(screen.getByLabelText("전체 모집 시작")).toHaveValue("2026-09-01T00:00");
  });

  it("편집 화면이 없는 섹션도 그대로 되돌려 보낸다", async () => {
    // 10.20 은 화면 전체 상태를 한 트랜잭션으로 반영한다. 빼고 보내면 서버에서 지워진다.
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(saveButton());

    await waitFor(() => expect(api.saveSiteSettings).toHaveBeenCalled());
    expect(lastPayload()).toMatchObject({ curriculums: CURRICULUMS, events: EVENTS, faqs: FAQS });
  });

  it("손대지 않은 강의 분류는 받은 그대로 나간다", async () => {
    // 편집 대상이 됐어도 아무것도 고치지 않았다면 값이 달라지면 안 된다.
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(saveButton());

    await waitFor(() => expect(api.saveSiteSettings).toHaveBeenCalled());
    expect(lastPayload()?.tracks).toEqual(TRACKS);
  });

  it("고친 기수와 일정을 보낸다", async () => {
    renderPage();

    const no = await screen.findByLabelText("기수");
    await userEvent.clear(no);
    await userEvent.type(no, "10");
    await userEvent.click(saveButton());

    await waitFor(() => expect(api.saveSiteSettings).toHaveBeenCalled());
    expect(lastPayload()?.generation).toEqual({ generationNo: 10, year: 2026 });
    // 화면 값은 KST 로 읽어 ISO 로 되돌린다.
    expect(new Date(lastPayload()!.schedule.totalStartAt).toISOString()).toBe("2026-08-31T15:00:00.000Z");
  });

  it("일정이 뒤집히면 저장을 막고 이유를 보여준다", async () => {
    renderPage();

    const end = await screen.findByLabelText("전체 모집 마감");
    await userEvent.clear(end);
    await userEvent.type(end, "2026-08-01T00:00");

    expect(screen.getByText("전체 모집 마감이 시작보다 빠릅니다.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(api.saveSiteSettings).not.toHaveBeenCalled();
  });

  it("기수가 비면 저장을 막는다", async () => {
    renderPage();

    await userEvent.clear(await screen.findByLabelText("기수"));

    expect(screen.getByText("기수는 1 이상의 정수여야 합니다.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("저장에 실패하면 이유를 보여주고 입력을 지우지 않는다", async () => {
    vi.mocked(api.saveSiteSettings).mockRejectedValue({ code: "ACTIVE_GENERATION_EXISTS", message: "?" });
    renderPage();

    const no = await screen.findByLabelText("기수");
    await userEvent.clear(no);
    await userEvent.type(no, "12");
    await userEvent.click(saveButton());

    expect(await screen.findByText(/이미 활성화된 기수가 있습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText("기수")).toHaveValue(12);
  });

  it("저장에 성공하면 알린다", async () => {
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(saveButton());

    expect(await screen.findByText("저장했습니다.")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getSiteSettings).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });

  it("저장한 뒤 값을 고치면 저장 안내가 사라진다", async () => {
    // 남아 있으면 아직 보내지 않은 값을 저장된 것으로 읽는다.
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(saveButton());
    expect(await screen.findByText("저장했습니다.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("기수"), "1");

    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument();
  });

  it("저장에 실패한 뒤 값을 고치면 실패 문구도 사라진다", async () => {
    vi.mocked(api.saveSiteSettings).mockRejectedValue({ code: "ACTIVE_GENERATION_EXISTS", message: "?" });
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(saveButton());
    expect(await screen.findByText(/이미 활성화된 기수가 있습니다/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("기수"), "1");

    expect(screen.queryByText(/이미 활성화된 기수가 있습니다/)).not.toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/site/siteApi";
import type { Generation, SiteSettings } from "../../types/site";

import SitePage from "./SitePage";

vi.mock("../../apis/site/siteApi");

const GENERATION: Generation = { id: 9, generationNo: 9, year: 2026, isActive: true };
const TRACKS = [{ id: 1, name: "SW", subCategories: [{ id: 1, name: "웹기초" }] }];
const FAQS = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시" }];

function settings(over: Partial<SiteSettings> = {}): SiteSettings {
  return {
    schedule: {
      totalStartAt: "2026-09-01T00:00:00+09:00",
      totalEndAt: "2026-09-30T23:59:00+09:00",
      documentStartAt: "2026-09-01T00:00:00+09:00",
      documentEndAt: "2026-09-10T23:59:00+09:00",
      interviewStartAt: "2026-09-15T00:00:00+09:00",
    },
    tracks: TRACKS,
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

const generationSaveButton = () => screen.getByRole("button", { name: "진행 기수 저장" });
const restSaveButton = () => screen.getByRole("button", { name: "저장하기" });
const lastRestPayload = () => vi.mocked(api.saveSiteSettings).mock.lastCall?.[0];

describe("SitePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getGeneration).mockResolvedValue(GENERATION);
    vi.mocked(api.saveGeneration).mockResolvedValue(GENERATION);
    vi.mocked(api.getSiteSettings).mockResolvedValue(settings());
    vi.mocked(api.saveSiteSettings).mockResolvedValue(settings());
    vi.mocked(api.getCurriculums).mockResolvedValue([]);
    vi.mocked(api.getEvents).mockResolvedValue([]);
    vi.mocked(api.getStaffs).mockResolvedValue([]);
    vi.mocked(api.getFeatures).mockResolvedValue([]);
  });

  it("기존 기수와 일정을 채운다", async () => {
    renderPage();

    expect(await screen.findByLabelText("기수")).toHaveValue(9);
    expect(screen.getByLabelText("연도")).toHaveValue(2026);
    expect(screen.getByLabelText("전체 모집 시작")).toHaveValue("2026-09-01T00:00");
  });

  it("고친 기수를 실제 기수와 별개로 즉시 저장한다", async () => {
    // 진행 기수는 나머지 섹션과 다른 엔드포인트로 즉시 반영된다.
    renderPage();

    const no = await screen.findByLabelText("기수");
    await userEvent.clear(no);
    await userEvent.type(no, "10");
    await userEvent.click(generationSaveButton());

    await waitFor(() => expect(api.saveGeneration).toHaveBeenCalled());
    expect(vi.mocked(api.saveGeneration).mock.lastCall?.[0]).toEqual({ generationNo: 10, year: 2026 });
    // 나머지 섹션은 이 클릭으로 저장되지 않는다.
    expect(api.saveSiteSettings).not.toHaveBeenCalled();
  });

  it("기수가 비면 기수 저장만 막는다", async () => {
    renderPage();

    await userEvent.clear(await screen.findByLabelText("기수"));

    expect(screen.getByText("기수는 1 이상의 정수여야 합니다.")).toBeInTheDocument();
    expect(generationSaveButton()).toBeDisabled();
    // 일정 · 강의 분류 저장은 기수와 무관하다.
    expect(restSaveButton()).not.toBeDisabled();
  });

  it("기수 저장에 실패하면 이유를 보여주고 입력을 지우지 않는다", async () => {
    vi.mocked(api.saveGeneration).mockRejectedValue({ code: "ACTIVE_GENERATION_EXISTS", message: "?" });
    renderPage();

    const no = await screen.findByLabelText("기수");
    await userEvent.clear(no);
    await userEvent.type(no, "12");
    await userEvent.click(generationSaveButton());

    expect(await screen.findByText(/이미 활성화된 기수가 있습니다/)).toBeInTheDocument();
    expect(screen.getByLabelText("기수")).toHaveValue(12);
  });

  it("손대지 않은 강의 분류 · FAQ 는 받은 그대로 나간다", async () => {
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(restSaveButton());

    await waitFor(() => expect(api.saveSiteSettings).toHaveBeenCalled());
    expect(lastRestPayload()).toMatchObject({ tracks: TRACKS, faqs: FAQS });
  });

  it("고친 일정을 KST 로 읽어 ISO 로 보낸다", async () => {
    renderPage();

    const start = await screen.findByLabelText("전체 모집 시작");
    await userEvent.clear(start);
    await userEvent.type(start, "2026-09-01T00:00");
    await userEvent.click(restSaveButton());

    await waitFor(() => expect(api.saveSiteSettings).toHaveBeenCalled());
    expect(new Date(lastRestPayload()!.schedule.totalStartAt).toISOString()).toBe("2026-08-31T15:00:00.000Z");
  });

  it("일정이 뒤집히면 저장을 막고 이유를 보여준다", async () => {
    renderPage();

    const end = await screen.findByLabelText("전체 모집 마감");
    await userEvent.clear(end);
    await userEvent.type(end, "2026-08-01T00:00");

    expect(screen.getByText("전체 모집 마감이 시작보다 빠릅니다.")).toBeInTheDocument();
    expect(restSaveButton()).toBeDisabled();
    expect(api.saveSiteSettings).not.toHaveBeenCalled();
  });

  it("저장에 성공하면 알린다", async () => {
    renderPage();
    await screen.findByLabelText("기수");

    await userEvent.click(restSaveButton());

    expect(await screen.findByText("저장했습니다.")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getSiteSettings).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });

  it("고친 강의 분류가 저장에 실린다", async () => {
    renderPage();

    await userEvent.type(await screen.findByLabelText("대분류 이름 SW"), "!");
    await userEvent.click(restSaveButton());

    await waitFor(() => expect(api.saveSiteSettings).toHaveBeenCalled());
    expect(lastRestPayload()?.tracks[0].name).toBe("SW!");
    // 저장은 한 번이다.
    expect(api.saveSiteSettings).toHaveBeenCalledTimes(1);
  });

  it("어느 섹션이든 막히면 저장을 막는다", async () => {
    renderPage();

    // 강의 분류 쪽 이유
    await userEvent.clear(await screen.findByLabelText("대분류 이름 SW"));
    expect(screen.getByText("이름이 비어 있는 대분류가 있습니다.")).toBeInTheDocument();
    expect(restSaveButton()).toBeDisabled();
  });

  it("섹션 8개로 이동하는 네비게이션을 렌더링한다", async () => {
    renderPage();
    await screen.findByLabelText("기수");

    const nav = screen.getByRole("navigation", { name: "사이트 관리 섹션 바로가기" });
    const sectionIds = ["generation", "schedule", "tracks", "faqs", "curriculums", "events", "staffs", "features"];

    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(sectionIds.length);
    for (const id of sectionIds) {
      expect(links.some((link) => link.getAttribute("href") === `#${id}`)).toBe(true);
      expect(document.getElementById(id)).toBeInTheDocument();
    }
  });
});

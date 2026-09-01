import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/site/siteApi";
import * as recruitmentApi from "../../apis/recruitment/recruitmentApi";
import type { Generation, SiteTrack } from "../../types/site";
import type { RecruitmentSchedule } from "../../types/recruitment";

import SitePage from "./SitePage";

vi.mock("../../apis/site/siteApi");
vi.mock("../../apis/recruitment/recruitmentApi");

const GENERATION: Generation = { id: 9, generationNo: 9, year: 2026, isActive: true };
const TRACKS: SiteTrack[] = [
  { id: 1, name: "SW", order: 1, subCategories: [{ id: 1, name: "웹기초", order: 1, lectureCount: 0 }] },
];

/**
 * 모집 일정은 모집 관리(`ApplicationsPage`)와 같은 도메인이다 — 사이트 관리 전용
 * fixture를 따로 두지 않고 `ScheduleSection.test.tsx`와 같은 형태를 쓴다.
 */
function schedule(over: Partial<RecruitmentSchedule> = {}): RecruitmentSchedule {
  return {
    generationId: 9,
    generationNo: 9,
    year: 2026,
    totalStartAt: "2026-09-01T00:00:00+09:00",
    totalEndAt: "2026-09-30T23:59:00+09:00",
    documentStartAt: "2026-09-01T00:00:00+09:00",
    documentEndAt: "2026-09-10T23:59:00+09:00",
    interviewStartAt: "2026-09-15T00:00:00+09:00",
    interviewEndAt: "2026-09-30T23:59:00+09:00",
    applyEnabled: true,
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
const scheduleSaveButton = () => screen.getByRole("button", { name: "저장" });
const tracksSaveButton = () => screen.getByRole("button", { name: "강의 분류 저장" });
const lastTracksPayload = () => vi.mocked(api.saveTracks).mock.lastCall?.[0];

describe("SitePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getGeneration).mockResolvedValue(GENERATION);
    vi.mocked(api.saveGeneration).mockResolvedValue(GENERATION);
    vi.mocked(recruitmentApi.getSchedule).mockResolvedValue(schedule());
    vi.mocked(recruitmentApi.saveSchedule).mockResolvedValue(schedule());
    vi.mocked(api.getTracks).mockResolvedValue(TRACKS);
    vi.mocked(api.saveTracks).mockResolvedValue(undefined);
    vi.mocked(api.getCurriculums).mockResolvedValue([]);
    vi.mocked(api.getEvents).mockResolvedValue([]);
    vi.mocked(api.getStaffs).mockResolvedValue([]);
    vi.mocked(api.getFeatures).mockResolvedValue([]);
    vi.mocked(api.getFaqs).mockResolvedValue([]);
    vi.mocked(api.getActivityPhotos).mockResolvedValue([]);
  });

  it("기존 기수와 일정을 채운다", async () => {
    renderPage();

    expect(await screen.findByLabelText("기수")).toHaveValue(9);
    expect(screen.getByLabelText("연도")).toHaveValue(2026);
    expect(await screen.findByLabelText("전체 시작")).toHaveValue("2026-09-01T00:00");
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
    expect(recruitmentApi.saveSchedule).not.toHaveBeenCalled();
  });

  it("기수가 비면 기수 저장만 막는다", async () => {
    renderPage();
    await screen.findByLabelText("대분류 이름 SW");

    await userEvent.clear(await screen.findByLabelText("기수"));

    expect(screen.getByText("기수는 1 이상의 정수여야 합니다.")).toBeInTheDocument();
    expect(generationSaveButton()).toBeDisabled();
    // 모집 일정 · 강의 분류 저장은 기수와 무관하다.
    expect(scheduleSaveButton()).not.toBeDisabled();
    expect(tracksSaveButton()).not.toBeDisabled();
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

  it("모집 일정을 실제 모집 관리 API로 저장한다", async () => {
    // 사이트 관리·모집 관리에 따로 있던 "모집 일정"이 서로 안 맞던 문제 때문에
    // 같은 도메인(recruitmentApi)을 쓰도록 합쳤다 — 그 연동 자체를 확인한다.
    renderPage();
    await screen.findByLabelText("전체 시작");

    await userEvent.click(scheduleSaveButton());

    await waitFor(() => expect(recruitmentApi.saveSchedule).toHaveBeenCalled());
  });

  it("모집이 이미 시작됐어도 모집 관리와 똑같이 일정을 계속 수정할 수 있다", async () => {
    // BE는 시간 기준 잠금을 두지 않는다(RecruitmentScheduleService.updateSchedule 확인함).
    vi.mocked(recruitmentApi.getSchedule).mockResolvedValue(schedule({ totalStartAt: "2020-01-01T00:00:00+09:00" }));
    renderPage();

    expect(await screen.findByLabelText("전체 시작")).toBeEnabled();
    expect(scheduleSaveButton()).toBeEnabled();
  });

  it("손대지 않은 강의 분류는 받은 그대로 나간다", async () => {
    renderPage();
    await screen.findByLabelText("대분류 이름 SW");

    await userEvent.click(tracksSaveButton());

    await waitFor(() => expect(api.saveTracks).toHaveBeenCalled());
    expect(lastTracksPayload()).toEqual([{ id: 1, name: "SW", subCategories: [{ id: 1, name: "웹기초" }] }]);
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getGeneration).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });

  it("고친 강의 분류가 저장에 실린다", async () => {
    renderPage();

    await userEvent.type(await screen.findByLabelText("대분류 이름 SW"), "!");
    await userEvent.click(tracksSaveButton());

    await waitFor(() => expect(api.saveTracks).toHaveBeenCalled());
    expect(lastTracksPayload()?.[0].name).toBe("SW!");
    // 저장은 한 번이다.
    expect(api.saveTracks).toHaveBeenCalledTimes(1);
  });

  it("강의 분류 이름이 비면 강의 분류 저장만 막는다", async () => {
    renderPage();

    await userEvent.clear(await screen.findByLabelText("대분류 이름 SW"));
    expect(screen.getByText("이름이 비어 있는 대분류가 있습니다.")).toBeInTheDocument();
    expect(tracksSaveButton()).toBeDisabled();
    // 모집 일정 저장은 강의 분류와 무관하다.
    expect(scheduleSaveButton()).not.toBeDisabled();
  });

  it("활성 기수가 없으면 오류 화면 대신 빈 기수 등록 폼을 보여준다", async () => {
    // 배포 직후처럼 활성 기수가 하나도 없는 상태 — BE가 404로 응답한다.
    vi.mocked(api.getGeneration).mockRejectedValue({ code: "ACTIVE_GENERATION_NOT_FOUND", message: "?" });
    renderPage();

    expect(await screen.findByLabelText("기수")).toHaveValue(null);
    expect(screen.getByLabelText("연도")).toHaveValue(null);
    expect(screen.getByText(/아직 진행 중인 기수가 없습니다/)).toBeInTheDocument();
    // 페이지 전체가 오류로 막히지 않는다 — 나머지 폼도 그대로 뜬다.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await screen.findByLabelText("전체 시작");
    expect(scheduleSaveButton()).toBeInTheDocument();
  });

  it("활성 기수가 없으면 기수에 딸린 섹션(커리큘럼·행사·운영진)은 숨기고 나머지는 그대로 둔다", async () => {
    vi.mocked(api.getGeneration).mockRejectedValue({ code: "ACTIVE_GENERATION_NOT_FOUND", message: "?" });
    renderPage();

    await screen.findByLabelText("기수");
    expect(document.getElementById("curriculums")).not.toBeInTheDocument();
    expect(document.getElementById("events")).not.toBeInTheDocument();
    expect(document.getElementById("staffs")).not.toBeInTheDocument();
    expect(api.getCurriculums).not.toHaveBeenCalled();
    // 기수와 무관한 섹션은 계속 뜬다.
    expect(document.getElementById("features")).toBeInTheDocument();
  });

  it("활성 기수가 없을 때 저장하면 새 기수를 만든다", async () => {
    vi.mocked(api.getGeneration).mockRejectedValue({ code: "ACTIVE_GENERATION_NOT_FOUND", message: "?" });
    renderPage();

    await userEvent.type(await screen.findByLabelText("기수"), "9");
    await userEvent.type(screen.getByLabelText("연도"), "2026");
    await userEvent.click(generationSaveButton());

    await waitFor(() => expect(api.saveGeneration).toHaveBeenCalled());
    expect(vi.mocked(api.saveGeneration).mock.lastCall?.[0]).toEqual({ generationNo: 9, year: 2026 });
  });

  it("섹션 9개로 이동하는 네비게이션을 렌더링한다", async () => {
    renderPage();
    await screen.findByLabelText("기수");

    const nav = screen.getByRole("navigation", { name: "사이트 관리 섹션 바로가기" });
    const sectionIds = [
      "generation",
      "schedule",
      "tracks",
      "faqs",
      "curriculums",
      "events",
      "staffs",
      "activity-photos",
      "features",
    ];

    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(sectionIds.length);
    for (const id of sectionIds) {
      expect(links.some((link) => link.getAttribute("href") === `#${id}`)).toBe(true);
      expect(document.getElementById(id)).toBeInTheDocument();
    }
  });
});

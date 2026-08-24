import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/recruitment/recruitmentApi";
import type { RecruitmentSchedule } from "../../types/recruitment";

import { ScheduleSection } from "./ScheduleSection";

vi.mock("../../apis/recruitment/recruitmentApi");

function schedule(over: Partial<RecruitmentSchedule> = {}): RecruitmentSchedule {
  return {
    generationId: 9,
    generationNo: 9,
    year: 2026,
    totalStartAt: "2026-09-01T00:00",
    totalEndAt: "2026-09-30T23:59",
    documentStartAt: "2026-09-01T00:00",
    documentEndAt: "2026-09-10T23:59",
    interviewStartAt: "2026-09-15T00:00",
    interviewEndAt: "2026-09-30T23:59",
    ...over,
  };
}

function renderSection(locked = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ScheduleSection locked={locked} />
    </QueryClientProvider>,
  );
}

const saveButton = () => screen.getByRole("button", { name: "저장" });

/** 라벨로 일정 칸을 찾아 값을 바꾼다. */
async function setField(label: RegExp, value: string) {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  await userEvent.type(box, value);
}

describe("ScheduleSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getSchedule).mockResolvedValue(schedule());
    vi.mocked(api.saveSchedule).mockResolvedValue(schedule());
  });

  it("올바른 일정은 저장할 수 있다", async () => {
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    expect(saveButton()).toBeEnabled();
  });

  it("면접이 전체 종료보다 늦으면 저장을 막는다", async () => {
    // 전체 기간 밖으로 나가면 공개 사이트의 단계 표기가 어긋난다.
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    await setField(/면접 시작/, "2026-10-05T00:00");

    expect(screen.getByText("면접은 전체 종료 안에 시작해야 합니다.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("서류 접수가 전체 시작보다 빠르면 저장을 막는다", async () => {
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    await setField(/서류 접수 시작|서류 시작/, "2026-08-01T00:00");

    expect(screen.getByText("서류 접수는 전체 시작 뒤에 열려야 합니다.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("전체 종료가 시작보다 빠르면 저장을 막는다", async () => {
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    await setField(/전체 (모집 )?종료|전체 마감/, "2026-08-01T00:00");

    expect(saveButton()).toBeDisabled();
  });

  it("면접이 서류 마감보다 빠르면 저장을 막는다", async () => {
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    await setField(/면접 시작/, "2026-09-05T00:00");

    expect(screen.getByText("면접은 서류 마감 뒤에 시작해야 합니다.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });
});

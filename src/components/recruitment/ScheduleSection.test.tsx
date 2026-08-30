import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/recruitment/recruitmentApi";
import type { RecruitmentSchedule } from "../../types/recruitment";

import { ScheduleSection } from "./ScheduleSection";

vi.mock("../../apis/recruitment/recruitmentApi");

/**
 * 실제 BE는 오프셋 붙은 ISO 8601(`date-time`)을 준다. `datetime-local` 이 바로 받는
 * 형태(초·오프셋 없음)로 목을 만들면 화면의 KST 변환 누락 버그가 감춰진다 — 실제
 * 계약대로 초·오프셋을 갖춰 둔다.
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

  it("서버가 준 오프셋 붙은 일시를 KST datetime-local 값으로 채운다", async () => {
    // 오프셋을 그대로 넣으면 <input type="datetime-local">은 형식 불일치로 빈 칸을 보여준다.
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    expect(screen.getByLabelText("전체 시작")).toHaveValue("2026-09-01T00:00");
    expect(screen.getByLabelText("면접 시작")).toHaveValue("2026-09-15T00:00");
  });

  it("고친 일정을 KST로 읽어 오프셋 붙은 ISO로 저장한다", async () => {
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    // 면접 시작을 하루 늦춰도 다른 필드와의 순서 제약엔 걸리지 않는 값을 고른다.
    await setField(/면접 시작/, "2026-09-20T00:00");
    await userEvent.click(saveButton());

    const payload = vi.mocked(api.saveSchedule).mock.lastCall?.[0];
    expect(new Date(payload!.interviewStartAt).toISOString()).toBe("2026-09-19T15:00:00.000Z");
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

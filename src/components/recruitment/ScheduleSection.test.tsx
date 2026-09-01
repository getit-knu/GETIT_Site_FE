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
    applyEnabled: true,
    ...over,
  };
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ScheduleSection />
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

  describe("아직 모집 일정을 저장한 적 없는 기수", () => {
    // 새 기수를 막 활성화한 직후처럼 이 기수의 일정을 한 번도 저장한 적 없으면
    // 조회 자체가 404 SCHEDULE_NOT_FOUND 다(BE 확인함) — 오류가 아니라 정상 상태다.
    beforeEach(() => {
      vi.mocked(api.getSchedule).mockRejectedValue({ code: "SCHEDULE_NOT_FOUND", message: "?" });
    });

    it("오류 화면 대신 빈 입력 폼을 보여준다", async () => {
      renderSection();

      expect(
        await screen.findByText("아직 설정된 모집 일정이 없습니다. 입력하고 저장하면 새로 만들어집니다."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByLabelText("전체 시작")).toHaveValue("");
      // 기수 번호 · 연도는 이 응답에 안 실려 온다(BE 확인함) — 일반 제목으로 대체한다.
      expect(screen.getByRole("heading", { name: "모집 일정" })).toBeInTheDocument();
    });

    it("빈 채로는 저장할 수 없다", async () => {
      renderSection();
      await screen.findByLabelText("전체 시작");

      expect(screen.getByText("모든 일정을 입력해 주세요.")).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it("값을 다 채우면 저장할 수 있고, PUT이 새로 만든다", async () => {
      renderSection();
      await screen.findByLabelText("전체 시작");

      for (const [label, value] of [
        [/^전체 시작/, "2026-09-01T00:00"],
        [/^전체 종료/, "2026-09-30T23:59"],
        [/^서류 시작/, "2026-09-01T00:00"],
        [/^서류 마감/, "2026-09-10T23:59"],
        [/^면접 시작/, "2026-09-15T00:00"],
      ] as const) {
        await userEvent.type(screen.getByLabelText(label), value);
      }

      expect(saveButton()).toBeEnabled();
      await userEvent.click(saveButton());

      await vi.waitFor(() => expect(api.saveSchedule).toHaveBeenCalled());
      const payload = vi.mocked(api.saveSchedule).mock.lastCall?.[0];
      expect(new Date(payload!.totalStartAt).toISOString()).toBe("2026-08-31T15:00:00.000Z");
    });
  });

  it("SCHEDULE_NOT_FOUND가 아닌 다른 실패는 그대로 오류 화면으로 막는다", async () => {
    vi.mocked(api.getSchedule).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
    expect(screen.queryByLabelText("전체 시작")).not.toBeInTheDocument();
  });

  it("모집이 이미 시작됐어도 일정을 계속 수정할 수 있다", async () => {
    // BE는 시간 기준 잠금을 두지 않는다(RecruitmentScheduleService.updateSchedule 확인함) —
    // 화면에서 임의로 막으면 시작 뒤 마감을 늘리는 등 정상적인 관리 작업도 못 하게 된다.
    renderSection();
    await screen.findByRole("button", { name: "저장" });

    expect(screen.getByLabelText("전체 시작")).toBeEnabled();
    expect(saveButton()).toBeEnabled();
  });
});

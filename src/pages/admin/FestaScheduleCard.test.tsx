import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFestaSchedule, updateFestaSchedule } from "../../apis/festa/festaAdminApi";

import { FestaScheduleCard } from "./FestaScheduleCard";

vi.mock("../../apis/festa/festaAdminApi");

const SAVED = { startAt: "2026-11-23T10:00:00+09:00", endAt: "2026-11-30T00:00:00+09:00" };

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FestaScheduleCard />
    </QueryClientProvider>,
  );
}

async function fill(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

describe("FestaScheduleCard (#379)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("저장된 기간을 한국 시간 입력값으로 보여준다", async () => {
    vi.mocked(getFestaSchedule).mockResolvedValue(SAVED);
    renderCard();

    expect(await screen.findByLabelText("시작")).toHaveValue("2026-11-23T10:00");
    expect(screen.getByLabelText("종료")).toHaveValue("2026-11-30T00:00");
    expect(screen.getByRole("button", { name: "투표 기간 저장" })).toBeDisabled();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("정하지 않았으면 토글만으로 투표를 받는다고 안내하고, 입력한 한국 시간을 UTC ISO 로 보낸다", async () => {
    vi.mocked(getFestaSchedule).mockResolvedValue({ startAt: null, endAt: null });
    vi.mocked(updateFestaSchedule).mockResolvedValue(SAVED);
    renderCard();

    expect(await screen.findByRole("note")).toHaveTextContent("토글이 켜져 있는 동안 계속 투표를 받습니다");
    await fill("시작", "2026-11-23T10:00");
    expect(screen.getByText("시작과 종료 시각을 모두 정해 주세요.")).toBeInTheDocument();
    await fill("종료", "2026-11-30T00:00");
    await userEvent.click(screen.getByRole("button", { name: "투표 기간 저장" }));

    expect(vi.mocked(updateFestaSchedule).mock.calls[0]?.[0]).toEqual({
      startAt: "2026-11-23T01:00:00.000Z",
      endAt: "2026-11-29T15:00:00.000Z",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("투표 기간을 저장했습니다.");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("종료가 시작보다 앞서거나 같으면 저장할 수 없다", async () => {
    vi.mocked(getFestaSchedule).mockResolvedValue(SAVED);
    renderCard();

    await screen.findByLabelText("시작");
    await fill("종료", "2026-11-23T10:00");

    expect(screen.getByText("종료 시각은 시작 시각보다 뒤여야 합니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "투표 기간 저장" })).toBeDisabled();
  });

  it("서버가 거절하면 에러 코드에 맞는 문구를 보여준다", async () => {
    vi.mocked(getFestaSchedule).mockResolvedValue(SAVED);
    vi.mocked(updateFestaSchedule).mockRejectedValue({ code: "INVALID_FESTA_SCHEDULE", message: "" });
    renderCard();

    await screen.findByLabelText("시작");
    await fill("종료", "2026-11-29T18:00");
    await userEvent.click(screen.getByRole("button", { name: "투표 기간 저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("종료 시각은 시작 시각보다 뒤여야 합니다.");
  });
});

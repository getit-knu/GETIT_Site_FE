import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DdayBadge } from "./DdayBadge";

// mocks/recruitment/recruitment.ts 의 documentStartAt~documentEndAt: 2026-09-01 ~ 2026-09-10 23:59.

function renderBadge() {
  const router = createMemoryRouter([{ path: "/", element: <DdayBadge /> }], { initialEntries: ["/"] });
  return render(<RouterProvider router={router} />);
}

describe("DdayBadge", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("서류 접수 기간 전에는 아무것도 보여주지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T12:00"));

    renderBadge();

    expect(screen.queryByText("지원하기")).not.toBeInTheDocument();
  });

  it("서류 접수 기간이 지나면 아무것도 보여주지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T00:00"));

    renderBadge();

    expect(screen.queryByText("지원하기")).not.toBeInTheDocument();
  });

  it("서류 접수 기간 안이면 남은 일수와 함께 지원하기 링크를 보여준다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T09:00"));

    renderBadge();

    expect(screen.getByText("D-2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /지원하기/ })).toHaveAttribute("href", "/apply");
  });

  it("마감 당일에는 시각과 무관하게 D-DAY로 보여준다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T08:00"));

    renderBadge();

    expect(screen.getByText("D-DAY")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState, TableSkeleton } from "./States";

describe("TableSkeleton", () => {
  it("요청한 행·열 수만큼 자리를 잡는다", () => {
    render(<TableSkeleton rows={3} columns={4} />);

    const status = screen.getByRole("status", { name: "불러오는 중" });
    expect(status.querySelectorAll("span")).toHaveLength(12);
  });

  it("로딩 중임을 읽을 수 있게 알린다", () => {
    render(<TableSkeleton columns={2} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("오류는 alert 로 알린다", () => {
    // 화면을 보고 있지 않아도 실패했다는 것이 전달돼야 한다.
    render(<ErrorState message="목록을 불러오지 못했습니다." />);

    expect(screen.getByRole("alert")).toHaveTextContent("목록을 불러오지 못했습니다.");
  });

  it("재시도 핸들러를 주지 않으면 버튼을 그리지 않는다", () => {
    render(<ErrorState message="실패" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("재시도 버튼을 누르면 핸들러를 부른다", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="실패" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("EmptyState", () => {
  it("메시지를 보여준다", () => {
    render(<EmptyState message="등록된 질문이 없습니다." />);

    expect(screen.getByText("등록된 질문이 없습니다.")).toBeInTheDocument();
  });

  it("빈 상태는 오류가 아니므로 alert 로 알리지 않는다", () => {
    render(<EmptyState message="없음" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("액션을 넘기면 함께 그린다", () => {
    render(<EmptyState message="없음" action={<button type="button">추가하기</button>} />);

    expect(screen.getByRole("button", { name: "추가하기" })).toBeInTheDocument();
  });
});

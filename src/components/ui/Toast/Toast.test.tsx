import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toast } from "./Toast";

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("메시지를 알림으로 읽어준다", () => {
    render(<Toast message="저장했습니다." onClose={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("저장했습니다.");
  });

  it("action 이 없으면 버튼은 닫기뿐이다", () => {
    render(<Toast message="저장했습니다." onClose={vi.fn()} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
  });

  it("action 을 누르면 그 동작을 실행한다", async () => {
    const onClick = vi.fn();
    render(<Toast message="제출할까요?" action={{ label: "제출", onClick }} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "제출" }));

    expect(onClick).toHaveBeenCalled();
  });

  it("되묻는 버튼에 바로 포커스를 준다", () => {
    // 키보드만 쓰는 사람도 곧바로 답할 수 있어야 한다.
    render(<Toast message="제출할까요?" action={{ label: "제출", onClick: vi.fn() }} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "제출" })).toHaveFocus();
  });

  it("닫기를 누르면 닫는다", async () => {
    const onClose = vi.fn();
    render(<Toast message="저장했습니다." onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("시간이 지나면 저절로 닫힌다", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="제출할까요?" onClose={onClose} duration={5000} />);

    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);

    expect(onClose).toHaveBeenCalled();
  });

  it("저절로 닫히기 전에 사라지면 타이머를 걷는다", () => {
    // 남은 타이머가 이미 없는 화면의 상태를 건드리면 안 된다.
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="제출할까요?" onClose={onClose} duration={5000} />);

    unmount();
    vi.advanceTimersByTime(5000);

    expect(onClose).not.toHaveBeenCalled();
  });
});

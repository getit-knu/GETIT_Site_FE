import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toast } from "./Toast";

/** 부모가 매 렌더 새 `onClose` 를 넘기는 실제 사용처(`ApplyForm`)와 같은 모양. */
function Harness({ onClose }: { onClose: () => void }) {
  const [, setTick] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setTick((tick) => tick + 1)}>
        부모 리렌더
      </button>
      <Toast message="제출할까요?" onClose={() => onClose()} duration={5000} />
    </>
  );
}

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

  it("부모가 다시 그려도 duration 이 지나면 닫는다", () => {
    // 부모가 인라인 함수를 넘기면 리렌더마다 onClose 가 새 함수가 된다. 그때 타이머를
    // 다시 걸면 리렌더가 잦을수록 토스트가 안 닫힌다.
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole("button", { name: "부모 리렌더" }));
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
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

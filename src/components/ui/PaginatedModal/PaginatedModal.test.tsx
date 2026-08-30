import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PaginatedModal } from "./PaginatedModal";

function renderModal(over: Partial<Parameters<typeof PaginatedModal>[0]> = {}) {
  const props = {
    title: "지원서 상세",
    onClose: vi.fn(),
    current: 2,
    total: 5,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    children: <p>내용</p>,
    ...over,
  };
  render(<PaginatedModal {...props} />);
  return props;
}

describe("PaginatedModal", () => {
  it("다이얼로그가 제목으로 이름을 갖는다", () => {
    // aria-labelledby 가 끊기면 보조 기술이 모달의 이름을 읽지 못한다.
    renderModal();

    expect(screen.getByRole("dialog", { name: "지원서 상세" })).toBeInTheDocument();
  });

  it("현재 위치와 전체 개수를 보여준다", () => {
    renderModal();

    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("이전 · 다음을 누르면 알린다", async () => {
    const { onPrev, onNext } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: /이전/ }));
    await userEvent.click(screen.getByRole("button", { name: /다음/ }));

    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("끝에서는 그쪽으로 더 갈 수 없다", () => {
    renderModal({ onPrev: null, current: 1 });

    expect(screen.getByRole("button", { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /다음/ })).toBeEnabled();
  });

  it("푸터에 넘긴 것을 함께 보여준다", () => {
    renderModal({ actions: <button type="button">저장</button> });

    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  });

  it("current · total을 생략하면(개수를 안 주는 순차 탐색) 카운터를 안 보여준다", () => {
    renderModal({ current: undefined, total: undefined });

    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
  });
});

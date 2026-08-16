import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";

import { Modal, ModalBody, ModalHeader } from "./Modal";

it("isOpen이 false면 아무것도 렌더링하지 않는다", () => {
  render(
    <Modal isOpen={false} onClose={() => {}}>
      <p>내용</p>
    </Modal>,
  );

  expect(screen.queryByText("내용")).not.toBeInTheDocument();
});

it("isOpen이 true면 children을 렌더링한다", () => {
  render(
    <Modal isOpen onClose={() => {}}>
      <p>내용</p>
    </Modal>,
  );

  expect(screen.getByText("내용")).toBeInTheDocument();
});

it("ESC 키를 누르면 onClose가 호출된다", () => {
  const handleClose = vi.fn();
  render(
    <Modal isOpen onClose={handleClose}>
      <p>내용</p>
    </Modal>,
  );

  fireEvent.keyDown(document, { key: "Escape" });

  expect(handleClose).toHaveBeenCalledTimes(1);
});

it("오버레이를 클릭하면 onClose가 호출된다", () => {
  const handleClose = vi.fn();
  render(
    <Modal isOpen onClose={handleClose}>
      <p>내용</p>
    </Modal>,
  );

  const overlay = screen.getByTestId("modal-overlay");
  fireEvent.mouseDown(overlay);
  fireEvent.click(overlay);

  expect(handleClose).toHaveBeenCalledTimes(1);
});

it("다이얼로그 안에서 시작한 드래그가 오버레이 위에서 끝나도 닫히지 않는다", () => {
  const handleClose = vi.fn();
  render(
    <Modal isOpen onClose={handleClose}>
      <p>본문 텍스트를 드래그로 선택하는 상황</p>
    </Modal>,
  );

  const overlay = screen.getByTestId("modal-overlay");
  const dialog = screen.getByRole("dialog");

  // 텍스트 드래그 선택을 흉내: mousedown은 다이얼로그 안에서, click은 오버레이에서 발생
  fireEvent.mouseDown(dialog);
  fireEvent.click(overlay);

  expect(handleClose).not.toHaveBeenCalled();
});

it("closeOnOverlayClick이 false면 오버레이를 클릭해도 닫히지 않는다", () => {
  const handleClose = vi.fn();
  render(
    <Modal isOpen onClose={handleClose} closeOnOverlayClick={false}>
      <p>내용</p>
    </Modal>,
  );

  const overlay = screen.getByTestId("modal-overlay");
  fireEvent.mouseDown(overlay);
  fireEvent.click(overlay);

  expect(handleClose).not.toHaveBeenCalled();
});

it("헤더의 닫기 버튼을 누르면 onClose가 호출된다", () => {
  const handleClose = vi.fn();
  render(
    <Modal isOpen onClose={handleClose}>
      <ModalHeader title="제목" onClose={handleClose} />
      <ModalBody>내용</ModalBody>
    </Modal>,
  );

  fireEvent.click(screen.getByRole("button", { name: "닫기" }));

  expect(handleClose).toHaveBeenCalledTimes(1);
});

it("ModalHeader의 title이 aria-labelledby로 dialog와 연결된다", () => {
  render(
    <Modal isOpen onClose={() => {}}>
      <ModalHeader title="답변 작성" onClose={() => {}} />
    </Modal>,
  );

  const dialog = screen.getByRole("dialog");
  const labelledBy = dialog.getAttribute("aria-labelledby");

  expect(labelledBy).toBeTruthy();
  expect(document.getElementById(labelledBy as string)).toHaveTextContent("답변 작성");
});

it("열리면 다이얼로그 자체에 포커스가 간다", () => {
  render(
    <Modal isOpen onClose={() => {}}>
      <ModalHeader title="제목" onClose={() => {}} />
      <ModalBody>내용</ModalBody>
    </Modal>,
  );

  expect(screen.getByRole("dialog")).toHaveFocus();
});

it("포커스 트랩이 비활성화된 요소를 건너뛴다", () => {
  render(
    <Modal isOpen onClose={() => {}}>
      <input placeholder="첫번째" />
      <input placeholder="마지막" />
      <input placeholder="비활성화" disabled />
    </Modal>,
  );

  const first = screen.getByPlaceholderText("첫번째");
  const last = screen.getByPlaceholderText("마지막");

  last.focus();
  fireEvent.keyDown(document, { key: "Tab" });

  expect(document.activeElement).toBe(first);
});

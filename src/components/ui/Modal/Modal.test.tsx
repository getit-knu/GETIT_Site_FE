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

  fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);

  expect(handleClose).toHaveBeenCalledTimes(1);
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

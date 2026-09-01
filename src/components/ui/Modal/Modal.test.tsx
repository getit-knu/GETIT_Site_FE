import { render, screen, fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import { StrictMode } from "react";
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

it("닫히면 퇴장 연출이 끝날 때까지 남지만 접근성 트리에서는 즉시 빠진다", async () => {
  // 예전엔 `isOpen`이 false가 되는 순간 통째로 사라져서 퇴장 연출을 걸 자리가 없었다.
  // 이제 잠깐 남지만, 그동안 스크린리더에는 이미 닫힌 대화상자로 취급된다.
  const { rerender } = render(
    <Modal isOpen onClose={() => {}}>
      <p>내용</p>
    </Modal>,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  rerender(
    <Modal isOpen={false} onClose={() => {}}>
      <p>내용</p>
    </Modal>,
  );

  expect(screen.getByTestId("modal-overlay")).toHaveAttribute("data-exiting");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  // 폴백 타임아웃이 지나면 DOM에서도 사라진다(jsdom엔 animationend가 없다).
  await waitForElementToBeRemoved(() => screen.queryByTestId("modal-overlay"));
});

it("닫히는 중에 오버레이를 눌러도 다시 닫으라고 하지 않는다", () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <Modal isOpen onClose={onClose}>
      <p>내용</p>
    </Modal>,
  );

  rerender(
    <Modal isOpen={false} onClose={onClose}>
      <p>내용</p>
    </Modal>,
  );
  fireEvent.click(screen.getByTestId("modal-overlay"));

  expect(onClose).not.toHaveBeenCalled();
});

it("StrictMode 안에서 닫힌 채 마운트한 뒤 열어도 열린다", () => {
  /*
    앱은 `main.tsx`에서 StrictMode 안에 있는데 이 파일의 다른 테스트들은 벗겨 놓고 렌더한다.
    닫힌 채 마운트했다가 여는 흔한 경로를 앱과 같은 조건에서 한 번은 확인해 둔다.

    다만 실제로 났던 "브라우저에서 모달이 아예 안 열리는" 회귀는 jsdom에서는 재현되지 않아
    이 테스트로 잡히지 않는다 — 그 성질은 `useAnimatedPresence.test.ts` 의 "open이 true인
    렌더에서 mounted가 false인 순간이 한 번도 없다" 가 지킨다.
  */
  const { rerender } = render(
    <StrictMode>
      <Modal isOpen={false} onClose={() => {}}>
        <p>내용</p>
      </Modal>
    </StrictMode>,
  );
  expect(screen.queryByText("내용")).not.toBeInTheDocument();

  rerender(
    <StrictMode>
      <Modal isOpen onClose={() => {}}>
        <p>내용</p>
      </Modal>
    </StrictMode>,
  );

  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

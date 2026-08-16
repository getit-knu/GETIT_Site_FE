import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { useModalParams } from "./useModalParams";

function Probe() {
  const { modal, id, openModal, closeModal } = useModalParams();

  return (
    <div>
      <p data-testid="state">{`${modal ?? "없음"}:${id ?? "없음"}`}</p>
      <button type="button" onClick={() => openModal("answer", 7)}>
        열기
      </button>
      <button type="button" onClick={closeModal}>
        닫기
      </button>
    </div>
  );
}

/**
 * 메모리 라우터는 `window.history` 나 `window.location` 을 건드리지 않는다.
 * 뒤로가기와 현재 쿼리는 라우터 인스턴스에서 직접 읽어야 한다.
 */
function renderAt(initialEntry: string) {
  const router = createMemoryRouter([{ path: "/admin/questions", element: <Probe /> }], {
    initialEntries: [initialEntry],
  });
  render(<RouterProvider router={router} />);
  return router;
}

const state = () => screen.getByTestId("state").textContent;

describe("useModalParams", () => {
  it("URL 에 이미 modal 이 있으면 열린 상태로 시작한다", () => {
    // 새로고침하면 컴포넌트는 처음부터 다시 그려진다. 상태를 URL 에 둔 이유가 이것이다.
    renderAt("/admin/questions?modal=answer&id=7");

    expect(state()).toBe("answer:7");
  });

  it("열면 URL 에 반영된다", async () => {
    renderAt("/admin/questions");
    expect(state()).toBe("없음:없음");

    await userEvent.click(screen.getByRole("button", { name: "열기" }));

    expect(state()).toBe("answer:7");
  });

  it("닫으면 modal 과 id 가 모두 지워진다", async () => {
    renderAt("/admin/questions?modal=answer&id=7");

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(state()).toBe("없음:없음");
  });

  it("뒤로가기로 모달이 닫힌다", async () => {
    const router = renderAt("/admin/questions");

    await userEvent.click(screen.getByRole("button", { name: "열기" }));
    expect(state()).toBe("answer:7");

    await router.navigate(-1);

    // 여는 것을 replace 로 처리하면 여기서 실패한다. 기록이 남지 않아 뒤로가기가
    // 모달이 아니라 이전 화면으로 나가 버린다.
    await expect.poll(state).toBe("없음:없음");
  });

  it("숫자가 아닌 id 는 없는 것으로 본다", () => {
    // 주소를 손으로 고쳐 들어올 수 있다. NaN 을 그대로 넘기면 조회가 이상하게 실패한다.
    renderAt("/admin/questions?modal=answer&id=abc");

    expect(state()).toBe("answer:없음");
  });

  it("다른 쿼리 파라미터는 건드리지 않는다", async () => {
    // 탭·필터·페이지도 URL 에 있다. 모달을 닫았다고 표가 1페이지로 돌아가면 안 된다.
    const router = renderAt("/admin/questions?tab=pending&page=3&modal=answer&id=7");

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("tab")).toBe("pending");
    expect(params.get("page")).toBe("3");
    expect(params.get("modal")).toBeNull();
  });
});

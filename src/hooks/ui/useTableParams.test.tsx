import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { useTableParams } from "./useTableParams";

const ALLOWED = ["PENDING", "ANSWERED"] as const;

function Probe() {
  const { page, filter, setPage, setFilter } = useTableParams("status", ALLOWED);
  return (
    <div>
      <p data-testid="state">{`${page}:${filter ?? "전체"}`}</p>
      <button type="button" onClick={() => setPage(page + 1)}>
        다음
      </button>
      <button type="button" onClick={() => setFilter("PENDING")}>
        미답변
      </button>
      <button type="button" onClick={() => setFilter(undefined)}>
        전체
      </button>
    </div>
  );
}

function renderAt(entry: string) {
  const router = createMemoryRouter([{ path: "/list", element: <Probe /> }], {
    initialEntries: [entry],
  });
  render(<RouterProvider router={router} />);
  return router;
}

const state = () => screen.getByTestId("state").textContent;

describe("useTableParams", () => {
  it("URL 의 page 와 필터를 읽는다", () => {
    renderAt("/list?page=2&status=ANSWERED");

    expect(state()).toBe("2:ANSWERED");
  });

  it.each(["", " ", "-1", "abc", "0x10", "1e3"])("page=%j 는 첫 페이지로 본다", (raw) => {
    // Number("0x10") 은 16 이다. 그대로 실리면 없는 페이지를 요청한다.
    renderAt(`/list?page=${raw}`);

    expect(state()).toBe("0:전체");
  });

  it("허용 목록에 없는 필터는 무시한다", () => {
    // 주소를 손으로 고쳐 넣은 값이 서버 조회 조건이 되면 안 된다.
    renderAt("/list?status=DROP_TABLE");

    expect(state()).toBe("0:전체");
  });

  it("필터를 바꾸면 첫 페이지로 돌아간다", async () => {
    // 3페이지에서 필터를 좁히면 있지도 않은 페이지를 요청하게 된다.
    renderAt("/list?page=3");
    expect(state()).toBe("3:전체");

    await userEvent.click(screen.getByRole("button", { name: "미답변" }));

    expect(state()).toBe("0:PENDING");
  });

  it("첫 페이지는 URL 을 더럽히지 않는다", async () => {
    const router = renderAt("/list?page=1");

    await userEvent.click(screen.getByRole("button", { name: "전체" }));

    expect(router.state.location.search).not.toContain("page=");
  });

  it("다른 쿼리 파라미터는 건드리지 않는다", async () => {
    // 모달도 같은 쿼리를 쓴다. 페이지를 넘겼다고 모달이 닫히면 안 된다.
    const router = renderAt("/list?modal=answer&id=7");

    await userEvent.click(screen.getByRole("button", { name: "다음" }));

    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("modal")).toBe("answer");
    expect(params.get("id")).toBe("7");
    expect(params.get("page")).toBe("1");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("페이지가 하나뿐이면 아무것도 그리지 않는다", () => {
    const { container } = render(<Pagination page={0} totalPages={1} onChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("0부터 세는 page 를 1부터로 보여준다", () => {
    // 서버는 0부터 준다(명세서 0.3). 사람에게 0페이지를 보여주면 안 된다.
    render(<Pagination page={0} totalPages={4} onChange={vi.fn()} />);

    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("첫 페이지에서는 이전으로 갈 수 없다", () => {
    render(<Pagination page={0} totalPages={4} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });

  it("마지막 페이지에서는 다음으로 갈 수 없다", () => {
    render(<Pagination page={3} totalPages={4} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("이동하면 바뀐 페이지 번호를 넘긴다", async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={4} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(onChange).toHaveBeenCalledWith(2);

    await userEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(onChange).toHaveBeenCalledWith(0);
  });
});

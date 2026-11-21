import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectCover } from "./ProjectCover";

describe("ProjectCover (#398)", () => {
  it("사진을 자르지 않는 앞층과, 같은 사진을 흐리게 깐 뒤층을 그린다", () => {
    const { container } = render(<ProjectCover url="https://cdn/icon.png" className="slot" />);

    const cover = container.firstElementChild as HTMLElement;
    expect(cover).toHaveClass("slot");
    expect(cover).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn/icon.png");
    const backdrop = container.querySelector("img")?.previousElementSibling as HTMLElement;
    expect(backdrop.style.backgroundImage).toContain("https://cdn/icon.png");
  });

  it("사진이 없으면 칸만 그린다", () => {
    const { container } = render(<ProjectCover url={null} />);

    expect(container.firstElementChild).toBeEmptyDOMElement();
  });
});

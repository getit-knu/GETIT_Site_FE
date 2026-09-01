import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeBoundaryDecor } from "./HomeBoundaryDecor";

describe("HomeBoundaryDecor", () => {
  it("좌우 장식 레이어 2개를 aria-hidden으로 렌더링해 접근성 트리에서 제외한다", () => {
    const { container } = render(<HomeBoundaryDecor />);

    const decor = container.querySelectorAll('[aria-hidden="true"]');
    expect(decor).toHaveLength(2);
  });
});

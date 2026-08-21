import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressBar } from "./ProgressBar";

const bar = () => screen.getByRole("progressbar");

describe("ProgressBar", () => {
  it("비율을 접근 가능한 값으로 알린다", () => {
    render(<ProgressBar rate={93.8} label="제출률" />);

    expect(bar()).toHaveAttribute("aria-valuenow", "94");
    expect(bar()).toHaveAccessibleName("제출률");
  });

  it.each([
    [95, "good"],
    [90, "good"],
    [89.9, "warn"],
    [70, "warn"],
    [69.9, "bad"],
    [0, "bad"],
  ])("비율 %s 는 %s 색이다", (rate, tone) => {
    // 경계값이 명세에 없어 와이어프레임에서 역산했다(93% 초록 / 87%·79% 노랑).
    // 기준이 정해지면 이 표를 먼저 고친다.
    const { container } = render(<ProgressBar rate={rate} label="제출률" />);
    const fill = container.querySelector("span");

    expect(fill?.className).toContain(tone);
  });

  it.each([
    [120, 100],
    [-10, 0],
  ])("범위를 벗어난 %s 는 %s 로 자른다", (rate, expected) => {
    // 서버가 이상한 값을 줘도 막대가 밖으로 넘치면 안 된다.
    const { container } = render(<ProgressBar rate={rate} label="제출률" />);

    expect(container.querySelector("span")).toHaveStyle({ width: `${expected}%` });
    expect(bar()).toHaveAttribute("aria-valuenow", String(expected));
  });
});

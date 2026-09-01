import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FullScreenLoader } from "./FullScreenLoader";

describe("FullScreenLoader", () => {
  it("기다리는 이유를 화면과 스크린리더 양쪽에 알린다", () => {
    render(<FullScreenLoader label="GET IT을 여는 중이에요" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("GET IT을 여는 중이에요");
    // 하던 일을 끊지 않고 전하는 알림이라 assertive 가 아니라 polite 여야 한다.
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("이유를 안 주면 무난한 기본 문구를 쓴다", () => {
    render(<FullScreenLoader />);

    expect(screen.getByRole("status")).toHaveTextContent("잠시만 기다려 주세요");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("굵게·기울임·링크를 실제 엘리먼트로 렌더링한다", () => {
    render(<Markdown content="**굵게** *기울임* [GETIT](https://getit.example.com)" />);

    expect(screen.getByText("굵게", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("기울임", { selector: "em" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GETIT" })).toHaveAttribute("href", "https://getit.example.com");
  });

  it("표(GFM)를 렌더링한다", () => {
    render(<Markdown content={"| 주차 | 내용 |\n| --- | --- |\n| 1 | OT |"} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "주차" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "OT" })).toBeInTheDocument();
  });

  it("마크다운에 섞인 원시 HTML은 태그 그대로(텍스트로) 보여준다 — 실행하지 않는다", () => {
    // react-markdown은 rehype-raw 없이는 원시 HTML을 파싱하지 않는다. 강의 설명은 운영진이
    // 쓰지만 사용자 입력이라는 점은 같아, 스크립트가 섞여도 실행되지 않아야 한다.
    const { container } = render(<Markdown content='<script>alert("xss")</script>' />);

    expect(container.querySelector("script")).not.toBeInTheDocument();
  });

  it("일반 텍스트는 그대로 보여준다", () => {
    render(<Markdown content="특수 문법 없는 그냥 설명입니다." />);

    expect(screen.getByText("특수 문법 없는 그냥 설명입니다.")).toBeInTheDocument();
  });
});

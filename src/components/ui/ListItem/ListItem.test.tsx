import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListItem } from "./ListItem";

describe("ListItem", () => {
  it("제목과 보조 정보를 보여준다", () => {
    render(
      <ul>
        <ListItem tone="blue" title="과제 제출 기한 문의" meta="김부원 · 1시간 전" />
      </ul>,
    );

    expect(screen.getByText("과제 제출 기한 문의")).toBeInTheDocument();
    expect(screen.getByText("김부원 · 1시간 전")).toBeInTheDocument();
  });

  it.each(["blue", "yellow", "gray"] as const)("%s 톤이 배경으로 반영된다", (tone) => {
    // 와이어프레임 p5 — 구조는 같고 배경만 다르다.
    const { container } = render(
      <ul>
        <ListItem tone={tone} title="제목" meta="보조" />
      </ul>,
    );

    expect(container.querySelector("li")?.className).toContain(tone);
  });

  it("href 와 linkAs 를 주면 항목이 링크가 된다", () => {
    render(
      <ul>
        <ListItem
          tone="blue"
          title="제목"
          meta="보조"
          href="/admin/questions?modal=answer&id=7"
          linkAs={({ to, className, children }) => (
            <a href={to} className={className}>
              {children}
            </a>
          )}
        />
      </ul>,
    );

    expect(screen.getByRole("link", { name: /제목/ })).toHaveAttribute("href", "/admin/questions?modal=answer&id=7");
  });

  it("linkAs 없이 href 만 주면 링크로 만들지 않는다", () => {
    // 이 컴포넌트는 라우터를 모른다. 링크 구현은 쓰는 쪽이 넘긴다.
    render(
      <ul>
        <ListItem tone="blue" title="제목" meta="보조" href="/somewhere" />
      </ul>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("trailing 을 주면 함께 그린다", () => {
    render(
      <ul>
        <ListItem tone="yellow" title="제목" meta="보조" trailing={<span>D-7</span>} />
      </ul>,
    );

    expect(screen.getByText("D-7")).toBeInTheDocument();
  });
});

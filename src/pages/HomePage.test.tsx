import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { getFaqs, getRecruitmentStatus } from "../apis/public/publicApi";

import HomePage from "./HomePage";

// D-Day 배지 · FAQ(publicApi)는 이 테스트의 관심사가 아니다 — 섹션 순서만 확인한다.
vi.mock("../apis/public/publicApi");

describe("HomePage", () => {
  it("Figma 와이어프레임 순서대로 6개 섹션을 모두 렌더링한다", async () => {
    vi.mocked(getRecruitmentStatus).mockReturnValue(new Promise(() => {}));
    vi.mocked(getFaqs).mockResolvedValue([{ id: 1, question: "질문", answer: "답변", order: 1 }]);

    const router = createMemoryRouter([{ path: "/", Component: HomePage }], { initialEntries: ["/"] });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await screen.findByRole("heading", { name: "자주 묻는 질문" });

    const headings = screen.getAllByRole("heading", { level: 1 }).concat(screen.getAllByRole("heading", { level: 2 }));
    const headingTexts = headings.map((heading) => heading.textContent);

    expect(headingTexts).toEqual([
      "LET'S MAKEANYTHING.",
      "GETIT과 함께한 순간들",
      "커리큘럼",
      "프로젝트 쇼케이스",
      "자주 묻는 질문",
    ]);
  });
});

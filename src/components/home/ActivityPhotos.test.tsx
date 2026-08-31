import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getActivityPhotos } from "../../apis/public/publicApi";
import type { PublicActivityPhoto } from "../../types/home";

import { ActivityPhotos } from "./ActivityPhotos";

vi.mock("../../apis/public/publicApi");

function photo(over: Partial<PublicActivityPhoto> = {}): PublicActivityPhoto {
  return { id: 1, imageUrl: "https://cdn.example.com/photo-1.jpg", order: 1, ...over };
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActivityPhotos />
    </QueryClientProvider>,
  );
}

describe("ActivityPhotos", () => {
  it("등록된 사진을 카드로 보여준다", async () => {
    vi.mocked(getActivityPhotos).mockResolvedValue([
      photo({ id: 1, imageUrl: "https://cdn.example.com/a.jpg" }),
      photo({ id: 2, imageUrl: "https://cdn.example.com/b.jpg", order: 2 }),
    ]);
    renderSection();

    expect(await screen.findByRole("heading", { name: "GETIT과 함께한 순간들" })).toBeInTheDocument();

    // 무한 스크롤처럼 보이려고 카드 목록을 통째로 하나 더 복제해 붙인다. 복제본은
    // aria-hidden이라 접근성 트리(role 쿼리)에는 원본 목록 하나만 잡힌다.
    const list = within(screen.getByRole("list"));
    const images = list.getAllByAltText("GETIT 활동 사진");
    expect(images.map((img) => img.getAttribute("src"))).toEqual([
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
    ]);
  });

  it("무한 루프처럼 보이도록 카드 목록을 복제해 붙인다", async () => {
    // 복제본은 aria-hidden 이라 role 쿼리엔 안 잡힌다 — alt 텍스트로는 hidden 여부와
    // 무관하게 둘 다 잡힌다.
    vi.mocked(getActivityPhotos).mockResolvedValue([photo()]);
    renderSection();

    expect(await screen.findAllByAltText("GETIT 활동 사진")).toHaveLength(2);
  });

  it("등록된 사진이 없으면 섹션 자체를 숨긴다", async () => {
    vi.mocked(getActivityPhotos).mockResolvedValue([]);
    renderSection();

    await waitFor(() => expect(getActivityPhotos).toHaveBeenCalled());
    expect(screen.queryByRole("heading", { name: "GETIT과 함께한 순간들" })).not.toBeInTheDocument();
  });
});

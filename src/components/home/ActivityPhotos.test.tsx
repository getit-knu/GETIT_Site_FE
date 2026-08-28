import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityPhotos } from "./ActivityPhotos";

describe("ActivityPhotos", () => {
  it("제목과 활동 사진 카드 4개를 보여준다", () => {
    render(<ActivityPhotos />);

    expect(screen.getByRole("heading", { name: "GETIT과 함께한 순간들" })).toBeInTheDocument();

    // 무한 스크롤처럼 보이려고 카드 목록을 통째로 하나 더 복제해 붙인다. 복제본은
    // aria-hidden이라 접근성 트리(role 쿼리)에는 원본 목록 하나만 잡힌다.
    const list = within(screen.getByRole("list"));
    for (const label of ["해커톤", "MT", "세미나", "프로젝트 발표"]) {
      expect(list.getByText(label)).toBeInTheDocument();
    }
  });

  it("무한 루프처럼 보이도록 카드 목록을 복제해 붙인다", () => {
    render(<ActivityPhotos />);

    // 복제본까지 합치면 각 라벨이 화면(DOM)엔 두 번씩 있어야 한다.
    expect(screen.getAllByText("해커톤")).toHaveLength(2);
  });
});

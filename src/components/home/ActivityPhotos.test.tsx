import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityPhotos } from "./ActivityPhotos";

describe("ActivityPhotos", () => {
  it("제목과 활동 사진 카드 4개를 보여준다", () => {
    render(<ActivityPhotos />);

    expect(screen.getByRole("heading", { name: "GETIT과 함께한 순간들" })).toBeInTheDocument();
    for (const label of ["해커톤", "MT", "세미나", "프로젝트 발표"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

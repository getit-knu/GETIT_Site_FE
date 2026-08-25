import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getMemberLecturesSnapshot } from "../../mocks/lecture/memberLectures";

import LectureListPage from "./LectureListPage";

describe("LectureListPage", () => {
  it("헤더와 전체 강의를 렌더링한다", () => {
    render(<LectureListPage />);

    const lectures = getMemberLecturesSnapshot();

    expect(screen.getByRole("heading", { name: "강좌 목록" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(lectures.length);
  });

  it("필터 탭을 선택하면 해당 소분류 강의만 보여준다", () => {
    render(<LectureListPage />);

    const lectures = getMemberLecturesSnapshot();
    const webBasicCount = lectures.filter((l) => l.subCategoryId === 1).length;

    fireEvent.click(screen.getByRole("button", { name: `WEB 기초 (${webBasicCount})` }));

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(webBasicCount);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { getMemberLecturesSnapshot } from "../../mocks/lecture/memberLectures";

import LectureListPage from "./LectureListPage";

function renderAt(path = "/member") {
  const router = createMemoryRouter(
    [
      { path: "/member", element: <LectureListPage /> },
      { path: "/member/lectures/:id", element: <p>강의 시청</p> },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe("LectureListPage", () => {
  it("헤더와 전체 강의를 렌더링한다", () => {
    renderAt();

    const lectures = getMemberLecturesSnapshot();

    expect(screen.getByRole("heading", { name: "강좌 목록" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(lectures.length);
  });

  it("필터 탭을 선택하면 해당 소분류 강의만 보여준다", () => {
    renderAt();

    const lectures = getMemberLecturesSnapshot();
    const webBasicCount = lectures.filter((l) => l.subCategoryId === 1).length;

    fireEvent.click(screen.getByRole("button", { name: `WEB 기초 (${webBasicCount})` }));

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(webBasicCount);
  });

  it("카드를 클릭하면 강의 시청 페이지로 이동한다", () => {
    renderAt();

    fireEvent.click(screen.getByRole("heading", { name: "HTML/CSS 기초" }));

    expect(screen.getByText("강의 시청")).toBeInTheDocument();
  });
});

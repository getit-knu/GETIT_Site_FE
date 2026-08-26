import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import LectureDetailPage from "./LectureDetailPage";

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/member", element: <p>강좌 목록</p> },
      { path: "/member/lectures/:id", element: <LectureDetailPage /> },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe("LectureDetailPage", () => {
  it("강의 제목·영상·강의 자료를 렌더링한다", () => {
    renderAt("/member/lectures/1");

    expect(screen.getByRole("heading", { level: 1, name: "HTML/CSS 기초" })).toBeInTheDocument();
    expect(screen.getByTitle("HTML/CSS 기초")).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
    expect(screen.getByRole("link", { name: "강의 자료.pdf" })).toHaveAttribute("href", "https://cdn.getit.com/501");
    expect(screen.getByRole("link", { name: "예제 코드.zip" })).toHaveAttribute("href", "https://cdn.getit.com/502");
  });

  it("등록된 자료가 없으면 안내 문구를 보여준다", () => {
    renderAt("/member/lectures/2");

    expect(screen.getByText("등록된 자료가 없습니다.")).toBeInTheDocument();
  });

  it("존재하지 않는 강의면 안내 문구와 돌아가기 링크만 보여준다", () => {
    renderAt("/member/lectures/999");

    expect(screen.getByText("강의를 찾을 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "강좌 목록으로 돌아가기" })).toHaveAttribute("href", "/member");
  });

  it("이미 제출한 강의는 과제 정보와 함께 제출 완료 안내만 보여준다", () => {
    renderAt("/member/lectures/1");

    expect(screen.getByRole("heading", { name: "간단한 자기소개 페이지 만들기" })).toBeInTheDocument();
    expect(screen.getByText("이미 제출한 과제입니다.")).toBeInTheDocument();
    expect(screen.queryByLabelText("과제 파일 선택")).not.toBeInTheDocument();
  });

  it("과제가 없는 강의는 안내 문구를 보여준다", () => {
    renderAt("/member/lectures/3");

    expect(screen.getByText("등록된 과제가 없습니다.")).toBeInTheDocument();
  });

  it("파일을 고르기 전엔 제출 버튼이 비활성화고, 고르면 제출할 수 있다", async () => {
    const user = userEvent.setup();
    renderAt("/member/lectures/2");

    const submitButton = screen.getByRole("button", { name: "과제 제출하기" });
    expect(submitButton).toBeDisabled();

    const file = new File(["hello"], "소개.html", { type: "text/html" });
    await user.upload(screen.getByLabelText("과제 파일 선택"), file);

    expect(screen.getByText("소개.html")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(await screen.findByText("과제를 제출했습니다.")).toBeInTheDocument();
  });
});

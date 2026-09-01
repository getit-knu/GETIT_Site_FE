import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadFile } from "../../apis/file/filesApi";
import * as api from "../../apis/lecture/memberLecturesApi";
import type { MemberLectureDetail, MemberMySubmission } from "../../types/lecture";

import LectureDetailPage from "./LectureDetailPage";

vi.mock("../../apis/lecture/memberLecturesApi");
vi.mock("../../apis/file/filesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../apis/file/filesApi")>()),
  uploadFile: vi.fn(),
}));

function detail(over: Partial<MemberLectureDetail> = {}): MemberLectureDetail {
  return {
    id: 1,
    week: 1,
    title: "HTML/CSS 기초",
    description: "HTML과 CSS의 기본 개념을 이해합니다.",
    trackName: "SW",
    subCategoryName: "WEB 기초",
    durationMinutes: 90,
    youtubeUrl: "https://youtube.com/watch?v=abc123",
    materialUrl: "",
    author: { name: "GETIT SW교육 팀장", profileImageUrl: null },
    publishedAt: "2026-06-01T00:00:00+09:00",
    materials: [{ fileId: 501, displayName: "강의 자료.pdf", size: 2048576, contentType: "application/pdf" }],
    assignment: {
      id: 10,
      title: "간단한 자기소개 페이지 만들기",
      description: "HTML과 CSS로 자기소개 페이지를 만들어보세요.",
      deadline: "2026-06-19T23:59:00+09:00",
    },
    mySubmission: null,
    ...over,
  };
}

function submission(over: Partial<MemberMySubmission> = {}): MemberMySubmission {
  return {
    id: 900,
    fileUrl: "https://cdn.getit.com/900",
    fileName: "소개.html",
    linkUrl: null,
    comment: "",
    submittedAt: "2026-06-10T10:00:00+09:00",
    status: "SUBMITTED",
    feedbacks: [],
    ...over,
  };
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/member", element: <p>강좌 목록</p> },
      { path: "/member/lectures/:id", element: <LectureDetailPage /> },
    ],
    { initialEntries: [path] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("LectureDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Q&A는 QnaSection.test.tsx에서 따로 검증한다 — 여기선 조용히 비어 있게만 둔다.
    vi.mocked(api.getMyLectureQuestions).mockResolvedValue([]);
  });

  it("강의 제목 · 영상 · 강의 자료를 렌더링한다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail());
    renderAt("/member/lectures/1");

    expect(await screen.findByRole("heading", { level: 1, name: "HTML/CSS 기초" })).toBeInTheDocument();
    expect(screen.getByTitle("HTML/CSS 기초")).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
    expect(screen.getByRole("button", { name: /강의 자료\.pdf/ })).toBeInTheDocument();
  });

  it("자료 버튼을 누르면 매번 새 다운로드 주소를 받아 새 탭으로 연다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail());
    vi.mocked(api.getMemberMaterialDownloadUrl).mockResolvedValue({
      downloadUrl: "https://storage.example/501?sig=abc",
      fileName: "강의 자료.pdf",
      contentType: "application/pdf",
      expiresIn: 600,
    });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    renderAt("/member/lectures/1");

    await user.click(await screen.findByRole("button", { name: /강의 자료\.pdf/ }));

    expect(api.getMemberMaterialDownloadUrl).toHaveBeenCalledWith(1, 501);
    expect(openSpy).toHaveBeenCalledWith("https://storage.example/501?sig=abc", "_blank", "noopener,noreferrer");
  });

  it("강의 설명을 마크다운으로 렌더링한다", async () => {
    // BE가 이 필드를 마크다운 원문으로 준다(`types/lecture/index.ts`의 `LectureDetail.description` 주석 참고).
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(
      detail({ description: "**HTML**과 CSS의\n\n- 태그\n- 속성\n\n을 이해합니다." }),
    );
    renderAt("/member/lectures/1");

    // 굵게 처리된 부분이 <strong> 엘리먼트로 실제 렌더링됐는지 — 별표(**)가 그대로 화면에
    // 남아 있으면 안 된다.
    const strong = await screen.findByText("HTML", { selector: "strong" });
    expect(strong).toBeInTheDocument();
    // 목록(- 태그, - 속성)도 <li>로 렌더링된다(강의 자료 목록도 <li>라 텍스트로 특정한다).
    expect(screen.getByText("태그", { selector: "li" })).toBeInTheDocument();
    expect(screen.getByText("속성", { selector: "li" })).toBeInTheDocument();
  });

  it("과제 설명도 마크다운으로 렌더링한다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(
      detail({ assignment: { ...detail().assignment!, description: "**필수**: 완성한 페이지 링크를 제출하세요." } }),
    );
    renderAt("/member/lectures/1");

    expect(await screen.findByText("필수", { selector: "strong" })).toBeInTheDocument();
  });

  it("등록된 자료가 없으면 안내 문구를 보여준다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail({ materials: [] }));
    renderAt("/member/lectures/2");

    expect(await screen.findByText("등록된 자료가 없습니다.")).toBeInTheDocument();
  });

  it("조회 실패면 에러 화면을 보여준다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockRejectedValue({ code: "LECTURE_NOT_FOUND", message: "?" });
    renderAt("/member/lectures/999");

    expect(await screen.findByRole("alert")).toHaveTextContent("강의를 찾을 수 없습니다");
  });

  it("이미 제출한 과제는 제출 요약과 다시 제출하기 버튼을 보여준다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail({ mySubmission: submission({ status: "LATE" }) }));
    renderAt("/member/lectures/1");

    expect(await screen.findByText("지각 제출했습니다", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "소개.html" })).toHaveAttribute("href", "https://cdn.getit.com/900");
    expect(screen.getByRole("button", { name: "다시 제출하기" })).toBeInTheDocument();
    expect(screen.queryByLabelText("과제 파일 선택")).not.toBeInTheDocument();
  });

  it("다시 제출하기를 누르면 제출 폼이 다시 나온다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail({ mySubmission: submission() }));
    const user = userEvent.setup();
    renderAt("/member/lectures/1");

    await user.click(await screen.findByRole("button", { name: "다시 제출하기" }));

    expect(await screen.findByLabelText("과제 파일 선택")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 제출하기" })).toBeDisabled();
  });

  it("과제가 없는 강의는 안내 문구를 보여준다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail({ assignment: null }));
    renderAt("/member/lectures/1");

    expect(await screen.findByText("등록된 과제가 없습니다.")).toBeInTheDocument();
  });

  it("파일을 고르기 전엔 제출 버튼이 비활성화고, 올리면 제출할 수 있다", async () => {
    vi.mocked(api.getMemberLectureDetail)
      .mockResolvedValueOnce(detail())
      .mockResolvedValueOnce(detail({ mySubmission: submission() }));
    vi.mocked(uploadFile).mockResolvedValue({ fileId: 700, fileName: "소개.zip", size: 100 });
    vi.mocked(api.submitAssignment).mockResolvedValue({
      id: 900,
      assignmentId: 10,
      fileUrl: "https://cdn.getit.com/900",
      fileName: "소개.zip",
      linkUrl: null,
      comment: "",
      submittedAt: "2026-06-10T10:00:00+09:00",
      status: "SUBMITTED",
    });
    const user = userEvent.setup();
    renderAt("/member/lectures/1");

    const submitButton = await screen.findByRole("button", { name: "과제 제출하기" });
    expect(submitButton).toBeDisabled();

    // ASSIGNMENT 용도는 zip · pdf · png · jpg · ipynb · txt만 허용한다(`PURPOSE_LIMITS`) —
    // 다른 확장자는 업로드 전에 클라이언트에서부터 막힌다.
    const file = new File(["hello"], "소개.zip", { type: "application/zip" });
    await user.upload(screen.getByLabelText("과제 파일 선택"), file);

    expect(await screen.findByText("소개.zip")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(api.submitAssignment).toHaveBeenCalledWith(10, { fileId: 700, linkUrl: null, comment: "" });
    expect(await screen.findByText("제출했습니다", { exact: false })).toBeInTheDocument();
  });

  it("링크만 입력해도 제출할 수 있다", async () => {
    vi.mocked(api.getMemberLectureDetail).mockResolvedValue(detail());
    vi.mocked(api.submitAssignment).mockResolvedValue({
      id: 901,
      assignmentId: 10,
      fileUrl: null,
      fileName: null,
      linkUrl: "https://github.com/me/repo",
      comment: "",
      submittedAt: "2026-06-10T10:00:00+09:00",
      status: "SUBMITTED",
    });
    const user = userEvent.setup();
    renderAt("/member/lectures/1");

    const submitButton = await screen.findByRole("button", { name: "과제 제출하기" });
    await user.type(screen.getByPlaceholderText("https://..."), "https://github.com/me/repo");
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(api.submitAssignment).toHaveBeenCalledWith(10, {
      fileId: null,
      linkUrl: "https://github.com/me/repo",
      comment: "",
    });
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/lecture/lecturesApi";
import { queryKeys } from "../../apis/queryKeys";
import type { LectureDetail, Track } from "../../types/lecture";

import { LectureFormModal } from "./LectureFormModal";

vi.mock("../../apis/lecture/lecturesApi");

const TRACKS: Track[] = [
  {
    id: 1,
    name: "SW",
    subCategories: [
      { id: 1, name: "WEB 기초" },
      { id: 2, name: "React.js" },
    ],
  },
  { id: 2, name: "창업 빌드업", subCategories: [] },
];

function detail(over: Partial<LectureDetail> = {}): LectureDetail {
  return {
    id: 101,
    generationId: 9,
    trackId: 1,
    subCategoryId: 1,
    week: 3,
    title: "HTML/CSS 기초",
    description: "## 학습 구성",
    youtubeUrl: "https://youtube.com/watch?v=abc",
    materialUrl: "https://docs.getit.com/web",
    durationMinutes: 120,
    isPublished: true,
    files: [{ fileId: 501, displayName: "강의 자료.pdf", url: "https://cdn/1", size: 2048 }],
    // 실제 BE는 오프셋 붙은 ISO 8601(`date-time`)을 준다 — 초·오프셋 없는 값으로 목을
    // 만들면 화면의 KST 변환 누락 버그가 감춰진다.
    assignment: {
      id: 201,
      title: "소개 페이지 만들기",
      description: "설명",
      deadline: "2026-06-19T23:59:00+09:00",
      allowedTypes: ["FILE"],
      linkPlaceholder: null,
    },
    ...over,
  };
}

const onClose = vi.fn();

function renderModal(lectureId: number | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <LectureFormModal lectureId={lectureId} tracks={TRACKS} onClose={onClose} />
    </QueryClientProvider>,
  );
}

const titleBox = () => screen.getByLabelText(/^제목/);
const weekBox = () => screen.getByLabelText(/^주차/);
const submit = () => screen.getByRole("button", { name: /강의 추가|^저장$/ });

describe("LectureFormModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getLectureDetail).mockResolvedValue(detail());
    vi.mocked(api.createLecture).mockResolvedValue();
    vi.mocked(api.updateLecture).mockResolvedValue();
  });

  it("추가 모드는 조회하지 않고 빈 폼으로 연다", () => {
    renderModal(null);

    expect(api.getLectureDetail).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "강의 추가" })).toBeInTheDocument();
    expect(titleBox()).toHaveValue("");
  });

  it("수정 모드는 기존 값을 채운다", async () => {
    renderModal(101);

    expect(await screen.findByDisplayValue("HTML/CSS 기초")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "강의 수정" })).toBeInTheDocument();
    expect(weekBox()).toHaveValue(3);
    expect(screen.getByDisplayValue("소개 페이지 만들기")).toBeInTheDocument();
  });

  it("서버가 준 오프셋 붙은 과제 마감을 KST datetime-local 값으로 채우고, 안 고쳐도 오프셋 붙여 되돌린다", async () => {
    // 오프셋을 그대로 넣으면 <input type="datetime-local">은 형식 불일치로 빈 칸을 보여준다.
    renderModal(101);

    expect(await screen.findByLabelText("마감 기한 *")).toHaveValue("2026-06-19T23:59");

    await userEvent.click(submit());

    const payload = vi.mocked(api.updateLecture).mock.lastCall?.[1];
    expect(new Date(payload!.assignment!.deadline).toISOString()).toBe("2026-06-19T14:59:00.000Z");
  });

  it("제목이 비면 저장할 수 없다", () => {
    renderModal(null);

    expect(screen.getByText("제목을 입력해 주세요.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("주차가 없으면 저장할 수 없다", async () => {
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");

    expect(screen.getByText("주차는 1 이상의 정수여야 합니다.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("URL 형식이 틀리면 저장할 수 없다", async () => {
    // 서버도 막는다(명세서 8.2). 눌러 보고 알게 하지 않는다.
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "1");
    await userEvent.type(screen.getByLabelText("유튜브 URL"), "not-a-url");

    expect(screen.getByText("유튜브 URL 형식이 올바르지 않습니다.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("필수만 채우면 추가할 수 있다", async () => {
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "5");
    await userEvent.click(submit());

    expect(api.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({ title: "새 강의", week: 5, trackId: 1, assignment: null }),
    );
  });

  it("과제를 켜면 제목과 마감이 필수가 된다", async () => {
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "1");
    await userEvent.click(screen.getByLabelText("과제 있음"));

    expect(screen.getByText("과제 제목을 입력해 주세요.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("제출 방식을 하나도 선택하지 않으면 저장을 막는다", async () => {
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "1");
    await userEvent.click(screen.getByLabelText("과제 있음"));
    await userEvent.type(screen.getByLabelText("과제 제목 *"), "과제");
    await userEvent.type(screen.getByLabelText("과제 설명 (Markdown) *"), "설명");
    await userEvent.type(screen.getByLabelText("마감 기한 *"), "2026-06-19T23:59");
    // 기본값(파일)을 끄면 아무 방식도 안 남는다.
    await userEvent.click(screen.getByLabelText("파일"));

    expect(screen.getByText("과제 제출 방식을 하나 이상 선택해 주세요.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("링크를 허용하면 안내 문구 입력칸이 나타나고 저장에 실린다", async () => {
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "1");
    await userEvent.click(screen.getByLabelText("과제 있음"));
    await userEvent.type(screen.getByLabelText("과제 제목 *"), "과제");
    await userEvent.type(screen.getByLabelText("과제 설명 (Markdown) *"), "설명");
    await userEvent.type(screen.getByLabelText("마감 기한 *"), "2026-06-19T23:59");

    expect(screen.queryByLabelText("링크 안내 문구")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("링크"));
    await userEvent.type(screen.getByLabelText("링크 안내 문구"), "구글 드라이브 링크");
    await userEvent.click(submit());

    expect(api.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        assignment: expect.objectContaining({
          allowedTypes: ["FILE", "LINK"],
          linkPlaceholder: "구글 드라이브 링크",
        }),
      }),
    );
  });

  it("소분류를 고르지 않으면 null 로 보낸다", async () => {
    // 0 은 화면에서 쓰는 값일 뿐 서버가 아는 소분류 id 가 아니다.
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "1");
    await userEvent.click(submit());

    expect(api.createLecture).toHaveBeenCalledWith(expect.objectContaining({ subCategoryId: null }));
  });

  it("트랙을 바꾸면 소분류 선택을 비운다", async () => {
    // 남겨 두면 다른 트랙의 소분류가 그대로 저장된다.
    renderModal(101);

    await screen.findByDisplayValue("HTML/CSS 기초");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "트랙" }), "2");
    await userEvent.click(submit());

    expect(api.updateLecture).toHaveBeenCalledWith(101, expect.objectContaining({ trackId: 2, subCategoryId: null }));
  });

  it("소분류가 없는 트랙에서는 선택지를 '없음' 만 준다", async () => {
    renderModal(null);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "트랙" }), "2");

    const sub = screen.getByRole("combobox", { name: "소분류" });
    expect(sub).toHaveTextContent("없음");
    expect(sub.querySelectorAll("option")).toHaveLength(1);
  });

  it("첨부를 제거하면 fileIds 에서 빠진다", async () => {
    renderModal(101);

    await screen.findByDisplayValue("HTML/CSS 기초");
    await userEvent.click(screen.getByRole("button", { name: "제거" }));
    await userEvent.click(submit());

    expect(api.updateLecture).toHaveBeenCalledWith(101, expect.objectContaining({ fileIds: [] }));
  });

  it("제거한 첨부는 저장 전에 되돌릴 수 있다", async () => {
    renderModal(101);

    await screen.findByDisplayValue("HTML/CSS 기초");
    await userEvent.click(screen.getByRole("button", { name: "제거" }));
    await userEvent.click(screen.getByRole("button", { name: "되돌리기" }));
    await userEvent.click(submit());

    expect(api.updateLecture).toHaveBeenCalledWith(101, expect.objectContaining({ fileIds: [501] }));
  });

  it("재생 시간이 0 이면 저장할 수 없다", async () => {
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "1");
    await userEvent.type(screen.getByLabelText("재생 시간(분)"), "0");

    expect(screen.getByText("재생 시간은 1분 이상이어야 합니다.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("저장에 성공하면 모달을 닫는다", async () => {
    renderModal(101);

    await screen.findByDisplayValue("HTML/CSS 기초");
    await userEvent.click(submit());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("표에 없는 코드는 서버가 준 문구를 보여준다", async () => {
    // BE 가 코드를 추가해도 화면이 '저장하지 못했습니다' 만 되뇌면 무엇이 잘못됐는지 알 수 없다.
    vi.mocked(api.createLecture).mockRejectedValue({ code: "DUPLICATE_WEEK", message: "이미 등록된 주차입니다." });
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "3");
    await userEvent.click(submit());

    expect(await screen.findByText("이미 등록된 주차입니다.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("서버 문구도 없으면 저장 실패 대체 문구를 쓴다", async () => {
    // 대체 문구가 조회용이면 무엇이 안 됐는지 알 수 없다.
    vi.mocked(api.createLecture).mockRejectedValue({ code: "SOME_UNMAPPED_CODE", message: "  " });
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "3");
    await userEvent.click(submit());

    expect(await screen.findByText("강의를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
  });

  it("표에 있는 코드는 화면 문구를 쓴다", async () => {
    // 서버 문구가 개발자용일 수 있다. 아는 코드는 우리 문구가 우선이다.
    vi.mocked(api.createLecture).mockRejectedValue({ code: "FORBIDDEN", message: "Access denied" });
    renderModal(null);

    await userEvent.type(titleBox(), "새 강의");
    await userEvent.type(weekBox(), "3");
    await userEvent.click(submit());

    expect(await screen.findByText("강의를 볼 권한이 없습니다.")).toBeInTheDocument();
  });

  it("수정 조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getLectureDetail).mockRejectedValue({ code: "LECTURE_NOT_FOUND", message: "?" });
    renderModal(101);

    expect(await screen.findByRole("alert")).toHaveTextContent("강의를 찾을 수 없습니다");
  });

  it("열린 채로 다른 강의로 바뀌면 그 강의 값을 보여준다", async () => {
    /*
      캐시에 이미 있는 강의로 바꾸면 data 가 곧바로 채워져 폼이 언마운트되지 않는다.
      그러면 앞 강의에서 고치던 draft 가 남아 새 강의에 저장된다.
    */
    const other = detail({ id: 202, title: "Express 라우팅", week: 5 });
    vi.mocked(api.getLectureDetail).mockImplementation((id) => Promise.resolve(id === 202 ? other : detail()));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // 두 강의를 모두 캐시에 올려 둔다 — 실제로 목록에서 번갈아 열면 이 상태가 된다.
    await queryClient.prefetchQuery({
      queryKey: queryKeys.lectures.detail(101),
      queryFn: () => api.getLectureDetail(101),
    });
    await queryClient.prefetchQuery({
      queryKey: queryKeys.lectures.detail(202),
      queryFn: () => api.getLectureDetail(202),
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <LectureFormModal lectureId={101} tracks={TRACKS} onClose={onClose} />
      </QueryClientProvider>,
    );
    expect(await screen.findByDisplayValue("HTML/CSS 기초")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <LectureFormModal lectureId={202} tracks={TRACKS} onClose={onClose} />
      </QueryClientProvider>,
    );

    expect(await screen.findByDisplayValue("Express 라우팅")).toBeInTheDocument();
    expect(screen.getByLabelText(/^주차/)).toHaveValue(5);
  });
});

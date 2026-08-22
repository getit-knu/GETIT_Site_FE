import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/lecture/lecturesApi";
import type { Feedback, SubmissionDetail, SubmissionFile } from "../../types/lecture";

import { FeedbackModal } from "./FeedbackModal";

vi.mock("../../apis/lecture/lecturesApi");

const ZIP: SubmissionFile = {
  fileId: 601,
  fileName: "week1.zip",
  url: "https://cdn/3005.zip",
  previewUrl: null,
  contentType: "application/zip",
  size: 512000,
  previewable: false,
};

const feedback = (over: Partial<Feedback> = {}): Feedback => ({
  id: 9001,
  adminId: 3,
  adminName: "김운영",
  content: "구조가 깔끔합니다.",
  createdAt: "2026-06-06T10:00:00+09:00",
  updatedAt: null,
  ...over,
});

function detail(over: Partial<SubmissionDetail> = {}): SubmissionDetail {
  return {
    id: 3005,
    lecture: { id: 101, title: "HTML/CSS 기초" },
    user: { id: 24, name: "이재민", major: "컴퓨터공학과" },
    file: ZIP,
    comment: "부족한 부분이 있으면 알려주세요.",
    submittedAt: "2026-06-04T20:11:00+09:00",
    status: "SUBMITTED",
    feedbacks: [feedback()],
    navigation: { current: 1, total: 2, prevSubmissionId: null, nextSubmissionId: 3006 },
    ...over,
  };
}

const onNavigate = vi.fn();
const onClose = vi.fn();

function renderModal(submissionId = 3005) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FeedbackModal submissionId={submissionId} onNavigate={onNavigate} onClose={onClose} />
    </QueryClientProvider>,
  );
}

const newBox = () => screen.getByLabelText("새 피드백");
const saveButton = () => screen.getByRole("button", { name: "저장" });

describe("FeedbackModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getSubmissionDetail).mockResolvedValue(detail());
    vi.mocked(api.createFeedback).mockResolvedValue(feedback({ id: 9002, content: "좋습니다." }));
    vi.mocked(api.updateFeedback).mockResolvedValue(
      feedback({ content: "고친 내용", updatedAt: "2026-06-06T11:00:00+09:00" }),
    );
  });

  it("제출자와 기존 피드백을 보여준다", async () => {
    renderModal();

    expect(await screen.findByText("이재민")).toBeInTheDocument();
    expect(screen.getByText("구조가 깔끔합니다.")).toBeInTheDocument();
    expect(screen.getByText("부족한 부분이 있으면 알려주세요.")).toBeInTheDocument();
  });

  it("미리보기를 지원하지 않는 파일은 내려받기만 준다", async () => {
    // previewable 은 서버가 정한다. FE 가 contentType 을 다시 보고 열려 들면 안 된다.
    renderModal();

    expect(await screen.findByText(/미리보기를 지원하지 않습니다/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "내려받기" })).toHaveAttribute("href", "https://cdn/3005.zip");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("previewable 이면 미리보기를 그린다", async () => {
    vi.mocked(api.getSubmissionDetail).mockResolvedValue(
      detail({
        file: {
          ...ZIP,
          fileName: "intro.png",
          contentType: "image/png",
          previewUrl: "https://cdn/p.png",
          previewable: true,
        },
      }),
    );
    renderModal();

    expect(await screen.findByRole("img", { name: /미리보기/ })).toHaveAttribute("src", "https://cdn/p.png");
  });

  it("지각 제출을 표시한다", async () => {
    vi.mocked(api.getSubmissionDetail).mockResolvedValue(detail({ status: "LATE" }));
    renderModal();

    expect(await screen.findByText("지각")).toBeInTheDocument();
  });

  it("빈 피드백은 저장할 수 없다", async () => {
    renderModal();
    await screen.findByText("이재민");

    expect(saveButton()).toBeDisabled();

    await userEvent.type(newBox(), "   ");
    expect(saveButton()).toBeDisabled();
  });

  it("새 피드백을 작성한다", async () => {
    renderModal();
    await screen.findByText("이재민");

    await userEvent.type(newBox(), "  좋습니다.  ");
    await userEvent.click(saveButton());

    // 앞뒤 공백은 서버에 보내지 않는다.
    expect(api.createFeedback).toHaveBeenCalledWith(3005, "좋습니다.");
    expect(api.updateFeedback).not.toHaveBeenCalled();
  });

  it("기존 피드백을 고르면 수정으로 저장한다", async () => {
    // 같은 칸을 쓰지만 새로 쓰는 것과 고치는 것은 다른 엔드포인트다(8.8 · 8.9).
    renderModal();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    expect(screen.getByLabelText("피드백 수정")).toHaveValue("구조가 깔끔합니다.");

    await userEvent.clear(screen.getByLabelText("피드백 수정"));
    await userEvent.type(screen.getByLabelText("피드백 수정"), "고친 내용");
    await userEvent.click(saveButton());

    expect(api.updateFeedback).toHaveBeenCalledWith(9001, "고친 내용");
    expect(api.createFeedback).not.toHaveBeenCalled();
  });

  it("수정을 취소하면 새 피드백 칸으로 되돌아온다", async () => {
    renderModal();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    await userEvent.click(screen.getByRole("button", { name: "수정 취소" }));

    expect(newBox()).toHaveValue("");
  });

  it("저장 후 다음을 누르면 저장하고 다음 제출물로 넘어간다", async () => {
    renderModal();
    await screen.findByText("이재민");

    await userEvent.type(newBox(), "좋습니다.");
    await userEvent.click(screen.getByRole("button", { name: "저장 후 다음" }));

    expect(api.createFeedback).toHaveBeenCalledWith(3005, "좋습니다.");
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(3006));
  });

  it("마지막 제출물에는 저장 후 다음을 두지 않는다", async () => {
    vi.mocked(api.getSubmissionDetail).mockResolvedValue(
      detail({ navigation: { current: 2, total: 2, prevSubmissionId: 3005, nextSubmissionId: null } }),
    );
    renderModal();
    await screen.findByText("이재민");

    expect(screen.queryByRole("button", { name: "저장 후 다음" })).not.toBeInTheDocument();
  });

  it("순차 탐색 위치와 이동을 보여준다", async () => {
    renderModal();
    await screen.findByText("이재민");

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    // 첫 제출물이라 이전은 누를 수 없다.
    expect(screen.getByRole("button", { name: "< 이전" })).toBeDisabled();

    // 푸터의 이동 버튼이다. 저장을 거치지 않고 그냥 넘어간다.
    await userEvent.click(screen.getByRole("button", { name: "다음 >" }));
    expect(onNavigate).toHaveBeenCalledWith(3006);
    expect(api.createFeedback).not.toHaveBeenCalled();
  });

  it("저장에 실패하면 이유를 보여주고 넘어가지 않는다", async () => {
    vi.mocked(api.createFeedback).mockRejectedValue({ code: "NOT_RESOURCE_OWNER", message: "?" });
    renderModal();
    await screen.findByText("이재민");

    await userEvent.type(newBox(), "좋습니다.");
    await userEvent.click(screen.getByRole("button", { name: "저장 후 다음" }));

    expect(await screen.findByText(/본인이 작성한 피드백만/)).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getSubmissionDetail).mockRejectedValue({ code: "SUBMISSION_NOT_FOUND", message: "?" });
    renderModal();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

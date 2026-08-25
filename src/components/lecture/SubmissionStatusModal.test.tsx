import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as groupsApi from "../../apis/group/groupsApi";
import * as api from "../../apis/lecture/lecturesApi";
import type { SubmissionBoard, SubmissionRow } from "../../types/lecture";

import { SubmissionStatusModal } from "./SubmissionStatusModal";

vi.mock("../../apis/lecture/lecturesApi");
vi.mock("../../apis/group/groupsApi");

function row(over: Partial<SubmissionRow> & { userId: number; userName: string }): SubmissionRow {
  return {
    major: "경영학과",
    submissionId: null,
    submitted: false,
    status: null,
    submittedAt: null,
    feedbackDone: false,
    ...over,
  };
}

const ROWS: SubmissionRow[] = [
  row({
    userId: 24,
    userName: "이재민",
    major: "컴퓨터공학과",
    submissionId: 3005,
    submitted: true,
    status: "SUBMITTED",
    submittedAt: "2026-06-04T20:11:00+09:00",
    feedbackDone: true,
  }),
  row({
    userId: 25,
    userName: "정하늘",
    submissionId: 3007,
    submitted: true,
    status: "LATE",
    submittedAt: "2026-06-07T01:20:00+09:00",
  }),
  row({ userId: 21, userName: "김지원" }),
];

function board(over: Partial<SubmissionBoard> = {}): SubmissionBoard {
  return {
    lecture: { id: 101, title: "HTML/CSS 기초", deadline: "2026-06-05T23:59:59+09:00" },
    counts: { submitted: 2, notSubmitted: 1, total: 3 },
    content: ROWS,
    page: 0,
    size: 50,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    ...over,
  };
}

const onClose = vi.fn();

function renderModal() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SubmissionStatusModal lectureId={101} onClose={onClose} />
    </QueryClientProvider>,
  );
}

/** 마지막 조회에 실린 파라미터. */
const lastParams = () => vi.mocked(api.getSubmissions).mock.lastCall?.[0];

/** 이름이 들어 있는 표의 행. */
async function rowOf(name: string): Promise<HTMLElement> {
  const tr = (await screen.findByText(name)).closest("tr");
  if (tr === null) throw new Error(`${name} 이(가) 표 안에 없습니다.`);
  return tr;
}

describe("SubmissionStatusModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getSubmissions).mockResolvedValue(board());
    vi.mocked(groupsApi.getGroups).mockResolvedValue({
      generationNo: 9,
      groups: [
        { id: 1, name: "1조", memberCount: 2, members: [] },
        { id: 2, name: "2조", memberCount: 2, members: [] },
      ],
      unassigned: [],
    });
  });

  it("미제출자도 행으로 보여준다", async () => {
    // user LEFT JOIN submission 이라 미제출자가 목록에서 빠지면 안 된다(명세서 8.6).
    renderModal();

    expect(await rowOf("김지원")).toHaveTextContent("미제출");
  });

  it("지각 제출을 제출과 구분해 보여준다", async () => {
    // 마감을 지킨 사람과 같이 두면 구분이 사라진다.
    renderModal();

    expect(await rowOf("정하늘")).toHaveTextContent("지각");
    expect(await rowOf("이재민")).not.toHaveTextContent("지각");
  });

  it("집계와 마감을 함께 보여준다", async () => {
    renderModal();

    const summary = await screen.findByText(/제출/, { selector: "p" });
    expect(summary).toHaveTextContent("제출 2");
    expect(summary).toHaveTextContent("미제출 1");
    expect(summary).toHaveTextContent("전체 3");
  });

  it("제출 여부 필터를 조회에 싣는다", async () => {
    renderModal();
    await screen.findByText("이재민");

    await userEvent.selectOptions(screen.getByLabelText("제출 여부"), "no");

    expect(lastParams()).toMatchObject({ lectureId: 101, submitted: false });
  });

  it("전체를 고르면 필터를 빼고 조회한다", async () => {
    // "all" 을 그대로 실으면 서버가 아무것도 없는 조건으로 읽는다.
    renderModal();
    await screen.findByText("이재민");

    await userEvent.selectOptions(screen.getByLabelText("피드백"), "yes");
    await userEvent.selectOptions(screen.getByLabelText("피드백"), "all");

    expect(lastParams()?.feedbackDone).toBeUndefined();
  });

  it("조 필터는 전체일 때 조회에 싣지 않는다", async () => {
    // 0 은 화면에서 쓰는 '전체' 값일 뿐 서버가 아는 조 id 가 아니다.
    renderModal();
    await screen.findByText("이재민");

    expect(lastParams()?.groupId).toBeUndefined();

    await userEvent.selectOptions(screen.getByLabelText("조"), "2");
    expect(lastParams()?.groupId).toBe(2);
  });

  it("조 목록을 필터 선택지로 보여준다", async () => {
    renderModal();

    expect(await screen.findByRole("option", { name: "1조" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2조" })).toBeInTheDocument();
  });

  it("필터를 바꾸면 첫 페이지로 되돌린다", async () => {
    // 3페이지를 보다 필터를 좁히면 있지도 않은 페이지를 요청하게 된다.
    vi.mocked(api.getSubmissions).mockResolvedValue(board({ totalPages: 3, totalElements: 120 }));
    renderModal();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(lastParams()?.page).toBe(1);

    await userEvent.selectOptions(screen.getByLabelText("제출 여부"), "yes");
    expect(lastParams()?.page).toBe(0);
  });

  it("조건에 맞는 부원이 없으면 빈 상태를 보여준다", async () => {
    vi.mocked(api.getSubmissions).mockResolvedValue(board({ content: [], totalElements: 0 }));
    renderModal();

    expect(await screen.findByText("조건에 맞는 부원이 없습니다.")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getSubmissions).mockRejectedValue({ code: "LECTURE_NOT_FOUND", message: "?" });
    renderModal();

    expect(await screen.findByRole("alert")).toHaveTextContent("강의를 찾을 수 없습니다");
  });

  it("모르는 코드에는 제출 현황 문구를 쓴다", async () => {
    // 강의 문구를 쓰면 "강의 목록을 불러오지 못했습니다" 가 떠서 목록 탓으로 읽힌다.
    vi.mocked(api.getSubmissions).mockRejectedValue({ code: "SOMETHING_NEW", message: "" });
    renderModal();

    expect(await screen.findByRole("alert")).toHaveTextContent("제출 현황을 불러오지 못했습니다.");
  });

  it("보던 페이지가 범위를 벗어나면 첫 페이지로 돌아갈 길을 준다", async () => {
    /*
      빈 페이지가 곧 "조건에 맞는 사람이 없다" 는 뜻은 아니다. 그렇게 말해 버리면
      이유를 오해하고, 돌아갈 방법도 사라진다.
    */
    vi.mocked(api.getSubmissions).mockResolvedValue(board({ content: [], totalElements: 120, totalPages: 3, page: 5 }));
    renderModal();

    expect(await screen.findByText(/이 페이지에는 부원이 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText("조건에 맞는 부원이 없습니다.")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "첫 페이지로" }));
    expect(lastParams()?.page).toBe(0);
  });

  it("조 목록을 못 받아도 현황은 보여준다", async () => {
    // 필터 선택지를 위한 부수적인 조회다. 이것 때문에 본 화면이 막히면 안 된다.
    vi.mocked(groupsApi.getGroups).mockRejectedValue({ code: "UNKNOWN", message: "?" });
    renderModal();

    expect(await screen.findByText("이재민")).toBeInTheDocument();
  });
});

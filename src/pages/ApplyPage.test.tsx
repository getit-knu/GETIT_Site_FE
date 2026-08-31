import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getForm, getMyApplication, getResult, saveDraft, submit } from "../apis/application/myApplicationApi";
import { getColleges, getMajors, getRecruitmentStatus } from "../apis/public/publicApi";
import type { ApplicationFormResult, ApplicationDecisionResult, MyApplicationResult } from "../types/application";
import type { College, Major } from "../types/college";
import type { RecruitmentStatus } from "../types/recruitment";

import ApplyPage from "./ApplyPage";

vi.mock("../apis/application/myApplicationApi");
vi.mock("../apis/public/publicApi");

const COLLEGES: College[] = [
  { id: 1, name: "경영대학" },
  { id: 2, name: "공과대학" },
];

const MAJORS: Major[] = [
  { id: 1, collegeId: 1, name: "경영학과" },
  { id: 2, collegeId: 2, name: "기계공학과" },
];

function form(over: Partial<ApplicationFormResult> = {}): ApplicationFormResult {
  return {
    generationNo: 9,
    phase: "DOCUMENT_OPEN",
    deadline: "2026-09-30T23:59:00+09:00",
    basicInfoPrefill: {
      name: "홍길동",
      email: "hong@getit.com",
      phoneNumber: null,
      collegeId: null,
      majorId: null,
      grade: null,
      studentNumber: null,
    },
    questions: [
      {
        id: 1,
        order: 1,
        type: "TEXT",
        content: "지원 동기는 무엇인가요?",
        placeholder: "자유롭게 작성해주세요.",
        required: true,
        maxLength: 300,
        options: null,
      },
      {
        id: 2,
        order: 2,
        type: "CHOICE",
        content: "선호하는 트랙은?",
        placeholder: null,
        required: true,
        maxLength: null,
        options: [
          { id: "opt-1", label: "SW" },
          { id: "opt-2", label: "창업" },
        ],
      },
      {
        id: 3,
        order: 3,
        type: "CHECKBOX",
        content: "개인정보 수집에 동의하시나요?",
        placeholder: null,
        required: true,
        maxLength: null,
        options: [{ id: "opt-1", label: "동의합니다" }],
      },
    ],
    ...over,
  };
}

function myApplication(over: Partial<MyApplicationResult> = {}): MyApplicationResult {
  return {
    id: 1,
    generationNo: 9,
    status: "DRAFT",
    basicInfo: {
      name: "김부원",
      email: "kim@getit.com",
      phoneNumber: "010-1234-5678",
      collegeId: 2,
      majorId: 2,
      grade: 3,
      studentNumber: "2021123456",
    },
    answers: [{ questionId: 1, answerText: "이미 써둔 동기입니다.", selectedOptions: null }],
    savedAt: "2026-09-01T00:00:00+09:00",
    submittedAt: null,
    ...over,
  };
}

function decision(over: Partial<ApplicationDecisionResult> = {}): ApplicationDecisionResult {
  return {
    generationNo: 9,
    status: "SUBMITTED",
    statusLabel: "심사 중",
    documentAnnouncedAt: "2026-09-15T00:00:00+09:00",
    finalAnnouncedAt: "2026-09-30T00:00:00+09:00",
    nextStep: null,
    ...over,
  };
}

function recruitmentStatus(over: Partial<RecruitmentStatus> = {}): RecruitmentStatus {
  return {
    generationNo: 9,
    year: 2026,
    phase: "DOCUMENT_OPEN",
    dDay: 5,
    message: "",
    applyEnabled: true,
    schedule: null,
    ...over,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/apply", element: <ApplyPage /> },
      { path: "/login", element: <p>로그인 페이지</p> },
    ],
    { initialEntries: ["/apply"] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

/**
 * 단과 대학 select의 실제 `<option>`이 뜰 때까지 기다린 뒤 렌더한다.
 *
 * `colleges` 쿼리가 아직 로딩 중이면 그 select엔 "선택해주세요" 옵션만 있다 —
 * 그 상태에서 `fireEvent.change`로 없는 value를 넣으면 네이티브 select가 조용히
 * 무시해서(값이 안 바뀜) 이후 단언이 전부 틀어진다. 옵션이 실제로 뜬 뒤에만 바꾼다.
 */
async function renderReadyPage() {
  const utils = renderPage();
  await screen.findByRole("option", { name: "경영대학" });
  return utils;
}

describe("ApplyPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getMyApplication).mockResolvedValue(null);
    vi.mocked(getForm).mockResolvedValue(form());
    vi.mocked(getColleges).mockResolvedValue(COLLEGES);
    vi.mocked(getMajors).mockResolvedValue(MAJORS);
    vi.mocked(getRecruitmentStatus).mockResolvedValue(recruitmentStatus());
  });

  it("지원서가 아직 없으면 양식 프리필로 폼을 채운다", async () => {
    await renderReadyPage();

    expect(screen.getByRole("heading", { name: "GETIT 지원하기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원서 작성" })).toBeInTheDocument();
    expect(screen.getByLabelText("이름 *")).toHaveValue("홍길동");
    expect(screen.getByLabelText("이메일 *")).toHaveValue("hong@getit.com");
  });

  it("이미 임시저장된 지원서가 있으면 그 값으로 이어쓴다", async () => {
    vi.mocked(getMyApplication).mockResolvedValue(myApplication());
    await renderReadyPage();

    expect(screen.getByLabelText("이름 *")).toHaveValue("김부원");
    expect(screen.getByLabelText("전화번호 *")).toHaveValue("010-1234-5678");
    expect(screen.getByLabelText("학년 *")).toHaveValue(3);
    expect(screen.getByLabelText("학번(10자) *")).toHaveValue("2021123456");
    expect(screen.getByLabelText("지원 동기는 무엇인가요? *")).toHaveValue("이미 써둔 동기입니다.");
  });

  it("문항을 BE가 준 순서·타입대로 렌더링한다", async () => {
    await renderReadyPage();

    expect(screen.getByLabelText("지원 동기는 무엇인가요? *")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "선호하는 트랙은? *" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "SW" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "동의합니다" })).toBeInTheDocument();
  });

  it("CHOICE 문항은 하나만 고를 수 있다", async () => {
    await renderReadyPage();

    const sw = screen.getByRole("radio", { name: "SW" });
    const startup = screen.getByRole("radio", { name: "창업" });

    await userEvent.click(sw);
    expect(sw).toBeChecked();

    await userEvent.click(startup);
    expect(sw).not.toBeChecked();
    expect(startup).toBeChecked();
  });

  it("단과 대학을 고르기 전엔 전공을 고를 수 없고, 고르면 그 대학의 전공만 보여준다", async () => {
    await renderReadyPage();

    const majorSelect = screen.getByLabelText("전공 *");
    expect(majorSelect).toBeDisabled();

    fireEvent.change(screen.getByLabelText("단과 대학 *"), { target: { value: "1" } });

    expect(majorSelect).not.toBeDisabled();
    expect(await screen.findByRole("option", { name: "경영학과" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "기계공학과" })).not.toBeInTheDocument();
  });

  it("단과 대학을 바꾸면 이미 고른 전공이 초기화된다", async () => {
    await renderReadyPage();

    const collegeSelect = screen.getByLabelText("단과 대학 *");
    const majorSelect = screen.getByLabelText("전공 *");

    fireEvent.change(collegeSelect, { target: { value: "1" } });
    await screen.findByRole("option", { name: "경영학과" });
    fireEvent.change(majorSelect, { target: { value: "1" } });
    expect(majorSelect).toHaveValue("1");

    fireEvent.change(collegeSelect, { target: { value: "2" } });
    expect(majorSelect).toHaveValue("0");
  });

  it("학번은 10자까지만 입력할 수 있다", async () => {
    await renderReadyPage();

    expect(screen.getByLabelText("학번(10자) *")).toHaveAttribute("maxlength", "10");
  });

  it("비로그인 상태에서도 모집 기간이 아니면 로그인부터 요구하지 않고 안내부터 보여준다", async () => {
    // #187과 같은 공개 엔드포인트로 모집 기간부터 먼저 본다 — 로그인이 필요한
    // `GET /api/applications/me`를 먼저 부르면 모집 기간이 아예 아닌데도
    // "로그인해 주세요"부터 뜨게 된다(0831 QA).
    vi.mocked(getRecruitmentStatus).mockResolvedValue(recruitmentStatus({ applyEnabled: false }));
    renderPage();

    expect(await screen.findByText("지금은 지원서 접수 기간이 아닙니다.")).toBeInTheDocument();
    expect(screen.queryByText("지원서를 작성하려면 먼저 로그인해 주세요.")).not.toBeInTheDocument();
    expect(getMyApplication).not.toHaveBeenCalled();
  });

  it("모집 기간이 아니면 안내만 보여주고 폼은 렌더링하지 않는다", async () => {
    vi.mocked(getForm).mockResolvedValue(form({ phase: "BEFORE_OPEN" }));
    renderPage();

    expect(await screen.findByText("지금은 지원서 접수 기간이 아닙니다.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "지원서 작성" })).not.toBeInTheDocument();
  });

  it("로그인이 안 되어 있으면 로그인 유도 화면을 보여준다", async () => {
    vi.mocked(getMyApplication).mockRejectedValue({ code: "UNAUTHORIZED", message: "?" });
    renderPage();

    expect(await screen.findByText("지원서를 작성하려면 먼저 로그인해 주세요.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "로그인하러 가기" });
    expect(link).toHaveAttribute("href", "/login");

    await userEvent.click(link);
    expect(await screen.findByText("로그인 페이지")).toBeInTheDocument();
  });

  it("그 외 조회 실패는 일반 오류로 보여준다", async () => {
    vi.mocked(getMyApplication).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("지원서를 볼 권한이 없습니다");
  });

  it("임시 저장을 누르면 현재 입력값을 그대로 보낸다", async () => {
    vi.mocked(saveDraft).mockResolvedValue({ id: 1, status: "DRAFT", savedAt: "2026-09-01T00:00:00+09:00" });
    await renderReadyPage();

    await userEvent.type(screen.getByLabelText("지원 동기는 무엇인가요? *"), "성장하고 싶어서 지원합니다.");
    await userEvent.click(screen.getByRole("button", { name: "임시 저장" }));

    await waitFor(() => expect(saveDraft).toHaveBeenCalled());
    const payload = vi.mocked(saveDraft).mock.lastCall?.[0];
    expect(payload?.basicInfo.name).toBe("홍길동");
    expect(payload?.answers.find((a) => a.questionId === 1)?.answerText).toBe("성장하고 싶어서 지원합니다.");
    expect(await screen.findByText("임시 저장했습니다.")).toBeInTheDocument();
  });

  it("필수 정보 · 문항이 비어 있으면 제출을 막고 이유를 보여준다", async () => {
    await renderReadyPage();

    const submitButton = screen.getByRole("button", { name: "제출하기" });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByText("이름 · 이메일 · 전화번호 · 단과 대학 · 전공 · 학년을 모두 입력해 주세요."),
    ).toBeInTheDocument();
  });

  it("전부 채우면 제출할 수 있고, 성공하면 결과 화면으로 바뀐다", async () => {
    // 제출 성공 후 useMyApplication이 다시 조회하면 이제는 SUBMITTED로 와야
    // 화면이 결과 보기로 바뀐다 — 실제 서버도 이렇게 상태가 바뀐다.
    vi.mocked(submit).mockImplementation(async () => {
      vi.mocked(getMyApplication).mockResolvedValue(myApplication({ status: "SUBMITTED" }));
      return { id: 1, status: "SUBMITTED", submittedAt: "2026-09-02T00:00:00+09:00" };
    });
    vi.mocked(getResult).mockResolvedValue(decision());
    await renderReadyPage();

    await userEvent.type(screen.getByLabelText("전화번호 *"), "010-0000-0000");
    fireEvent.change(screen.getByLabelText("단과 대학 *"), { target: { value: "1" } });
    await screen.findByRole("option", { name: "경영학과" });
    fireEvent.change(screen.getByLabelText("전공 *"), { target: { value: "1" } });
    await userEvent.type(screen.getByLabelText("학년 *"), "2");
    await userEvent.type(screen.getByLabelText("지원 동기는 무엇인가요? *"), "성장하고 싶어서 지원합니다.");
    await userEvent.click(screen.getByRole("radio", { name: "SW" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "동의합니다" }));

    const submitButton = screen.getByRole("button", { name: "제출하기" });
    expect(submitButton).not.toBeDisabled();
    await userEvent.click(submitButton);

    await waitFor(() => expect(submit).toHaveBeenCalled());
    const payload = vi.mocked(submit).mock.lastCall?.[0];
    expect(payload?.basicInfo.collegeId).toBe(1);
    expect(payload?.basicInfo.majorId).toBe(1);
    expect(payload?.basicInfo.grade).toBe(2);

    expect(await screen.findByRole("heading", { name: "심사 중" })).toBeInTheDocument();
  });

  it("임시 저장이 실패하면 이유를 보여준다", async () => {
    vi.mocked(saveDraft).mockRejectedValue({ code: "APPLICATION_DEADLINE_PASSED", message: "?" });
    await renderReadyPage();

    await userEvent.click(screen.getByRole("button", { name: "임시 저장" }));

    expect(await screen.findByText("지원서 제출 기한이 지났습니다.")).toBeInTheDocument();
  });
});

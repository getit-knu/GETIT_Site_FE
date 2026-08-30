import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getForm } from "../apis/application/myApplicationApi";
import { getColleges, getMajors } from "../apis/public/publicApi";
import type { ApplicationFormResult } from "../types/application";
import type { College, Major } from "../types/college";

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

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ApplyPage />
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
    vi.mocked(getForm).mockResolvedValue(form());
    vi.mocked(getColleges).mockResolvedValue(COLLEGES);
    vi.mocked(getMajors).mockResolvedValue(MAJORS);
  });

  it("헤더와 기본 정보 필드를 프리필된 값으로 렌더링한다", async () => {
    await renderReadyPage();

    expect(screen.getByRole("heading", { name: "GETIT 지원하기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원서 작성" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기본 정보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원 문항" })).toBeInTheDocument();

    expect(screen.getByLabelText("이름 *")).toHaveValue("홍길동");
    expect(screen.getByLabelText("이메일 *")).toHaveValue("hong@getit.com");

    for (const label of ["전화번호 *", "단과 대학 *", "전공 *", "학년 *", "학번(10자) *"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("문항을 BE가 준 순서·타입대로 렌더링한다", async () => {
    await renderReadyPage();

    expect(screen.getByLabelText("지원 동기는 무엇인가요? *")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "선호하는 트랙은? *" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "SW" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "창업" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "동의합니다" })).toBeInTheDocument();
  });

  it("TEXT 문항에 입력한 값이 그대로 반영된다", async () => {
    await renderReadyPage();

    const motivation = screen.getByLabelText("지원 동기는 무엇인가요? *");
    fireEvent.change(motivation, { target: { value: "성장하고 싶어서 지원합니다." } });

    expect(motivation).toHaveValue("성장하고 싶어서 지원합니다.");
  });

  it("CHOICE 문항은 하나만 고를 수 있다", async () => {
    await renderReadyPage();

    const sw = screen.getByRole("radio", { name: "SW" });
    const startup = screen.getByRole("radio", { name: "창업" });

    await userEvent.click(sw);
    expect(sw).toBeChecked();
    expect(startup).not.toBeChecked();

    await userEvent.click(startup);
    expect(sw).not.toBeChecked();
    expect(startup).toBeChecked();
  });

  it("CHECKBOX 문항은 체크를 켜고 끌 수 있다", async () => {
    await renderReadyPage();

    const consent = screen.getByRole("checkbox", { name: "동의합니다" });
    expect(consent).not.toBeChecked();

    await userEvent.click(consent);
    expect(consent).toBeChecked();

    await userEvent.click(consent);
    expect(consent).not.toBeChecked();
  });

  it("sticky footer에 임시 저장 · 제출하기 버튼이 있다", async () => {
    await renderReadyPage();

    expect(screen.getByRole("button", { name: "임시 저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "제출하기" })).toBeInTheDocument();
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

  it("학번은 10자까지만 입력할 수 있다", async () => {
    await renderReadyPage();

    expect(screen.getByLabelText("학번(10자) *")).toHaveAttribute("maxlength", "10");
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

  it("이미 채워진 기본 정보는 프리필 그대로 보여준다", async () => {
    vi.mocked(getForm).mockResolvedValue(
      form({
        basicInfoPrefill: {
          name: "김부원",
          email: "kim@getit.com",
          phoneNumber: "010-1234-5678",
          collegeId: 2,
          majorId: 2,
          grade: 3,
          studentNumber: "2021123456",
        },
      }),
    );
    renderPage();

    expect(await screen.findByLabelText("전화번호 *")).toHaveValue("010-1234-5678");
    expect(screen.getByLabelText("학년 *")).toHaveValue(3);
    expect(screen.getByLabelText("학번(10자) *")).toHaveValue("2021123456");
  });

  it("모집 기간이 아니면 안내만 보여주고 폼은 렌더링하지 않는다", async () => {
    vi.mocked(getForm).mockResolvedValue(form({ phase: "BEFORE_OPEN" }));
    renderPage();

    expect(await screen.findByText("지금은 지원서 접수 기간이 아닙니다.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "지원서 작성" })).not.toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(getForm).mockRejectedValue({ code: "UNAUTHORIZED", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("로그인이 필요합니다");
  });
});

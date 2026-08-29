import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getColleges, getMajors } from "../apis/public/publicApi";
import type { College, Major } from "../types/college";

import ApplyPage from "./ApplyPage";

vi.mock("../apis/public/publicApi");

const COLLEGES: College[] = [
  { id: 1, name: "경영대학" },
  { id: 2, name: "공과대학" },
];

const MAJORS: Major[] = [
  { id: 1, collegeId: 1, name: "경영학과" },
  { id: 2, collegeId: 2, name: "기계공학과" },
];

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
    vi.mocked(getColleges).mockResolvedValue(COLLEGES);
    vi.mocked(getMajors).mockResolvedValue(MAJORS);
  });

  it("헤더와 두 섹션의 필드를 모두 렌더링한다", async () => {
    await renderReadyPage();

    expect(screen.getByRole("heading", { name: "GETIT 지원하기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원서 작성" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기본 정보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "지원 동기 및 경험" })).toBeInTheDocument();

    for (const label of ["이름 *", "이메일 *", "전화번호 *", "단과 대학 *", "전공 *", "학번(10자) *"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("GETIT에 지원하게 된 동기는 무엇인가요? *")).toBeInTheDocument();
    expect(screen.getByLabelText("프로그래밍 경험이 있다면 간단히 설명해주세요")).toBeInTheDocument();
    expect(screen.getByLabelText("GETIT에서 어떤 프로젝트를 하고 싶으신가요? *")).toBeInTheDocument();
    expect(screen.getByLabelText("궁금한 점이나 하고 싶은 말이 있다면 자유롭게 작성해주세요")).toBeInTheDocument();

    // 실제 데이터로 드롭다운이 채워지는지도 함께 확인한다.
    fireEvent.change(screen.getByLabelText("단과 대학 *"), { target: { value: "1" } });
    expect(await screen.findByRole("option", { name: "경영학과" })).toBeInTheDocument();
  });

  it("입력한 값이 필드에 그대로 반영된다", () => {
    renderPage();

    const nameInput = screen.getByLabelText("이름 *");
    fireEvent.change(nameInput, { target: { value: "홍길동" } });

    expect(nameInput).toHaveValue("홍길동");
  });

  it("sticky footer에 임시 저장 · 제출하기 버튼이 있다", () => {
    renderPage();

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

  it("학번은 10자까지만 입력할 수 있다", () => {
    renderPage();

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
});

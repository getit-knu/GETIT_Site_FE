import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../apis/site/siteApi";
import type { Curriculum } from "../../../types/site";

import { CurriculumsSection } from "./CurriculumsSection";

vi.mock("../../../apis/site/siteApi");

const CURRICULUMS: Curriculum[] = [
  { id: 1, order: 1, title: "HTML/CSS", subtitle: "웹 기초" },
  { id: 2, order: 2, title: "React", subtitle: "컴포넌트" },
];

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <CurriculumsSection generationId={9} />
    </QueryClientProvider>,
  );
}

describe("CurriculumsSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getCurriculums).mockResolvedValue(CURRICULUMS);
    vi.mocked(api.deleteCurriculum).mockResolvedValue();
  });

  it("목록을 보여준다", async () => {
    renderSection();
    expect(await screen.findByText("HTML/CSS")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("빈 목록은 안내를 보여준다", async () => {
    vi.mocked(api.getCurriculums).mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText("등록된 커리큘럼이 없습니다.")).toBeInTheDocument();
  });

  it("제목이나 부제가 비면 저장을 막는다", async () => {
    renderSection();
    await screen.findByText("HTML/CSS");

    await userEvent.click(screen.getByRole("button", { name: "+ 커리큘럼 추가" }));

    expect(screen.getByText("제목을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("추가는 다음 순번과 기수 id 를 실어 보낸다", async () => {
    vi.mocked(api.createCurriculum).mockResolvedValue({ id: 3, order: 3, title: "새 커리큘럼", subtitle: "설명" });
    renderSection();
    await screen.findByText("HTML/CSS");

    await userEvent.click(screen.getByRole("button", { name: "+ 커리큘럼 추가" }));
    await userEvent.type(screen.getByLabelText("제목 *"), "새 커리큘럼");
    await userEvent.type(screen.getByLabelText("부제 *"), "설명");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createCurriculum).toHaveBeenCalled());
    expect(vi.mocked(api.createCurriculum).mock.lastCall?.[0]).toEqual({
      generationId: 9,
      title: "새 커리큘럼",
      subtitle: "설명",
      order: 3,
    });
  });

  it("수정은 그 항목의 id 로 보낸다", async () => {
    vi.mocked(api.updateCurriculum).mockResolvedValue({ id: 1, order: 1, title: "HTML/CSS!", subtitle: "웹 기초" });
    renderSection();
    await screen.findByText("HTML/CSS");

    await userEvent.click(screen.getAllByRole("button", { name: "수정" })[0]);
    await userEvent.type(screen.getByLabelText("제목 *"), "!");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(api.updateCurriculum).toHaveBeenCalled());
    expect(vi.mocked(api.updateCurriculum).mock.lastCall?.[0]).toBe(1);
  });

  it("삭제는 확인을 묻고, 확인하면 지운다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderSection();
    await screen.findByText("HTML/CSS");

    await userEvent.click(screen.getAllByRole("button", { name: "삭제" })[0]);

    expect(api.deleteCurriculum).toHaveBeenCalledWith(1);
    vi.unstubAllGlobals();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getCurriculums).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});

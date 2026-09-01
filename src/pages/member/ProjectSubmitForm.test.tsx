import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { submitProject } from "../../apis/project/memberProjectsApi";
import type { MemberProject } from "../../types/project";

import { ProjectSubmitForm } from "./ProjectSubmitForm";

vi.mock("../../apis/project/memberProjectsApi");
vi.mock("../../apis/file/filesApi");

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectSubmitForm />
    </QueryClientProvider>,
  );
}

const RESULT: MemberProject = {
  id: 10,
  title: "AI 포트폴리오",
  teamName: "1조",
  semester: "2026-FALL",
  description: "설명",
  techStacks: ["Python"],
  codeUrl: "",
  demoUrl: "",
  fileId: 0,
  thumbnailUrl: "",
  status: "PENDING",
  statusLabel: "승인 대기",
  rejectReason: null,
};

describe("ProjectSubmitForm", () => {
  it("제목이 비면 등록을 막는다", async () => {
    renderForm();

    expect(screen.getByText("제목을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "프로젝트 등록" })).toBeDisabled();
  });

  it("팀 이름 · 공개 여부 · 순서 입력칸이 없다 — 서버가 정한다", () => {
    renderForm();

    expect(screen.queryByLabelText(/팀 이름|순서/)).not.toBeInTheDocument();
    expect(screen.queryByText("Home 화면에 소개")).not.toBeInTheDocument();
  });

  it("URL을 비우고 등록하면 빈 문자열이 아니라 아예 안 보낸다", async () => {
    // 빈 문자열("")은 BE @HttpUrl 형식 검증(http/https만 허용)에 걸려 400이 난다 — null은 통과.
    vi.mocked(submitProject).mockResolvedValue(RESULT);
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    await waitFor(() => expect(submitProject).toHaveBeenCalled());
    const payload = vi.mocked(submitProject).mock.lastCall?.[0];
    expect(payload?.codeUrl).toBeUndefined();
    expect(payload?.demoUrl).toBeUndefined();
  });

  it("올바른 URL이 아니면 등록을 막는다", async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.type(screen.getByLabelText("코드 저장소 URL"), "안녕");

    expect(screen.getByText("코드 저장소 URL 형식이 올바르지 않습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "프로젝트 등록" })).toBeDisabled();
  });

  it("등록하면 title · semester를 조립해 보내고, 성공 안내를 보여준다", async () => {
    vi.mocked(submitProject).mockResolvedValue(RESULT);
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.type(screen.getByLabelText("코드 저장소 URL"), "https://github.com/team/repo");
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    await waitFor(() => expect(submitProject).toHaveBeenCalled());
    expect(vi.mocked(submitProject).mock.lastCall?.[0]).toMatchObject({
      title: "AI 포트폴리오",
      semester: expect.stringMatching(/^\d{4}-SPRING$/),
      codeUrl: "https://github.com/team/repo",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("관리자 승인 후 공개됩니다");
  });

  it("등록에 실패하면 이유를 보여준다", async () => {
    vi.mocked(submitProject).mockRejectedValue({ code: "NOT_ASSIGNED_TO_GROUP", message: "?" });
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    expect(await screen.findByText("소속된 조가 있어야 프로젝트를 등록할 수 있습니다.")).toBeInTheDocument();
  });
});

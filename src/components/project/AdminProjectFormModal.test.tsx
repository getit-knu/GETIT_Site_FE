import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/project/projectsApi";
import type { AdminProject } from "../../types/project";

import { AdminProjectFormModal } from "./AdminProjectFormModal";

vi.mock("../../apis/project/projectsApi");
vi.mock("../../apis/file/filesApi");

function project(over: Partial<AdminProject> = {}): AdminProject {
  return {
    id: 1,
    title: "AI 포트폴리오 추천 시스템",
    teamName: "Team Alpha",
    semester: "2026-FALL",
    description: "설명",
    techStacks: ["Python", "React"],
    codeUrl: "https://github.com/getit-knu/ai-portfolio",
    demoUrl: "https://ai-portfolio.getit-knu.dev",
    fileId: 501,
    thumbnailUrl: "https://cdn/thumb.png",
    isFeatured: true,
    order: 3,
    status: "APPROVED",
    statusLabel: "공개",
    ...over,
  };
}

function renderModal(target: AdminProject | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AdminProjectFormModal project={target} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

const submit = () => screen.getByRole("button", { name: /^(추가|저장)$/ });
const titleBox = () => screen.getByLabelText("제목 *");

describe("AdminProjectFormModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.createProject).mockResolvedValue(project());
    vi.mocked(api.updateProject).mockResolvedValue(project());
  });

  it("추가 모드는 빈 폼을 보여준다", () => {
    renderModal(null);

    expect(screen.getByRole("heading", { name: "프로젝트 추가" })).toBeInTheDocument();
    expect(titleBox()).toHaveValue("");
  });

  it("수정 모드는 목록 행 값을 연도 · 학기로 나눠 채운다", () => {
    renderModal(project());

    expect(screen.getByRole("heading", { name: "프로젝트 수정" })).toBeInTheDocument();
    expect(titleBox()).toHaveValue("AI 포트폴리오 추천 시스템");
    expect(screen.getByLabelText("연도 *")).toHaveValue(2026);
    expect(screen.getByRole("combobox", { name: "학기" })).toHaveTextContent("가을");
    expect(screen.getByLabelText("기술 스택 (쉼표로 구분)")).toHaveValue("Python, React");
  });

  it("제목이 비면 저장할 수 없다", () => {
    renderModal(null);

    expect(screen.getByText("제목을 입력해 주세요.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("연도가 4자리가 아니면 저장을 막는다", async () => {
    renderModal(null);
    await userEvent.type(titleBox(), "새 프로젝트");
    await userEvent.type(screen.getByLabelText("팀 이름 *"), "새 팀");

    await userEvent.clear(screen.getByLabelText("연도 *"));
    await userEvent.type(screen.getByLabelText("연도 *"), "26");

    expect(screen.getByText("연도를 올바르게 입력해 주세요.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("URL 형식이 틀리면 저장할 수 없다", async () => {
    renderModal(null);
    await userEvent.type(titleBox(), "새 프로젝트");
    await userEvent.type(screen.getByLabelText("팀 이름 *"), "새 팀");
    await userEvent.type(screen.getByLabelText("코드 저장소 URL"), "not-a-url");

    expect(screen.getByText("코드 저장소 URL 형식이 올바르지 않습니다.")).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("연도 · 학기를 조립해 semester 로 저장한다", async () => {
    renderModal(null);
    await userEvent.type(titleBox(), "새 프로젝트");
    await userEvent.type(screen.getByLabelText("팀 이름 *"), "새 팀");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "학기" }), "겨울");
    await userEvent.click(submit());

    await waitFor(() => expect(api.createProject).toHaveBeenCalled());
    expect(vi.mocked(api.createProject).mock.lastCall?.[0]).toMatchObject({
      semester: `${new Date().getFullYear()}-WINTER`,
    });
  });

  it("기술 스택은 쉼표로 나눠 배열로 보낸다", async () => {
    renderModal(null);
    await userEvent.type(titleBox(), "새 프로젝트");
    await userEvent.type(screen.getByLabelText("팀 이름 *"), "새 팀");
    await userEvent.type(screen.getByLabelText("기술 스택 (쉼표로 구분)"), "Python, TensorFlow ,React");
    await userEvent.click(submit());

    await waitFor(() => expect(api.createProject).toHaveBeenCalled());
    expect(vi.mocked(api.createProject).mock.lastCall?.[0].techStacks).toEqual(["Python", "TensorFlow", "React"]);
  });

  it("순서를 비우면 order 를 아예 보내지 않는다", async () => {
    renderModal(project());
    await userEvent.click(submit());

    await waitFor(() => expect(api.updateProject).toHaveBeenCalled());
    const [, payload] = vi.mocked(api.updateProject).mock.lastCall!;
    expect(payload).toMatchObject({ order: 3 });

    vi.mocked(api.updateProject).mockClear();
    await userEvent.clear(screen.getByLabelText("순서"));
    await userEvent.click(submit());

    await waitFor(() => expect(api.updateProject).toHaveBeenCalled());
    expect(vi.mocked(api.updateProject).mock.lastCall?.[1]).not.toHaveProperty("order");
  });

  it("썸네일을 손대지 않고 저장하면 fileId 가 null 로 나간다 — BE 한계 안내를 함께 보여준다", async () => {
    renderModal(project());

    expect(screen.getByText("썸네일을 다시 올리지 않고 저장하면 기존 썸네일이 사라집니다.")).toBeInTheDocument();

    await userEvent.click(submit());

    await waitFor(() => expect(api.updateProject).toHaveBeenCalled());
    expect(vi.mocked(api.updateProject).mock.lastCall?.[1]).toMatchObject({ fileId: null });
  });
});

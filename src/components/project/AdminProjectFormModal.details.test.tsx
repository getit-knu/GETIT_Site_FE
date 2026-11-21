import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getGroups } from "../../apis/group/groupsApi";
import * as api from "../../apis/project/projectsApi";
import { NO_PROJECT_DETAILS, noProjectImages } from "../../mocks/projectDetails";
import type { AdminProject } from "../../types/project";

import { AdminProjectFormModal } from "./AdminProjectFormModal";

vi.mock("../../apis/project/projectsApi");
vi.mock("../../apis/file/filesApi");
vi.mock("../../apis/group/groupsApi");

function project(over: Partial<AdminProject> = {}): AdminProject {
  return {
    id: 1,
    title: "AI 포트폴리오 추천 시스템",
    teamName: "Team Alpha",
    semester: "2026-FALL",
    description: "설명",
    techStacks: [],
    codeUrl: "https://github.com/getit-knu/ai-portfolio",
    demoUrl: "https://ai-portfolio.getit-knu.dev",
    fileId: null,
    thumbnailUrl: "",
    ...NO_PROJECT_DETAILS,
    ...noProjectImages(),
    isFeatured: false,
    order: 1,
    status: "APPROVED",
    statusLabel: "공개",
    rejectReason: null,
    festaEntry: false,
    festaOrder: null,
    groupId: null,
    ...over,
  };
}

function renderModal(target: AdminProject) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AdminProjectFormModal project={target} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

const submit = () => screen.getByRole("button", { name: "저장" });

describe("AdminProjectFormModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.updateProject).mockResolvedValue(project());
    vi.mocked(getGroups).mockResolvedValue({ generationNo: 9, groups: [], unassigned: [] });
  });

  describe("한 줄 소개·진행 상태·스토어 링크 (#389)", () => {
    it("기존 값을 채워 보여주고, 바꾸거나 비운 값을 보낸다", async () => {
      renderModal(
        project({
          oneLiner: "예전 소개",
          progressStatus: "IN_PROGRESS",
          progressStatusLabel: "개발 중",
          playStoreUrl: "https://play.google.com/store/apps/details?id=a",
        }),
      );
      expect(screen.getByLabelText("한 줄 소개")).toHaveValue("예전 소개");
      expect(screen.getByLabelText("진행 상태")).toHaveValue("IN_PROGRESS");

      await userEvent.clear(screen.getByLabelText("한 줄 소개"));
      await userEvent.type(screen.getByLabelText("한 줄 소개"), "새 소개");
      await userEvent.selectOptions(screen.getByLabelText("진행 상태"), "서비스 중");
      await userEvent.clear(screen.getByLabelText("Google Play 링크"));
      await userEvent.type(screen.getByLabelText("App Store 링크"), "https://apps.apple.com/kr/app/id1");
      await userEvent.click(submit());

      await waitFor(() => expect(api.updateProject).toHaveBeenCalled());
      expect(vi.mocked(api.updateProject).mock.lastCall?.[1]).toMatchObject({
        oneLiner: "새 소개",
        progressStatus: "LIVE",
        playStoreUrl: null,
        appStoreUrl: "https://apps.apple.com/kr/app/id1",
      });
    });

    it("스토어 링크가 http(s)가 아니면 저장을 막는다", async () => {
      renderModal(project());
      await userEvent.type(screen.getByLabelText("App Store 링크"), "apps.apple.com");

      expect(submit()).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent(
        "App Store 링크는 http:// 또는 https:// 로 시작해야 합니다.",
      );
    });
  });

  it("코드·데모 URL과 설명이 비어 있는(null) 프로젝트도 수정 창이 열리고 저장된다 (#395)", async () => {
    renderModal(project({ codeUrl: null, demoUrl: null, description: null }));

    expect(screen.getByLabelText("코드 저장소 URL")).toHaveValue("");
    expect(screen.getByLabelText("데모 URL")).toHaveValue("");
    await userEvent.click(submit());

    await waitFor(() => expect(api.updateProject).toHaveBeenCalled());
    const payload = vi.mocked(api.updateProject).mock.lastCall?.[1];
    expect(payload?.codeUrl).toBeUndefined();
    expect(payload?.demoUrl).toBeUndefined();
    expect(payload?.description).toBe("");
  });
});

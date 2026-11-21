import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { getDownloadUrl, uploadFile, uploadInvalidReason } from "../../apis/file/filesApi";
import { submitProject } from "../../apis/project/memberProjectsApi";
import type { MemberProject } from "../../types/project";
import { NO_PROJECT_DETAILS, noProjectImages } from "../../mocks/projectDetails";

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
  ...NO_PROJECT_DETAILS,
  ...noProjectImages(),
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

  it("프로젝트 이미지를 올리면 galleryFileIds 로 함께 등록한다 (#382)", async () => {
    vi.mocked(submitProject).mockResolvedValue(RESULT);
    vi.mocked(uploadInvalidReason).mockReturnValue(null);
    vi.mocked(uploadFile).mockResolvedValue({ fileId: 77, fileName: "a.png", size: 1 });
    Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:preview"), configurable: true });
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.upload(
      screen.getByLabelText("프로젝트 이미지 올리기"),
      new File(["x"], "a.png", { type: "image/png" }),
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "프로젝트 등록" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    await waitFor(() => expect(submitProject).toHaveBeenCalled());
    expect(vi.mocked(uploadFile).mock.lastCall?.[1]).toBe("PROJECT_IMAGE");
    expect(vi.mocked(submitProject).mock.lastCall?.[0]).toMatchObject({ galleryFileIds: [77] });
  });

  it("설명에 이미지를 넣으면 마크다운과 descriptionImageFileIds 로 함께 등록한다 (#385)", async () => {
    vi.mocked(submitProject).mockResolvedValue(RESULT);
    vi.mocked(uploadInvalidReason).mockReturnValue(null);
    vi.mocked(uploadFile).mockResolvedValue({ fileId: 88, fileName: "diagram.png", size: 1 });
    vi.mocked(getDownloadUrl).mockResolvedValue({
      downloadUrl: "https://api.getit.io.kr/api/public/files/public/d.png",
      fileName: "diagram.png",
      contentType: "image/png",
      expiresIn: -1,
    });
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.upload(
      await screen.findByLabelText("설명에 넣을 이미지"),
      new File(["x"], "diagram.png", { type: "image/png" }),
    );
    await waitFor(() => expect(getDownloadUrl).toHaveBeenCalledWith(88));
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    await waitFor(() => expect(submitProject).toHaveBeenCalled());
    expect(vi.mocked(submitProject).mock.lastCall?.[0]).toMatchObject({
      description: expect.stringContaining("![diagram](https://api.getit.io.kr/api/public/files/public/d.png)"),
      descriptionImageFileIds: [88],
    });
  });

  it("한 줄 소개·진행 상태를 함께 등록하고, 비운 스토어 링크는 보내지 않는다 (#389)", async () => {
    vi.mocked(submitProject).mockResolvedValue(RESULT);
    renderForm();

    await userEvent.type(screen.getByLabelText("제목 *"), "AI 포트폴리오");
    await userEvent.type(screen.getByLabelText("한 줄 소개"), "포트폴리오를 추천해요");
    await userEvent.selectOptions(screen.getByLabelText("진행 상태"), "개발 중");
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    await waitFor(() => expect(submitProject).toHaveBeenCalled());
    const payload = vi.mocked(submitProject).mock.lastCall?.[0];
    expect(payload).toMatchObject({ oneLiner: "포트폴리오를 추천해요", progressStatus: "IN_PROGRESS" });
    // undefined 는 JSON 에서 빠진다 — 생략이 곧 null 이다.
    expect(payload?.playStoreUrl).toBeUndefined();
    expect(payload?.appStoreUrl).toBeUndefined();
  });
});

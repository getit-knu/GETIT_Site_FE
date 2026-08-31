import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe, updateMe } from "../apis/auth/authApi";
import * as filesApi from "../apis/file/filesApi";
import type { Me } from "../types/auth";

import MyPage from "./MyPage";

vi.mock("../apis/auth/authApi");
vi.mock("../apis/file/filesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

const MEMBER: Me = {
  id: 1,
  email: "member@getit.com",
  name: "김부원",
  phoneNumber: null,
  college: "경영대학",
  major: "경영학과",
  studentYear: 21,
  studentNumber: null,
  profileImageUrl: null,
  role: "MEMBER",
  generationNo: 9,
  status: "ACTIVE",
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyPage />
    </QueryClientProvider>,
  );
}

describe("MyPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("로그인한 사용자의 프로필을 렌더링한다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    renderPage();

    expect(await screen.findByRole("heading", { name: "김부원" })).toBeInTheDocument();
    expect(screen.getByText("경영학과 21학번")).toBeInTheDocument();
    expect(screen.getByText("member@getit.com")).toBeInTheDocument();
    expect(screen.getByText("김")).toBeInTheDocument();
  });

  it("세션 판정이 끝나기 전에는 아무것도 그리지 않는다", () => {
    vi.mocked(getMe).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();

    expect(container).toBeEmptyDOMElement();
  });

  it("수정을 누르면 이름 · 전화번호 · 프로필 사진 입력칸이 나온다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "수정" }));

    expect(screen.getByLabelText("이름 *")).toHaveValue("김부원");
    expect(screen.getByLabelText("전화번호")).toHaveValue("");
    expect(screen.getByLabelText("프로필 사진 올리기")).toBeInTheDocument();
    // 학과 · 학번 · 기수 · 권한은 자기 수정 대상이 아니다(BE 확인함) — 입력칸이 없어야 한다.
    expect(screen.queryByLabelText(/학과|학번|기수/)).not.toBeInTheDocument();
  });

  it("이름이 비면 저장을 막는다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "수정" }));

    await userEvent.clear(screen.getByLabelText("이름 *"));

    expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("저장하면 이름 · 전화번호를 실어 보내고 조회 화면으로 돌아간다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    vi.mocked(updateMe).mockResolvedValue({ ...MEMBER, name: "김부원2", phoneNumber: "010-1234-5678" });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "수정" }));

    await userEvent.type(screen.getByLabelText("이름 *"), "2");
    await userEvent.type(screen.getByLabelText("전화번호"), "010-1234-5678");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(updateMe).toHaveBeenCalledWith({ name: "김부원2", phoneNumber: "010-1234-5678", profileFileId: null }),
    );
    expect(await screen.findByRole("heading", { name: "김부원2" })).toBeInTheDocument();
  });

  it("사진을 올리면 fileId를 함께 실어 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    vi.mocked(updateMe).mockResolvedValue(MEMBER);
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 701, fileName: "프사.png", size: 1024 });
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn().mockReturnValue("blob:preview") });
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "수정" }));

    await userEvent.upload(
      screen.getByLabelText("프로필 사진 올리기"),
      new File(["x"], "프사.png", { type: "image/png" }),
    );
    await waitFor(() => expect(filesApi.uploadFile).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(updateMe).toHaveBeenCalledWith({ name: "김부원", phoneNumber: null, profileFileId: 701 }),
    );
    vi.unstubAllGlobals();
  });

  it("취소하면 입력값을 버리고 조회 화면으로 돌아간다", async () => {
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "수정" }));

    await userEvent.type(screen.getByLabelText("이름 *"), "지운이름");
    await userEvent.click(screen.getByRole("button", { name: "취소" }));

    expect(screen.getByRole("heading", { name: "김부원" })).toBeInTheDocument();
    expect(updateMe).not.toHaveBeenCalled();
  });
});

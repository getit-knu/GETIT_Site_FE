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

  it("소속에 단과대와 학과를 함께 보여준다", async () => {
    // 그동안 college 를 받아 놓고 화면에서 버려, 어드민 표와 같은 사람의 소속이 달라 보였다.
    vi.mocked(getMe).mockResolvedValue(MEMBER);
    renderPage();

    expect(await screen.findByLabelText("소속")).toHaveTextContent(/^경영대학 경영학과$/);
  });

  it("소속이 한쪽만 있으면 있는 것만 보여준다", async () => {
    vi.mocked(getMe).mockResolvedValue({ ...MEMBER, college: null });
    renderPage();

    expect(await screen.findByLabelText("소속")).toHaveTextContent(/^경영학과$/);
  });

  it("소속이 아예 없으면 - 로 보여준다", async () => {
    /*
      승격 때 지원서의 단과대·학과가 넘어오지 않아 지금은 이 경우가 흔하다
      (getit-knu/GETIT_Site_BE#184). 화면이 깨지지 않아야 한다.

      "- 가 화면에 있다" 로는 부족하다. 이 fixture 는 전화번호도 비어 있어 그쪽도 - 라,
      엉뚱한 칸이 - 여도 통과해 버린다. 값에 aria-labelledby 로 레이블이 걸려 있으니
      항목을 지목해 확인한다.
    */
    vi.mocked(getMe).mockResolvedValue({ ...MEMBER, college: null, major: null });
    renderPage();

    expect(await screen.findByLabelText("소속")).toHaveTextContent(/^-$/);
  });

  it("학과가 없어도 학번은 그대로 보여준다", async () => {
    // 전에는 둘 다 있어야만 부제를 그려, 학과가 비면 학번까지 통째로 사라졌다.
    vi.mocked(getMe).mockResolvedValue({ ...MEMBER, college: null, major: null });
    renderPage();

    expect(await screen.findByText("21학번")).toBeInTheDocument();
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

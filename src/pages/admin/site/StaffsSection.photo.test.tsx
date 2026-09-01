import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../../apis/file/filesApi";
import * as api from "../../../apis/site/siteApi";
import type { Staff } from "../../../types/site";

import { StaffsSection } from "./StaffsSection";

vi.mock("../../../apis/site/siteApi");
vi.mock("../../../apis/file/filesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

/**
 * 운영진 프로필 사진(#269). 폼 자체의 동작은 `StaffsSection.test.tsx` 에 있다 —
 * 한 파일이 300 줄을 넘지 않게 사진 쪽만 떼어 뒀다.
 */

function staff(over: Partial<Staff> & { id: number; name: string }): Staff {
  return {
    userId: null,
    staffRole: "SW 운영진",
    section: "SW",
    department: "컴퓨터공학과 21",
    introduction: "",
    profileImageUrl: null,
    fileId: null,
    githubUrl: null,
    instagramUrl: null,
    order: 1,
    generationNo: 9,
    ...over,
  };
}

function image(name: string, bytes = 1024): File {
  const f = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

/** 저장을 막지 않을 만큼만 채운다. */
async function fillRequired(name: string) {
  await userEvent.type(screen.getByLabelText("이름 *"), name);
  await userEvent.type(screen.getByLabelText("직책 *"), "SW 운영진");
  await userEvent.type(screen.getByLabelText("학과 · 학번 *"), "컴퓨터공학과 21");
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <StaffsSection generationNo={9} />
    </QueryClientProvider>,
  );
}

describe("StaffsSection 프로필 사진", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getStaffs).mockResolvedValue([staff({ id: 3, name: "이재민" })]);
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 77, fileName: "얼굴.png", size: 1024 });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("사진을 올려 추가하면 그 fileId 를 실어 보낸다", async () => {
    vi.mocked(api.createStaff).mockResolvedValue(staff({ id: 9, name: "새 운영진" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    await fillRequired("새 운영진");
    await userEvent.upload(screen.getByLabelText("프로필 사진"), image("얼굴.png"));
    await waitFor(() => expect(filesApi.uploadFile).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createStaff).toHaveBeenCalled());
    expect(vi.mocked(api.createStaff).mock.lastCall?.[0]).toMatchObject({ fileId: 77 });
  });

  it("사진 없이도 추가할 수 있다", async () => {
    // 운영진 사진은 선택 항목이다(BE `fileId` 선택).
    vi.mocked(api.createStaff).mockResolvedValue(staff({ id: 9, name: "새 운영진" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    await fillRequired("새 운영진");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createStaff).toHaveBeenCalled());
    expect(vi.mocked(api.createStaff).mock.lastCall?.[0]).toMatchObject({ fileId: null });
  });

  it("사진을 건드리지 않고 수정하면 원래 fileId 를 그대로 보낸다", async () => {
    /*
      수정(10.21)은 `fileId` 를 통째로 덮어쓴다. 그대로 실어 보내지 않으면 직책만 고쳐도
      사진이 지워진다.
    */
    vi.mocked(api.getStaffs).mockResolvedValue([
      staff({ id: 3, name: "이재민", fileId: 42, profileImageUrl: "https://cdn/lee.png" }),
    ]);
    vi.mocked(api.updateStaff).mockResolvedValue(staff({ id: 3, name: "이재민!" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    await userEvent.type(screen.getByLabelText("이름 *"), "!");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(api.updateStaff).toHaveBeenCalled());
    expect(vi.mocked(api.updateStaff).mock.lastCall?.[1]).toMatchObject({ fileId: 42 });
  });

  it("사진을 제거하고 저장하면 null 을 보낸다", async () => {
    vi.mocked(api.getStaffs).mockResolvedValue([
      staff({ id: 3, name: "이재민", fileId: 42, profileImageUrl: "https://cdn/lee.png" }),
    ]);
    vi.mocked(api.updateStaff).mockResolvedValue(staff({ id: 3, name: "이재민" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    await userEvent.click(screen.getByRole("button", { name: "제거" }));
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(api.updateStaff).toHaveBeenCalled());
    expect(vi.mocked(api.updateStaff).mock.lastCall?.[1]).toMatchObject({ fileId: null });
  });

  it("서버가 fileId 를 안 주면 사진 있는 운영진의 저장을 막는다", async () => {
    /*
      BE#187 전 상태다. 모르는 값을 `null` 로 보내면 서버가 사진을 지운다 —
      지우느니 막고 무엇을 해야 하는지 알린다. 값이 오기 시작하면 이 검사는 저절로 통과한다.
    */
    vi.mocked(api.getStaffs).mockResolvedValue([
      staff({ id: 3, name: "이재민", fileId: undefined, profileImageUrl: "https://cdn/lee.png" }),
    ]);
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));

    expect(screen.getByText(/등록된 사진 정보를 불러오지 못했습니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("fileId 를 몰라도 사진을 다시 올리면 저장할 수 있다", async () => {
    vi.mocked(api.getStaffs).mockResolvedValue([
      staff({ id: 3, name: "이재민", fileId: undefined, profileImageUrl: "https://cdn/lee.png" }),
    ]);
    vi.mocked(api.updateStaff).mockResolvedValue(staff({ id: 3, name: "이재민" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));
    await userEvent.upload(screen.getByLabelText("프로필 사진"), image("얼굴.png"));

    await waitFor(() => expect(screen.getByRole("button", { name: "저장" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(api.updateStaff).toHaveBeenCalled());
    expect(vi.mocked(api.updateStaff).mock.lastCall?.[1]).toMatchObject({ fileId: 77 });
  });

  it("사진이 없는 운영진은 fileId 를 몰라도 막지 않는다", async () => {
    // 지킬 사진이 없으니 `null` 을 보내도 잃을 것이 없다.
    vi.mocked(api.getStaffs).mockResolvedValue([
      staff({ id: 3, name: "이재민", fileId: undefined, profileImageUrl: null }),
    ]);
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));

    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled();
  });

  it("목록에 등록된 사진을 보여준다", async () => {
    vi.mocked(api.getStaffs).mockResolvedValue([
      staff({ id: 3, name: "이재민", fileId: 42, profileImageUrl: "https://cdn/lee.png" }),
    ]);
    renderSection();
    await screen.findByText("이재민");

    expect(screen.getByRole("presentation")).toHaveAttribute("src", "https://cdn/lee.png");
  });
});

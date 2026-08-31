import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../../apis/file/filesApi";
import * as api from "../../../apis/site/siteApi";
import type { ActivityPhoto } from "../../../types/site";

import { ActivityPhotosSection } from "./ActivityPhotosSection";

vi.mock("../../../apis/site/siteApi");
vi.mock("../../../apis/file/filesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

function photo(over: Partial<ActivityPhoto> = {}): ActivityPhoto {
  return { id: 1, fileId: 501, imageUrl: "https://cdn/photo-1.jpg", order: 1, isVisible: true, ...over };
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ActivityPhotosSection />
    </QueryClientProvider>,
  );
}

describe("ActivityPhotosSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getActivityPhotos).mockResolvedValue([photo()]);
    vi.mocked(api.deleteActivityPhoto).mockResolvedValue();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 502, fileName: "새사진.png", size: 1024 });
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn().mockReturnValue("blob:preview") });
  });

  it("목록을 보여준다", async () => {
    renderSection();
    expect(await screen.findByText("1번째")).toBeInTheDocument();
  });

  it("비공개 사진을 표시한다", async () => {
    vi.mocked(api.getActivityPhotos).mockResolvedValue([photo({ isVisible: false })]);
    renderSection();
    expect(await screen.findByText("(비공개)")).toBeInTheDocument();
  });

  it("빈 목록은 안내를 보여준다", async () => {
    vi.mocked(api.getActivityPhotos).mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText("등록된 활동 사진이 없습니다.")).toBeInTheDocument();
  });

  it("사진을 올리기 전에는 저장을 막는다", async () => {
    vi.mocked(api.getActivityPhotos).mockResolvedValue([]);
    renderSection();
    await screen.findByText("등록된 활동 사진이 없습니다.");

    await userEvent.click(screen.getByRole("button", { name: "+ 활동 사진 추가" }));

    expect(screen.getByText("사진을 올려 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("사진을 올리면 fileId·순서를 실어 등록한다", async () => {
    vi.mocked(api.getActivityPhotos).mockResolvedValue([]);
    vi.mocked(api.createActivityPhoto).mockResolvedValue(photo({ id: 2, fileId: 502, order: 1 }));
    renderSection();
    await screen.findByText("등록된 활동 사진이 없습니다.");

    await userEvent.click(screen.getByRole("button", { name: "+ 활동 사진 추가" }));
    await userEvent.upload(
      screen.getByLabelText("활동 사진 올리기"),
      new File(["x"], "새사진.png", { type: "image/png" }),
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "추가" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createActivityPhoto).toHaveBeenCalled());
    expect(vi.mocked(api.createActivityPhoto).mock.lastCall?.[0]).toMatchObject({
      fileId: 502,
      isVisible: true,
      order: 1,
    });
  });

  it("삭제는 확인을 묻고, 확인하면 지운다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderSection();
    await screen.findByText("1번째");

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(api.deleteActivityPhoto).toHaveBeenCalledWith(1);
    vi.unstubAllGlobals();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getActivityPhotos).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});

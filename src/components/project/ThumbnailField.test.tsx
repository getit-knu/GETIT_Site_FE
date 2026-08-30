import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../apis/file/filesApi";

import { ThumbnailField } from "./ThumbnailField";

vi.mock("../../apis/file/filesApi", async (importOriginal) => {
  // uploadInvalidReason 은 실제 규칙(명세서 13.1 표)을 그대로 써야 검증이 의미 있다.
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

const picker = () => screen.getByLabelText("썸네일 올리기");

function image(name: string, bytes = 1024): File {
  const f = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

describe("ThumbnailField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 901, fileName: "새 썸네일.png", size: 1024 });
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn().mockReturnValue("blob:preview") });
  });

  it("기존 썸네일이 없으면 안내를 보여준다", () => {
    render(<ThumbnailField currentUrl={null} onFileIdChange={vi.fn()} />);

    expect(screen.getByText("등록된 썸네일이 없습니다.")).toBeInTheDocument();
  });

  it("기존 썸네일을 보여준다", () => {
    render(<ThumbnailField currentUrl="https://cdn/thumb.png" onFileIdChange={vi.fn()} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://cdn/thumb.png");
  });

  it("올리면 fileId 를 알리고 미리보기로 바꾼다", async () => {
    const onFileIdChange = vi.fn();
    render(<ThumbnailField currentUrl={null} onFileIdChange={onFileIdChange} />);

    await userEvent.upload(picker(), image("새 썸네일.png"));

    await waitFor(() => expect(onFileIdChange).toHaveBeenCalledWith(901));
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:preview");
  });

  it("제거를 누르면 null 을 알린다", async () => {
    const onFileIdChange = vi.fn();
    render(<ThumbnailField currentUrl="https://cdn/thumb.png" onFileIdChange={onFileIdChange} />);

    await userEvent.click(screen.getByRole("button", { name: "제거" }));

    expect(onFileIdChange).toHaveBeenCalledWith(null);
    expect(screen.getByText("등록된 썸네일이 없습니다.")).toBeInTheDocument();
  });

  it("허용하지 않는 형식은 올리지 않고 이유를 보여준다", async () => {
    render(<ThumbnailField currentUrl={null} onFileIdChange={vi.fn()} />);

    const badFile = new File(["x"], "악성.exe", { type: "application/x-msdownload" });
    await userEvent.upload(picker(), badFile);

    expect(screen.getByText(/형식만 올릴 수 있습니다/)).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
  });

  it("업로드에 실패하면 이유를 보여주고 미리보기를 되돌린다", async () => {
    vi.mocked(filesApi.uploadFile).mockRejectedValue({ code: "INVALID_FILE_SIZE", message: "?" });
    const onFileIdChange = vi.fn();
    render(<ThumbnailField currentUrl={null} onFileIdChange={onFileIdChange} />);

    await userEvent.upload(picker(), image("새 썸네일.png"));

    expect(await screen.findByText("파일이 너무 큽니다.")).toBeInTheDocument();
    expect(onFileIdChange).not.toHaveBeenCalled();
  });
});

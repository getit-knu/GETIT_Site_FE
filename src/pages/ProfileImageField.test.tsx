import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../apis/file/filesApi";

import { ProfileImageField } from "./ProfileImageField";

vi.mock("../apis/file/filesApi", async (importOriginal) => {
  // uploadInvalidReason 은 실제 규칙(명세서 13.1 표)을 그대로 써야 검증이 의미 있다.
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

const picker = () => screen.getByLabelText("프로필 사진 올리기");

function image(name: string, bytes = 1024): File {
  const f = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

describe("ProfileImageField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 701, fileName: "프사.png", size: 1024 });
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn().mockReturnValue("blob:preview") });
  });

  it("기존 사진이 없으면 이니셜을 보여준다", () => {
    render(<ProfileImageField name="김부원" currentUrl={null} onFileIdChange={vi.fn()} />);

    expect(screen.getByText("김")).toBeInTheDocument();
  });

  it("기존 사진을 보여준다", () => {
    render(<ProfileImageField name="김부원" currentUrl="https://cdn/me.png" onFileIdChange={vi.fn()} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://cdn/me.png");
  });

  it("올리면 fileId를 알리고 미리보기로 바꾼다", async () => {
    const onFileIdChange = vi.fn();
    render(<ProfileImageField name="김부원" currentUrl={null} onFileIdChange={onFileIdChange} />);

    await userEvent.upload(picker(), image("프사.png"));

    await waitFor(() => expect(onFileIdChange).toHaveBeenCalledWith(701));
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:preview");
  });

  it("허용하지 않는 형식은 올리지 않고 이유를 보여준다", async () => {
    render(<ProfileImageField name="김부원" currentUrl={null} onFileIdChange={vi.fn()} />);

    const badFile = new File(["x"], "악성.exe", { type: "application/x-msdownload" });
    await userEvent.upload(picker(), badFile);

    expect(screen.getByText(/형식만 올릴 수 있습니다/)).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
  });
});

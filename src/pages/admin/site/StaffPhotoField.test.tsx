import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../../apis/file/filesApi";

import { StaffPhotoField } from "./StaffPhotoField";

vi.mock("../../../apis/file/filesApi", async (importOriginal) => {
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

describe("StaffPhotoField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 77, fileName: "얼굴.png", size: 1024 });
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn().mockReturnValue("blob:preview") });
  });

  it("사진이 없어도 저장할 수 있다고 알린다", () => {
    // 활동 사진과 달리 운영진 사진은 선택 항목이다(BE `fileId` 선택).
    render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    expect(screen.getByText("등록된 사진이 없습니다. 올리지 않아도 저장할 수 있습니다.")).toBeInTheDocument();
  });

  it("올리면 fileId 를 알리고 미리보기로 바꾼다", async () => {
    const onFileIdChange = vi.fn();
    render(<StaffPhotoField currentUrl={null} onFileIdChange={onFileIdChange} />);

    await userEvent.upload(picker(), image("얼굴.png"));

    await waitFor(() => expect(onFileIdChange).toHaveBeenCalledWith(77));
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:preview");
  });

  it("기존 사진을 새 사진으로 덮는다", async () => {
    render(<StaffPhotoField currentUrl="https://cdn/old.png" onFileIdChange={vi.fn()} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://cdn/old.png");

    await userEvent.upload(picker(), image("새얼굴.png"));

    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "blob:preview"));
  });

  it("제거를 누르면 null 을 알리고 기존 사진으로 되돌아가지 않는다", async () => {
    const onFileIdChange = vi.fn();
    render(<StaffPhotoField currentUrl="https://cdn/old.png" onFileIdChange={onFileIdChange} />);

    await userEvent.click(screen.getByRole("button", { name: "제거" }));

    expect(onFileIdChange).toHaveBeenCalledWith(null);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("허용하지 않는 형식은 올리지 않고 이유를 보여준다", async () => {
    render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    await userEvent.upload(picker(), new File(["x"], "이력서.pdf", { type: "application/pdf" }));

    expect(await screen.findByText(/png, jpg, jpeg, webp 형식만/)).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
  });

  it("5MB 를 넘으면 올리지 않고 이유를 보여준다", async () => {
    render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    await userEvent.upload(picker(), image("큰사진.png", 6 * 1024 * 1024));

    expect(await screen.findByText(/5MB 이하만/)).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
  });

  it("업로드에 실패하면 미리보기를 되돌리고 이유를 보여준다", async () => {
    // 올라간 것처럼 보이는 채로 두면 저장했다고 믿고 화면을 떠난다.
    const onFileIdChange = vi.fn();
    vi.mocked(filesApi.uploadFile).mockRejectedValue({ code: "FILE_UPLOAD_FAILED", message: "?" });
    render(<StaffPhotoField currentUrl={null} onFileIdChange={onFileIdChange} />);

    await userEvent.upload(picker(), image("얼굴.png"));

    await waitFor(() => expect(screen.queryByRole("img")).not.toBeInTheDocument());
    expect(onFileIdChange).not.toHaveBeenCalled();
  });
});

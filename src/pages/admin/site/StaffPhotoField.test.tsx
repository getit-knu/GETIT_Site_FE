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

const picker = () => screen.getByLabelText("프로필 사진");

function image(name: string, bytes = 1024): File {
  const f = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

describe("StaffPhotoField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 77, fileName: "얼굴.png", size: 1024 });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:preview"),
      revokeObjectURL: vi.fn(),
    });
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

    await userEvent.upload(picker(), new File(["x"], "이력서.pdf", { type: "application/pdf" }), {
      // 브라우저는 `accept` 로 이미 걸러 주지만, 여기서 검증하려는 건 우리 쪽 사전 검사다.
      applyAccept: false,
    });

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

  it("실패 이유를 alert 로 알린다", async () => {
    // 업로드는 시간이 걸려 화면을 보고 있지 않을 수 있다. 나타나기만 해선 안 읽힌다.
    vi.mocked(filesApi.uploadFile).mockRejectedValue({ code: "FILE_SIZE_MISMATCH", message: "size mismatch" });
    render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    await userEvent.upload(picker(), image("얼굴.png"));

    expect(await screen.findByRole("alert")).toHaveTextContent("신고한 크기와 실제 파일이 달라 처리할 수 없습니다.");
  });

  it("브라우저 파일 선택 창에서도 허용 형식만 고르게 한다", () => {
    render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    expect(picker()).toHaveAttribute("accept", ".png,.jpg,.jpeg,.webp");
  });

  it("사진을 다시 고르면 앞서 만든 blob URL 을 해제한다", async () => {
    // 해제하지 않으면 고른 이미지가 문서 수명 내내 메모리에 남는다.
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:첫번째").mockReturnValueOnce("blob:두번째");
    render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    await userEvent.upload(picker(), image("얼굴.png"));
    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "blob:첫번째"));
    await userEvent.upload(picker(), image("새얼굴.png"));

    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:첫번째"));
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:두번째");
  });

  it("화면을 떠나면 남아 있는 blob URL 을 해제한다", async () => {
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:마지막");
    const { unmount } = render(<StaffPhotoField currentUrl={null} onFileIdChange={vi.fn()} />);

    await userEvent.upload(picker(), image("얼굴.png"));
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:마지막");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../apis/file/filesApi";

import DescriptionEditor from "./DescriptionEditor";

vi.mock("../../apis/file/filesApi", async (importOriginal) => {
  // uploadInvalidReason 은 실제 규칙(명세서 13.1 표)을 그대로 써야 검증이 의미 있다.
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn(), getDownloadUrl: vi.fn() };
});

const URL_OF_IMAGE = "https://api.getit.io.kr/api/public/files/public/shot.png";

function renderEditor(initialValue = "", canAddImage = true) {
  const onChange = vi.fn<(markdown: string) => void>();
  const onImageUploaded = vi.fn();
  render(
    <DescriptionEditor
      initialValue={initialValue}
      onChange={onChange}
      onImageUploaded={onImageUploaded}
      canAddImage={canAddImage}
    />,
  );
  const lastMarkdown = () => onChange.mock.lastCall?.[0];
  return { onChange, onImageUploaded, lastMarkdown };
}

describe("DescriptionEditor (#385)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 41, fileName: "shot.png", size: 10 });
    vi.mocked(filesApi.getDownloadUrl).mockResolvedValue({
      downloadUrl: URL_OF_IMAGE,
      fileName: "shot.png",
      contentType: "image/png",
      expiresIn: -1,
    });
  });

  it("처음 마크다운을 서식이 적용된 글로 보여준다", () => {
    renderEditor("## 주요 기능\n\n- 일정 공유");

    const box = screen.getByRole("textbox", { name: "설명" });
    expect(box.querySelector("h2")).toHaveTextContent("주요 기능");
    expect(box.querySelector("li")).toHaveTextContent("일정 공유");
  });

  it("툴바로 제목·목록을 걸면 마크다운으로 알리고, 눌림 상태를 보여준다", async () => {
    const { lastMarkdown } = renderEditor("소개 글");

    await userEvent.click(screen.getByRole("button", { name: "제목" }));
    expect(lastMarkdown()).toBe("## 소개 글");
    expect(screen.getByRole("button", { name: "제목" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "제목" }));
    await userEvent.click(screen.getByRole("button", { name: "글머리 목록" }));
    expect(lastMarkdown()).toBe("- 소개 글");
  });

  it("이미지를 올리면 고정 주소를 받아 본문에 넣고, 올린 id를 알린다", async () => {
    const { lastMarkdown, onImageUploaded } = renderEditor("소개 글");

    await userEvent.upload(
      screen.getByLabelText("설명에 넣을 이미지"),
      new File(["x"], "shot.png", { type: "image/png" }),
    );

    await waitFor(() => expect(onImageUploaded).toHaveBeenCalledWith({ fileId: 41, url: URL_OF_IMAGE }));
    expect(filesApi.uploadFile).toHaveBeenCalledWith(expect.any(File), "PROJECT_IMAGE");
    expect(filesApi.getDownloadUrl).toHaveBeenCalledWith(41);
    expect(lastMarkdown()).toContain(`![shot](${URL_OF_IMAGE})`);
  });

  it("형식이 틀린 파일은 올리지 않고 이유를 보여준다", async () => {
    renderEditor();

    await userEvent.upload(screen.getByLabelText("설명에 넣을 이미지"), new File(["x"], "notes.pdf"), {
      applyAccept: false,
    });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
  });

  it("10장이 차면 이미지 넣기를 잠그고 알려 준다", () => {
    renderEditor("", false);

    expect(screen.getByRole("button", { name: "이미지 넣기" })).toBeDisabled();
    expect(screen.getByText("설명 속 이미지는 10장까지 넣을 수 있습니다.")).toBeInTheDocument();
  });

  it("http(s)가 아닌 링크는 걸지 않는다", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("javascript:alert(1)");
    const { onChange } = renderEditor("소개 글");

    await userEvent.click(screen.getByRole("button", { name: "링크" }));

    expect(screen.getByRole("alert")).toHaveTextContent("http:// 또는 https://");
    expect(onChange).not.toHaveBeenCalled();
  });
});

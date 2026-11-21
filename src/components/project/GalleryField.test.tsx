import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../apis/file/filesApi";

import { GalleryField } from "./GalleryField";
import { galleryFileIds, isGalleryUploading, toGalleryItems, type GalleryItem } from "./projectImages";

vi.mock("../../apis/file/filesApi", async (importOriginal) => {
  // uploadInvalidReason 은 실제 규칙(명세서 13.1 표)을 그대로 써야 검증이 의미 있다.
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

const picker = () => screen.getByLabelText("프로젝트 이미지 올리기");

function image(name: string, bytes = 1024): File {
  const f = new File(["x"], name, { type: "image/png" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

/** 부모 폼처럼 값을 들고 있다가 마지막 값을 밖으로 알려 준다. */
function Harness({ initial, onItems }: { initial: GalleryItem[]; onItems: (items: GalleryItem[]) => void }) {
  const [items, setItems] = useState(initial);
  onItems(items);
  return <GalleryField items={items} onChange={(update) => setItems((prev) => update(prev))} />;
}

function renderField(initial: GalleryItem[] = []) {
  let latest = initial;
  render(<Harness initial={initial} onItems={(items) => (latest = items)} />);
  return () => latest;
}

const saved = (count: number) =>
  toGalleryItems(
    Array.from({ length: count }, (_, i) => 100 + i),
    Array.from({ length: count }, (_, i) => `https://cdn/shot-${i}.png`),
  );

describe("GalleryField (#382)", () => {
  let nextId: number;

  beforeEach(() => {
    vi.clearAllMocks();
    nextId = 900;
    vi.mocked(filesApi.uploadFile).mockImplementation(async (file) => ({
      fileId: nextId++,
      fileName: file.name,
      size: file.size,
    }));
    let blob = 0;
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => `blob:preview-${blob++}`) });
  });

  it("여러 장을 한 번에 올리면 고른 순서대로 뒤에 붙고 PROJECT_IMAGE 용도로 올린다", async () => {
    const items = renderField(saved(1));

    await userEvent.upload(picker(), [image("a.png"), image("b.png")]);

    await waitFor(() => expect(isGalleryUploading(items())).toBe(false));
    expect(galleryFileIds(items())).toEqual([100, 900, 901]);
    expect(filesApi.uploadFile).toHaveBeenCalledWith(expect.any(File), "PROJECT_IMAGE");
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("5장을 넘기면 앞의 남은 칸만큼만 올리고 알려 준다. 다 차면 더 고를 수 없다", async () => {
    const items = renderField(saved(3));

    await userEvent.upload(picker(), [image("a.png"), image("b.png"), image("c.png")]);

    expect(await screen.findByRole("alert")).toHaveTextContent("최대 5장까지 올릴 수 있어 앞의 2장만 올렸습니다.");
    await waitFor(() => expect(galleryFileIds(items())).toEqual([100, 101, 102, 900, 901]));
    expect(picker()).toBeDisabled();
  });

  it("형식이 틀린 파일은 올리지 않고 이유를 보여준다", async () => {
    const items = renderField();

    await userEvent.upload(picker(), [image("notes.pdf"), image("ok.png")], { applyAccept: false });

    expect(await screen.findByRole("alert")).toHaveTextContent("notes.pdf");
    await waitFor(() => expect(galleryFileIds(items())).toEqual([900]));
    expect(filesApi.uploadFile).toHaveBeenCalledTimes(1);
  });

  it("올리는 동안은 올리는 중으로 표시하고, 실패한 장은 빼고 이유를 보여준다", async () => {
    let fail: (reason: unknown) => void = () => {};
    vi.mocked(filesApi.uploadFile).mockReturnValueOnce(new Promise((_, reject) => (fail = reject)));
    const items = renderField();

    await userEvent.upload(picker(), image("a.png"));
    expect(isGalleryUploading(items())).toBe(true);
    expect(screen.getByText("올리는 중…")).toBeInTheDocument();

    fail(new Error("network"));
    expect(await screen.findByRole("alert")).toHaveTextContent("a.png");
    expect(items()).toEqual([]);
  });

  it("앞뒤로 옮기고 지우면 그 순서가 곧 저장 순서다", async () => {
    const items = renderField(saved(3));
    expect(screen.getByRole("button", { name: "1번째 이미지를 앞으로" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "3번째 이미지를 뒤로" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "1번째 이미지를 뒤로" }));
    expect(galleryFileIds(items())).toEqual([101, 100, 102]);

    await userEvent.click(screen.getByRole("button", { name: "3번째 이미지를 앞으로" }));
    expect(galleryFileIds(items())).toEqual([101, 102, 100]);

    await userEvent.click(screen.getByRole("button", { name: "1번째 이미지 삭제" }));
    expect(galleryFileIds(items())).toEqual([102, 100]);
    expect(screen.getByRole("img", { name: "프로젝트 이미지 1" })).toHaveAttribute("src", "https://cdn/shot-2.png");
  });
});

describe("toGalleryItems", () => {
  it("URL이 모자라도 id를 잃지 않는다 — 잃으면 저장할 때 그 이미지가 지워진다", () => {
    const items = toGalleryItems([1, 2], ["https://cdn/1.png"]);

    expect(galleryFileIds(items)).toEqual([1, 2]);
    expect(items[1].url).toBeNull();
  });
});

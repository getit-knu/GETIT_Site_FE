import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as filesApi from "../../apis/file/filesApi";
import type { LectureFile } from "../../types/lecture";

import { AttachmentsField } from "./AttachmentsField";

vi.mock("../../apis/file/filesApi", async (importOriginal) => {
  // uploadInvalidReason 은 실제 규칙(명세서 13.1 표)을 그대로 써야 검증이 의미 있다.
  const actual = await importOriginal<typeof filesApi>();
  return { ...actual, uploadFile: vi.fn() };
});

const EXISTING: LectureFile[] = [{ fileId: 501, displayName: "강의 자료.pdf", url: "https://cdn/1", size: 2048 }];

/** 실제 폼처럼 fileIds 를 들고 있는 껍데기. */
function Harness({ files = EXISTING, initial = [501] }: { files?: LectureFile[]; initial?: number[] }) {
  const [keptIds, setKeptIds] = useState(initial);

  return (
    <>
      <AttachmentsField files={files} keptIds={keptIds} onKeptIdsChange={setKeptIds} />
      <output>{JSON.stringify(keptIds)}</output>
    </>
  );
}

const kept = (): number[] => JSON.parse(screen.getByRole("status").textContent ?? "[]") as number[];
const picker = () => screen.getByLabelText("강의 자료 올리기");

function file(name: string, bytes = 1024): File {
  const f = new File(["x"], name, { type: "application/pdf" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

describe("AttachmentsField", () => {
  beforeEach(() => {
    // 호출 기록이 테스트 사이에 남으면 "부르지 않았다" 를 확인할 수 없다.
    vi.clearAllMocks();
    vi.mocked(filesApi.uploadFile).mockResolvedValue({ fileId: 901, fileName: "새 자료.pdf", size: 1024 });
  });

  it("첨부가 없으면 안내를 보여준다", () => {
    render(<Harness files={[]} initial={[]} />);

    expect(screen.getByText("첨부된 파일이 없습니다.")).toBeInTheDocument();
  });

  it("올린 파일이 fileIds 에 들어간다", async () => {
    // 추가 모드에서는 기존 첨부가 없어 이 경로가 유일하다.
    render(<Harness files={[]} initial={[]} />);

    await userEvent.upload(picker(), file("새 자료.pdf"));

    await waitFor(() => expect(kept()).toEqual([901]));
    expect(screen.getByText("새 자료.pdf")).toBeInTheDocument();
  });

  it("기존 첨부를 지우지 않고 뒤에 더한다", async () => {
    render(<Harness />);

    await userEvent.upload(picker(), file("새 자료.pdf"));

    await waitFor(() => expect(kept()).toEqual([501, 901]));
  });

  it("올린 파일을 다시 뺄 수 있다", async () => {
    render(<Harness files={[]} initial={[]} />);

    await userEvent.upload(picker(), file("새 자료.pdf"));
    await waitFor(() => expect(kept()).toEqual([901]));

    await userEvent.click(screen.getByRole("button", { name: "제거" }));

    expect(kept()).toEqual([]);
    expect(screen.queryByText("새 자료.pdf")).not.toBeInTheDocument();
  });

  it("허용하지 않는 형식은 올리지 않고 이유를 보여준다", async () => {
    // 다 올린 뒤에 거절당하면 기다린 시간이 헛되다(명세서 13.1 표).
    render(<Harness files={[]} initial={[]} />);

    await userEvent.upload(picker(), file("악성.exe"));

    expect(screen.getByText(/형식만 올릴 수 있습니다/)).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
    expect(kept()).toEqual([]);
  });

  it("용량을 넘으면 올리지 않는다", async () => {
    render(<Harness files={[]} initial={[]} />);

    await userEvent.upload(picker(), file("큰 파일.pdf", 51 * 1024 * 1024));

    expect(screen.getByText("50MB 이하만 올릴 수 있습니다.")).toBeInTheDocument();
    expect(filesApi.uploadFile).not.toHaveBeenCalled();
  });

  it("업로드에 실패하면 이유를 보여주고 fileIds 를 건드리지 않는다", async () => {
    vi.mocked(filesApi.uploadFile).mockRejectedValue({ code: "FILE_SIZE_EXCEEDED", message: "?" });
    render(<Harness />);

    await userEvent.upload(picker(), file("새 자료.pdf"));

    expect(await screen.findByText("파일이 너무 큽니다.")).toBeInTheDocument();
    expect(kept()).toEqual([501]);
  });

  it("기존 첨부는 제거하고 되돌릴 수 있다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "제거" }));
    expect(kept()).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "되돌리기" }));
    expect(kept()).toEqual([501]);
  });
});

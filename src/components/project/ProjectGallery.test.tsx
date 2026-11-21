import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "../ui/Modal/Modal";

import { ProjectGallery } from "./ProjectGallery";

const URLS = ["https://cdn/1.png", "https://cdn/2.png", "https://cdn/3.png"];

describe("ProjectGallery 전체화면 뷰어 (#404)", () => {
  it("누른 사진부터 전체화면으로 열고, 몇 번째인지 보여준다", async () => {
    render(<ProjectGallery urls={URLS} title="폴리핏" />);

    await userEvent.click(screen.getByRole("button", { name: "폴리핏 화면 2 크게 보기" }));

    const viewer = await screen.findByLabelText("사진 크게 보기");
    expect(within(viewer).getByText("2 / 3")).toBeInTheDocument();
    expect(within(viewer).getByRole("button", { name: "다음 사진" })).toBeInTheDocument();
    expect(within(viewer).getByRole("button", { name: "확대" })).toBeInTheDocument();
  });

  it("다음 사진으로 넘기고, 닫으면 사라진다", async () => {
    render(<ProjectGallery urls={URLS} title="폴리핏" />);
    await userEvent.click(screen.getByRole("button", { name: "폴리핏 화면 1 크게 보기" }));
    const viewer = await screen.findByLabelText("사진 크게 보기");

    await userEvent.click(within(viewer).getByRole("button", { name: "다음 사진" }));
    await waitFor(() => expect(within(viewer).getByText("2 / 3")).toBeInTheDocument());

    await userEvent.click(within(viewer).getByRole("button", { name: "닫기" }));
    await waitFor(() => expect(screen.queryByLabelText("사진 크게 보기")).not.toBeInTheDocument());
  });

  it("상세 모달 위에서 Esc를 누르면 사진만 닫고 상세 모달은 그대로 둔다", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <ProjectGallery urls={URLS} title="폴리핏" />
      </Modal>,
    );
    await userEvent.click(screen.getByRole("button", { name: "폴리핏 화면 1 크게 보기" }));
    await screen.findByLabelText("사진 크게 보기");

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByLabelText("사진 크게 보기")).not.toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("사진이 한 장이면 넘기기 버튼을 숨긴다", async () => {
    render(<ProjectGallery urls={["https://cdn/1.png"]} title="폴리핏" />);
    await userEvent.click(screen.getByRole("button", { name: "폴리핏 화면 1 크게 보기" }));

    const viewer = await screen.findByLabelText("사진 크게 보기");
    expect(within(viewer).queryByRole("button", { name: "다음 사진" })).not.toBeInTheDocument();
  });
});

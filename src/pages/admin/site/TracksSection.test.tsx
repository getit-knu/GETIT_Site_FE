import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { SiteTrack } from "../../../types/site";

import { TracksSection } from "./TracksSection";
import type { TrackDraft } from "./tracksDraft";
import { toTrackDrafts, toTracks } from "./tracksDraft";

const TRACKS: SiteTrack[] = [
  {
    id: 1,
    name: "SW",
    subCategories: [
      { id: 1, name: "웹기초" },
      { id: 2, name: "React.js" },
    ],
  },
  { id: 3, name: "세미나", subCategories: [] },
];

const onChange = vi.fn();

/** 실제 화면처럼 상태를 들고 있는 껍데기. 여러 번 고치는 흐름을 봐야 한다. */
function Harness({ initial = TRACKS }: { initial?: SiteTrack[] }) {
  const [tracks, setTracks] = useState<TrackDraft[]>(() => toTrackDrafts(initial));

  return (
    <>
      <TracksSection
        tracks={tracks}
        onChange={(next) => {
          onChange(toTracks(next));
          setTracks(next);
        }}
      />
      <output>{JSON.stringify(toTracks(tracks))}</output>
    </>
  );
}

const result = (): SiteTrack[] => JSON.parse(screen.getByRole("status").textContent ?? "[]") as SiteTrack[];
const trackBox = (name: string) => screen.getByLabelText(`대분류 이름 ${name}`);

describe("TracksSection", () => {
  it("대분류와 소분류를 보여준다", () => {
    render(<Harness />);

    expect(trackBox("SW")).toHaveValue("SW");
    expect(screen.getByLabelText("SW 소분류 이름 웹기초")).toHaveValue("웹기초");
    expect(trackBox("세미나")).toHaveValue("세미나");
  });

  it("소분류가 없는 대분류를 견딘다", () => {
    render(<Harness initial={[{ id: 3, name: "세미나", subCategories: [] }]} />);

    expect(trackBox("세미나")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "+ 소분류 추가" })).toHaveLength(1);
  });

  it("등록된 분류가 없으면 안내를 보여준다", () => {
    render(<Harness initial={[]} />);

    expect(screen.getByText("등록된 분류가 없습니다.")).toBeInTheDocument();
  });

  it("대분류 이름을 고친다", async () => {
    render(<Harness />);

    await userEvent.type(trackBox("SW"), "!");

    expect(result()[0].name).toBe("SW!");
    // id 가 있는 항목은 수정이지 새 항목이 아니다.
    expect(result()[0].id).toBe(1);
  });

  it("대분류를 지우면 딸린 소분류도 함께 사라진다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getAllByRole("button", { name: "대분류 삭제" })[0]);

    expect(result()).toHaveLength(1);
    expect(result()[0].name).toBe("세미나");
    expect(screen.queryByLabelText("SW 소분류 이름 웹기초")).not.toBeInTheDocument();
  });

  it("소분류만 지우면 대분류는 남는다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getAllByRole("button", { name: "삭제" })[0]);

    expect(result()[0].subCategories.map((s) => s.name)).toEqual(["React.js"]);
  });

  it("새 대분류는 id 가 null 이다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "+ 대분류 추가" }));

    expect(result()).toHaveLength(3);
    expect(result()[2]).toEqual({ id: null, name: "", subCategories: [] });
  });

  it("새 소분류를 그 대분류에만 넣는다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getAllByRole("button", { name: "+ 소분류 추가" })[1]);

    expect(result()[0].subCategories).toHaveLength(2);
    expect(result()[1].subCategories).toEqual([{ id: null, name: "" }]);
  });

  it("새로 만든 항목 여러 개를 따로 고칠 수 있다", async () => {
    // id 가 전부 null 이라 서로 구분되지 않으면 한 칸만 고쳐도 둘 다 바뀐다.
    render(<Harness initial={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "+ 대분류 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "+ 대분류 추가" }));

    const boxes = screen.getAllByLabelText("대분류 이름 (새 항목)");
    await userEvent.type(boxes[0], "가");
    await userEvent.type(screen.getAllByLabelText(/대분류 이름/)[1], "나");

    expect(result().map((t) => t.name)).toEqual(["가", "나"]);
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable, type Column } from "./DataTable";

interface Row {
  id: number;
  name: string;
  score: number;
}

const rows: Row[] = [
  { id: 1, name: "김부원", score: 90 },
  { id: 2, name: "박부원", score: 80 },
];

const columns: Column<Row>[] = [
  { header: "이름", render: (r) => r.name },
  { header: "점수", render: (r) => `${r.score}점`, align: "right" },
];

function renderTable(override?: Partial<Parameters<typeof DataTable<Row>>[0]>) {
  return render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} caption="점수표" {...override} />);
}

describe("DataTable", () => {
  it("컬럼 정의대로 헤더를 그린다", () => {
    renderTable();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(["이름", "점수"]);
  });

  it("행마다 render 결과를 넣는다", () => {
    renderTable();

    const bodyRows = screen.getAllByRole("row").slice(1); // 첫 행은 헤더
    expect(bodyRows).toHaveLength(2);
    expect(within(bodyRows[0]).getByText("김부원")).toBeInTheDocument();
    expect(within(bodyRows[0]).getByText("90점")).toBeInTheDocument();
  });

  it("caption 으로 표의 용도를 읽을 수 있다", () => {
    // 열 제목만으로는 무슨 표인지 알 수 없다. 스크린리더가 표를 건너뛸지 판단하는 근거다.
    renderTable();

    expect(screen.getByRole("table", { name: "점수표" })).toBeInTheDocument();
  });

  it("헤더에 scope=col 이 붙는다", () => {
    // 없으면 스크린리더가 셀과 열 제목을 연결하지 못한다.
    renderTable();

    for (const header of screen.getAllByRole("columnheader")) {
      expect(header).toHaveAttribute("scope", "col");
    }
  });

  it("행이 없으면 본문을 비운다", () => {
    // 빈 상태 문구는 화면이 정한다. 표는 골격만 남긴다.
    renderTable({ rows: [] });

    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("rowKey 로 행을 구분한다", () => {
    // 인덱스를 쓰면 정렬·필터가 바뀔 때 React 가 행을 재사용해 내용이 섞인다.
    const { rerender } = renderTable();

    rerender(<DataTable columns={columns} rows={[rows[1], rows[0]]} rowKey={(r) => r.id} caption="점수표" />);

    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]).getByText("박부원")).toBeInTheDocument();
  });
});

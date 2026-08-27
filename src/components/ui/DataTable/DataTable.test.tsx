import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

const columnsWithButton: Column<Row>[] = [
  ...columns,
  {
    header: "처리",
    render: (r) => (
      <button type="button" aria-label={`${r.name} 처리`}>
        처리
      </button>
    ),
  },
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

  it("onRowClick 을 주지 않으면 행을 눌러도 아무 일도 없다", async () => {
    renderTable();

    const bodyRows = screen.getAllByRole("row").slice(1);
    await userEvent.click(bodyRows[0]);

    // 클릭 핸들러 자체가 없으니 예외 없이 지나가는 것으로 충분하다.
    expect(bodyRows[0]).toBeInTheDocument();
  });

  it("행을 클릭하면 onRowClick 이 그 행으로 불린다", async () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });

    const bodyRows = screen.getAllByRole("row").slice(1);
    await userEvent.click(bodyRows[0]);

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("행에 포커스를 두고 Enter 를 누르면 onRowClick 이 불린다", async () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });

    const bodyRows = screen.getAllByRole("row").slice(1);
    bodyRows[0].focus();
    await userEvent.keyboard("{Enter}");

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("행 안의 버튼을 클릭하면 onRowClick 이 불리지 않는다", async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columnsWithButton}
        rows={rows}
        rowKey={(r) => r.id}
        caption="점수표"
        onRowClick={onRowClick}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "김부원 처리" }));

    expect(onRowClick).not.toHaveBeenCalled();
  });
});

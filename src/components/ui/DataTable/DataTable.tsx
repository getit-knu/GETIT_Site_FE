import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import styles from "./DataTable.module.scss";

export interface Column<T> {
  /** `<th>` 에 들어갈 표기. */
  header: string;
  /** 행 하나를 어떻게 그릴지. 문자열을 돌려주면 그대로 셀에 들어간다. */
  render: (row: T) => ReactNode;
  /** 열 너비. 주지 않으면 내용에 맞춰 늘어난다. */
  width?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** 행을 구분하는 값. 인덱스를 쓰면 정렬·필터가 바뀔 때 React 가 행을 헷갈린다. */
  rowKey: (row: T) => string | number;
  /** 표에 딸린 설명. 스크린리더가 어떤 표인지 알 수 있어야 한다. */
  caption: string;
  /**
   * 주면 행 전체를 클릭·Enter/Space 로 열 수 있다.
   *
   * 행 안의 버튼·링크 등은 자기 동작을 그대로 유지해야 하므로, 그 위에서 난 클릭·키 입력은
   * 무시한다(`isFromInteractiveElement`).
   */
  onRowClick?: (row: T) => void;
}

const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, label";

function isFromInteractiveElement(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest(INTERACTIVE_SELECTOR) !== null;
}

/**
 * 어드민 목록 표.
 *
 * 로딩·에러·빈 상태는 **여기서 처리하지 않는다.** 표를 그릴 데이터가 있을 때만 부른다.
 * 상태마다 표 골격을 남길지 말지는 화면이 정할 일이고, 여기서 떠안으면
 * 화면마다 다른 요구가 생길 때 이 컴포넌트가 분기로 뒤덮인다.
 */
export function DataTable<T>({ columns, rows, rowKey, caption, onRowClick }: DataTableProps<T>) {
  function handleClick(event: MouseEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick || isFromInteractiveElement(event.target)) return;
    onRowClick(row);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick || isFromInteractiveElement(event.target)) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    // 스크롤 페이지에서 Space 는 기본으로 스크롤을 내린다.
    event.preventDefault();
    onRowClick(row);
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" style={{ width: column.width, textAlign: column.align }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? styles.clickableRow : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? (event) => handleClick(event, row) : undefined}
              onKeyDown={onRowClick ? (event) => handleKeyDown(event, row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.header} style={{ textAlign: column.align }}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

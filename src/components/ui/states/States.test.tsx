import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  BlockSkeleton,
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  FormSkeleton,
  TableSkeleton,
  TextSkeleton,
} from "./States";

describe("TableSkeleton", () => {
  it("요청한 행·열 수만큼 자리를 잡는다", () => {
    render(<TableSkeleton rows={3} columns={4} />);

    const status = screen.getByRole("status", { name: "불러오는 중" });
    expect(status.querySelectorAll("span")).toHaveLength(12);
  });

  it("로딩 중임을 읽을 수 있게 알린다", () => {
    render(<TableSkeleton columns={2} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("TextSkeleton", () => {
  it("요청한 줄 수만큼 자리를 잡는다", () => {
    render(<TextSkeleton lines={4} />);

    expect(screen.getByRole("status", { name: "불러오는 중" }).querySelectorAll("span")).toHaveLength(4);
  });

  it("이름을 넘기면 무엇을 기다리는지 구분해서 알린다", () => {
    // 대시보드처럼 스켈레톤이 여럿인 화면에서 전부 "불러오는 중"으로만 읽히면
    // 화면을 보지 않는 사용자는 무엇이 아직 안 왔는지 알 수 없다.
    render(<TextSkeleton label="내 질문 불러오는 중" />);

    expect(screen.getByRole("status", { name: "내 질문 불러오는 중" })).toBeInTheDocument();
  });
});

describe("CardGridSkeleton", () => {
  it("요청한 장수만큼 자리를 잡는다", () => {
    render(<CardGridSkeleton count={8} height="20rem" />);

    expect(screen.getByRole("status").querySelectorAll("li")).toHaveLength(8);
  });

  it("넘긴 높이로 자리를 잡는다", () => {
    // 카드 실제 높이와 맞아야 응답이 도착할 때 격자가 밀리지 않는다.
    render(<CardGridSkeleton count={1} height="20rem" />);

    // jsdom 은 `toHaveStyle` 에서 rem 을 px 로 환산해 버려 단위가 남지 않는다. 넘긴 값이
    // 그대로 붙었는지 보려면 인라인 스타일을 직접 읽어야 한다.
    expect(screen.getByRole("status").querySelector("li")).toHaveAttribute("style", "height: 20rem;");
  });

  it("화면의 격자 클래스를 넘기면 그것을 쓴다", () => {
    // 열 수·간격이 화면마다 달라, 로딩이 끝나는 순간 카드가 재배치되지 않으려면
    // 스켈레톤이 그 화면의 실제 격자를 그대로 써야 한다.
    render(<CardGridSkeleton count={2} height="10rem" className="page-grid" />);

    expect(screen.getByRole("status").querySelector("ul")).toHaveClass("page-grid");
  });
});

describe("BlockSkeleton", () => {
  it("넘긴 높이만큼 자리를 잡는다", () => {
    // 필터 탭처럼 데이터가 와야 그릴 수 있는 띠의 자리를 대신 잡는 용도다 —
    // 높이가 안 맞으면 응답이 도착할 때 아래 내용이 그만큼 밀린다.
    render(<BlockSkeleton height="2.375rem" />);

    expect(screen.getByRole("status").querySelector("span")).toHaveAttribute("style", "height: 2.375rem; width: 100%;");
  });
});

describe("FormSkeleton", () => {
  it("필드마다 라벨과 입력칸 자리를 함께 잡는다", () => {
    render(<FormSkeleton fields={3} />);

    expect(screen.getByRole("status").querySelectorAll("span")).toHaveLength(6);
  });
});

describe("States.module.scss", () => {
  it("어드민 전용 커스텀 프로퍼티에 기대지 않는다", () => {
    /*
     * `--admin-*` 은 `AdminLayout.module.scss` 의 `.layout` 안에서만 정의된다. 그런데 이
     * 컴포넌트는 공개·부원 화면에서도 쓰이고, `Modal` 은 `document.body` 로 포털되어
     * `.layout` 밖으로 나간다. 거기서는 변수가 없어 선언이 통째로 무효가 되고
     * `background-color` 가 transparent 로 떨어져 **스켈레톤이 아예 안 보였다.**
     *
     * jsdom 은 CSS 를 계산하지 않아 렌더 단언으로는 이걸 잡을 수 없다. `?raw` 도 안 된다 —
     * `.module.scss` 는 CSS Modules 플러그인이 먼저 잡아 클래스 맵 객체를 준다. 그래서
     * 원본을 직접 읽어 규칙 자체를 지킨다 — 색은 전역 SCSS 토큰에서 가져온다.
     */
    const scss = readFileSync(resolve(process.cwd(), "src/components/ui/states/States.module.scss"), "utf8");

    expect(scss).not.toMatch(/var\(--admin-/);
  });
});

describe("ErrorState", () => {
  it("오류는 alert 로 알린다", () => {
    // 화면을 보고 있지 않아도 실패했다는 것이 전달돼야 한다.
    render(<ErrorState message="목록을 불러오지 못했습니다." />);

    expect(screen.getByRole("alert")).toHaveTextContent("목록을 불러오지 못했습니다.");
  });

  it("재시도 핸들러를 주지 않으면 버튼을 그리지 않는다", () => {
    render(<ErrorState message="실패" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("재시도 버튼을 누르면 핸들러를 부른다", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="실패" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("EmptyState", () => {
  it("메시지를 보여준다", () => {
    render(<EmptyState message="등록된 질문이 없습니다." />);

    expect(screen.getByText("등록된 질문이 없습니다.")).toBeInTheDocument();
  });

  it("빈 상태는 오류가 아니므로 alert 로 알리지 않는다", () => {
    render(<EmptyState message="없음" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("액션을 넘기면 함께 그린다", () => {
    render(<EmptyState message="없음" action={<button type="button">추가하기</button>} />);

    expect(screen.getByRole("button", { name: "추가하기" })).toBeInTheDocument();
  });
});

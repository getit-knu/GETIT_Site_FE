import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Curriculum, Faq, SiteEvent } from "../../../types/site";

import { ContentSections } from "./ContentSections";
import type { Draft } from "./contentDraft";
import { fromDrafts, toDrafts } from "./contentDraft";

const CURRICULUMS: Curriculum[] = [{ id: 1, title: "Python & 데이터 분석", subtitle: "기초부터" }];
const EVENTS: SiteEvent[] = [
  { id: 11, title: "개발 대회", startDate: "2026-09-27", endDate: "2026-11-11", type: "COMPETITION" },
];
const FAQS: Faq[] = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시" }];

interface HarnessProps {
  curriculums?: Curriculum[];
  events?: SiteEvent[];
  faqs?: Faq[];
}

/** 실제 화면처럼 상태를 들고 있는 껍데기. 여러 번 고치는 흐름을 봐야 한다. */
function Harness({ curriculums = CURRICULUMS, events = EVENTS, faqs = FAQS }: HarnessProps) {
  const [c, setC] = useState<Draft<Curriculum>[]>(() => toDrafts(curriculums));
  const [e, setE] = useState<Draft<SiteEvent>[]>(() => toDrafts(events));
  const [f, setF] = useState<Draft<Faq>[]>(() => toDrafts(faqs));

  return (
    <>
      <ContentSections
        curriculums={c}
        events={e}
        faqs={f}
        onCurriculumsChange={setC}
        onEventsChange={setE}
        onFaqsChange={setF}
      />
      <output>{JSON.stringify({ c: fromDrafts(c), e: fromDrafts(e), f: fromDrafts(f) })}</output>
    </>
  );
}

interface Result {
  c: Curriculum[];
  e: SiteEvent[];
  f: Faq[];
}
const result = (): Result => JSON.parse(screen.getByRole("status").textContent ?? "{}") as Result;

describe("ContentSections", () => {
  it("세 목록을 모두 보여준다", () => {
    render(<Harness />);

    expect(screen.getByLabelText("커리큘럼 제목 Python & 데이터 분석")).toHaveValue("Python & 데이터 분석");
    expect(screen.getByLabelText("행사 제목 개발 대회")).toHaveValue("개발 대회");
    expect(screen.getByLabelText("FAQ 질문 활동 시간은?")).toHaveValue("활동 시간은?");
  });

  it("빈 목록마다 안내를 보여준다", () => {
    render(<Harness curriculums={[]} events={[]} faqs={[]} />);

    expect(screen.getByText("등록된 커리큘럼이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("등록된 행사가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("등록된 FAQ 가 없습니다.")).toBeInTheDocument();
  });

  it("커리큘럼을 고친다", async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText("커리큘럼 부제 Python & 데이터 분석"), "!");

    expect(result().c[0]).toEqual({ id: 1, title: "Python & 데이터 분석", subtitle: "기초부터!" });
  });

  it("행사 기간과 종류를 고친다", async () => {
    render(<Harness />);

    await userEvent.selectOptions(screen.getByLabelText("개발 대회 종류"), "WORKSHOP");

    expect(result().e[0].type).toBe("WORKSHOP");
    // 다른 값은 건드리지 않는다.
    expect(result().e[0].startDate).toBe("2026-09-27");
  });

  it("새 행은 id 가 null 이고 그 목록에만 들어간다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "+ 행사 추가" }));

    expect(result().e).toHaveLength(2);
    expect(result().e[1].id).toBeNull();
    // 다른 목록은 늘지 않는다.
    expect(result().c).toHaveLength(1);
    expect(result().f).toHaveLength(1);
  });

  it("누른 행만 지우고 같은 목록의 나머지는 남긴다", async () => {
    /*
      가운데 행을 지워야 실수를 가려낼 수 있다. 행이 하나뿐이면 '전부 비우기' 와,
      첫 행이면 '앞에서 자르기' 와, 마지막 행이면 '뒤에서 자르기' 와 결과가 같아진다.
    */
    render(
      <Harness
        curriculums={[
          { id: 1, title: "첫째", subtitle: "" },
          { id: 2, title: "둘째", subtitle: "" },
          { id: 3, title: "셋째", subtitle: "" },
        ]}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "삭제" })[1]);

    expect(result().c.map((row) => row.title)).toEqual(["첫째", "셋째"]);
    // 다른 목록은 건드리지 않는다.
    expect(result().e).toHaveLength(1);
    expect(result().f).toHaveLength(1);
  });

  it("새로 만든 행 여러 개를 따로 고칠 수 있다", async () => {
    // id 가 전부 null 이라 서로 구분되지 않으면 한 칸만 고쳐도 둘 다 바뀐다.
    render(<Harness curriculums={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "+ 커리큘럼 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "+ 커리큘럼 추가" }));

    const boxes = screen.getAllByLabelText("커리큘럼 제목 (새 항목)");
    await userEvent.type(boxes[0], "가");
    await userEvent.type(screen.getAllByLabelText(/커리큘럼 제목/)[1], "나");

    expect(result().c.map((row) => row.title)).toEqual(["가", "나"]);
  });

  it("FAQ 답변을 고친다", async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('"활동 시간은?" 답변'), " 입니다");

    expect(result().f[0].answer).toBe("화요일 저녁 7시 입니다");
  });
});

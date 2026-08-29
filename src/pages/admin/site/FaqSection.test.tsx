import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Faq } from "../../../types/site";

import type { Draft } from "./faqDraft";
import { fromDrafts, toDrafts } from "./faqDraft";
import { FaqSection } from "./FaqSection";

const FAQS: Faq[] = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시" }];

/** 실제 화면처럼 상태를 들고 있는 껍데기. 여러 번 고치는 흐름을 봐야 한다. */
function Harness({ faqs = FAQS }: { faqs?: Faq[] }) {
  const [f, setF] = useState<Draft<Faq>[]>(() => toDrafts(faqs));

  return (
    <>
      <FaqSection faqs={f} onChange={setF} />
      <output>{JSON.stringify(fromDrafts(f))}</output>
    </>
  );
}

const result = (): Faq[] => JSON.parse(screen.getByRole("status").textContent ?? "[]") as Faq[];

describe("FaqSection", () => {
  it("목록을 보여준다", () => {
    render(<Harness />);
    expect(screen.getByLabelText("FAQ 질문 활동 시간은?")).toHaveValue("활동 시간은?");
  });

  it("빈 목록은 안내를 보여준다", () => {
    render(<Harness faqs={[]} />);
    expect(screen.getByText("등록된 FAQ 가 없습니다.")).toBeInTheDocument();
  });

  it("답변을 고친다", async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('"활동 시간은?" 답변'), " 입니다");

    expect(result()[0].answer).toBe("화요일 저녁 7시 입니다");
  });

  it("새 행을 추가한다", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("button", { name: "+ FAQ 추가" }));

    expect(result()).toHaveLength(2);
    expect(result()[1].id).toBeNull();
  });

  it("누른 행만 지운다", async () => {
    render(
      <Harness
        faqs={[
          { id: 1, question: "첫째", answer: "" },
          { id: 2, question: "둘째", answer: "" },
        ]}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "삭제" })[0]);

    expect(result().map((row) => row.question)).toEqual(["둘째"]);
  });
});

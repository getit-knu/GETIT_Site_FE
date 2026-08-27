import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/recruitment/recruitmentApi";
import type { RecruitmentQuestion } from "../../types/recruitment";

import { QuestionsSection } from "./QuestionsSection";

vi.mock("../../apis/recruitment/recruitmentApi");

const QUESTIONS: RecruitmentQuestion[] = [
  { id: 1, order: 1, type: "TEXT", content: "지원 동기", required: true, maxLength: 300, options: null },
  {
    id: 2,
    order: 2,
    type: "CHOICE",
    content: "희망 트랙",
    required: true,
    maxLength: null,
    options: [
      { id: "opt-1", label: "SW" },
      { id: "opt-2", label: "창업" },
    ],
  },
  { id: 3, order: 3, type: "TEXT", content: "포부", required: false, maxLength: 300, options: null },
];

function renderSection(locked = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <QuestionsSection locked={locked} />
    </QueryClientProvider>,
  );
}

const lastUpdate = () => vi.mocked(api.updateQuestion).mock.lastCall;
const filter = () => screen.getByLabelText("문항 유형 필터");

describe("QuestionsSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getQuestions).mockResolvedValue(QUESTIONS);
    vi.mocked(api.createQuestion).mockResolvedValue();
    vi.mocked(api.updateQuestion).mockResolvedValue();
    vi.mocked(api.deleteQuestion).mockResolvedValue();
    vi.mocked(api.reorderQuestions).mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("문항마다 유형을 보여준다", async () => {
    renderSection();

    expect(await screen.findByLabelText("1번 문항 유형")).toHaveValue("TEXT");
    expect(screen.getByLabelText("2번 문항 유형")).toHaveValue("CHOICE");
  });

  it("객관식 문항의 선택지를 보여준다", async () => {
    renderSection();

    expect(await screen.findByLabelText("2번 문항 1번 선택지")).toHaveValue("SW");
    expect(screen.getByLabelText("2번 문항 2번 선택지")).toHaveValue("창업");
  });

  it("서술형에는 선택지를 두지 않는다", async () => {
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    expect(screen.queryByLabelText("1번 문항 1번 선택지")).not.toBeInTheDocument();
  });

  it("서술형을 객관식으로 바꾸면 선택지를 만들고 maxLength 를 비운다", async () => {
    // 명세서 6.3 에서 maxLength 는 TEXT 만, options 는 CHOICE 만 쓴다.
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(screen.getByLabelText("1번 문항 유형"), "CHOICE");

    await waitFor(() => expect(api.updateQuestion).toHaveBeenCalled());
    expect(lastUpdate()?.[1]).toMatchObject({ type: "CHOICE", maxLength: null });
    expect(lastUpdate()?.[1].options).toHaveLength(1);
  });

  it("객관식을 서술형으로 바꾸면 선택지를 비운다", async () => {
    renderSection();
    await screen.findByLabelText("2번 문항 유형");

    await userEvent.selectOptions(screen.getByLabelText("2번 문항 유형"), "TEXT");

    await waitFor(() => expect(api.updateQuestion).toHaveBeenCalled());
    expect(lastUpdate()?.[1]).toMatchObject({ type: "TEXT", options: null });
    expect(lastUpdate()?.[1].maxLength).not.toBeNull();
  });

  it("서술형을 체크박스로 바꾸면 선택지를 하나 만든다", async () => {
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(screen.getByLabelText("1번 문항 유형"), "CHECKBOX");

    await waitFor(() => expect(api.updateQuestion).toHaveBeenCalled());
    expect(lastUpdate()?.[1]).toMatchObject({ type: "CHECKBOX", maxLength: null });
    expect(lastUpdate()?.[1].options).toHaveLength(1);
  });

  it("선택지를 더할 수 있다", async () => {
    renderSection();
    await screen.findByLabelText("2번 문항 유형");

    await userEvent.click(screen.getByRole("button", { name: "+ 선택지" }));

    await waitFor(() => expect(api.updateQuestion).toHaveBeenCalled());
    expect(lastUpdate()?.[1].options).toHaveLength(3);
  });

  it("선택지가 하나뿐이면 지울 수 없다", async () => {
    // 고를 것이 없는 객관식이 된다.
    vi.mocked(api.getQuestions).mockResolvedValue([{ ...QUESTIONS[1], options: [{ id: "opt-1", label: "SW" }] }]);
    renderSection();

    expect(await screen.findByRole("button", { name: "1번 문항 1번 선택지 삭제" })).toBeDisabled();
  });

  it("체크박스 문항은 선택지를 하나만 보여주고 더하거나 지울 수 없다", async () => {
    vi.mocked(api.getQuestions).mockResolvedValue([
      {
        id: 1,
        order: 1,
        type: "CHECKBOX",
        content: "동의",
        required: true,
        maxLength: null,
        options: [{ id: "agree", label: "동의합니다" }],
      },
    ]);
    renderSection();

    expect(await screen.findByLabelText("1번 문항 1번 선택지")).toHaveValue("동의합니다");
    expect(screen.queryByLabelText("1번 문항 1번 선택지 삭제")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ 선택지" })).not.toBeInTheDocument();
  });

  it("유형으로 걸러 볼 수 있다", async () => {
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(filter(), "CHOICE");

    expect(screen.getByLabelText("2번 문항 내용")).toBeInTheDocument();
    expect(screen.queryByLabelText("1번 문항 내용")).not.toBeInTheDocument();
    expect(screen.getByText("1개 / 전체 3개")).toBeInTheDocument();
  });

  it("걸러도 문항 번호는 전체 기준이다", async () => {
    // 필터를 걸었다고 3번 문항이 2번이 되면 안 된다.
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(filter(), "TEXT");

    expect(screen.getByLabelText("1번 문항 내용")).toBeInTheDocument();
    expect(screen.getByLabelText("3번 문항 내용")).toBeInTheDocument();
  });

  it("걸러 보는 동안에는 순서를 옮길 수 없다", async () => {
    // 화면에 없는 문항과 자리를 바꾸게 되어 무슨 일이 일어났는지 보이지 않는다.
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(filter(), "TEXT");

    expect(screen.getByRole("button", { name: "3번 문항 위로" })).toBeDisabled();
  });

  it("걸러 보는 유형이 있으면 그 유형으로 만든다", async () => {
    // 만들자마자 걸러져 사라지면 안 된다.
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(filter(), "CHOICE");
    await userEvent.click(screen.getByRole("button", { name: "+ 문항 추가" }));

    expect(vi.mocked(api.createQuestion).mock.lastCall?.[0]).toMatchObject({ type: "CHOICE", maxLength: null });
  });

  it("걸러 보는 유형이 체크박스면 그 유형으로 만들고 선택지를 하나 채운다", async () => {
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(filter(), "CHECKBOX");
    await userEvent.click(screen.getByRole("button", { name: "+ 문항 추가" }));

    const created = vi.mocked(api.createQuestion).mock.lastCall?.[0];
    expect(created).toMatchObject({ type: "CHECKBOX", maxLength: null });
    expect(created?.options).toHaveLength(1);
  });

  it("해당 유형이 없으면 안내를 보여준다", async () => {
    vi.mocked(api.getQuestions).mockResolvedValue([QUESTIONS[0]]);
    renderSection();
    await screen.findByLabelText("1번 문항 유형");

    await userEvent.selectOptions(filter(), "CHOICE");

    expect(screen.getByText("이 유형의 문항이 없습니다.")).toBeInTheDocument();
  });

  it("모집이 시작되면 아무것도 고칠 수 없다", async () => {
    renderSection(true);

    expect(await screen.findByLabelText("1번 문항 유형")).toBeDisabled();
    expect(screen.getByRole("button", { name: "+ 문항 추가" })).toBeDisabled();
  });
});

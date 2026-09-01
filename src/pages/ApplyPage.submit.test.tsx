import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getForm, getMyApplication, getResult, submit } from "../apis/application/myApplicationApi";
import { getColleges, getMajors, getRecruitmentStatus } from "../apis/public/publicApi";
import type { ApplicationDecisionResult, ApplicationFormResult } from "../types/application";
import type { College, Major } from "../types/college";
import type { RecruitmentStatus } from "../types/recruitment";

import ApplyPage from "./ApplyPage";

vi.mock("../apis/application/myApplicationApi");
vi.mock("../apis/public/publicApi");

/**
 * 최종 제출(#275). 폼 자체의 동작은 `ApplyPage.test.tsx` 에 있다 — 한 파일이 300 줄을
 * 넘지 않게 제출 쪽만 떼어 뒀다(`ApplyPage.result.test.tsx` 와 같은 방식).
 */

const COLLEGES: College[] = [{ id: 1, name: "경영대학" }];
const MAJORS: Major[] = [{ id: 1, collegeId: 1, name: "경영학과" }];

function form(): ApplicationFormResult {
  return {
    generationNo: 9,
    phase: "DOCUMENT_OPEN",
    deadline: "2026-09-30T23:59:00+09:00",
    basicInfoPrefill: {
      name: "홍길동",
      email: "hong@getit.com",
      phoneNumber: null,
      collegeId: null,
      majorId: null,
      grade: null,
      studentNumber: null,
    },
    questions: [
      {
        id: 1,
        order: 1,
        type: "TEXT",
        content: "지원 동기는 무엇인가요?",
        placeholder: "자유롭게 작성해주세요.",
        required: true,
        maxLength: 300,
        options: null,
      },
      {
        id: 2,
        order: 2,
        type: "CHOICE",
        content: "선호하는 트랙은?",
        placeholder: null,
        required: true,
        maxLength: null,
        options: [
          { id: "opt-1", label: "SW" },
          { id: "opt-2", label: "창업" },
        ],
      },
      {
        id: 3,
        order: 3,
        type: "CHECKBOX",
        content: "개인정보 수집에 동의하시나요?",
        placeholder: null,
        required: true,
        maxLength: null,
        options: [{ id: "opt-1", label: "동의합니다" }],
      },
    ],
  };
}

function decision(): ApplicationDecisionResult {
  return {
    generationNo: 9,
    status: "SUBMITTED",
    statusLabel: "심사 중",
    documentAnnouncedAt: "2026-09-15T00:00:00+09:00",
    finalAnnouncedAt: "2026-09-30T00:00:00+09:00",
    nextStep: null,
  };
}

function recruitmentStatus(): RecruitmentStatus {
  return {
    generationNo: 9,
    year: 2026,
    phase: "DOCUMENT_OPEN",
    dDay: 5,
    message: "",
    applyEnabled: true,
    schedule: null,
  };
}

/** 단과 대학 `<option>` 이 실제로 뜬 뒤에 돌려준다(`ApplyPage.test.tsx` 와 같은 이유). */
async function renderReadyPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/apply", element: <ApplyPage /> }], { initialEntries: ["/apply"] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole("option", { name: "경영대학" });
}

/** 제출을 막지 않을 만큼 다 채운다. */
async function fillAll() {
  await userEvent.type(screen.getByLabelText("전화번호 *"), "010-0000-0000");
  fireEvent.change(screen.getByLabelText("단과 대학 *"), { target: { value: "1" } });
  await screen.findByRole("option", { name: "경영학과" });
  fireEvent.change(screen.getByLabelText("전공 *"), { target: { value: "1" } });
  await userEvent.type(screen.getByLabelText("학년 *"), "2");
  await userEvent.type(screen.getByLabelText("지원 동기는 무엇인가요? *"), "성장하고 싶어서 지원합니다.");
  await userEvent.click(screen.getByRole("radio", { name: "SW" }));
  await userEvent.click(screen.getByRole("checkbox", { name: "동의합니다" }));
  // 개인정보 동의(고정 칸) — 위 "동의합니다"는 어드민이 만든 지원 문항(CHECKBOX)이고, 이건
  // 별개로 화면이 항상 갖고 있는 칸이다.
  await userEvent.click(screen.getByRole("checkbox", { name: /개인정보 수집·이용에 동의합니다/ }));
}

describe("ApplyPage 최종 제출", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getMyApplication).mockResolvedValue(null);
    vi.mocked(getForm).mockResolvedValue(form());
    vi.mocked(getColleges).mockResolvedValue(COLLEGES);
    vi.mocked(getMajors).mockResolvedValue(MAJORS);
    vi.mocked(getRecruitmentStatus).mockResolvedValue(recruitmentStatus());
  });

  it("누르기 전에도 수정할 수 없다는 것을 알린다", async () => {
    // 되묻는 토스트는 누른 뒤에야 뜬다. 누르기 전에 알 수 있어야 한다.
    await renderReadyPage();

    expect(screen.getByText("제출하면 더 이상 수정할 수 없습니다.")).toBeInTheDocument();
  });

  it("제출 버튼을 눌러도 바로 보내지 않고 되묻는다", async () => {
    /*
      최종 제출은 되돌릴 수 없다(BE 도 status != DRAFT 면 409 로 막는다).
      한 번 잘못 누른 것으로 끝나면 안 된다.
    */
    await renderReadyPage();
    await fillAll();

    await userEvent.click(screen.getByRole("button", { name: "제출하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("제출하면 더 이상 수정할 수 없습니다");
    expect(submit).not.toHaveBeenCalled();
  });

  it("되묻는 것을 닫으면 제출하지 않는다", async () => {
    await renderReadyPage();
    await fillAll();

    await userEvent.click(screen.getByRole("button", { name: "제출하기" }));
    await userEvent.click(await screen.findByRole("button", { name: "닫기" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("되물었을 때 제출을 누르면 보내고, 결과 화면으로 바뀐다", async () => {
    // 제출 성공 후 useMyApplication이 다시 조회하면 이제는 SUBMITTED로 와야
    // 화면이 결과 보기로 바뀐다 — 실제 서버도 이렇게 상태가 바뀐다.
    vi.mocked(submit).mockImplementation(async () => {
      vi.mocked(getMyApplication).mockResolvedValue({
        id: 1,
        generationNo: 9,
        status: "SUBMITTED",
        basicInfo: {
          name: "홍길동",
          email: "hong@getit.com",
          phoneNumber: "010-0000-0000",
          collegeId: 1,
          majorId: 1,
          grade: 2,
          studentNumber: null,
        },
        answers: [],
        savedAt: "2026-09-01T00:00:00+09:00",
        submittedAt: "2026-09-02T00:00:00+09:00",
      });
      return {
        id: 1,
        status: "SUBMITTED",
        submittedAt: "2026-09-02T00:00:00+09:00",
        privacyConsentedAt: "2026-09-02T00:00:00+09:00",
      };
    });
    vi.mocked(getResult).mockResolvedValue(decision());
    await renderReadyPage();
    await fillAll();

    await userEvent.click(screen.getByRole("button", { name: "제출하기" }));
    await userEvent.click(await screen.findByRole("button", { name: "제출" }));

    await waitFor(() => expect(submit).toHaveBeenCalled());
    const payload = vi.mocked(submit).mock.lastCall?.[0];
    expect(payload?.basicInfo.collegeId).toBe(1);
    expect(payload?.basicInfo.majorId).toBe(1);
    expect(payload?.basicInfo.grade).toBe(2);
    // #203 — 동의 없이는 애초에 여기까지 못 왔지만(제출을 눌렀다면 이미 체크된 것), 실제로
    // 보내는 값에 실렸는지 직접 확인한다.
    expect(payload?.privacyConsent).toBe(true);

    expect(await screen.findByRole("heading", { name: "심사 중" })).toBeInTheDocument();
  });

  it("개인정보 동의를 안 하면 다른 칸을 다 채워도 제출을 막는다", async () => {
    await renderReadyPage();
    await fillAll();
    // fillAll이 이미 체크한 걸 다시 풀어, "동의 빼고 다 채운" 상태를 만든다.
    await userEvent.click(screen.getByRole("checkbox", { name: /개인정보 수집·이용에 동의합니다/ }));

    await userEvent.click(screen.getByRole("button", { name: "제출하기" }));

    expect(submit).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "제출" })).not.toBeInTheDocument();
    expect(await screen.findByText("개인정보 수집·이용에 동의해 주세요.")).toBeInTheDocument();
  });

  it("되묻는 동안 폼이 다시 미완성이 되면 확인을 눌러도 보내지 않는다", async () => {
    // 토스트가 떠 있는 사이에도 폼은 고칠 수 있다. 제출 버튼이 막는 조건은 확인 단계에서도 같아야 한다.
    await renderReadyPage();
    await fillAll();

    await userEvent.click(screen.getByRole("button", { name: "제출하기" }));
    await screen.findByRole("button", { name: "제출" });
    await userEvent.clear(screen.getByLabelText("전화번호 *"));
    await userEvent.click(screen.getByRole("button", { name: "제출" }));

    expect(submit).not.toHaveBeenCalled();
    // 비운 칸 하나를 콕 짚어 준다 — 여섯 칸을 뭉뚱그려 나열하던 시절엔 어디가 빈지 직접 찾아야 했다.
    expect(await screen.findByText("전화번호를 입력해 주세요.")).toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyQuestions } from "../../apis/qna/myQuestionsApi";
import type { MyQuestion } from "../../types/lecture";

import { useMyQuestions } from "./useMyQuestions";

vi.mock("../../apis/qna/myQuestionsApi");

function question(id: number): MyQuestion {
  return {
    id,
    lectureId: 7,
    lectureTitle: "3주차 · 재무제표 읽기",
    authorName: "김부원",
    content: `질문 ${id}`,
    createdAt: "2026-09-01T10:00:00+09:00",
    status: "PENDING",
    answers: [],
  };
}

function page(size: number) {
  const content = Array.from({ length: size }, (_, index) => question(index + 1));
  return { content, page: 0, size, totalElements: 30, totalPages: Math.ceil(30 / size), first: true, last: false };
}

/** 같은 QueryClient 를 계속 써야 앞선 조회의 캐시가 남아 있는 상황을 만들 수 있다. */
function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useMyQuestions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("같은 페이지라도 size 가 다르면 앞선 조회의 캐시를 쓰지 않는다", async () => {
    /*
      size 는 요청에 들어가는 값이라 쿼리 키에도 있어야 한다. 빠지면 5개짜리 캐시가
      10개 요청에 그대로 재사용돼, 화면이 요청한 적 없는 목록을 그린다.
    */
    vi.mocked(getMyQuestions).mockImplementation(async ({ size = 5 } = {}) => page(size));
    const wrapper = makeWrapper();

    const first = renderHook(() => useMyQuestions(0, 5), { wrapper });
    await waitFor(() => expect(first.result.current.data?.content).toHaveLength(5));

    const second = renderHook(() => useMyQuestions(0, 10), { wrapper });

    // 마운트 직후에 이미 데이터가 있다면 앞선 size=5 캐시를 물려받은 것이다.
    expect(second.result.current.data).toBeUndefined();
    await waitFor(() => expect(second.result.current.data?.content).toHaveLength(10));
  });

  it("size 마다 서버에 따로 요청한다", async () => {
    vi.mocked(getMyQuestions).mockImplementation(async ({ size = 5 } = {}) => page(size));
    const wrapper = makeWrapper();

    const first = renderHook(() => useMyQuestions(0, 5), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = renderHook(() => useMyQuestions(0, 10), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(getMyQuestions).toHaveBeenCalledTimes(2);
    expect(getMyQuestions).toHaveBeenNthCalledWith(1, { page: 0, size: 5 });
    expect(getMyQuestions).toHaveBeenNthCalledWith(2, { page: 0, size: 10 });
  });
});

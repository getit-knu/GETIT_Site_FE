import type { Faq } from "../../../types/site";

/**
 * FAQ 편집 상태.
 *
 * **`id` 를 React key 로 쓸 수 없다.** 저장 전까지 서버에 아무것도 보내지 않으므로
 * 새로 만든 행은 전부 `id: null` 이라 서로 구분되지 않는다. 화면 전용 key 를 따로 둔다.
 */
export type Draft<T> = T & { key: string };

let counter = 0;
/** 화면 전용 key. 렌더 중에 부르지 않는다(`react-hooks/purity`). */
function nextKey(): string {
  counter += 1;
  return `faq-${counter}`;
}

export function toDrafts<T>(rows: T[]): Draft<T>[] {
  return rows.map((row) => ({ ...row, key: nextKey() }));
}

/** 화면 전용 key 를 떼고 서버로 보낼 형태로 되돌린다. */
export function fromDrafts<T>(drafts: Draft<T>[]): T[] {
  return drafts.map(({ key, ...row }) => {
    void key;
    return row as unknown as T;
  });
}

export function emptyFaq(): Draft<Faq> {
  return { key: nextKey(), id: null, question: "", answer: "" };
}

/** 저장을 막는 이유. 없으면 `null`. */
export function faqInvalidReason(faqs: Draft<Faq>[]): string | null {
  for (const faq of faqs) {
    if (faq.question.trim() === "") return "질문이 비어 있는 FAQ 가 있습니다.";
    // 답이 없는 FAQ 는 공개 사이트에 빈칸으로 나간다.
    if (faq.answer.trim() === "") return `"${faq.question.trim()}" 의 답변을 입력해 주세요.`;
  }
  return null;
}

import type { Curriculum, EventType, Faq, SiteEvent } from "../../../types/site";

/**
 * 커리큘럼 · 행사 · FAQ 편집 상태. 명세서 10.10 ~ 10.20.
 *
 * 셋 다 "목록에 행을 넣고 빼는" 같은 모양이라 한곳에서 다룬다.
 *
 * **`id` 를 React key 로 쓸 수 없다.** 저장 전까지 서버에 아무것도 보내지 않으므로
 * (10.20 일괄 저장) 새로 만든 행은 전부 `id: null` 이라 서로 구분되지 않는다.
 * 화면 전용 key 를 따로 둔다.
 */
export type Draft<T> = T & { key: string };

let counter = 0;
/** 화면 전용 key. 렌더 중에 부르지 않는다(`react-hooks/purity`). */
function nextKey(): string {
  counter += 1;
  return `content-${counter}`;
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

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "COMPETITION", label: "대회" },
  { value: "WORKSHOP", label: "워크숍" },
  { value: "EVENT", label: "행사" },
];

export function emptyCurriculum(): Draft<Curriculum> {
  return { key: nextKey(), id: null, title: "", subtitle: "" };
}

export function emptyEvent(): Draft<SiteEvent> {
  return { key: nextKey(), id: null, title: "", startDate: "", endDate: "", type: "EVENT" };
}

export function emptyFaq(): Draft<Faq> {
  return { key: nextKey(), id: null, question: "", answer: "" };
}

/** 저장을 막는 이유. 없으면 `null`. */
export function contentInvalidReason(
  curriculums: Draft<Curriculum>[],
  events: Draft<SiteEvent>[],
  faqs: Draft<Faq>[],
): string | null {
  if (curriculums.some((row) => row.title.trim() === "")) return "제목이 비어 있는 커리큘럼이 있습니다.";

  for (const event of events) {
    if (event.title.trim() === "") return "제목이 비어 있는 행사가 있습니다.";
    if (event.startDate === "" || event.endDate === "") {
      return `${event.title.trim()} 의 행사 기간을 입력해 주세요.`;
    }
    // 하루짜리 행사는 시작과 종료가 같다. 같은 것은 막지 않는다.
    if (event.endDate < event.startDate) return `${event.title.trim()} 의 종료일이 시작일보다 빠릅니다.`;
  }

  for (const faq of faqs) {
    if (faq.question.trim() === "") return "질문이 비어 있는 FAQ 가 있습니다.";
    // 답이 없는 FAQ 는 공개 사이트에 빈칸으로 나간다.
    if (faq.answer.trim() === "") return `"${faq.question.trim()}" 의 답변을 입력해 주세요.`;
  }

  return null;
}

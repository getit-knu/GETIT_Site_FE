import { toIso, toLocalInput } from "../../../libs/datetimeLocalInput";
import type { SiteSchedule } from "../../../types/site";

/**
 * 모집 일정 폼 상태.
 *
 * `<input type="datetime-local">` 은 `2026-09-01T00:00` 형태만 받는다. 서버는 오프셋이
 * 붙은 ISO 8601 을 주고받으므로 화면에 들일 때와 낼 때 형태를 바꿔 준다(`libs/datetimeLocalInput`).
 */
export type ScheduleDraft = Record<keyof SiteSchedule, string>;

export const SCHEDULE_FIELDS: { key: keyof SiteSchedule; label: string }[] = [
  { key: "totalStartAt", label: "전체 모집 시작" },
  { key: "totalEndAt", label: "전체 모집 마감" },
  { key: "documentStartAt", label: "서류 접수 시작" },
  { key: "documentEndAt", label: "서류 접수 마감" },
  { key: "interviewStartAt", label: "면접 시작" },
];

export function toDraft(schedule: SiteSchedule): ScheduleDraft {
  return {
    totalStartAt: toLocalInput(schedule.totalStartAt),
    totalEndAt: toLocalInput(schedule.totalEndAt),
    documentStartAt: toLocalInput(schedule.documentStartAt),
    documentEndAt: toLocalInput(schedule.documentEndAt),
    interviewStartAt: toLocalInput(schedule.interviewStartAt),
  };
}

export function toSchedule(draft: ScheduleDraft): SiteSchedule {
  return {
    totalStartAt: toIso(draft.totalStartAt),
    totalEndAt: toIso(draft.totalEndAt),
    documentStartAt: toIso(draft.documentStartAt),
    documentEndAt: toIso(draft.documentEndAt),
    interviewStartAt: toIso(draft.interviewStartAt),
  };
}

/**
 * 저장을 막는 이유. 없으면 `null`.
 *
 * 눌러 보고 알게 하지 않는다. 서버도 막는 조건이지만 왕복하기 전에 화면에서 알린다.
 */
export function invalidReason(draft: ScheduleDraft): string | null {
  const missing = SCHEDULE_FIELDS.find(({ key }) => draft[key] === "");
  if (missing) return `${missing.label} 일시를 입력해 주세요.`;

  /*
    비어 있지 않다고 쓸 수 있는 값은 아니다. 형태가 어긋난 값(주소를 손으로 고쳤거나
    저장된 값이 깨진 경우)은 `toIso` 가 빈 문자열을 돌려주므로, 막지 않으면 저장 버튼이
    열린 채 빈 일정이 서버로 나간다.
  */
  const malformed = SCHEDULE_FIELDS.find(({ key }) => toIso(draft[key]) === "");
  if (malformed) return `${malformed.label} 일시 형식이 올바르지 않습니다.`;

  if (draft.totalEndAt <= draft.totalStartAt) return "전체 모집 마감이 시작보다 빠릅니다.";
  if (draft.documentEndAt <= draft.documentStartAt) return "서류 접수 마감이 시작보다 빠릅니다.";

  /*
    서류·면접은 전체 모집 기간 안에 들어야 한다. 밖으로 나가면 공개 사이트의 단계 표기가 어긋난다.

    상한도 각각 따로 본다. 서류가 전체 마감을 넘으면 뒤따르는 면접 검사에도 걸리지만,
    그러면 "면접이 늦습니다" 라고 나와 정작 고쳐야 할 칸을 짚어 주지 못한다.
  */
  if (draft.documentStartAt < draft.totalStartAt) return "서류 접수가 전체 모집 시작보다 빠릅니다.";
  if (draft.documentStartAt > draft.totalEndAt) return "서류 접수 시작이 전체 모집 마감보다 늦습니다.";
  if (draft.documentEndAt > draft.totalEndAt) return "서류 접수 마감이 전체 모집 마감보다 늦습니다.";
  if (draft.interviewStartAt < draft.documentEndAt) return "면접이 서류 마감보다 빠릅니다.";
  if (draft.interviewStartAt > draft.totalEndAt) return "면접이 전체 모집 마감보다 늦습니다.";

  return null;
}

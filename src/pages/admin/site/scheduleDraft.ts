import type { SiteSchedule } from "../../../types/site";

/**
 * 모집 일정 폼 상태.
 *
 * `<input type="datetime-local">` 은 `2026-09-01T00:00` 형태만 받는다. 서버는 오프셋이
 * 붙은 ISO 8601 을 주고받으므로 화면에 들일 때와 낼 때 형태를 바꿔 준다.
 */
export type ScheduleDraft = Record<keyof SiteSchedule, string>;

export const SCHEDULE_FIELDS: { key: keyof SiteSchedule; label: string }[] = [
  { key: "totalStartAt", label: "전체 모집 시작" },
  { key: "totalEndAt", label: "전체 모집 마감" },
  { key: "documentStartAt", label: "서류 접수 시작" },
  { key: "documentEndAt", label: "서류 접수 마감" },
  { key: "interviewStartAt", label: "면접 시작" },
];

const KST_OFFSET_MINUTES = 9 * 60;

/**
 * ISO → `datetime-local` 값.
 *
 * 문자열을 그대로 자르면 서버가 준 오프셋을 무시하게 된다(`+09:00` 이 아닐 수도 있다).
 * 시각으로 바꾼 뒤 한국 시간으로 다시 그린다 — 화면 표기는 KST 로 고정한다.
 */
export function toLocalInput(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";

  const kst = new Date(at.getTime() + KST_OFFSET_MINUTES * 60_000);
  return kst.toISOString().slice(0, 16);
}

/**
 * `datetime-local` 값의 형태. `2026-09-01T00:00`.
 *
 * `Date` 파싱만 믿으면 안 된다 — V8 은 `"아무거나:00Z"` 를 2000-01-01 로 읽어 준다.
 * 주소나 저장된 값이 깨져 들어왔을 때 엉뚱한 날짜가 조용히 저장된다.
 */
const LOCAL_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** `datetime-local` 값 → ISO. 입력은 KST 로 읽는다. */
export function toIso(local: string): string {
  if (!LOCAL_INPUT.test(local)) return "";

  const asUtc = new Date(`${local}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return "";

  return new Date(asUtc.getTime() - KST_OFFSET_MINUTES * 60_000).toISOString();
}

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
export function invalidReason(generationNo: string, year: string, draft: ScheduleDraft): string | null {
  const no = Number(generationNo);
  if (!Number.isInteger(no) || no < 1) return "기수는 1 이상의 정수여야 합니다.";

  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000) return "연도를 올바르게 입력해 주세요.";

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

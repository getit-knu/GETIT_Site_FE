import type { ProgressStatus, ProjectDetailFields } from "../../types/project";

/** BE `@Size(max = 60)`(BE#227). FESTA 카드 소개 문구다. */
export const ONE_LINER_MAX = 60;

export const PROGRESS_OPTIONS: { value: ProgressStatus; label: string }[] = [
  { value: "IN_PROGRESS", label: "개발 중" },
  { value: "LIVE", label: "서비스 중" },
  { value: "ENDED", label: "서비스 종료" },
];

/** 입력칸 값(#389). 모두 선택값이라 빈 문자열이 "정하지 않음"이다. */
export interface ProjectDetailsDraft {
  oneLiner: string;
  progressStatus: ProgressStatus | "";
  playStoreUrl: string;
  appStoreUrl: string;
}

export function emptyDetailsDraft(): ProjectDetailsDraft {
  return { oneLiner: "", progressStatus: "", playStoreUrl: "", appStoreUrl: "" };
}

export function toDetailsDraft(fields: ProjectDetailFields): ProjectDetailsDraft {
  return {
    oneLiner: fields.oneLiner ?? "",
    progressStatus: fields.progressStatus ?? "",
    playStoreUrl: fields.playStoreUrl ?? "",
    appStoreUrl: fields.appStoreUrl ?? "",
  };
}

const isBadLink = (value: string) => value.trim() !== "" && !/^https?:\/\/\S+$/i.test(value.trim());

/** 서버도 검증한다(BE `@Size`·`@HttpUrl`). 눌러 보고 알게 하지 않는다. */
export function detailsInvalidReason(draft: ProjectDetailsDraft): string | null {
  if (draft.oneLiner.trim().length > ONE_LINER_MAX) return `한 줄 소개는 ${ONE_LINER_MAX}자 이내로 입력해 주세요.`;
  if (isBadLink(draft.playStoreUrl)) return "Google Play 링크는 http:// 또는 https:// 로 시작해야 합니다.";
  if (isBadLink(draft.appStoreUrl)) return "App Store 링크는 http:// 또는 https:// 로 시작해야 합니다.";
  return null;
}

/**
 * 요청에 실을 값. 비운 칸은 `null`이다 — BE `@HttpUrl`은 `""`를 형식 위반(400)으로 보고, 수정은 통째로
 * 바꾸는 요청이라 `null`이 곧 "지운다"이다.
 */
export function toDetailsPayload(draft: ProjectDetailsDraft): Omit<ProjectDetailFields, "progressStatusLabel"> {
  const orNull = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    oneLiner: orNull(draft.oneLiner),
    progressStatus: draft.progressStatus === "" ? null : draft.progressStatus,
    playStoreUrl: orNull(draft.playStoreUrl),
    appStoreUrl: orNull(draft.appStoreUrl),
  };
}

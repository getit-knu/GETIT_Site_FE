import type { SiteTrack } from "../../../types/site";

/**
 * 강의 분류 편집 상태.
 *
 * 저장 전까지는 서버에 아무것도 보내지 않는다(10.20 일괄 저장). 그래서 화면에서 만든
 * 항목은 아직 서버 id 가 없고, 명세서 규약대로 `id: null` 로 나간다.
 *
 * **`id` 를 React key 로 쓸 수 없다.** 새로 만든 항목은 전부 `null` 이라 서로 구분되지
 * 않는다. 화면 전용 key 를 따로 둔다.
 */
export interface SubCategoryDraft {
  key: string;
  id: number | null;
  name: string;
}

export interface TrackDraft {
  key: string;
  id: number | null;
  name: string;
  subCategories: SubCategoryDraft[];
}

let counter = 0;
/** 화면 전용 key. 렌더 중에 부르지 않는다(`react-hooks/purity`). */
function nextKey(): string {
  counter += 1;
  return `draft-${counter}`;
}

export function toTrackDrafts(tracks: SiteTrack[]): TrackDraft[] {
  return tracks.map((track) => ({
    key: nextKey(),
    id: track.id,
    name: track.name,
    subCategories: track.subCategories.map((sub) => ({ key: nextKey(), id: sub.id, name: sub.name })),
  }));
}

export function toTracks(drafts: TrackDraft[]): SiteTrack[] {
  return drafts.map((draft) => ({
    id: draft.id,
    name: draft.name.trim(),
    subCategories: draft.subCategories.map((sub) => ({ id: sub.id, name: sub.name.trim() })),
  }));
}

export function emptyTrack(): TrackDraft {
  return { key: nextKey(), id: null, name: "", subCategories: [] };
}

export function emptySubCategory(): SubCategoryDraft {
  return { key: nextKey(), id: null, name: "" };
}

/** 저장을 막는 이유. 없으면 `null`. */
export function tracksInvalidReason(drafts: TrackDraft[]): string | null {
  if (drafts.some((track) => track.name.trim() === "")) return "이름이 비어 있는 대분류가 있습니다.";

  const names = drafts.map((track) => track.name.trim());
  if (new Set(names).size !== names.length) return "대분류 이름이 겹칩니다.";

  for (const track of drafts) {
    if (track.subCategories.some((sub) => sub.name.trim() === "")) {
      return `${track.name.trim()} 에 이름이 비어 있는 소분류가 있습니다.`;
    }

    // 소분류는 대분류 안에서만 겹치지 않으면 된다. 다른 대분류와는 같아도 괜찮다.
    const subNames = track.subCategories.map((sub) => sub.name.trim());
    if (new Set(subNames).size !== subNames.length) {
      return `${track.name.trim()} 의 소분류 이름이 겹칩니다.`;
    }
  }

  return null;
}

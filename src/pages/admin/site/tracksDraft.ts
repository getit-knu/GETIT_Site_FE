import type { SiteTrack } from "../../../types/site";

/**
 * 강의 분류 편집 상태.
 *
 * 화면은 트리 전체를 로컬 draft로 들고 있다가 "저장하기" 한 번에 반영한다 — 다만 실제로는
 * 일괄 저장 엔드포인트가 없어(명세서 10.4 ~ 10.9 개별 CRUD뿐), 저장 시점에 서버 트리와
 * 비교해 여러 요청으로 나눠 보낸다(`siteApi.saveTracks` 참고). 그래서 화면에서 만든
 * 항목은 아직 서버 id 가 없고 `id: null` 로 둔다.
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

/**
 * 서버 트리를 화면 초안으로 바꾼다. **id 로 key 를 만든다** — 새 항목(id: null)만
 * `nextKey()`(`emptyTrack`/`emptySubCategory`)를 쓴다. 이 함수 자체는 같은 입력에
 * 항상 같은 key 를 내야 한다 — 저장 후 초안을 비우고 이 함수로 다시 채울 때, 매번
 * 다른 key 가 나오면 목록 전체가 리마운트된다.
 */
export function toTrackDrafts(tracks: SiteTrack[]): TrackDraft[] {
  return tracks.map((track) => ({
    key: `track-${track.id}`,
    id: track.id,
    name: track.name,
    subCategories: track.subCategories.map((sub) => ({ key: `sub-${sub.id}`, id: sub.id, name: sub.name })),
  }));
}

export interface TrackSaveInput {
  id: number | null;
  name: string;
  subCategories: { id: number | null; name: string }[];
}

export function toTracks(drafts: TrackDraft[]): TrackSaveInput[] {
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

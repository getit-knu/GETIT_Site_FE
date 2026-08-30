import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";

import type { SubCategoryDraft, TrackDraft } from "./tracksDraft";
import { emptySubCategory, emptyTrack } from "./tracksDraft";
import styles from "./TracksSection.module.scss";

interface TracksSectionProps {
  tracks: TrackDraft[];
  onChange: (next: TrackDraft[]) => void;
  onSave: () => void;
  saving: boolean;
  reason: string | null;
  saveError: string | null;
  saved: boolean;
}

/**
 * 강의 분류 트리 편집 몸통. 와이어프레임 p10. 명세서 10.3 ~ 10.9.
 *
 * **개별 CRUD를 직접 부르지 않는다.** 화면은 트리 전체를 로컬 초안으로 들고 있다가
 * `저장하기` 한 번에 반영하고, 실제로 어떤 요청이 몇 번 나가는지는 `siteApi.saveTracks`가
 * 서버 트리와 비교해서 정한다.
 *
 * `<section id="tracks">`·제목은 여기 없다 — 부르는 쪽(`SitePage`)이 조회 중 · 실패 상태도
 * 같은 섹션 안에서 보여줘야 해서(Curriculum·Events와 같은 모양) 그쪽이 감싼다.
 */
export function TracksSection({ tracks, onChange, onSave, saving, reason, saveError, saved }: TracksSectionProps) {
  function patchTrack(key: string, patch: Partial<TrackDraft>) {
    onChange(tracks.map((track) => (track.key === key ? { ...track, ...patch } : track)));
  }

  function patchSub(trackKey: string, subKey: string, patch: Partial<SubCategoryDraft>) {
    const track = tracks.find((t) => t.key === trackKey);
    if (track === undefined) return;

    patchTrack(trackKey, {
      subCategories: track.subCategories.map((sub) => (sub.key === subKey ? { ...sub, ...patch } : sub)),
    });
  }

  return (
    <>
      {tracks.length === 0 ? (
        <p className={styles.hint}>등록된 분류가 없습니다.</p>
      ) : (
        <ul className={styles.tracks}>
          {tracks.map((track) => (
            <li key={track.key} className={styles.track}>
              <div className={styles.trackHead}>
                <Input
                  ariaLabel={`대분류 이름 ${track.name || "(새 항목)"}`}
                  value={track.name}
                  onChange={(name) => patchTrack(track.key, { name })}
                />
                <button
                  type="button"
                  className={styles.danger}
                  /*
                    대분류를 지우면 딸린 소분류도 함께 사라진다. 되돌릴 수 없는 것은
                    저장 버튼이지 이 버튼이 아니라, 여기서는 확인을 묻지 않고
                    사라지는 것이 화면에 그대로 보이게 둔다.
                  */
                  onClick={() => onChange(tracks.filter((t) => t.key !== track.key))}
                >
                  대분류 삭제
                </button>
              </div>

              <ul className={styles.subs}>
                {track.subCategories.map((sub) => (
                  <li key={sub.key}>
                    <Input
                      ariaLabel={`${track.name || "새 대분류"} 소분류 이름 ${sub.name || "(새 항목)"}`}
                      value={sub.name}
                      onChange={(name) => patchSub(track.key, sub.key, { name })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patchTrack(track.key, {
                          subCategories: track.subCategories.filter((s) => s.key !== sub.key),
                        })
                      }
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={styles.add}
                onClick={() => patchTrack(track.key, { subCategories: [...track.subCategories, emptySubCategory()] })}
              >
                + 소분류 추가
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.add} onClick={() => onChange([...tracks, emptyTrack()])}>
        + 대분류 추가
      </button>

      <div className={styles.footer}>
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {saveError !== null && <p className={styles.reason}>{saveError}</p>}
        {saved && saveError === null && (
          <p className={styles.saved} role="status">
            저장했습니다.
          </p>
        )}
        <Button disabled={reason !== null || saving} onClick={onSave}>
          {saving ? "저장 중…" : "강의 분류 저장"}
        </Button>
      </div>
    </>
  );
}

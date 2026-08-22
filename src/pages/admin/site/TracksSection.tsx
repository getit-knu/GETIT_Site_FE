import { Input } from "../../../components/ui/Input/Input";

import type { SubCategoryDraft, TrackDraft } from "./tracksDraft";
import { emptySubCategory, emptyTrack } from "./tracksDraft";
import styles from "./TracksSection.module.scss";

interface TracksSectionProps {
  tracks: TrackDraft[];
  onChange: (next: TrackDraft[]) => void;
}

/**
 * 강의 분류 트리 편집. 와이어프레임 p10. 명세서 10.3 · 10.20.
 *
 * **개별 CRUD(10.4 ~ 10.9)를 부르지 않는다.** 저장은 화면 전체가 한 번에 나간다.
 * 여기서는 폼 상태만 고치고 실제 반영은 `저장하기` 가 한다.
 */
export function TracksSection({ tracks, onChange }: TracksSectionProps) {
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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>강의 분류</h2>

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
    </section>
  );
}

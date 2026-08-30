import { useQuery } from "@tanstack/react-query";

import { getHome } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";

import styles from "./CurriculumTimeline.module.scss";

/**
 * 커리큘럼 섹션. `GET /api/public/home`(#218)로 연동한다.
 *
 * 학기마다 스파인(세로선)을 두고 좌우로 번갈아 붙이는 타임라인으로 재설계했었는데(#173),
 * 그때는 "1학기/2학기" 학기 구분이 있는 정적 목업이었다. 실제 응답(`HomeResultCurriculumInfo`)엔
 * `order`·`title`·`subtitle`뿐 학기 구분이 없어(BE 확인함, 어드민 커리큘럼 관리(#194)와 같은
 * 한계), `order` 하나로 이어지는 단일 타임라인으로 다시 그렸다 — 좌우 지그재그 자체는 유지한다.
 */
export function CurriculumTimeline() {
  const { data } = useQuery({ queryKey: queryKeys.public.home(), queryFn: getHome });
  const curriculums = data?.curriculums ?? [];

  if (curriculums.length === 0) return null;

  const ordered = [...curriculums].sort((a, b) => a.order - b.order);

  return (
    <section className={styles.section}>
      <div className={styles.blobBlue} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>커리큘럼</h2>
          <p className={styles.subtitle}>체계적인 교육 프로그램으로 성장하세요</p>
        </div>

        <div className={styles.timeline}>
          <div className={styles.timelineList}>
            <div className={styles.spine} aria-hidden="true" />

            {ordered.map((item, index) => (
              <div key={item.id} className={styles.row} data-side={index % 2 === 0 ? "left" : "right"}>
                <div className={styles.chip}>
                  <span className={styles.chipIndex}>{index + 1}</span>
                  <div>
                    <p className={styles.chipLabel}>{item.title}</p>
                    {item.subtitle !== "" && <p className={styles.chipSubtitle}>{item.subtitle}</p>}
                  </div>
                </div>
                <span className={styles.node} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

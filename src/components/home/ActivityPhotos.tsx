import { useQuery } from "@tanstack/react-query";

import { getActivityPhotos } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import type { PublicActivityPhoto } from "../../types/home";

import styles from "./ActivityPhotos.module.scss";

function CardList({ photos, hidden }: { photos: PublicActivityPhoto[]; hidden?: boolean }) {
  return (
    <ul className={styles.grid} aria-hidden={hidden}>
      {photos.map((photo) => (
        <li key={photo.id} className={styles.card}>
          <img src={photo.imageUrl} alt="GETIT 활동 사진" className={styles.thumbnail} />
        </li>
      ))}
    </ul>
  );
}

/**
 * 어드민이 등록·노출한 활동 사진만 순서대로 흐른다(BE#146). 등록된 사진이 없으면
 * 흘려보낼 카드 자체가 없어 섹션을 통째로 숨긴다(`FAQSection`과 같은 방식).
 *
 * 카드 목록을 통째로 한 번 더 복제해 나란히 붙이고, 그 폭의 절반만큼 왼쪽으로
 * 무한 반복 이동시켜 자연스럽게 흘러가는 것처럼 보이게 한다 — 원본과 복제본의
 * 폭이 정확히 같아야 이어지는 지점이 안 보인다(`ActivityPhotos.module.scss` 참고).
 * 복제본은 화면에 두 번 읽히지 않도록 `aria-hidden`으로 접근성 트리에서 뺀다.
 */
export function ActivityPhotos() {
  const { data } = useQuery({ queryKey: queryKeys.public.activityPhotos(), queryFn: getActivityPhotos });

  if (data === undefined || data.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>GETIT과 함께한 순간들</h2>
        <p className={styles.subtitle}>타과생도 부담 없이, 동아리 활동 현장을 먼저 만나보세요</p>
      </div>

      <div className={styles.marquee}>
        <div className={styles.track}>
          <CardList photos={data} />
          <CardList photos={data} hidden />
        </div>
      </div>
    </section>
  );
}

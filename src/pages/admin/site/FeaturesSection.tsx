import { ErrorState } from "../../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../../errors/site/errorMessages";
import { useFeatures, useToggleFeature } from "../../../hooks/site/useStaffs";
import { formatDateTime } from "../../../libs/formatDate";

import styles from "./FeaturesSection.module.scss";

/**
 * 기능 토글. 와이어프레임 p15. 명세서 10.23 · 10.24.
 *
 * **키 목록을 화면에 두지 않는다.** BE 가 정한 목록을 그대로 그린다 — 여기에 적어 두면
 * BE 가 기능을 추가해도 화면에 나오지 않는다.
 */
export function FeaturesSection() {
  const { data, isPending, isError, error, refetch } = useFeatures();
  const toggle = useToggleFeature();

  return (
    <section id="features" className={styles.section}>
      <h2 className={styles.sectionTitle}>기능 활성화</h2>
      <p className={styles.hint}>
        끄면 공개 사이트에서 해당 화면이 보이지 않습니다. 켜기 전에 화면이 준비됐는지 확인해 주세요.
      </p>

      {isPending && <p className={styles.hint}>불러오는 중…</p>}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && (
        <ul className={styles.features}>
          {data.map((feature) => (
            <li key={feature.key} className={styles.feature}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  disabled={toggle.isPending}
                  onChange={(e) => toggle.mutate({ featureKey: feature.key, enabled: e.target.checked })}
                />
                {feature.label}
              </label>
              <span className={styles.muted}>
                {formatDateTime(feature.updatedAt)} · {feature.updatedBy}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 실패하면 스위치가 원래대로 돌아간다. 왜 돌아갔는지도 말해 준다. */}
      {toggle.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(toggle.error)}</p>}
    </section>
  );
}

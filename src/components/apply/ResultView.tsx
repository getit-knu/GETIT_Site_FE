import { applicationResultErrorMessage } from "../../errors/application/errorMessages";
import { useApplicationResult } from "../../hooks/application/useMyApplication";
import { ErrorState } from "../ui/states/States";
import styles from "../../pages/ApplyPage.module.scss";

/** 지원서가 이미 심사 단계로 넘어간 뒤(제출됨 이상)의 결과 화면. */
export function ResultView() {
  const { data, isPending, isError, error, refetch } = useApplicationResult();

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    return <ErrorState message={applicationResultErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>GETIT 지원하기</h1>
            <p className={styles.subtitle}>{data.generationNo}기 지원 결과</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{data.statusLabel}</h2>
            </div>

            <div className={styles.form}>
              <p className={styles.resultInfo}>서류 발표: {new Date(data.documentAnnouncedAt).toLocaleString()}</p>
              <p className={styles.resultInfo}>최종 발표: {new Date(data.finalAnnouncedAt).toLocaleString()}</p>

              {data.nextStep !== null && (
                <div className={styles.nextStep}>
                  <p className={styles.resultInfo}>{data.nextStep.message}</p>
                  <p className={styles.resultInfo}>
                    기간: {data.nextStep.periodStart} ~ {data.nextStep.periodEnd}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

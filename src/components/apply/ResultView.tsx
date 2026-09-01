import { applicationResultErrorMessage } from "../../errors/application/errorMessages";
import { useApplicationResult } from "../../hooks/application/useMyApplication";
import { formatDateTime } from "../../libs/formatDate";
import { ErrorState, TextSkeleton } from "../ui/states/States";
import styles from "../../pages/ApplyPage.module.scss";

/** 지원서가 이미 심사 단계로 넘어간 뒤(제출됨 이상)의 결과 화면. */
export function ResultView() {
  const { data, isPending, isError, error, refetch } = useApplicationResult();

  // 상태 한 줄과 발표 일정 두 줄이 온다.
  if (isPending) return <TextSkeleton lines={3} label="지원 결과 불러오는 중" />;
  if (isError) {
    return <ErrorState message={applicationResultErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>GET IT 지원하기</h1>
            <p className={styles.subtitle}>{data.generationNo}기 지원 결과</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{data.statusLabel}</h2>
            </div>

            <div className={styles.form}>
              {/*
                `toLocaleString()`은 브라우저 로캘·시간대를 그대로 따라가 사람마다 다르게
                보였다(초까지 나오고 표기도 제각각) — 프로젝트 공용 포맷터로 고정한다.
              */}
              <p className={styles.resultInfo}>서류 발표: {formatDateTime(data.documentAnnouncedAt)}</p>
              <p className={styles.resultInfo}>최종 발표: {formatDateTime(data.finalAnnouncedAt)}</p>

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

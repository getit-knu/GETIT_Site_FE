import type { ReactNode } from "react";
import { Link } from "react-router";

import { ApplyForm } from "../components/apply/ApplyForm";
import { ResultView } from "../components/apply/ResultView";
import { ErrorState } from "../components/ui/states/States";
import { applicationFormErrorMessage, myApplicationErrorMessage } from "../errors/application/errorMessages";
import { useApplicationForm, useMyApplication } from "../hooks/application/useMyApplication";
import type { MyApplicationResult } from "../types/application";

import styles from "./ApplyPage.module.scss";

const NOT_OPEN_MESSAGE = "지금은 지원서 접수 기간이 아닙니다.";

/** 헤더만 있는 안내 화면. 로그인 유도 · 모집 기간 아님 안내가 이 모양을 함께 쓴다. */
function NoticePage({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>GETIT 지원하기</h1>
            <p className={styles.subtitle}>{message}</p>
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormGateProps {
  existing: MyApplicationResult | null;
}

/** 조회 · phase 분기를 마친 뒤에만 실제 폼(`ApplyForm`)을 그린다. */
function FormGate({ existing }: FormGateProps) {
  const { data, isPending, isError, error, refetch } = useApplicationForm();

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    return <ErrorState message={applicationFormErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  if (data.phase !== "DOCUMENT_OPEN") {
    return <NoticePage message={NOT_OPEN_MESSAGE} />;
  }

  return <ApplyForm form={data} existing={existing} />;
}

/**
 * 지원서 작성. Figma 와이어프레임(`6:5942`) 기준.
 *
 * **먼저 `GET /api/applications/me`(3.2)로 이미 있는 지원서를 본다** — `DRAFT`가 아니면
 * (제출·심사·합불 결정까지 끝난 상태) 결과 화면을 보여주고, 그 외(없거나 `DRAFT`)에만
 * 양식(3.1, #188)을 받아 이어쓰기 폼을 그린다.
 */
export default function ApplyPage() {
  const { data, isPending, isError, error, refetch } = useMyApplication();

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    const isUnauthorized =
      typeof error === "object" && error !== null && "code" in error && error.code === "UNAUTHORIZED";
    if (isUnauthorized) {
      return (
        <NoticePage
          message="지원서를 작성하려면 먼저 로그인해 주세요."
          action={
            <Link to="/login" className={styles.loginCta}>
              로그인하러 가기
            </Link>
          }
        />
      );
    }
    return <ErrorState message={myApplicationErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  if (data !== null && data.status !== "DRAFT") {
    return <ResultView />;
  }

  return <FormGate existing={data} />;
}

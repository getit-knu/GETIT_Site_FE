import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { getRecruitmentStatus } from "../apis/public/publicApi";
import { queryKeys } from "../apis/queryKeys";
import { ApplyForm } from "../components/apply/ApplyForm";
import { ResultView } from "../components/apply/ResultView";
import { ErrorState } from "../components/ui/states/States";
import { applicationFormErrorMessage, myApplicationErrorMessage } from "../errors/application/errorMessages";
import { recruitmentErrorMessage } from "../errors/recruitment/errorMessages";
import { useApplicationForm, useMyApplication } from "../hooks/application/useMyApplication";
import type { MyApplicationResult } from "../types/application";

import styles from "./ApplyPage.module.scss";

const NOT_OPEN_MESSAGE = "지금은 지원서 접수 기간이 아니에요.";

/** 헤더만 있는 안내 화면. 로그인 유도 · 모집 기간 아님 안내가 이 모양을 함께 쓴다. */
function NoticePage({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>GET IT 지원하기</h1>
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

/** 로그인 여부와 무관하게 봐야 하는 화면(로그인 · 폼 · 결과) 전부를 이 안에서 가른다. */
function LoginGate() {
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

/**
 * 지원서 작성. Figma 와이어프레임(`6:5942`) 기준.
 *
 * **로그인 여부를 묻기 전에 공개(비로그인) 모집 상태부터 먼저 본다**(#187, 홈 D-Day
 * 배지와 같은 엔드포인트) — `GET /api/applications/me`는 로그인이 필요해서, 이 순서를
 * 뒤집으면 모집 기간이 아예 아닌데도 "로그인해 주세요"부터 보여주게 된다(0831 QA).
 *
 * 모집 기간이면 그 다음에야 `GET /api/applications/me`(3.2)로 이미 있는 지원서를 본다 —
 * `DRAFT`가 아니면(제출·심사·합불 결정까지 끝난 상태) 결과 화면을, 그 외(없거나 `DRAFT`)엔
 * 양식(3.1, #188)을 받아 이어쓰기 폼을 그린다.
 */
export default function ApplyPage() {
  const {
    data: status,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.public.recruitmentStatus(),
    queryFn: getRecruitmentStatus,
  });

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) return <ErrorState message={recruitmentErrorMessage(error)} onRetry={() => void refetch()} />;
  if (!status.applyEnabled) return <NoticePage message={NOT_OPEN_MESSAGE} />;

  return <LoginGate />;
}

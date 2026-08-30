import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getColleges, getMajors } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { applicationSaveErrorMessage, applicationSubmitErrorMessage } from "../../errors/application/errorMessages";
import { useSaveDraft, useSubmitApplication } from "../../hooks/application/useMyApplication";
import type { ApplicationDraftPayload, ApplicationFormResult, MyApplicationResult } from "../../types/application";
import { Input } from "../ui/Input/Input";
import styles from "../../pages/ApplyPage.module.scss";

import type { AnswerState } from "./answerState";
import type { Answers, BasicInfoState } from "./applyFormState";
import {
  initialAnswers,
  submitInvalidReason,
  toAnswerPayloads,
  toBasicInfoPayload,
  toBasicInfoState,
} from "./applyFormState";
import { QuestionField } from "./QuestionField";

interface ApplyFormProps {
  form: ApplicationFormResult;
  /** 이미 임시저장된 지원서가 있으면 이어쓰기 초기값으로 쓴다. */
  existing: MyApplicationResult | null;
}

/** 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 프리필 · 이어쓰기 정보를 넣을 수 있다. */
export function ApplyForm({ form, existing }: ApplyFormProps) {
  const [basicInfo, setBasicInfo] = useState(() => toBasicInfoState(existing?.basicInfo ?? form.basicInfoPrefill));
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(form.questions, existing?.answers ?? null));
  const collegeSelectId = useId();
  const majorSelectId = useId();

  const saveDraft = useSaveDraft();
  const submitApplication = useSubmitApplication();

  function edit(apply: () => void) {
    if (saveDraft.isSuccess || saveDraft.isError) saveDraft.reset();
    if (submitApplication.isError) submitApplication.reset();
    apply();
  }

  function update<K extends keyof BasicInfoState>(key: K) {
    return (value: string) => edit(() => setBasicInfo((prev) => ({ ...prev, [key]: value })));
  }

  function handleCollegeChange(collegeId: number) {
    // 단과 대학이 바뀌면 이전 대학의 전공이 그대로 남아있으면 안 된다.
    edit(() => setBasicInfo((prev) => ({ ...prev, collegeId, majorId: 0 })));
  }

  function handleMajorChange(majorId: number) {
    edit(() => setBasicInfo((prev) => ({ ...prev, majorId })));
  }

  function updateAnswer(questionId: number, next: AnswerState) {
    edit(() => setAnswers((prev) => ({ ...prev, [questionId]: next })));
  }

  const { data: colleges = [] } = useQuery({ queryKey: queryKeys.public.colleges(), queryFn: getColleges });
  const { data: majors = [] } = useQuery({ queryKey: queryKeys.public.majors(), queryFn: getMajors });
  const majorOptions = majors.filter((major) => major.collegeId === basicInfo.collegeId);

  const questions = [...form.questions].sort((a, b) => a.order - b.order);
  const reason = submitInvalidReason(basicInfo, answers, questions);

  function buildPayload(): ApplicationDraftPayload {
    return { basicInfo: toBasicInfoPayload(basicInfo), answers: toAnswerPayloads(answers) };
  }

  function handleSaveDraft() {
    saveDraft.mutate(buildPayload());
  }

  function handleSubmit() {
    if (reason !== null) return;
    submitApplication.mutate(buildPayload());
  }

  // 방금 한 행동(저장/제출)의 결과가 있으면 그게 우선이다 — "제출을 막는 이유"는
  // 아직 아무 액션도 없을 때만 보여주는 상시 힌트라 실제 서버 응답보다 낮은 우선순위다.
  const feedback =
    saveDraft.error !== null
      ? { text: applicationSaveErrorMessage(saveDraft.error), isError: true }
      : submitApplication.error !== null
        ? { text: applicationSubmitErrorMessage(submitApplication.error), isError: true }
        : saveDraft.isSuccess
          ? { text: "임시 저장했습니다.", isError: false }
          : reason !== null
            ? { text: reason, isError: true }
            : null;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>GETIT 지원하기</h1>
            <p className={styles.subtitle}>금융과 IT를 함께 배우고 성장할 준비가 되셨나요?</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <svg
                className={styles.cardHeaderIcon}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h2 className={styles.cardTitle}>지원서 작성</h2>
            </div>

            <form className={styles.form}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>기본 정보</h3>
                <div className={styles.fieldGrid}>
                  <Input label="이름 *" value={basicInfo.name} onChange={update("name")} placeholder="홍길동" />
                  <Input
                    label="이메일 *"
                    type="email"
                    value={basicInfo.email}
                    onChange={update("email")}
                    placeholder="example@email.com"
                  />
                  <Input
                    label="전화번호 *"
                    value={basicInfo.phone}
                    onChange={update("phone")}
                    placeholder="010-1234-5678"
                  />
                  <div className={styles.selectField}>
                    <label htmlFor={collegeSelectId} className={styles.selectLabel}>
                      단과 대학 *
                    </label>
                    <select
                      id={collegeSelectId}
                      className={styles.select}
                      value={basicInfo.collegeId}
                      onChange={(event) => handleCollegeChange(Number(event.target.value))}
                    >
                      <option value={0}>단과 대학을 선택해주세요</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.selectField}>
                    <label htmlFor={majorSelectId} className={styles.selectLabel}>
                      전공 *
                    </label>
                    <select
                      id={majorSelectId}
                      className={styles.select}
                      value={basicInfo.majorId}
                      disabled={basicInfo.collegeId === 0}
                      onChange={(event) => handleMajorChange(Number(event.target.value))}
                    >
                      <option value={0}>
                        {basicInfo.collegeId === 0 ? "단과 대학을 먼저 선택해주세요" : "전공을 선택해주세요"}
                      </option>
                      {majorOptions.map((major) => (
                        <option key={major.id} value={major.id}>
                          {major.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="학년 *"
                    type="number"
                    value={basicInfo.grade}
                    onChange={update("grade")}
                    placeholder="1"
                  />
                  <Input
                    label="학번(10자) *"
                    value={basicInfo.studentId}
                    onChange={update("studentId")}
                    placeholder="2021123456"
                    maxLength={10}
                  />
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>지원 문항</h3>
                <div className={styles.fieldStack}>
                  {questions.map((question) => (
                    <QuestionField
                      key={question.id}
                      question={question}
                      answer={answers[question.id]}
                      onChange={(next) => updateAnswer(question.id, next)}
                    />
                  ))}
                </div>
              </section>
            </form>
          </div>
        </div>
      </div>

      <div className={styles.stickyFooter}>
        <div className={styles.footerInner}>
          {feedback !== null && (
            <p
              className={feedback.isError ? styles.reason : styles.saved}
              role={feedback.isError ? undefined : "status"}
            >
              {feedback.text}
            </p>
          )}
          <div className={styles.buttonsRow}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSaveDraft}
              disabled={saveDraft.isPending}
            >
              {saveDraft.isPending ? "저장 중…" : "임시 저장"}
            </button>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={reason !== null || submitApplication.isPending}
            >
              {submitApplication.isPending ? "제출 중…" : "제출하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

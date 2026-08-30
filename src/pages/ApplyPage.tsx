import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getForm } from "../apis/application/myApplicationApi";
import { getColleges, getMajors } from "../apis/public/publicApi";
import { queryKeys } from "../apis/queryKeys";
import type { AnswerState } from "../components/apply/answerState";
import { emptyAnswer } from "../components/apply/answerState";
import { QuestionField } from "../components/apply/QuestionField";
import { Input } from "../components/ui/Input/Input";
import { ErrorState } from "../components/ui/states/States";
import { applicationFormErrorMessage } from "../errors/application/errorMessages";
import type { ApplicationFormQuestion, ApplicationFormResult, BasicInfo } from "../types/application";

import styles from "./ApplyPage.module.scss";

const NOT_OPEN_MESSAGE = "지금은 지원서 접수 기간이 아닙니다.";

interface BasicInfoState {
  name: string;
  email: string;
  phone: string;
  /** 0 = 미선택. */
  collegeId: number;
  /** 0 = 미선택. 단과 대학이 바뀌면 같이 초기화된다. */
  majorId: number;
  grade: string;
  studentId: string;
}

function toBasicInfoState(prefill: BasicInfo): BasicInfoState {
  return {
    name: prefill.name,
    email: prefill.email,
    phone: prefill.phoneNumber ?? "",
    collegeId: prefill.collegeId ?? 0,
    majorId: prefill.majorId ?? 0,
    grade: prefill.grade !== null ? String(prefill.grade) : "",
    studentId: prefill.studentNumber ?? "",
  };
}

type Answers = Record<number, AnswerState>;

function initialAnswers(questions: ApplicationFormQuestion[]): Answers {
  return Object.fromEntries(questions.map((question) => [question.id, emptyAnswer(question)]));
}

interface ApplyFormProps {
  form: ApplicationFormResult;
}

/** 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 프리필된 정보를 넣을 수 있다. */
function ApplyForm({ form }: ApplyFormProps) {
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>(() => toBasicInfoState(form.basicInfoPrefill));
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(form.questions));
  const collegeSelectId = useId();
  const majorSelectId = useId();

  function update<K extends keyof BasicInfoState>(key: K) {
    return (value: string) => setBasicInfo((prev) => ({ ...prev, [key]: value }));
  }

  function handleCollegeChange(collegeId: number) {
    // 단과 대학이 바뀌면 이전 대학의 전공이 그대로 남아있으면 안 된다.
    setBasicInfo((prev) => ({ ...prev, collegeId, majorId: 0 }));
  }

  function handleMajorChange(majorId: number) {
    setBasicInfo((prev) => ({ ...prev, majorId }));
  }

  function updateAnswer(questionId: number, next: AnswerState) {
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
  }

  const { data: colleges = [] } = useQuery({ queryKey: queryKeys.public.colleges(), queryFn: getColleges });
  const { data: majors = [] } = useQuery({ queryKey: queryKeys.public.majors(), queryFn: getMajors });
  const majorOptions = majors.filter((major) => major.collegeId === basicInfo.collegeId);

  const questions = [...form.questions].sort((a, b) => a.order - b.order);

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
          <button type="button" className={styles.saveButton}>
            임시 저장
          </button>
          <button type="button" className={styles.submitButton}>
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 지원서 작성. Figma 와이어프레임(`6:5942`) 기준.
 *
 * `GET /api/applications/form`으로 문항(#188)을 받아 동적으로 그린다. 폼 상태는 여전히
 * 로컬에서만 관리한다 — 임시저장 · 제출은 후속 이슈(#189)에서 붙인다. 지금은 sticky
 * footer 버튼을 눌러도 아무 일도 일어나지 않는다.
 */
export default function ApplyPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.myApplication.form(),
    queryFn: getForm,
  });

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) {
    return <ErrorState message={applicationFormErrorMessage(error)} onRetry={() => void refetch()} />;
  }

  if (data.phase !== "DOCUMENT_OPEN") {
    return (
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.inner}>
            <div className={styles.heading}>
              <h1 className={styles.title}>GETIT 지원하기</h1>
              <p className={styles.subtitle}>{NOT_OPEN_MESSAGE}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ApplyForm form={data} />;
}

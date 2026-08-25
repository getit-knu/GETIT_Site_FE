import { useId, useState } from "react";

import { COLLEGES, getMajorsByCollege } from "../mocks/college/collegeMajors";
import { Input } from "../components/ui/Input/Input";
import { TextArea } from "../components/ui/TextArea/TextArea";

import styles from "./ApplyPage.module.scss";

interface ApplyFormState {
  name: string;
  email: string;
  phone: string;
  /** 0 = 미선택. */
  collegeId: number;
  /** 0 = 미선택. 단과 대학이 바뀌면 같이 초기화된다. */
  majorId: number;
  studentId: string;
  motivation: string;
  experience: string;
  projectIdea: string;
  message: string;
}

const INITIAL_FORM: ApplyFormState = {
  name: "",
  email: "",
  phone: "",
  collegeId: 0,
  majorId: 0,
  studentId: "",
  motivation: "",
  experience: "",
  projectIdea: "",
  message: "",
};

const MOTIVATION_MAX_LENGTH = 300;

/**
 * 지원서 작성. Figma 와이어프레임(`6:5942`) 기준.
 *
 * 폼 상태는 로컬에서만 관리한다. 양식 조회 · 임시저장 · 제출 · 로그인 가드는
 * 후속 이슈(API 연동)에서 붙인다 — 지금은 sticky footer 버튼을 눌러도 아무 일도
 * 일어나지 않는다. 다른 화면에서 아직 없는 목적지를 다루는 것과 같은 방식이다.
 */
export default function ApplyPage() {
  const [form, setForm] = useState<ApplyFormState>(INITIAL_FORM);
  const collegeSelectId = useId();
  const majorSelectId = useId();

  function update<K extends keyof ApplyFormState>(key: K) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCollegeChange(collegeId: number) {
    // 단과 대학이 바뀌면 이전 대학의 전공이 그대로 남아있으면 안 된다.
    setForm((prev) => ({ ...prev, collegeId, majorId: 0 }));
  }

  function handleMajorChange(majorId: number) {
    setForm((prev) => ({ ...prev, majorId }));
  }

  const majorOptions = getMajorsByCollege(form.collegeId);

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
                  <Input label="이름 *" value={form.name} onChange={update("name")} placeholder="홍길동" />
                  <Input
                    label="이메일 *"
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="example@email.com"
                  />
                  <Input label="전화번호 *" value={form.phone} onChange={update("phone")} placeholder="010-1234-5678" />
                  <div className={styles.selectField}>
                    <label htmlFor={collegeSelectId} className={styles.selectLabel}>
                      단과 대학 *
                    </label>
                    <select
                      id={collegeSelectId}
                      className={styles.select}
                      value={form.collegeId}
                      onChange={(event) => handleCollegeChange(Number(event.target.value))}
                    >
                      <option value={0}>단과 대학을 선택해주세요</option>
                      {COLLEGES.map((college) => (
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
                      value={form.majorId}
                      disabled={form.collegeId === 0}
                      onChange={(event) => handleMajorChange(Number(event.target.value))}
                    >
                      <option value={0}>
                        {form.collegeId === 0 ? "단과 대학을 먼저 선택해주세요" : "전공을 선택해주세요"}
                      </option>
                      {majorOptions.map((major) => (
                        <option key={major.id} value={major.id}>
                          {major.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="학번(10자) *"
                    value={form.studentId}
                    onChange={update("studentId")}
                    placeholder="2021123456"
                    maxLength={10}
                  />
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>지원 동기 및 경험</h3>
                <div className={styles.fieldStack}>
                  <TextArea
                    label="GETIT에 지원하게 된 동기는 무엇인가요? *"
                    value={form.motivation}
                    onChange={update("motivation")}
                    placeholder="지원 동기를 자유롭게 작성해주세요."
                    maxLength={MOTIVATION_MAX_LENGTH}
                  />
                  <TextArea
                    label="프로그래밍 경험이 있다면 간단히 설명해주세요"
                    value={form.experience}
                    onChange={update("experience")}
                    placeholder="언어, 프로젝트 경험 등을 작성해주세요. (선택사항)"
                    maxLength={MOTIVATION_MAX_LENGTH}
                  />
                  <TextArea
                    label="GETIT에서 어떤 프로젝트를 하고 싶으신가요? *"
                    value={form.projectIdea}
                    onChange={update("projectIdea")}
                    placeholder="관심 있는 프로젝트나 아이디어를 자유롭게 작성해주세요."
                    maxLength={MOTIVATION_MAX_LENGTH}
                  />
                  <TextArea
                    label="궁금한 점이나 하고 싶은 말이 있다면 자유롭게 작성해주세요"
                    value={form.message}
                    onChange={update("message")}
                    placeholder="질문이나 하고 싶은 말을 자유롭게 작성해주세요. (선택사항)"
                    maxLength={MOTIVATION_MAX_LENGTH}
                  />
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

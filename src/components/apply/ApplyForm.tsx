import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getColleges, getMajors } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { Toast } from "../ui/Toast/Toast";
import { applicationSaveErrorMessage, applicationSubmitErrorMessage } from "../../errors/application/errorMessages";
import { useSaveDraft, useSubmitApplication } from "../../hooks/application/useMyApplication";
import { useDebouncedValue } from "../../hooks/ui/useDebouncedValue";
import { APPLICATION_PRIVACY_NOTICE } from "../../libs/privacyNotices";
import { prefersReducedMotion } from "../../libs/prefersReducedMotion";
import type { ApplicationDraftPayload, ApplicationFormResult, MyApplicationResult } from "../../types/application";
import { PrivacyConsent } from "../ui/PrivacyConsent/PrivacyConsent";
import styles from "../../pages/ApplyPage.module.scss";

import type { AnswerState } from "./answerState";
import type { Answers, BasicInfoState, BlockedFieldKey, SubmitBlocker } from "./applyFormState";
import {
  initialAnswers,
  submitBlocker,
  toAnswerPayloads,
  toBasicInfoPayload,
  toBasicInfoState,
} from "./applyFormState";
import { BasicInfoFields } from "./BasicInfoFields";
import { QuestionField } from "./QuestionField";

/**
 * 마지막 입력에서 이만큼 조용하면 알아서 임시 저장한다.
 *
 * 지원서는 길다. 브라우저가 닫히거나 세션이 끊기면 작성분이 통째로 날아가는데, 지금까지는
 * "임시 저장"을 손수 누른 적이 있어야만 살아남았다. 타이핑 중에 요청이 계속 나가지 않도록
 * 손이 멈춘 뒤에만 보낸다.
 */
const AUTO_SAVE_QUIET_MS = 2000;

interface ApplyFormProps {
  form: ApplicationFormResult;
  /** 이미 임시저장된 지원서가 있으면 이어쓰기 초기값으로 쓴다. */
  existing: MyApplicationResult | null;
}

/** 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 프리필 · 이어쓰기 정보를 넣을 수 있다. */
export function ApplyForm({ form, existing }: ApplyFormProps) {
  const [basicInfo, setBasicInfo] = useState(() => toBasicInfoState(existing?.basicInfo ?? form.basicInfoPrefill));
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(form.questions, existing?.answers ?? null));

  // 모든 입력칸 id를 한 뿌리에서 만든다 — 제출을 막는 칸을 `getElementById`로 바로 찾기 위해서다.
  const fieldIdPrefix = useId();
  const fieldId = (key: BlockedFieldKey) => `${fieldIdPrefix}${key}`;

  const saveDraft = useSaveDraft();
  const submitApplication = useSubmitApplication();
  // 제출은 되돌릴 수 없다. 한 번 눌렀다고 바로 보내지 않고 되묻는다 (#275).
  const [confirming, setConfirming] = useState(false);

  /*
    BE 스키마에 없는 화면 전용 값이라 `basicInfo`가 아니라 따로 둔다 — 저장(임시저장)
    대상도 아니다. 이어쓰기(`existing`)여도 매번 다시 확인한다: 저장된 적 없는 동의를
    "이미 동의했다"고 가정하면 안 된다.
  */
  const [privacyConsent, setPrivacyConsent] = useState(false);

  /**
   * 고칠 때마다 1씩 오른다. 자동 저장의 기준점이자 "아직 안 보낸 변경이 있나"의 근거다.
   *
   * 값(`basicInfo`·`answers`)을 직접 디바운스하지 않는 이유: 둘 다 고칠 때마다 새 객체라
   * 참조가 매번 달라져 대기 시간이 영영 초기화된다. 숫자 하나면 그런 일이 없다.
   */
  const [editCount, setEditCount] = useState(0);
  const settledEditCount = useDebouncedValue(editCount, AUTO_SAVE_QUIET_MS);
  // 서버가 실제로 받아준 시점의 editCount. 요청을 보낸 시점이 아니라 성공한 시점에만 올린다 —
  // 저장이 실패했는데 "다 저장됐다"고 여기면 경고 없이 작성분이 날아간다.
  const [savedEditCount, setSavedEditCount] = useState(0);
  const hasUnsavedEdits = editCount > savedEditCount;
  // 방금 저장이 손으로 누른 것인지 알아서 된 것인지 — 안내 문구를 가른다.
  const [lastSaveWasAuto, setLastSaveWasAuto] = useState(false);
  // 제출을 눌렀는데 막힌 경우에만 보여주는 안내. 상시 잔소리가 아니라 누른 것에 대한 답이다.
  // 문구만이 아니라 **어느 칸이었는지**까지 들고 있는다 — 그 칸에도 이유를 붙여 줘야
  // 화면을 보지 않는 사람이 포커스가 옮겨 간 이유를 알 수 있다. `edit()` 이 어떤
  // 입력에서든 이걸 비우므로, 고치기 시작하면 표시는 알아서 사라진다.
  const [blocked, setBlocked] = useState<SubmitBlocker | null>(null);

  function edit(apply: () => void) {
    if (saveDraft.isSuccess || saveDraft.isError) saveDraft.reset();
    if (submitApplication.isError) submitApplication.reset();
    setEditCount((count) => count + 1);
    setBlocked(null);
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

  const questions = [...form.questions].sort((a, b) => a.order - b.order);
  const blocker = submitBlocker(basicInfo, answers, questions, privacyConsent);

  function buildPayload(): ApplicationDraftPayload {
    return { basicInfo: toBasicInfoPayload(basicInfo), answers: toAnswerPayloads(answers) };
  }

  /** 저장 성공을 `editCount` 기준으로 못박는다. 그 뒤에 더 고친 게 있으면 여전히 "안 저장됨"이다. */
  function handleSaveDraft() {
    const at = editCount;
    saveDraft.mutate(buildPayload(), {
      onSuccess: () => {
        setLastSaveWasAuto(false);
        setSavedEditCount(at);
      },
    });
  }

  /** 못 채운 칸으로 화면을 옮기고 커서를 놓는다. */
  function focusField(key: BlockedFieldKey) {
    const target = document.getElementById(fieldId(key));
    if (target === null) return;

    target.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    // 스크롤과 포커스를 같이 걸면 브라우저가 포커스 쪽으로 한 번 더 튄다 — 부드러운 이동이 끝나고
    // 커서만 옮기도록 다음 프레임으로 미룬다(preventScroll 로 두 번째 점프를 막는다).
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }

  /** 제출 버튼. 바로 보내지 않고 되묻는 토스트를 띄운다. */
  function handleSubmit() {
    // 예전엔 이 버튼을 `disabled` 로 잠갔다. 왜 못 누르는지는 아래 문구가 말해 줬지만 **어디를**
    // 고쳐야 하는지는 알려주지 않아, 긴 폼에서 직접 찾아 올라가야 했다. 이제 누를 수 있게 두고
    // 누르면 못 채운 첫 칸으로 데려다 놓는다(잠긴 버튼은 포커스도 안 잡혀 이유를 물을 수조차 없다).
    if (blocker !== null) {
      setBlocked(blocker);
      focusField(blocker.field);
      return;
    }
    setConfirming(true);
  }

  function handleConfirmSubmit() {
    setConfirming(false);
    // 되묻는 동안에도 폼은 고칠 수 있다. 그 사이에 다시 채워지지 않은 곳이 생겼으면 보내지 않는다.
    if (blocker !== null) {
      setBlocked(blocker);
      focusField(blocker.field);
      return;
    }
    submitApplication.mutate(buildPayload());
  }

  // 손이 멈춘 뒤 알아서 저장한다. `settledEditCount` 가 실제로 앞으로 나아갔을 때만 보내고,
  // 다른 이유로 이 이펙트가 다시 돌 때는 `savedEditCount` 비교에서 걸러진다.
  useEffect(() => {
    if (settledEditCount === 0 || settledEditCount <= savedEditCount) return;
    // 제출이 끝났거나 진행 중이면 임시 저장을 덧씌우지 않는다.
    if (submitApplication.isPending || submitApplication.isSuccess) return;
    if (saveDraft.isPending) return;

    saveDraft.mutate(
      { basicInfo: toBasicInfoPayload(basicInfo), answers: toAnswerPayloads(answers) },
      {
        onSuccess: () => {
          setLastSaveWasAuto(true);
          setSavedEditCount(settledEditCount);
        },
      },
    );
  }, [settledEditCount, savedEditCount, basicInfo, answers, saveDraft, submitApplication]);

  // 아직 서버가 못 받은 변경이 있는 채로 창을 닫거나 새로고침하면 브라우저가 한 번 되묻는다.
  // (문구는 브라우저가 정한다 — 사이트가 마음대로 쓰지 못하게 막혀 있다.)
  useEffect(() => {
    if (!hasUnsavedEdits) return;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedEdits]);

  /*
    기본 정보 칸이 막았을 때는 푸터가 통째로 비켜선다.

    `BasicInfoFields` 가 그 칸 자체에 이유를 붙이고 제출을 누르면 커서도 거기로 가는데,
    푸터까지 같은 문장을 띄우면 **화면에 두 번 뜨고 소리로도 두 번 읽힌다**(브라우저와
    테스트로 확인함). 문항 칸은 아직 자기 자리에서 이유를 말하지 못하므로 그때는 여기가 맡는다.
  */
  const blockedFieldSpeaksForItself = blocked !== null && !blocked.field.startsWith("question-");

  // 잘못된 것을 알리는 줄. 제출을 막는 안내는 **제출을 눌렀을 때만** 뜬다 — 예전엔 폼을
  // 열자마자 "다 입력해 주세요"가 떠 있어, 아직 아무것도 안 한 사람에게 먼저 잘못을
  // 지적하는 꼴이었다.
  const errorText =
    saveDraft.error !== null
      ? applicationSaveErrorMessage(saveDraft.error)
      : submitApplication.error !== null
        ? applicationSubmitErrorMessage(submitApplication.error)
        : blockedFieldSpeaksForItself
          ? null
          : (blocked?.message ?? null);

  /*
    저장 상태는 **에러와 다른 자리**에 둔다.

    한 줄을 같이 쓰던 때는 우선순위가 높은 에러가 저장 안내를 덮어, 제출을 눌렀다가 막힌
    사람은 그 사이 자동 저장이 됐다는 사실을 영영 못 봤다. 보이지 않는 자동 저장은 믿을 수
    없고, 믿을 수 없으면 창을 닫지 못한다.
  */
  const saveStatus = saveDraft.isPending
    ? "저장 중…"
    : saveDraft.isSuccess
      ? lastSaveWasAuto
        ? "자동으로 임시 저장했어요."
        : "임시 저장했어요."
      : hasUnsavedEdits
        ? "아직 저장하지 않은 변경이 있어요."
        : null;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <h1 className={styles.title}>GET IT 지원하기</h1>
            <p className={styles.subtitle}>SW와 창업을 함께 배우고 성장할 준비가 되셨나요?</p>
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
                <BasicInfoFields
                  value={basicInfo}
                  blocked={blocked}
                  colleges={colleges}
                  majors={majors}
                  fieldId={fieldId}
                  onChange={update}
                  onCollegeChange={handleCollegeChange}
                  onMajorChange={handleMajorChange}
                />
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>지원 문항</h3>
                <div className={styles.fieldStack}>
                  {questions.map((question) => (
                    <QuestionField
                      key={question.id}
                      id={fieldId(`question-${question.id}`)}
                      question={question}
                      answer={answers[question.id]}
                      onChange={(next) => updateAnswer(question.id, next)}
                    />
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>개인정보 동의</h3>
                <PrivacyConsent
                  id={fieldId("privacyConsent")}
                  checked={privacyConsent}
                  onChange={(next) => {
                    setPrivacyConsent(next);
                    if (next && blocked?.field === "privacyConsent") setBlocked(null);
                  }}
                  notice={APPLICATION_PRIVACY_NOTICE}
                  error={blocked?.field === "privacyConsent" ? blocked.message : undefined}
                />
              </section>
            </form>
          </div>
        </div>
      </div>

      <div className={styles.stickyFooter}>
        <div className={styles.footerInner}>
          {/*
            `role="alert"` 없이는 이 줄이 **소리로는 존재하지 않았다.** 스티키 푸터라 화면
            아래에 고정돼 있어, 저장·제출이 실패해도 눈으로 보지 않는 사용자는 아무 일도
            없었다고 여긴다 — 바로 아래 "저장했습니다"는 `role="status"`로 읽히고 있어서
            성공만 알려 주고 실패는 삼키는 꼴이었다.

            폼 오류 문구의 role 은 화면 전체에서 이 기준으로 나눈다(24개 파일):
            - **누른 뒤 벌어진 사건**(저장·삭제 실패, 잘못된 파일) → `alert`. 끼어들어 알린다.
            - **타이핑 중 바뀌는 안내**(제출을 막는 이유) → `status`. 글자마다 말을 끊지 않는다.
            - **상시 설명문**(반려 사유, "이미 결정돼 채점할 수 없습니다") → role 없음. 사건이 아니다.
          */}
          {errorText !== null && (
            <p role="alert" className={styles.reason}>
              {errorText}
            </p>
          )}
          {/* 저장 상태는 조용히 알린다 — role="status" 라 스크린리더도 하던 일을 끊지 않고 듣는다. */}
          {saveStatus !== null && (
            <p className={styles.saved} role="status">
              {saveStatus}
            </p>
          )}
          <p className={styles.notice}>제출하면 더 이상 수정할 수 없습니다.</p>
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
              disabled={submitApplication.isPending}
            >
              {submitApplication.isPending ? "제출 중…" : "제출하기"}
            </button>
          </div>
        </div>
      </div>

      {/* 조건부 마운트가 아니라 `open`을 내린다 — 그래야 되묻는 띠가 내려가는 모습이 보인다. */}
      <Toast
        open={confirming}
        message="제출하면 더 이상 수정할 수 없습니다. 제출할까요?"
        action={{ label: "제출", onClick: handleConfirmSubmit }}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

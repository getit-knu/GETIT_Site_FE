import { useId } from "react";

import { Markdown } from "../Markdown/Markdown";

import styles from "./PrivacyConsent.module.scss";

interface PrivacyConsentProps {
  /** 바깥에서 이 칸을 지목해야 할 때만 준다(예: 지원서에서 제출을 막는 칸으로 포커스를 옮길 때). */
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 고지 원문(마크다운). `libs/privacyNotices.ts` 참고. */
  notice: string;
  error?: string;
}

/**
 * 개인정보 수집·이용 동의 칸. 체크박스 하나 + 펼쳐 보는 전체 고지문으로 구성한다.
 *
 * 기본은 접어 둔다 — 매번 긴 고지문 전체를 펼쳐 보여주면 정작 "동의합니다" 한 줄이
 * 화면에서 밀려나 정말 눌러야 할 것을 못 찾는다. `<details>`는 스크립트 없이도
 * 펼침 상태를 스크린리더에 정확히 전달한다.
 */
export function PrivacyConsent({ id: givenId, checked, onChange, notice, error }: PrivacyConsentProps) {
  const generatedId = useId();
  const id = givenId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className={styles.wrapper}>
      <label className={styles.checkboxRow} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <span>(필수) 개인정보 수집·이용에 동의합니다.</span>
      </label>

      <details className={styles.details}>
        <summary>자세히 보기</summary>
        <Markdown className={styles.notice} content={notice} />
      </details>

      {error !== undefined && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

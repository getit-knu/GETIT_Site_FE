import { useId } from "react";

import styles from "./Select.module.scss";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  label?: string;
  /** 라벨을 화면에 두지 않을 때 스크린리더용 이름. 표 안에서 쓴다. */
  ariaLabel?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * 값 목록에서 하나를 고른다.
 *
 * 네이티브 `<select>` 를 쓴다. 키보드 조작·모바일 휠 UI 를 브라우저가 해주고,
 * 표 안에 여러 개가 들어가도 무겁지 않다.
 */
export function Select<T extends string | number>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  disabled,
}: SelectProps<T>) {
  const id = useId();
  // `<option value>` 는 언제나 문자열이다. 숫자 옵션이면 되돌려 놓는다.
  const isNumeric = typeof value === "number";

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={styles.select}
        aria-label={label ? undefined : ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange((isNumeric ? Number(e.target.value) : e.target.value) as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

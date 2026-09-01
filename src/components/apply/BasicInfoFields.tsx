import type { College, Major } from "../../types/college";
import { Input } from "../ui/Input/Input";
import styles from "../../pages/ApplyPage.module.scss";

import type { BasicInfoState, BlockedFieldKey, SubmitBlocker } from "./applyFormState";
import { formatPhoneNumber } from "./applyFormState";

interface BasicInfoFieldsProps {
  value: BasicInfoState;
  colleges: College[];
  majors: Major[];
  /** 입력칸 id를 만든다. `ApplyForm`이 제출을 막는 칸을 찾을 때 같은 함수를 쓴다. */
  fieldId: (key: BlockedFieldKey) => string;
  /** 제출을 막은 칸과 그 이유. `ApplyForm` 이 이 칸으로 포커스를 옮길 때 함께 넘긴다. */
  blocked: SubmitBlocker | null;
  onChange: <K extends keyof BasicInfoState>(key: K) => (value: string) => void;
  onCollegeChange: (collegeId: number) => void;
  onMajorChange: (majorId: number) => void;
}

/**
 * 지원서의 "기본 정보" 칸들. `ApplyForm`이 300줄 제한에 걸려 떼어냈다 — 문항 영역과 달리
 * 폼 스키마가 고정이라 경계가 분명하다.
 *
 * 모든 칸이 바깥에서 받은 `fieldId`로 id를 단다. 못 채운 칸으로 화면을 데려다 놓는 기능이
 * `document.getElementById`로 찾기 때문에, 여기서 임의로 id를 만들면 안 된다.
 */
export function BasicInfoFields({
  value,
  colleges,
  majors,
  fieldId,
  blocked,
  onChange,
  onCollegeChange,
  onMajorChange,
}: BasicInfoFieldsProps) {
  const majorOptions = majors.filter((major) => major.collegeId === value.collegeId);

  /*
    포커스를 옮겨 주는 것만으로는 부족하다 — 화면을 보지 않는 사람에게는 커서가 갑자기
    딴 데로 간 것뿐이다. 그 칸이 왜 막혔는지를 칸 자체에 붙여 줘야 한다(`Input` 주석 참고).
  */
  const errorOf = (key: BlockedFieldKey) => (blocked?.field === key ? blocked.message : undefined);

  return (
    <div className={styles.fieldGrid}>
      <Input
        id={fieldId("name")}
        error={errorOf("name")}
        label="이름 *"
        value={value.name}
        onChange={onChange("name")}
        placeholder="홍길동"
      />
      <Input
        id={fieldId("email")}
        error={errorOf("email")}
        label="이메일 *"
        type="email"
        value={value.email}
        onChange={onChange("email")}
        placeholder="example@email.com"
      />
      <Input
        id={fieldId("phone")}
        error={errorOf("phone")}
        label="전화번호 *"
        value={value.phone}
        // 숫자만 쭉 쳐도 010-1234-5678 꼴로 알아서 끊긴다 — 하이픈을 손으로 넣게 하면
        // 사람마다 다르게 저장되고, 넣는 자리를 틀리면 다시 지우고 쳐야 한다.
        onChange={(next) => onChange("phone")(formatPhoneNumber(next))}
        placeholder="010-1234-5678"
      />
      <div className={styles.selectField}>
        <label htmlFor={fieldId("college")} className={styles.selectLabel}>
          단과 대학 *
        </label>
        <select
          id={fieldId("college")}
          aria-invalid={errorOf("college") ? true : undefined}
          aria-describedby={errorOf("college") ? `${fieldId("college")}-error` : undefined}
          className={styles.select}
          value={value.collegeId}
          onChange={(event) => onCollegeChange(Number(event.target.value))}
        >
          <option value={0}>단과 대학을 선택해주세요</option>
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </select>
        {errorOf("college") !== undefined && (
          <p id={`${fieldId("college")}-error`} role="alert" className={styles.selectError}>
            {errorOf("college")}
          </p>
        )}
      </div>
      <div className={styles.selectField}>
        <label htmlFor={fieldId("major")} className={styles.selectLabel}>
          전공 *
        </label>
        <select
          id={fieldId("major")}
          aria-invalid={errorOf("major") ? true : undefined}
          aria-describedby={errorOf("major") ? `${fieldId("major")}-error` : undefined}
          className={styles.select}
          value={value.majorId}
          disabled={value.collegeId === 0}
          onChange={(event) => onMajorChange(Number(event.target.value))}
        >
          <option value={0}>{value.collegeId === 0 ? "단과 대학을 먼저 선택해주세요" : "전공을 선택해주세요"}</option>
          {majorOptions.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
            </option>
          ))}
        </select>
        {errorOf("major") !== undefined && (
          <p id={`${fieldId("major")}-error`} role="alert" className={styles.selectError}>
            {errorOf("major")}
          </p>
        )}
      </div>
      <Input
        id={fieldId("grade")}
        error={errorOf("grade")}
        label="학년 *"
        type="number"
        value={value.grade}
        onChange={onChange("grade")}
        placeholder="1"
      />
      <Input
        id={fieldId("studentId")}
        error={errorOf("studentId")}
        label="학번(10자) *"
        value={value.studentId}
        onChange={onChange("studentId")}
        placeholder="2021123456"
        maxLength={10}
      />
    </div>
  );
}

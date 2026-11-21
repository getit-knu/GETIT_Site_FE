import { useId } from "react";

import { Input } from "../ui/Input/Input";

import styles from "./ProjectDetailsFields.module.scss";
import { ONE_LINER_MAX, PROGRESS_OPTIONS, type ProjectDetailsDraft } from "./projectDetailsDraft";
import fieldStyles from "./ThumbnailField.module.scss";

interface ProjectDetailsFieldsProps {
  value: ProjectDetailsDraft;
  onChange: (patch: Partial<ProjectDetailsDraft>) => void;
}

/**
 * 한 줄 소개·진행 상태·스토어 링크(#389, BE#227). 어드민 모달과 부원 등록 폼이 같이 쓴다. 모두 선택값이다 —
 * 값이 없는 예전 프로젝트도 그대로 고칠 수 있어야 한다.
 */
export function ProjectDetailsFields({ value, onChange }: ProjectDetailsFieldsProps) {
  const statusId = useId();

  return (
    <div className={styles.fields}>
      <div>
        <Input
          label="한 줄 소개"
          value={value.oneLiner}
          maxLength={ONE_LINER_MAX}
          placeholder="예: 나에게 맞는 청년 정책을 골라 주는 서비스"
          onChange={(oneLiner) => onChange({ oneLiner })}
        />
        <p className={fieldStyles.hint}>
          {value.oneLiner.length} / {ONE_LINER_MAX}자 · 쇼케이스 카드에 이 문구가 나옵니다. 비우면 설명 앞부분을 씁니다.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={fieldStyles.field}>
          <label htmlFor={statusId} className={fieldStyles.label}>
            진행 상태
          </label>
          <select
            id={statusId}
            className={styles.select}
            value={value.progressStatus}
            onChange={(e) => onChange({ progressStatus: e.target.value as ProjectDetailsDraft["progressStatus"] })}
          >
            <option value="">선택 안 함</option>
            {PROGRESS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Google Play 링크"
          value={value.playStoreUrl}
          onChange={(playStoreUrl) => onChange({ playStoreUrl })}
        />
        <Input label="App Store 링크" value={value.appStoreUrl} onChange={(appStoreUrl) => onChange({ appStoreUrl })} />
      </div>
    </div>
  );
}

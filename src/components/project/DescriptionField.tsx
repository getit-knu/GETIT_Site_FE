import { lazy, Suspense } from "react";

import type { DescriptionEditorProps } from "./DescriptionEditor";
import styles from "./DescriptionEditor.module.scss";
import { DESCRIPTION_MAX_LENGTH } from "./projectImages";
import fieldStyles from "./ThumbnailField.module.scss";

// ProseMirror·marked까지 딸려 오는 무거운 코드라 작성 폼을 열 때만 받는다(#385).
const DescriptionEditor = lazy(() => import("./DescriptionEditor"));

interface DescriptionFieldProps extends DescriptionEditorProps {
  /** 지금 마크다운 글자 수. BE 한도(20000자)와 함께 보여준다. */
  length: number;
}

/** 프로젝트 설명 칸(#385). 어드민 모달과 부원 등록 폼이 같이 쓴다. */
export function DescriptionField({ length, ...editorProps }: DescriptionFieldProps) {
  return (
    <div className={fieldStyles.field}>
      <span className={fieldStyles.label}>설명</span>
      <Suspense fallback={<div className={styles.loading}>에디터를 불러오는 중…</div>}>
        <DescriptionEditor {...editorProps} />
      </Suspense>
      <p className={fieldStyles.hint}>
        {length.toLocaleString("ko-KR")} / {DESCRIPTION_MAX_LENGTH.toLocaleString("ko-KR")}자 · 서식과 이미지는
        마크다운으로 저장됩니다.
      </p>
    </div>
  );
}

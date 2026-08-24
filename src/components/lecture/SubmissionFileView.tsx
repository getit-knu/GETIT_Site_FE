import type { SubmissionFile } from "../../types/lecture";

import styles from "./FeedbackModal.module.scss";

/** 바이트를 사람이 읽는 크기로. 소수 한 자리면 충분하다. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let at = 0;
  while (value >= 1024 && at < units.length - 1) {
    value /= 1024;
    at += 1;
  }
  return `${value.toFixed(1)} ${units[at]}`;
}

/**
 * 제출 파일 (명세서 8.7).
 *
 * **볼 수 있는지는 서버가 정한다.** `previewable` 이 아니면 `previewUrl` 이 `null` 이라
 * 그릴 것이 없다. `contentType` 을 FE 가 다시 판정하면 서버와 기준이 갈려,
 * 서버가 미리보기를 막은 파일을 화면이 열려고 든다.
 */
export function SubmissionFileView({ file }: { file: SubmissionFile }) {
  const isImage = file.contentType.startsWith("image/");

  return (
    <div className={styles.file}>
      <div className={styles.fileMeta}>
        <strong>{file.fileName}</strong>
        <span>{formatSize(file.size)}</span>
        {/* 내려받기는 presigned URL 로 간다. 새 탭에서 열어 모달을 잃지 않게 한다. */}
        <a href={file.url} target="_blank" rel="noreferrer">
          내려받기
        </a>
      </div>

      {file.previewable && file.previewUrl !== null ? (
        <div className={styles.preview}>
          {isImage ? (
            <img src={file.previewUrl} alt={`${file.fileName} 미리보기`} />
          ) : (
            <iframe src={file.previewUrl} title={`${file.fileName} 미리보기`} />
          )}
        </div>
      ) : (
        <p className={styles.hint}>이 형식은 미리보기를 지원하지 않습니다. 내려받아 확인해 주세요.</p>
      )}
    </div>
  );
}

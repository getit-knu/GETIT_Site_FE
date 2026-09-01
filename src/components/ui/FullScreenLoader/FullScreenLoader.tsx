import styles from "./FullScreenLoader.module.scss";

interface FullScreenLoaderProps {
  /** 무엇을 기다리는 중인지. 화면에 보이고 스크린리더도 읽는다. */
  label?: string;
}

/**
 * 화면 전체를 채우는 대기 화면. 아직 그릴 것이 아무것도 없을 때만 쓴다.
 *
 * 세 자리의 `TODO(A-3)`를 대신한다 — 첫 진입 청크를 받는 동안(`routes.tsx`의
 * `HydrateFallback`), 로그인 판정이 끝나기 전(`RequireRole`), OAuth 콜백 처리 중
 * (`OAuthCallbackPage`). 셋 다 `null`이나 맨 텍스트를 그려서, 앱을 처음 여는 사람에게
 * 흰 화면만 보이거나 스타일 없는 글자 한 줄이 덩그러니 남았다.
 *
 * 화면 일부만 비어 있는 경우(표·카드 목록)는 이게 아니라 그 자리에 맞는 골격을 쓴다.
 */
export function FullScreenLoader({ label = "잠시만 기다려 주세요" }: FullScreenLoaderProps) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.logo}>GET IT</span>
      <p className={styles.label}>{label}</p>
    </div>
  );
}

import styles from "./SettingsPage.module.scss";

/**
 * 와이어프레임 p20. 셸이 실제로 동작한다는 증거로 두는 화면이다.
 * 내용은 아직 정해지지 않아 안내 문구 한 줄만 둔다.
 *
 * TODO: 공통 `Card` 로 교체한다. #35(Button · Input · Card)가 develop 에 들어오면
 * 이 파일의 `<section>` 과 `.card` 스타일을 지우고 `<Card>` 로 감싸면 된다.
 * 지금 develop 에는 `Modal` 만 있어 가져다 쓸 수 없다.
 */
export default function SettingsPage() {
  return (
    <section className={styles.card}>
      <p className={styles.notice}>추후 구현 예정입니다.</p>
    </section>
  );
}

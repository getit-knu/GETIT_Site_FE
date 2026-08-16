import { Card } from "../../components/ui/Card/Card";

import styles from "./SettingsPage.module.scss";

/**
 * 와이어프레임 p20. 셸이 실제로 동작한다는 증거로 두는 화면이다.
 * 내용은 아직 정해지지 않아 안내 문구 한 줄만 둔다.
 */
export default function SettingsPage() {
  return (
    <Card>
      <p className={styles.notice}>추후 구현 예정입니다.</p>
    </Card>
  );
}

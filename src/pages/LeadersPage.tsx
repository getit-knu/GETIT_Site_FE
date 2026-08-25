import { StaffGroup } from "../components/leader/StaffGroup";
import { getStaffsSnapshot } from "../mocks/site/staffs";

import styles from "./LeadersPage.module.scss";

const STAFFS = getStaffsSnapshot();
const LEADERS = STAFFS.filter((staff) => staff.section === "EXECUTIVE");
// SW·창업 운영진을 팀별로 나누지 않고 하나의 "Staff" 그룹으로 합친다(팀 논의 후 결정).
const STAFF_MEMBERS = STAFFS.filter((staff) => staff.section !== "EXECUTIVE");

/** 운영진 소개. Figma 와이어프레임(`4:2442`) 기준. */
export default function LeadersPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>운영진 소개</h1>
          <p className={styles.subtitle}>GETIT을 이끌어가는 열정적인 운영진들을 만나보세요</p>
        </div>

        <StaffGroup title="Leader" staffs={LEADERS} />
        <StaffGroup title="Staff" staffs={STAFF_MEMBERS} />
      </div>
    </div>
  );
}

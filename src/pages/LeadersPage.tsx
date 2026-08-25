import { LeaderCard } from "../components/leader/LeaderCard";
import { getStaffsSnapshot } from "../mocks/site/staffs";

import styles from "./LeadersPage.module.scss";

const STAFFS = getStaffsSnapshot();
const LEADERS = STAFFS.filter((staff) => staff.section === "EXECUTIVE");

/** 운영진 소개. Figma 와이어프레임(`4:2442`) 기준. 지금은 Leader(회장단) 섹션만 다룬다. */
export default function LeadersPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>운영진 소개</h1>
          <p className={styles.subtitle}>GETIT을 이끌어가는 열정적인 운영진들을 만나보세요</p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Leader</h2>
          <ul className={styles.grid}>
            {LEADERS.map((leader) => (
              <li key={leader.id}>
                <LeaderCard staff={leader} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

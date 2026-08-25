import type { Staff } from "../../types/site";

import { LeaderCard } from "./LeaderCard";
import styles from "./StaffGroup.module.scss";

interface StaffGroupProps {
  title: string;
  staffs: Staff[];
  /** Leader만 회장·부회장·총무 역할을 보여준다. Staff는 안 보여준다(기본값). */
  showRole?: boolean;
}

/** "Leader"·"Staff" 섹션이 제목만 다르고 구조가 같아서 공용으로 뺐다. */
export function StaffGroup({ title, staffs, showRole = false }: StaffGroupProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.grid}>
        {staffs.map((staff) => (
          <li key={staff.id}>
            <LeaderCard staff={staff} showRole={showRole} />
          </li>
        ))}
      </ul>
    </section>
  );
}

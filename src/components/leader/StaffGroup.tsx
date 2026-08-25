import type { Staff } from "../../types/site";

import { LeaderCard } from "./LeaderCard";
import styles from "./StaffGroup.module.scss";

interface StaffGroupProps {
  title: string;
  staffs: Staff[];
}

/** "Leader"·"Staff" 섹션이 제목만 다르고 구조가 같아서 공용으로 뺐다. */
export function StaffGroup({ title, staffs }: StaffGroupProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.grid}>
        {staffs.map((staff) => (
          <li key={staff.id}>
            <LeaderCard staff={staff} />
          </li>
        ))}
      </ul>
    </section>
  );
}

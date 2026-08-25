import { StaffGroup } from "../components/leader/StaffGroup";
import { getStaffsSnapshot } from "../mocks/site/staffs";

import styles from "./LeadersPage.module.scss";

/** 운영진 소개. Figma 와이어프레임(`4:2442`) 기준. */
export default function LeadersPage() {
  // 모듈 최상단에서 한 번만 읽으면 이후 어드민에서 운영진을 수정해도 새로고침 전까지
  // 반영되지 않는다(mock이 메모리 안 배열이라 스냅샷이 그대로 캐싱됨). 렌더마다 새로 읽는다.
  const staffs = getStaffsSnapshot();
  const leaders = staffs.filter((staff) => staff.section === "EXECUTIVE");
  // SW·창업 운영진을 팀별로 나누지 않고 하나의 "Staff" 그룹으로 합친다(팀 논의 후 결정).
  const staffMembers = staffs.filter((staff) => staff.section !== "EXECUTIVE");

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>운영진 소개</h1>
          <p className={styles.subtitle}>GETIT을 이끌어가는 열정적인 운영진들을 만나보세요</p>
        </div>

        <StaffGroup title="Leader" staffs={leaders} />
        <StaffGroup title="Staff" staffs={staffMembers} />
      </div>
    </div>
  );
}

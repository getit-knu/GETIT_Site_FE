import { useQuery } from "@tanstack/react-query";

import { getStaffs } from "../apis/public/publicApi";
import { queryKeys } from "../apis/queryKeys";
import { StaffGroup } from "../components/leader/StaffGroup";

import styles from "./LeadersPage.module.scss";

/** 운영진 소개. Figma 와이어프레임(`4:2442`) 기준. */
export default function LeadersPage() {
  const { data } = useQuery({ queryKey: queryKeys.public.staffs(), queryFn: getStaffs });
  const sections = data?.sections ?? [];

  const leaders = sections.find((section) => section.section === "EXECUTIVE")?.staffs ?? [];
  // SW·창업 운영진을 팀별로 나누지 않고 하나의 "Staff" 그룹으로 합친다(팀 논의 후 결정).
  // 팀 구분이 없어졌으니 section 기준 정렬은 의미가 없다 — 이름 가나다순으로만 보여준다.
  const staffMembers = sections
    .filter((section) => section.section !== "EXECUTIVE")
    .flatMap((section) => section.staffs)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>운영진 소개</h1>
          <p className={styles.subtitle}>GETIT을 이끌어가는 열정적인 운영진들을 만나보세요</p>
        </div>

        <StaffGroup title="Leader" staffs={leaders} showRole />
        <StaffGroup title="Staff" staffs={staffMembers} />
      </div>
    </div>
  );
}

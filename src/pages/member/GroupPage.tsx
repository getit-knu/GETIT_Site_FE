import { groupErrorMessage } from "../../errors/user/errorMessages";
import { useMyGroup } from "../../hooks/group/useMyGroup";
import { EmptyState, ErrorState } from "../../components/ui/states/States";

import { MyProjectsSection } from "./MyProjectsSection";
import { ProjectSubmitForm } from "./ProjectSubmitForm";
import styles from "./GroupPage.module.scss";

/**
 * 내 그룹(BE#148). 아직 조 배정이 안 됐으면 `data: null`(정상 상태, 에러 아님) —
 * 그 경우 프로젝트 등록 폼도 같이 숨긴다(BE `NOT_ASSIGNED_TO_GROUP`으로도 막혀 있다).
 */
export default function GroupPage() {
  const { data, isPending, isError, error, refetch } = useMyGroup();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>내 그룹</h1>

        {isPending && <p className={styles.loading}>불러오는 중…</p>}
        {isError && <ErrorState message={groupErrorMessage(error)} onRetry={() => void refetch()} />}

        {data === null && (
          <EmptyState message="아직 배정된 조가 없습니다. 배정되면 조원 정보와 프로젝트 등록이 열립니다." />
        )}

        {data && (
          <>
            <section className={styles.groupCard}>
              <header className={styles.groupHeader}>
                <h2 className={styles.groupName}>{data.name}</h2>
                <span className={styles.count}>{data.memberCount}명</span>
              </header>

              <ul className={styles.members}>
                {data.members.map((member) => (
                  <li key={member.userId} className={styles.member}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberMeta}>
                      {member.major} · {member.roleLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.submitSection}>
              <MyProjectsSection />

              <h2 className={styles.sectionTitle}>프로젝트 등록</h2>
              <p className={styles.hint}>등록하면 관리자 승인 후 프로젝트 목록에 공개됩니다.</p>
              <ProjectSubmitForm />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

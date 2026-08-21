import { GroupsTab } from "../../components/user/GroupsTab";
import { MembersTab } from "../../components/user/MembersTab";
import { useTableParams } from "../../hooks/ui/useTableParams";

import styles from "./UsersPage.module.scss";

const TABS = ["members", "groups"] as const;

const TAB_LABEL: Record<(typeof TABS)[number], string> = {
  members: "사용자 관리",
  groups: "그룹 관리",
};

/**
 * 와이어프레임 p8 · p14. 사용자 관리와 그룹 관리를 탭으로 오간다.
 *
 * 탭은 URL 에 둔다(`?tab=groups`). 새로고침해도 보던 탭이 유지되고 링크로 공유된다.
 * 기본값은 사용자 관리라 `?tab` 이 없으면 그쪽을 그린다.
 *
 * 두 탭은 각자 파일을 갖는다. 한 파일에 몰면 화면 하나가 500줄을 넘고,
 * 한쪽을 고칠 때마다 다른 쪽과 충돌한다.
 */
export default function UsersPage() {
  const { filter: tab, setFilter: setTab } = useTableParams("tab", TABS);
  const active = tab ?? "members";

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist" aria-label="사용자">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active === value}
            className={active === value ? styles.tabActive : styles.tab}
            onClick={() => setTab(value)}
          >
            {TAB_LABEL[value]}
          </button>
        ))}
      </div>

      {active === "members" ? <MembersTab /> : <GroupsTab />}
    </div>
  );
}

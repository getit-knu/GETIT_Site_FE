import { ApplicantsTab } from "../../components/application/ApplicantsTab";
import { CriteriaSection } from "../../components/recruitment/CriteriaSection";
import { QuestionsSection } from "../../components/recruitment/QuestionsSection";
import { ScheduleSection } from "../../components/recruitment/ScheduleSection";
import { useTableParams } from "../../hooks/ui/useTableParams";

import styles from "./ApplicationsPage.module.scss";

const TABS = ["applicants", "settings"] as const;

const TAB_LABEL: Record<(typeof TABS)[number], string> = {
  applicants: "지원자 목록",
  settings: "지원 시스템 설정",
};

/** 와이어프레임 p7 · p6. */
export default function ApplicationsPage() {
  const { filter: tab, setFilter: setTab } = useTableParams("tab", TABS);
  const active = tab ?? "applicants";

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist" aria-label="지원서 관리">
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

      {active === "applicants" ? (
        <ApplicantsTab />
      ) : (
        <div className={styles.settings}>
          <ScheduleSection />
          <QuestionsSection />
          <CriteriaSection />
        </div>
      )}
    </div>
  );
}

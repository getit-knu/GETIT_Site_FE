import { useState } from "react";

import { ApplicantsTab } from "../../components/application/ApplicantsTab";
import { CriteriaSection } from "../../components/recruitment/CriteriaSection";
import { QuestionsSection } from "../../components/recruitment/QuestionsSection";
import { ScheduleSection } from "../../components/recruitment/ScheduleSection";
import { useSchedule } from "../../hooks/recruitment/useRecruitment";
import { useTableParams } from "../../hooks/ui/useTableParams";

import styles from "./ApplicationsPage.module.scss";

const TABS = ["applicants", "settings"] as const;

const TAB_LABEL: Record<(typeof TABS)[number], string> = {
  applicants: "지원자 목록",
  settings: "지원 시스템 설정",
};

/**
 * 모집이 시작되면 설정을 잠근다.
 *
 * 서버도 `409 RECRUITMENT_ALREADY_STARTED` 로 막지만(명세서 6절), 눌러 보고 알게 하면
 * 무엇을 잘못했는지 찾기 어렵다. 시작 시각이 지났으면 입력칸부터 비활성으로 둔다.
 */
function useSettingsLocked() {
  const { data } = useSchedule();
  // 현재 시각은 렌더 중에 읽으면 안 된다(두 렌더가 달라진다). 마운트 때 한 번만 잡는다.
  // 화면을 열어 둔 채 모집 시작 시각을 넘기는 경우는 새로고침하면 반영된다.
  const [openedAt] = useState(() => Date.now());

  if (!data) return false;
  return new Date(data.totalStartAt).getTime() <= openedAt;
}

/** 와이어프레임 p7 · p6. */
export default function ApplicationsPage() {
  const { filter: tab, setFilter: setTab } = useTableParams("tab", TABS);
  const active = tab ?? "applicants";
  const locked = useSettingsLocked();

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
          {locked && (
            <p className={styles.lockNotice} role="status">
              모집이 시작되어 설정을 수정할 수 없습니다.
            </p>
          )}
          <ScheduleSection locked={locked} />
          <QuestionsSection locked={locked} />
          <CriteriaSection locked={locked} />
        </div>
      )}
    </div>
  );
}

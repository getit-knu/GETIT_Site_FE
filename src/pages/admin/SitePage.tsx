import { useState } from "react";

import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { ErrorState } from "../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../errors/site/errorMessages";
import { useSaveSiteSettings, useSiteSettings } from "../../hooks/site/useSiteSettings";
import type { SiteSettings } from "../../types/site";

import { ContentSections } from "./site/ContentSections";
import { contentInvalidReason, fromDrafts, toDrafts } from "./site/contentDraft";
import { FeaturesSection } from "./site/FeaturesSection";
import { invalidReason, SCHEDULE_FIELDS, toDraft, toSchedule } from "./site/scheduleDraft";
import type { ScheduleDraft } from "./site/scheduleDraft";
import { StaffsSection } from "./site/StaffsSection";
import { TracksSection } from "./site/TracksSection";
import { toTrackDrafts, toTracks, tracksInvalidReason } from "./site/tracksDraft";
import type { TrackDraft } from "./site/tracksDraft";
import styles from "./SitePage.module.scss";

const SECTION_NAV_ITEMS = [
  { id: "generation", label: "진행 기수" },
  { id: "schedule", label: "모집 일정" },
  { id: "tracks", label: "강의 분류" },
  { id: "curriculums", label: "커리큘럼" },
  { id: "events", label: "행사 일정" },
  { id: "faqs", label: "FAQ" },
  { id: "staffs", label: "운영진" },
  { id: "features", label: "기능 활성화" },
] as const;

/**
 * 섹션 8개로 바로 이동하는 sticky 앵커 바.
 *
 * 페이지 내부 이동일 뿐이라 `<a href="#id">`를 그대로 쓴다 — react-router `Link`가 아니다.
 * 스크롤 위치에 따라 현재 섹션을 강조하는 기능(scroll-spy)은 범위 밖이라 넣지 않았다.
 */
function SiteSectionNav() {
  return (
    <nav className={styles.sectionNav} aria-label="사이트 관리 섹션 바로가기">
      {SECTION_NAV_ITEMS.map((item) => (
        <a key={item.id} href={`#${item.id}`} className={styles.sectionNavLink}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/** 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 기존 값을 넣을 수 있다. */
function SiteForm({ settings }: { settings: SiteSettings }) {
  const [generationNo, setGenerationNo] = useState(String(settings.generation.generationNo));
  const [year, setYear] = useState(String(settings.generation.year));
  const [schedule, setSchedule] = useState<ScheduleDraft>(() => toDraft(settings.schedule));
  const [tracks, setTracks] = useState<TrackDraft[]>(() => toTrackDrafts(settings.tracks));
  const [curriculums, setCurriculums] = useState(() => toDrafts(settings.curriculums));
  const [events, setEvents] = useState(() => toDrafts(settings.events));
  const [faqs, setFaqs] = useState(() => toDrafts(settings.faqs));
  const save = useSaveSiteSettings();

  // 섹션이 늘어나면 이유도 늘어난다. 먼저 걸리는 것 하나만 보여준다.
  const reason =
    invalidReason(generationNo, year, schedule) ??
    tracksInvalidReason(tracks) ??
    contentInvalidReason(curriculums, events, faqs);

  /**
   * 값을 고치면 지난 저장 결과를 지운다.
   *
   * 그대로 두면 저장한 뒤 한 글자만 바꿔도 "저장했습니다." 가 계속 떠 있어,
   * 아직 보내지 않은 값을 저장된 것으로 읽게 된다. 실패 문구도 마찬가지다.
   */
  function edit(apply: () => void) {
    if (save.isSuccess || save.isError) save.reset();
    apply();
  }

  function handleSave() {
    save.mutate({
      generation: { generationNo: Number(generationNo), year: Number(year) },
      schedule: toSchedule(schedule),
      // 이제 모든 섹션이 편집 대상이다. 10.20 은 화면 전체 상태를 한 트랜잭션으로 반영한다.
      tracks: toTracks(tracks),
      curriculums: fromDrafts(curriculums),
      events: fromDrafts(events),
      faqs: fromDrafts(faqs),
    });
  }

  return (
    <>
      <SiteSectionNav />

      <section id="generation" className={styles.section}>
        <h2 className={styles.sectionTitle}>진행 기수</h2>
        <div className={styles.grid}>
          <Input label="기수" type="number" value={generationNo} onChange={(v) => edit(() => setGenerationNo(v))} />
          <Input label="연도" type="number" value={year} onChange={(v) => edit(() => setYear(v))} />
        </div>
      </section>

      <section id="schedule" className={styles.section}>
        <h2 className={styles.sectionTitle}>모집 일정</h2>
        <div className={styles.grid}>
          {SCHEDULE_FIELDS.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type="datetime-local"
              value={schedule[key]}
              onChange={(value) => edit(() => setSchedule((prev) => ({ ...prev, [key]: value })))}
            />
          ))}
        </div>
        {/* 면접 마감은 서버가 전체 모집 마감으로 맞춘다(명세서 6.2). 입력칸을 두지 않는다. */}
        <p className={styles.hint}>면접 마감은 전체 모집 마감과 같게 저장됩니다.</p>
      </section>

      <TracksSection tracks={tracks} onChange={setTracks} />

      <ContentSections
        curriculums={curriculums}
        events={events}
        faqs={faqs}
        onCurriculumsChange={setCurriculums}
        onEventsChange={setEvents}
        onFaqsChange={setFaqs}
      />

      {/*
        아래 두 섹션은 `저장하기` 와 무관하다. 10.20 일괄 저장에 들어가지 않고
        개별 엔드포인트로 즉시 반영된다(명세서 10.21 ~ 10.24).
      */}
      <StaffsSection generationNo={settings.generation.generationNo} />
      <FeaturesSection />

      <div className={styles.footer}>
        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {save.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(save.error)}</p>}
        {save.isSuccess && save.error === null && (
          <p className={styles.saved} role="status">
            저장했습니다.
          </p>
        )}
        <Button disabled={reason !== null || save.isPending} onClick={handleSave}>
          {save.isPending ? "저장 중…" : "저장하기"}
        </Button>
      </div>
    </>
  );
}

/**
 * 사이트 관리. 와이어프레임 p9.
 *
 * **섹션이 여럿이지만 저장은 하나다**(명세서 10.20). 강의 분류 · 커리큘럼 · 행사 · FAQ 는
 * 뒤따르는 이슈에서 이 폼 상태 위에 얹는다.
 */
export default function SitePage() {
  const { data, isPending, isError, error, refetch } = useSiteSettings();

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) return <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <div className={styles.page}>
      <SiteForm settings={data} />
    </div>
  );
}

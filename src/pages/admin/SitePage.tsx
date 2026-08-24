import { useState } from "react";

import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { ErrorState } from "../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../errors/site/errorMessages";
import { useSaveSiteSettings, useSiteSettings } from "../../hooks/site/useSiteSettings";
import type { SiteSettings } from "../../types/site";

import { invalidReason, SCHEDULE_FIELDS, toDraft, toSchedule } from "./site/scheduleDraft";
import type { ScheduleDraft } from "./site/scheduleDraft";
import { TracksSection } from "./site/TracksSection";
import { toTrackDrafts, toTracks, tracksInvalidReason } from "./site/tracksDraft";
import type { TrackDraft } from "./site/tracksDraft";
import styles from "./SitePage.module.scss";

/** 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 기존 값을 넣을 수 있다. */
function SiteForm({ settings }: { settings: SiteSettings }) {
  const [generationNo, setGenerationNo] = useState(String(settings.generation.generationNo));
  const [year, setYear] = useState(String(settings.generation.year));
  const [schedule, setSchedule] = useState<ScheduleDraft>(() => toDraft(settings.schedule));
  const [tracks, setTracks] = useState<TrackDraft[]>(() => toTrackDrafts(settings.tracks));
  const save = useSaveSiteSettings();

  // 섹션이 늘어나면 이유도 늘어난다. 먼저 걸리는 것 하나만 보여준다.
  const reason = invalidReason(generationNo, year, schedule) ?? tracksInvalidReason(tracks);

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
      tracks: toTracks(tracks),
      /*
        아직 편집 화면이 없는 섹션들이다. 10.20 은 개별 CRUD 가 아니라 화면 전체 상태를
        한 트랜잭션으로 반영하므로, 빼고 보내면 **서버에서 지워진다.**
        받은 그대로 되돌려 보낸다. 편집 UI 는 뒤따르는 이슈에서 붙인다.
      */
      curriculums: settings.curriculums,
      events: settings.events,
      faqs: settings.faqs,
    });
  }

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>진행 기수</h2>
        <div className={styles.grid}>
          <Input label="기수" type="number" value={generationNo} onChange={(v) => edit(() => setGenerationNo(v))} />
          <Input label="연도" type="number" value={year} onChange={(v) => edit(() => setYear(v))} />
        </div>
      </section>

      <section className={styles.section}>
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

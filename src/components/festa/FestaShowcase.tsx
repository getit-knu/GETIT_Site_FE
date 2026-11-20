import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getFestaProjects } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import type { PublicProject } from "../../types/project";

import { FESTA_COPY, FESTA_EVENT, FESTA_MODE, type FestaMode } from "./festaConfig";
import { FestaDeadlineLabel } from "./FestaDeadlineLabel";
import { FestaInvestBoard } from "./FestaInvestBoard";
import { FestaProjectDetail } from "./FestaProjectDetail";
import styles from "./FestaShowcase.module.scss";
import { FestaVoteBoard } from "./FestaVoteBoard";

/** 어드민이 "FESTA 출전"으로 고른 프로젝트를 출전 순서대로(#362, BE#220). */
function useFestaProjects() {
  const query = useQuery({ queryKey: queryKeys.public.festaProjects(), queryFn: getFestaProjects });
  return { projects: query.data ?? [], isPending: query.isPending, isError: query.isError };
}

/**
 * 모의투자 FESTA 쇼케이스(#359). 행사 기간(`MOCK_INVESTMENT` 토글 on)에 `HomePage`가 기존 홈 대신
 * 그린다. 배경은 홈 히어로와 같은 블롭을 쓰고, 그 위에 출전 팀 카드를 앱스토어 목록처럼 깐다.
 */
interface FestaShowcaseProps {
  mode?: FestaMode;
  /** 배지에 띄울 기수(홈 API의 활성 기수, #377). 없으면 숫자 없이 보여준다. */
  generationNo?: number | null;
}

export function FestaShowcase({ mode = FESTA_MODE, generationNo = null }: FestaShowcaseProps) {
  const { projects, isPending, isError } = useFestaProjects();
  const [selected, setSelected] = useState<PublicProject | null>(null);

  return (
    <section className={styles.showcase}>
      <div className={styles.blobBlue} aria-hidden="true" />
      <div className={styles.blobTeal} aria-hidden="true" />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.badge}>GET IT {generationNo === null ? "" : `${generationNo}기 · `}프로젝트 쇼케이스</p>
          <h1 className={styles.title}>
            모의투자 <span className={styles.titleAccent}>FESTA</span>
          </h1>
          <p className={styles.date}>
            <FestaDeadlineLabel endsAt={FESTA_EVENT.endsAt} action={FESTA_COPY[mode].action} />
            {projects.length > 0 && ` · ${projects.length}팀 출전`}
          </p>
          <p className={styles.subtitle}>{FESTA_COPY[mode].subtitle}</p>
        </header>

        {isError ? (
          <p className={styles.status} role="alert">
            프로젝트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : isPending ? (
          <p className={styles.status} aria-live="polite">
            출전 프로젝트를 불러오는 중이에요…
          </p>
        ) : projects.length === 0 ? (
          <p className={styles.status}>출전 프로젝트를 준비하고 있어요.</p>
        ) : mode === "vote" ? (
          <FestaVoteBoard projects={projects} onSelect={setSelected} />
        ) : (
          <FestaInvestBoard projects={projects} onSelect={setSelected} />
        )}
      </div>

      <FestaProjectDetail project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

import { useFestaInvestment } from "../../hooks/festa/useFestaInvestment";
import type { PublicProject } from "../../types/project";

import { FESTA_COPY } from "./festaConfig";
import { phaseLockReason, type FestaPhase, type FestaWindow } from "./festaDeadline";
import { FestaInvestBar } from "./FestaInvestBar";
import { FestaInvestControl } from "./FestaInvestControl";
import { FestaJoinPanel } from "./FestaJoinPanel";
import { FestaProjectCard } from "./FestaProjectCard";
import styles from "./FestaShowcase.module.scss";

export interface FestaBoardProps {
  projects: PublicProject[];
  onSelect: (project: PublicProject) => void;
  /** 투표 기간 단계(#379). 기간 밖이면 참여를 막는다. */
  phase: FestaPhase;
  period: FestaWindow | null;
}

/** 가상 투자금을 나눠 넣는 방식(#364). 지금은 `FESTA_MODE`가 `"investment"`일 때만 쓴다. */
export function FestaInvestBoard({ projects, onSelect, phase, period }: FestaBoardProps) {
  const invest = useFestaInvestment(projects);
  const lockReason = phaseLockReason(phase, period, FESTA_COPY.investment.action);

  return (
    <>
      <FestaJoinPanel state={invest} copy={FESTA_COPY.investment} />
      <h2 className={styles.visuallyHidden}>출전 프로젝트</h2>
      <ul className={styles.grid}>
        {projects.map((project, index) => (
          <FestaProjectCard
            key={project.id}
            project={project}
            index={index}
            onSelect={onSelect}
            footer={
              invest.phase === "ready" && (
                <FestaInvestControl
                  title={project.title}
                  amount={invest.amountOf(project.id)}
                  unit={invest.unit}
                  remaining={invest.remaining}
                  isOwn={invest.isOwn(project.id)}
                  onChange={(amount) => invest.setAmount(project.id, amount)}
                />
              )
            }
          />
        ))}
      </ul>
      <FestaInvestBar invest={invest} lockReason={lockReason} />
    </>
  );
}

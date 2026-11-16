import { useFestaInvestment } from "../../hooks/festa/useFestaInvestment";
import type { PublicProject } from "../../types/project";

import { FESTA_COPY } from "./festaConfig";
import { FestaInvestBar } from "./FestaInvestBar";
import { FestaInvestControl } from "./FestaInvestControl";
import { FestaJoinPanel } from "./FestaJoinPanel";
import { FestaProjectCard } from "./FestaProjectCard";
import styles from "./FestaShowcase.module.scss";

export interface FestaBoardProps {
  projects: PublicProject[];
  onSelect: (project: PublicProject) => void;
}

/** 가상 투자금을 나눠 넣는 방식(#364). 지금은 `FESTA_MODE`가 `"investment"`일 때만 쓴다. */
export function FestaInvestBoard({ projects, onSelect }: FestaBoardProps) {
  const invest = useFestaInvestment(projects);

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
      <FestaInvestBar invest={invest} />
    </>
  );
}

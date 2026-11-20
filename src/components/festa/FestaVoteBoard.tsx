import { useFestaVote } from "../../hooks/festa/useFestaVote";

import { FESTA_COPY } from "./festaConfig";
import { phaseLockReason } from "./festaDeadline";
import type { FestaBoardProps } from "./FestaInvestBoard";
import { FestaJoinPanel } from "./FestaJoinPanel";
import { FestaProjectCard } from "./FestaProjectCard";
import styles from "./FestaShowcase.module.scss";
import { FestaVoteBar } from "./FestaVoteBar";
import { FestaVoteButton } from "./FestaVoteButton";

/**
 * 1인 1팀 투표(#373). 카드에서 팀 하나를 고르고 아래 바에서 투표한다. 투표 기간 밖에는(#379) 고르기와
 * 투표를 모두 막고, 이미 투표한 팀 표시는 남긴다.
 */
export function FestaVoteBoard({ projects, onSelect, phase, period }: FestaBoardProps) {
  const vote = useFestaVote(projects);
  const lockReason = phaseLockReason(phase, period, FESTA_COPY.vote.action);

  return (
    <>
      <FestaJoinPanel state={vote} copy={FESTA_COPY.vote} />
      <h2 className={styles.visuallyHidden}>출전 프로젝트</h2>
      <ul className={styles.grid}>
        {projects.map((project, index) => (
          <FestaProjectCard
            key={project.id}
            project={project}
            index={index}
            onSelect={onSelect}
            footer={
              vote.phase === "ready" && (
                <FestaVoteButton
                  title={project.title}
                  isChosen={vote.chosenId === project.id}
                  isOwn={vote.isOwn(project.id)}
                  isLocked={lockReason !== null}
                  onChoose={() => vote.choose(project.id)}
                />
              )
            }
          />
        ))}
      </ul>
      <FestaVoteBar vote={vote} lockReason={lockReason} />
    </>
  );
}

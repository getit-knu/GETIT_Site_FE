import { useFestaVote } from "../../hooks/festa/useFestaVote";

import { FESTA_COPY } from "./festaConfig";
import type { FestaBoardProps } from "./FestaInvestBoard";
import { FestaJoinPanel } from "./FestaJoinPanel";
import { FestaProjectCard } from "./FestaProjectCard";
import styles from "./FestaShowcase.module.scss";
import { FestaVoteBar } from "./FestaVoteBar";
import { FestaVoteButton } from "./FestaVoteButton";

/** 1인 1팀 투표(#373). 카드에서 팀 하나를 고르고 아래 바에서 투표한다. */
export function FestaVoteBoard({ projects, onSelect }: FestaBoardProps) {
  const vote = useFestaVote(projects);

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
                  onChoose={() => vote.choose(project.id)}
                />
              )
            }
          />
        ))}
      </ul>
      <FestaVoteBar vote={vote} />
    </>
  );
}

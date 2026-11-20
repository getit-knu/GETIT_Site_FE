import type { FestaVoteState } from "../../hooks/festa/useFestaVote";
import { Button } from "../ui/Button/Button";

// 투자 바와 같은 자리·모양이라 스타일을 함께 쓴다.
import styles from "./FestaInvestBar.module.scss";

interface FestaVoteBarProps {
  vote: FestaVoteState;
  /** 투표 기간 밖이라 투표를 막는 이유(#379). 기간 안이면 `null`. */
  lockReason: string | null;
}

/** 화면 아래에 붙어 따라오는 고른 팀과 투표 버튼(#373). 카드를 내려가며 골라도 무엇을 골랐는지 보인다. */
export function FestaVoteBar({ vote, lockReason }: FestaVoteBarProps) {
  if (vote.phase !== "ready") return null;

  const message = vote.saveError ?? lockReason ?? (vote.justSaved ? "투표했어요." : vote.blockReason);

  return (
    <div className={styles.bar}>
      <div className={styles.summary}>
        <p className={styles.remaining}>
          {vote.chosenTitle === null ? (
            "아직 고른 팀이 없어요"
          ) : (
            <>
              {vote.chosenId === vote.votedId ? "투표한 팀" : "고른 팀"} <strong>{vote.chosenTitle}</strong>
            </>
          )}
        </p>
        {message !== null && (
          <p className={styles.message} role={vote.saveError ? "alert" : "status"}>
            {message}
          </p>
        )}
      </div>
      <Button onClick={vote.submit} disabled={lockReason !== null || vote.blockReason !== null || vote.isSaving}>
        {vote.isSaving ? "투표하는 중…" : vote.votedId === null ? "투표하기" : "투표 바꾸기"}
      </Button>
    </div>
  );
}

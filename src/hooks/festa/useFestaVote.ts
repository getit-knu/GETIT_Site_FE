import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getVote, saveVote } from "../../apis/festa/festaApi";
import { queryKeys } from "../../apis/queryKeys";
import { festaVoteErrorMessage, festaVoteSaveErrorMessage } from "../../errors/festa/errorMessages";
import type { FestaVotePayload } from "../../types/festa";
import type { PublicProject } from "../../types/project";
import { useSession } from "../auth/useSession";

import { useFestaContact } from "./useFestaContact";

/**
 * FESTA 1인 1팀 투표 상태(#373). 패널(번호·동의)·저장 바·카드(팀 고르기)가 함께 쓴다.
 *
 * 카드에서 고른 팀은 "투표하기"를 누르기 전까지 화면에만 있다(`draft`). 우리 조 판별은 응답의
 * `ownProjectIds`로 한다(BE#232 가 처음부터 함께 준다).
 */
export function useFestaVote(projects: PublicProject[]) {
  const { user, isLoading: isSessionLoading } = useSession();
  const queryClient = useQueryClient();

  const vote = useQuery({ queryKey: queryKeys.festa.vote(), queryFn: getVote, enabled: user !== undefined });
  const contact = useFestaContact(vote.data?.maskedPhoneNumber ?? null);
  const [draft, setDraft] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: (payload: FestaVotePayload) => saveVote(payload),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.festa.vote(), next);
      setDraft(null);
      contact.reset();
    },
  });

  const ownIds = new Set(vote.data?.ownProjectIds ?? []);
  const votedId = vote.data?.projectId ?? null;
  const chosenId = draft ?? votedId;
  const isDirty = draft !== null && draft !== votedId;
  const titleOf = (id: number | null) => projects.find((p) => p.id === id)?.title ?? null;

  function blockReason(): string | null {
    if (chosenId === null) return "투표할 팀을 골라 주세요.";
    if (contact.blockReason !== null) return contact.blockReason;
    if (!isDirty && !contact.needsPhone) return "다른 팀을 고르면 투표를 바꿀 수 있어요.";
    return null;
  }

  function submit() {
    if (chosenId === null) return;
    save.mutate({ projectId: chosenId, ...contact.payload });
  }

  const phase = isSessionLoading
    ? "loading"
    : user === undefined
      ? "signedOut"
      : vote.isError
        ? "error"
        : vote.isPending
          ? "loading"
          : "ready";

  return {
    phase,
    loadError: vote.isError ? festaVoteErrorMessage(vote.error) : null,
    contact,
    isOwn: (projectId: number) => ownIds.has(projectId),
    /** 우리 조 프로젝트는 고를 수 없다. 서버도 `OWN_GROUP_PROJECT`로 막는다. */
    choose: (projectId: number) => {
      if (!ownIds.has(projectId)) setDraft(projectId);
    },
    chosenId,
    chosenTitle: titleOf(chosenId),
    votedId,
    votedTitle: titleOf(votedId),
    blockReason: blockReason(),
    submit,
    isSaving: save.isPending,
    saveError: save.isError ? festaVoteSaveErrorMessage(save.error) : null,
    justSaved: save.isSuccess && !isDirty,
  } as const;
}

export type FestaVoteState = ReturnType<typeof useFestaVote>;

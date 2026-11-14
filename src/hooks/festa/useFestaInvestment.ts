import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getPortfolio, savePortfolio } from "../../apis/festa/festaApi";
import { queryKeys } from "../../apis/queryKeys";
import { festaErrorMessage, festaSaveErrorMessage } from "../../errors/festa/errorMessages";
import { formatPhoneNumber, isValidPhoneNumber, PHONE_NUMBER_FORMAT_MESSAGE } from "../../libs/phoneNumber";
import type { FestaInvestment, FestaPortfolioPayload } from "../../types/festa";
import type { PublicProject } from "../../types/project";
import { useSession } from "../auth/useSession";
import { useMyProjects } from "../project/useMemberProjects";

type Amounts = Record<number, number>;

function toAmounts(investments: FestaInvestment[] | undefined): Amounts {
  return Object.fromEntries((investments ?? []).map((i) => [i.projectId, i.amount]));
}

/**
 * FESTA 쇼케이스의 가상 투자 상태(#364). 패널(번호·동의)·저장 바·카드(금액 조절)가 함께 쓴다.
 *
 * 카드에서 고친 금액은 저장 전까지 화면에만 있다(`draft`). 서버는 투자를 통째로 바꾸므로
 * 저장할 때 출전 목록 전체를 한 번에 보낸다.
 */
export function useFestaInvestment(projects: PublicProject[]) {
  const { user, isLoading: isSessionLoading } = useSession();
  const queryClient = useQueryClient();

  const portfolio = useQuery({
    queryKey: queryKeys.festa.portfolio(),
    queryFn: getPortfolio,
    enabled: user !== undefined,
  });

  // "우리 조" 프로젝트는 BE#228 의 `ownProjectIds`로 판단한다. 그게 배포되기 전에는 부원이
  // 직접 낸 프로젝트로 대신한다 — 어드민이 대신 등록한 프로젝트는 못 잡지만 서버가 한 번 더 막는다.
  const ownFromServer = portfolio.data?.ownProjectIds;
  const myProjects = useMyProjects({ enabled: user?.role === "MEMBER" && portfolio.isSuccess && !ownFromServer });
  const ownIds = new Set(ownFromServer ?? myProjects.data?.map((p) => p.id) ?? []);

  const [draft, setDraft] = useState<Amounts | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const save = useMutation({
    mutationFn: (payload: FestaPortfolioPayload) => savePortfolio(payload),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.festa.portfolio(), next);
      setDraft(null);
      setEditingPhone(false);
      setPhone("");
      setConsent(false);
    },
  });

  const saved = toAmounts(portfolio.data?.investments);
  const amounts = draft ?? saved;
  // 투자할 수 있는 건 지금 출전 중이고 우리 조가 아닌 프로젝트뿐이다. 서버는 금액이 0 이어도
  // 그 밖의 프로젝트가 담기면 통째로 거절하므로 요청에서 아예 뺀다.
  const targets = projects.map((p) => p.id).filter((id) => !ownIds.has(id));
  const budget = portfolio.data?.budget ?? 0;
  const unit = portfolio.data?.unit ?? 1;
  const invested = targets.reduce((sum, id) => sum + (amounts[id] ?? 0), 0);
  const remaining = budget - invested;
  const isDirty = targets.some((id) => (amounts[id] ?? 0) !== (saved[id] ?? 0));

  const hasPhone = portfolio.data?.maskedPhoneNumber != null;
  const needsPhone = !hasPhone || editingPhone;

  function setAmount(projectId: number, amount: number) {
    const max = (amounts[projectId] ?? 0) + remaining;
    const next = Math.min(Math.max(Math.floor(amount / unit) * unit, 0), max);
    setDraft({ ...amounts, [projectId]: next });
  }

  function blockReason(): string | null {
    if (needsPhone && !isValidPhoneNumber(phone)) return PHONE_NUMBER_FORMAT_MESSAGE;
    if (needsPhone && !consent) return "전화번호 수집·이용에 동의해 주세요.";
    if (!isDirty && !needsPhone) return "바꾼 투자가 없어요.";
    return null;
  }

  function submit() {
    save.mutate({
      ...(needsPhone ? { phoneNumber: phone.trim(), privacyConsent: consent } : {}),
      investments: targets
        .map((projectId) => ({ projectId, amount: amounts[projectId] ?? 0 }))
        .filter((i) => i.amount > 0),
    });
  }

  const phase = isSessionLoading
    ? "loading"
    : user === undefined
      ? "signedOut"
      : portfolio.isError
        ? "error"
        : portfolio.isPending
          ? "loading"
          : "ready";

  return {
    phase,
    loadError: portfolio.isError ? festaErrorMessage(portfolio.error) : null,
    budget,
    unit,
    remaining,
    amountOf: (projectId: number) => amounts[projectId] ?? 0,
    isOwn: (projectId: number) => ownIds.has(projectId),
    setAmount,
    contact: {
      maskedPhoneNumber: portfolio.data?.maskedPhoneNumber ?? null,
      needsPhone,
      phone,
      setPhone: (value: string) => setPhone(formatPhoneNumber(value)),
      consent,
      setConsent,
      startEditing: () => setEditingPhone(true),
      cancelEditing: () => {
        setEditingPhone(false);
        setPhone("");
        setConsent(false);
      },
    },
    blockReason: blockReason(),
    submit,
    isSaving: save.isPending,
    saveError: save.isError ? festaSaveErrorMessage(save.error) : null,
    justSaved: save.isSuccess && !isDirty,
  } as const;
}

export type FestaInvestState = ReturnType<typeof useFestaInvestment>;

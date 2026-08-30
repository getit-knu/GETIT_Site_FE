import { useQuery } from "@tanstack/react-query";

import { getMySummary } from "../../apis/member/memberApi";
import { queryKeys } from "../../apis/queryKeys";

export function useMySummary() {
  return useQuery({ queryKey: queryKeys.member.summary(), queryFn: getMySummary });
}

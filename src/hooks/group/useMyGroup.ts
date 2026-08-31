import { useQuery } from "@tanstack/react-query";

import { getMyGroup } from "../../apis/group/memberGroupApi";
import { queryKeys } from "../../apis/queryKeys";

export function useMyGroup() {
  return useQuery({ queryKey: queryKeys.groups.mine(), queryFn: getMyGroup });
}

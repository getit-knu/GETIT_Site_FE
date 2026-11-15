import { useGroupBoard } from "../../hooks/group/useGroups";
import { Select } from "../ui/Select/Select";

import styles from "./AdminProjectFormModal.module.scss";

/** `Select`는 `null`을 못 받아 "선택 안 함"을 0으로 둔다. 조 id 는 양수다. */
const NONE = 0;

interface ProjectGroupFieldProps {
  value: number | null;
  /** 처음 열었을 때의 조. 이미 정해져 있으면 비울 수 없다(서버가 비우기를 지원하지 않는다). */
  initial: number | null;
  onChange: (groupId: number | null) => void;
}

/**
 * 프로젝트 소속 조(#371). FESTA "우리 조 투자 금지"를 이 값으로 판단하므로, 어드민이 대신 등록한
 * 출전 프로젝트에도 조를 정해 줘야 한다.
 *
 * 목록은 활성 기수의 조뿐이다. 이전 기수 조가 들어 있는 프로젝트를 열어도 그 값을 잃지 않게
 * 목록에 없는 조는 따로 보여준다.
 */
export function ProjectGroupField({ value, initial, onChange }: ProjectGroupFieldProps) {
  const { data, isError } = useGroupBoard();
  const groups = data?.groups ?? [];

  const options = [
    ...(initial === null ? [{ value: NONE, label: "선택 안 함" }] : []),
    ...groups.map((g) => ({ value: g.id, label: g.name })),
    ...(value !== null && !groups.some((g) => g.id === value)
      ? [{ value, label: data ? "현재 기수에 없는 조" : "불러오는 중…" }]
      : []),
  ];

  return (
    <div className={styles.field}>
      <span className={styles.label}>소속 조</span>
      <Select
        ariaLabel="소속 조"
        value={value ?? NONE}
        options={options}
        onChange={(next: number) => onChange(next === NONE ? null : next)}
      />
      {isError && <span className={styles.hint}>조 목록을 불러오지 못했습니다.</span>}
    </div>
  );
}

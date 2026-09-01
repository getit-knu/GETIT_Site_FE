import { useState } from "react";

import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { Select } from "../../../components/ui/Select/Select";
import { TextArea } from "../../../components/ui/TextArea/TextArea";
import { ErrorState, TextSkeleton } from "../../../components/ui/states/States";
import { siteSaveErrorMessage, siteErrorMessage } from "../../../errors/site/errorMessages";
import { useDeleteStaff, useReorderStaffs, useSaveStaff, useStaffs } from "../../../hooks/site/useStaffs";
import type { Staff, StaffPayload, StaffSection } from "../../../types/site";

import { StaffPhotoField } from "./StaffPhotoField";
import styles from "./StaffsSection.module.scss";

const SECTIONS: { value: StaffSection; label: string }[] = [
  { value: "EXECUTIVE", label: "임원진" },
  { value: "SW", label: "SW" },
  { value: "STARTUP", label: "창업" },
];

interface Draft {
  id: number | null;
  name: string;
  staffRole: string;
  section: StaffSection;
  department: string;
  introduction: string;
  githubUrl: string;
  instagramUrl: string;
  /**
   * 저장할 프로필 사진.
   *
   * `null` 은 "사진 없음"(새로 만들거나 제거를 누른 상태), 숫자는 올린 파일,
   * `undefined` 는 **기존 사진이 있는데 그 id 를 모르는 상태**다 — 이때는 저장을 막는다
   * (`Staff.fileId` 주석 참고).
   */
  fileId: number | null | undefined;
  /** 이미 등록된 사진 주소. 미리보기에만 쓴다. */
  photoUrl: string | null;
}

function emptyDraft(section: StaffSection): Draft {
  return {
    id: null,
    name: "",
    staffRole: "",
    section,
    department: "",
    introduction: "",
    githubUrl: "",
    instagramUrl: "",
    // 새 운영진에겐 지킬 사진이 없다. 안 올리면 그대로 사진 없이 저장된다.
    fileId: null,
    photoUrl: null,
  };
}

function toDraft(staff: Staff): Draft {
  return {
    id: staff.id,
    name: staff.name,
    staffRole: staff.staffRole,
    section: staff.section,
    department: staff.department,
    introduction: staff.introduction,
    githubUrl: staff.githubUrl ?? "",
    instagramUrl: staff.instagramUrl ?? "",
    // 사진이 없는 운영진은 지킬 것이 없으므로 `undefined` 여도 `null` 로 본다.
    fileId: staff.profileImageUrl === null ? null : staff.fileId,
    photoUrl: staff.profileImageUrl,
  };
}

/** BE `@HttpUrl` 검증(http · https만 허용)을 그대로 미러링한다 — 계정이 없으면 빈 칸이라 통과. */
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/;

function invalidUrlReason(label: string, value: string): string | null {
  if (value.trim() === "") return null;
  return HTTP_URL_PATTERN.test(value.trim()) ? null : `${label}은(는) http 또는 https로 시작하는 주소여야 합니다.`;
}

function invalidReason(draft: Draft): string | null {
  if (draft.name.trim() === "") return "이름을 입력해 주세요.";
  if (draft.staffRole.trim() === "") return "직책을 입력해 주세요.";
  /*
    구역 라벨의 `*` 는 공개 카드에 나가는 값이라는 표시일 뿐이고, 비울 수 없으니
    막을 것도 없다. 아래 이름 · 직책 · 학과의 `*` 는 실제로 저장을 막는다.
  */
  if (draft.department.trim() === "") return "학과 · 학번을 입력해 주세요.";
  /*
    등록된 사진이 있는데 그 id 를 모르면 저장할 수 없다 — 수정 요청은 `fileId` 를 통째로
    덮어쓰므로 보내지 않으면 서버가 사진을 지운다. 조회 응답에 `fileId` 가 실려 오기
    시작하면(BE#187) 이 검사는 저절로 통과한다.
  */
  if (draft.fileId === undefined) {
    return "등록된 사진 정보를 불러오지 못했습니다. 사진을 다시 올리거나 제거해 주세요.";
  }
  return invalidUrlReason("GitHub 링크", draft.githubUrl) ?? invalidUrlReason("Instagram 링크", draft.instagramUrl);
}

interface FormProps {
  draft: Draft;
  generationNo: number;
  onClose: () => void;
}

/** 추가와 수정이 같은 폼을 쓴다. `id` 가 `null` 이면 추가다. */
function StaffForm({ draft: initial, generationNo, onClose }: FormProps) {
  const [draft, setDraft] = useState(initial);
  const save = useSaveStaff();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    const payload: StaffPayload = {
      // 표시 전용 프로필이다. 계정 연결은 사용자 검색이 붙은 뒤에 다룬다(명세서 10.21 `userId` 는 선택).
      userId: null,
      name: draft.name.trim(),
      staffRole: draft.staffRole.trim(),
      section: draft.section,
      department: draft.department.trim(),
      introduction: draft.introduction,
      githubUrl: draft.githubUrl.trim() === "" ? null : draft.githubUrl.trim(),
      instagramUrl: draft.instagramUrl.trim() === "" ? null : draft.instagramUrl.trim(),
      // `undefined` 는 `invalidReason` 이 이미 막았다.
      fileId: draft.fileId ?? null,
      generationNo,
    };
    save.mutate({ id: draft.id, payload }, { onSuccess: onClose });
  }

  return (
    <div className={styles.form}>
      <div className={styles.formGrid}>
        <Input label="이름 *" value={draft.name} onChange={(name) => set({ name })} />
        <Input label="직책 *" value={draft.staffRole} onChange={(staffRole) => set({ staffRole })} />
        <Select
          label="구역 *"
          value={draft.section}
          options={SECTIONS}
          onChange={(section: StaffSection) => set({ section })}
        />
        <Input label="학과 · 학번 *" value={draft.department} onChange={(department) => set({ department })} />
        <Input
          label="GitHub 링크"
          placeholder="https://github.com/..."
          value={draft.githubUrl}
          onChange={(githubUrl) => set({ githubUrl })}
        />
        <Input
          label="Instagram 링크"
          placeholder="https://instagram.com/..."
          value={draft.instagramUrl}
          onChange={(instagramUrl) => set({ instagramUrl })}
        />
      </div>
      <StaffPhotoField currentUrl={draft.photoUrl} onFileIdChange={(fileId) => set({ fileId })} />

      <TextArea
        label="한줄 소개"
        rows={2}
        value={draft.introduction}
        onChange={(introduction) => set({ introduction })}
      />

      <div className={styles.formFooter}>
        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && (
          <p role="status" className={styles.reason}>
            {reason}
          </p>
        )}
        {save.error !== null && (
          <p role="alert" className={styles.reason}>
            {siteSaveErrorMessage(save.error)}
          </p>
        )}
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          취소
        </Button>
        <Button disabled={reason !== null || save.isPending} onClick={handleSave}>
          {draft.id === null ? "추가" : "저장"}
        </Button>
      </div>
    </div>
  );
}

/**
 * 운영진 프로필. 와이어프레임 p15. 명세서 10.21 · 10.22.
 *
 * **10.20 일괄 저장에 들어가지 않는다.** 여기서 누르면 그때 서버에 반영된다.
 */
export function StaffsSection({ generationNo }: { generationNo: number }) {
  const { data, isPending, isError, error, refetch } = useStaffs();
  const [editing, setEditing] = useState<Draft | null>(null);
  const remove = useDeleteStaff();
  const reorder = useReorderStaffs();

  /**
   * 화면 순서는 `order` 를 따른다. 배열 순서를 그대로 쓰면 순서를 낙관적으로 바꿔도
   * (`useReorderStaffs`) 화면이 그대로라 눌러도 아무 일이 없어 보인다.
   */
  const inSectionOf = (section: StaffSection) =>
    (data ?? []).filter((s) => s.section === section).sort((a, b) => a.order - b.order);

  function move(section: StaffSection, staffId: number, by: -1 | 1) {
    const inSection = inSectionOf(section);
    const at = inSection.findIndex((s) => s.id === staffId);
    const to = at + by;
    if (at === -1 || to < 0 || to >= inSection.length) return;

    const ids = inSection.map((s) => s.id);
    [ids[at], ids[to]] = [ids[to], ids[at]];
    reorder.mutate({ section, orderedIds: ids });
  }

  function handleDelete(staff: Staff) {
    // 되돌릴 수 없고 공개 사이트에서 바로 사라진다.
    if (!window.confirm(`${staff.name} 운영진을 삭제할까요? 공개 사이트에서도 사라집니다.`)) return;
    remove.mutate(staff.id);
  }

  return (
    <section id="staffs" className={styles.section}>
      <h2 className={styles.sectionTitle}>운영진</h2>

      {isPending && <TextSkeleton lines={4} label="운영진 불러오는 중" />}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data &&
        SECTIONS.map(({ value, label }) => {
          const inSection = inSectionOf(value);

          return (
            <div key={value} className={styles.group}>
              <h3 className={styles.groupTitle}>{label}</h3>

              {inSection.length === 0 ? (
                <p className={styles.hint}>등록된 운영진이 없습니다.</p>
              ) : (
                <ul className={styles.staffs}>
                  {inSection.map((staff, at) => (
                    <li key={staff.id} className={styles.staff}>
                      <div className={styles.identity}>
                        {/* 올린 사진이 목록에 바로 반영되는지 여기서 확인한다. */}
                        {staff.profileImageUrl !== null && (
                          <img src={staff.profileImageUrl} alt="" className={styles.thumb} />
                        )}
                        <div className={styles.info}>
                          <strong>{staff.name}</strong>
                          <span>{staff.staffRole}</span>
                          <span className={styles.muted}>{staff.department}</span>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          aria-label={`${staff.name} 위로`}
                          disabled={at === 0 || reorder.isPending}
                          onClick={() => move(value, staff.id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`${staff.name} 아래로`}
                          disabled={at === inSection.length - 1 || reorder.isPending}
                          onClick={() => move(value, staff.id, 1)}
                        >
                          ↓
                        </button>
                        <button type="button" onClick={() => setEditing(toDraft(staff))}>
                          수정
                        </button>
                        <button type="button" className={styles.danger} onClick={() => handleDelete(staff)}>
                          삭제
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button type="button" className={styles.add} onClick={() => setEditing(emptyDraft(value))}>
                + {label} 운영진 추가
              </button>
            </div>
          );
        })}

      {reorder.error !== null && (
        <p role="alert" className={styles.reason}>
          {siteSaveErrorMessage(reorder.error)}
        </p>
      )}
      {remove.error !== null && (
        <p role="alert" className={styles.reason}>
          {siteSaveErrorMessage(remove.error)}
        </p>
      )}

      {/* 고치는 대상이 바뀌면 폼을 새로 만든다. 그래야 `useState` 초기값이 다시 잡힌다. */}
      {editing !== null && (
        <StaffForm
          key={editing.id ?? `new-${editing.section}`}
          draft={editing}
          generationNo={generationNo}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

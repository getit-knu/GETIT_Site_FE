import { useId, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../components/ui/Button/Button";
import { Input } from "../components/ui/Input/Input";
import { meSaveErrorMessage } from "../errors/auth/errorMessages";
import { useSession, useUpdateMe } from "../hooks/auth/useSession";
import type { Me, MeUpdatePayload } from "../types/auth";

import { ProfileImageField } from "./ProfileImageField";
import styles from "./MyPage.module.scss";

/** 프로필 이미지가 없을 때 쓸 이니셜. `Topbar`의 것과 같은 규칙(한글 이름은 성을 뺀 첫 글자). */
function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

/** 값이 있는 것만 이어 붙인다. 아무것도 없으면 `null`. */
function joined(...parts: (string | null)[]): string | null {
  const filled = parts.filter((part): part is string => part !== null && part.trim() !== "");
  return filled.length === 0 ? null : filled.join(" ");
}

/**
 * 소속(단과대 · 학과).
 *
 * **단과대를 그동안 화면에서 버리고 있었다** — `Me.college` 를 받아 놓고 학과만 그렸다.
 * 어드민 사용자 표는 둘을 함께 보여주고 있어 같은 사람의 소속이 화면마다 달라 보였다.
 *
 * 한쪽만 채워질 수 있어(승격 경로에 따라 다르다) 있는 것만 이어 붙인다. 둘 다 비는
 * 경우가 지금은 흔한데, 그건 지원서의 단과대·학과가 승격 때 넘어오지 않아서다
 * (`getit-knu/GETIT_Site_BE#184` — College · Major 마스터 데이터가 아직 없다).
 */
function affiliationOf(user: Me): string {
  return joined(user.college, user.major) ?? "-";
}

interface Draft {
  name: string;
  phoneNumber: string;
  profileFileId: number | null;
  profileImageUrl: string | null;
}

function toDraft(user: Me): Draft {
  return {
    name: user.name,
    phoneNumber: user.phoneNumber ?? "",
    profileFileId: null,
    profileImageUrl: user.profileImageUrl,
  };
}

function invalidReason(draft: Draft): string | null {
  if (draft.name.trim() === "") return "이름을 입력해 주세요.";
  if (draft.name.trim().length > 50) return "이름은 50자 이내로 입력해 주세요.";
  if (draft.phoneNumber.trim().length > 20) return "전화번호는 20자 이내로 입력해 주세요.";
  return null;
}

interface EditFormProps {
  user: Me;
  onClose: () => void;
}

/** 이름 · 전화번호 · 프로필 사진만 고칠 수 있다(#147) — 학과·학번·기수·권한은 자기 수정 대상이 아니다. */
function EditForm({ user, onClose }: EditFormProps) {
  const [draft, setDraft] = useState(toDraft(user));
  const save = useUpdateMe();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    const payload: MeUpdatePayload = {
      name: draft.name.trim(),
      phoneNumber: draft.phoneNumber.trim() === "" ? null : draft.phoneNumber.trim(),
      profileFileId: draft.profileFileId,
    };
    save.mutate(payload, { onSuccess: onClose });
  }

  return (
    <div className={styles.profileCard}>
      <ProfileImageField
        name={draft.name}
        currentUrl={draft.profileImageUrl}
        onFileIdChange={(profileFileId) => set({ profileFileId })}
      />

      <div className={styles.editGrid}>
        <Input label="이름 *" value={draft.name} onChange={(name) => set({ name })} />
        <Input label="전화번호" value={draft.phoneNumber} onChange={(phoneNumber) => set({ phoneNumber })} />
      </div>

      <div className={styles.formFooter}>
        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {save.error !== null && <p className={styles.reason}>{meSaveErrorMessage(save.error)}</p>}
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          취소
        </Button>
        <Button disabled={reason !== null || save.isPending} onClick={handleSave}>
          저장
        </Button>
      </div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  /** 값 앞에 붙는 장식 아이콘. `aria-hidden` 이라 접근성 트리에는 들어가지 않는다. */
  icon: ReactNode;
  value: string;
}

/**
 * 정보 한 칸(레이블 + 값).
 *
 * 레이블과 값이 그저 위아래로 놓여 있으면 접근성 트리에서 둘이 이어지지 않아, 스크린리더로는
 * "소속" 과 "-" 가 따로 떨어져 읽힌다. 정의 목록으로 묶고 값에 `aria-labelledby` 로 레이블을
 * 걸어 "소속: -" 로 이어지게 한다. 덕분에 테스트도 DOM 구조를 타고 오르지 않고
 * `getByLabelText("소속")` 으로 **그 항목** 을 곧장 특정할 수 있다.
 */
function InfoItem({ label, icon, value }: InfoItemProps) {
  const labelId = useId();

  return (
    <div>
      <dt className={styles.label} id={labelId}>
        {label}
      </dt>
      <dd className={styles.infoValue} aria-labelledby={labelId}>
        {icon}
        <span>{value}</span>
      </dd>
    </div>
  );
}

/** 내 정보. GUEST · MEMBER · ADMIN 전 role 공통(#240) — 학습 통계 등은 #239로 분리됨. */
export default function MyPage() {
  const { user } = useSession();
  const [editing, setEditing] = useState(false);

  // RequireRole 이 이 라우트까지 오는 걸 이미 보장해서, 여기 도달했으면 로그인 상태다.
  if (!user) return null;

  const subtitle = joined(user.major, user.studentYear === null ? null : `${user.studentYear}학번`);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>내 정보</h1>

        {editing ? (
          <EditForm user={user} onClose={() => setEditing(false)} />
        ) : (
          <div className={styles.profileCard}>
            <div className={styles.identity}>
              {user.profileImageUrl ? (
                <img className={styles.avatar} src={user.profileImageUrl} alt="" />
              ) : (
                <span className={styles.avatar} aria-hidden="true">
                  {initialOf(user.name)}
                </span>
              )}
              <div>
                <h2 className={styles.name}>{user.name}</h2>
                {/* 학과가 비었다고 학번까지 감추지 않는다. 있는 것만 보여준다. */}
                {subtitle !== null && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
            </div>

            <dl className={styles.infoGrid}>
              <InfoItem
                label="이메일"
                icon={
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                    <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path
                      d="M3 5.5l7 5.25 7-5.25"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                value={user.email}
              />
              <InfoItem
                label="전화번호"
                icon={
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                    <path
                      d="M4.5 3.5h2.75L8.5 7l-1.75 1.25a8 8 0 0 0 5 5L13 11.75l3.5 1.25v2.75c0 .83-.67 1.5-1.5 1.5C8.6 17.25 2.75 11.4 2.75 5c0-.83.67-1.5 1.5-1.5Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                value={user.phoneNumber ?? "-"}
              />
              <InfoItem
                label="소속"
                icon={
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                    <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.3" />
                    <path
                      d="M4 16.5c0-3.038 2.686-5.5 6-5.5s6 2.462 6 5.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                }
                value={affiliationOf(user)}
              />
            </dl>

            <div className={styles.formFooter}>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                수정
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

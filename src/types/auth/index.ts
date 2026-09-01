/**
 * 인증 도메인 타입.
 *
 * BE 에 어드민 OpenAPI 스키마가 갖춰지면 `apis/generated.ts` 에서 가져와 재노출한다.
 * 지금은 `GETIT 백엔드 설계 명세서` 1.3 · 1.5 를 보고 손으로 옮겼다.
 */

/** BE `Role` enum 과 값이 같아야 한다. */
export const ROLES = ["GUEST", "MEMBER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

/** BE `UserStatus` enum. */
export type UserStatus = "ACTIVE" | "WITHDRAWN";

/**
 * `GET /api/auth/me` 응답. 명세서 1.5 의 필드 순서를 그대로 따랐다.
 *
 * `privacyConsentedAt`은 아직 BE에 없다(`getit-knu/GETIT_Site_BE#203`에서 추가 예정) — 그때까지는
 * 응답 자체에 이 키가 없어 런타임엔 `undefined`로 온다. **그래서 옵셔널로 둔다** — `string | null`로
 * 두면 "필드가 없다"와 "동의 안 했다(`null`)"를 구분 못 해, `OnboardingPage`가 신규 유저를
 * "이미 동의했다"고 잘못 판단할 수 있다(`undefined !== null`이 `true`라 `!== null` 검사로는
 * 안 걸러진다). 호출부는 반드시 `!me.privacyConsentedAt`(참-거짓)로 봐야 한다.
 */
export interface Me {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  college: string | null;
  major: string | null;
  studentYear: number | null;
  studentNumber: string | null;
  profileImageUrl: string | null;
  role: Role;
  generationNo: number | null;
  status: UserStatus;
  /** 개인정보 수집·이용에 동의한 시각. 아직 동의 안 했으면 `null`, BE가 아직 필드 자체를 안 주면 `undefined`. */
  privacyConsentedAt?: string | null;
}

/**
 * `POST /api/auth/refresh` 응답. 명세서 1.3.
 *
 * Refresh Token 은 본문에 없다. HttpOnly 쿠키로만 오간다.
 */
export interface TokenResponse {
  accessToken: string;
  /** 만료까지 남은 초. */
  accessTokenExpiresIn: number;
}

/**
 * `PUT /api/auth/me` 요청 본문. 편집 가능 필드는 이름·전화번호·프로필 사진·소속(#199) —
 * 학번·기수·권한·상태는 여전히 자기 수정 대상이 아니다(BE 확인함).
 *
 * `profileFileId`를 생략하면(`null`) 기존 사진을 그대로 둔다 — "지운다"는 뜻이 아니다.
 * Google 동기화 사진을 실수로 지우지 않으려는 설계(BE 주석 확인함).
 *
 * `collegeId`/`majorId`는 지원서 폼과 같은 College/Major 마스터 데이터의 id다(자유 텍스트
 * 아님) — 어드민 수정(9.2)과 달리 본인 수정은 오타·표기 불일치를 막으려 id로만 받는다.
 * 둘 다 없으면 소속을 건드리지 않는다. 하나만 보내면 BE가 `AFFILIATION_INCOMPLETE`로 막는다.
 */
export interface MeUpdatePayload {
  name: string;
  phoneNumber: string | null;
  profileFileId: number | null;
  collegeId?: number;
  majorId?: number;
}

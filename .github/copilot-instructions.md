# GETIT 프론트엔드 — Copilot 지침

경북대 금융IT 동아리 **GETIT** 통합 사이트의 프론트엔드입니다. 이 문서는 `GETIT_Site_FE`
레포지토리 전체에 적용됩니다.

응답·주석·커밋 메시지·테스트 이름·화면 문구는 **한국어**로 작성합니다. 코드 식별자는 영어입니다.

---

## 기술 스택

|               |                                           |
| ------------- | ----------------------------------------- |
| 언어          | TypeScript                                |
| 프레임워크    | React 19 + Vite                           |
| 라우팅        | React Router (`react-router` 에서 import) |
| 서버 상태     | TanStack Query                            |
| HTTP          | axios                                     |
| 스타일        | **CSS Modules (SCSS)** + `clsx`           |
| 테스트        | Vitest + React Testing Library            |
| 패키지 매니저 | **pnpm** (corepack 고정)                  |

Tailwind 를 쓰지 않습니다. styled-components 도 쓰지 않습니다.

```bash
pnpm dev          # 개발 서버 (5173)
pnpm lint         # ESLint --max-warnings=0
pnpm type-check   # tsc -b
pnpm format:check # Prettier
pnpm build
pnpm test         # Vitest
```

**CI 는 lint · type-check · format:check · build 넷뿐입니다.** 테스트 job 은 팀 결정으로
넣지 않았습니다. 테스트는 작성하되 로컬에서만 도니 **push 전에 직접 돌려야 합니다.**

---

## 디렉터리 구조

도메인(`application` `auth` `dashboard` `file` `group` `lecture` `qna` `recruitment`
`site` `user`)별로 층을 나눕니다.

```
src/
├── apis/{domain}/       서버 호출. BE 미구현 구간은 mocks/ 를 부른다
├── mocks/{domain}/      BE 가 아직 없는 영역의 목 데이터
├── hooks/{domain}/      TanStack Query 훅
├── hooks/ui/            useModalParams · useTableParams · useNumericParams
├── types/{domain}/      API 명세서를 옮긴 타입
├── errors/{domain}/     ErrorCode → 화면 문구
├── components/ui/       공통 UI (Button · Input · TextArea · Badge · Card · Modal …)
├── components/layout/   PublicLayout · Nav · Footer
├── components/{domain}/ 도메인 컴포넌트
├── pages/               공개·부원 화면
├── pages/admin/         어드민 화면
├── libs/                순수 유틸 (accessToken · formatDate · urlParams · downloadFile)
├── styles/abstracts/    _variables.scss · _container.scss · _form-field.scss
└── routes.tsx
```

**`components/ui/` 는 컴포넌트 하나당 폴더 하나**입니다.

```
components/ui/Modal/
├── Modal.tsx
├── Modal.module.scss
└── Modal.test.tsx
```

도메인 컴포넌트(`components/{domain}/`)는 폴더 없이 평평하게 둡니다.

명명 규칙: 컴포넌트 `PascalCase`, 훅 `useCamelCase`, 그 외 파일 `camelCase`.
export 는 **named export** 를 씁니다. 단, 라우트가 lazy 로 부르는 페이지는 default export 입니다.

---

## BE 가 아직 없습니다

어드민 도메인 대부분이 목 위에서 돕니다. `apis/*` 는 `mock.*` 를 부르고, 연동 이슈에서
`client.*` 로만 바꾸면 되도록 형태를 맞춥니다.

```ts
/** `GET /api/admin/lectures/{id}/submissions?...` */
export const getSubmissions = (params: SubmissionListParams): Promise<SubmissionBoard> =>
  submissionMock.fetchSubmissions(params);
```

**목이라도 거짓말을 하면 안 됩니다.** 브라우저로 보는 화면이 이 위에서 돕니다.

- **시각에는 오프셋을 붙입니다** (`+09:00`). 빼면 브라우저가 실행 환경 시간대로 읽어
  한국 밖에서 다른 시각이 보이고, 지각 여부 같은 판정까지 달라집니다.
- **저장소를 하나로 둡니다.** 같은 것을 두 목이 따로 들고 있으면 한쪽에서 만든 것이
  다른 쪽에서 안 보입니다(실제로 새 강의가 제출 현황에서 `LECTURE_NOT_FOUND` 가 됐습니다).
- 명세의 규칙(집계 기준·LEFT JOIN 의미·기수 필터 등)을 담고 있으면 **목에도 테스트를 붙입니다.**

---

## 명세서가 단일 기준입니다

`DOCS/API_명세서.pdf` 를 따릅니다. 타입·엔드포인트·**에러 코드를 FE 가 지어내지 않습니다.**
파일 주석에 절 번호를 남깁니다 (`명세서 8.6`).

```bash
pdftotext -layout DOCS/API_명세서.pdf /tmp/api.txt   # 읽을 때
```

- **응답에 있는데 항상 `null` 인 필드는 BE 에 아직 소스가 없다는 뜻입니다.** 그 값으로
  기능을 만들기 전에 확인하십시오.
- **와이어프레임에 있는데 명세서에 없는 항목**은 그냥 넘기지 마십시오. BE 만 봐서는
  보이지 않는 결함이고 실제로 이 경로로 여러 건이 잡혔습니다.

### 응답 envelope

```ts
// src/apis/client.ts — 인터셉터가 벗겨서 data 만 넘긴다
interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null; // { code, message }
}
```

- **분기는 `error.code` 로 합니다.**
- 서버 상태는 **TanStack Query** 로 다룹니다. `useEffect` + `useState` 로 직접 fetch 하지 마십시오.
- 컴포넌트에서 `axios` 를 직접 부르지 않습니다. `apis/{domain}/` 을 거칩니다.
- 인증 토큰은 메모리(`libs/accessToken.ts`) + HttpOnly 쿠키입니다. **`localStorage` 에 두지 마십시오.**

---

## 지켜야 할 패턴

### 쿼리 키

`src/apis/queryKeys.ts` 에서만 만듭니다. `all` 을 앞에 깔고 확장해야 부모 무효화가
자식까지 닿습니다. 파일 상단 주석에 규약이 있습니다.

### 에러 문구

`errors/{domain}/errorMessages.ts` 에서 **BE `ErrorCode` → 화면 문구**로 옮깁니다.
순서는 이렇습니다.

1. 표에 있으면 우리 문구 (서버 문구가 개발자용일 수 있습니다)
2. 없으면 `error.message` — BE 가 코드를 추가해도 화면이 같은 말만 되뇌지 않게
3. 그마저 없으면 대체 문구

**대체 문구는 화면마다 갈라야 합니다.** 저장에 실패했는데 "목록을 불러오지 못했습니다"
가 뜨면 무엇이 안 됐는지 알 수 없습니다. 조회·저장·도메인별로 나눕니다.

### URL 을 상태로

모달과 표 상태는 주소에 둡니다 — 새로고침·뒤로가기·링크 공유가 살아납니다.
`useModalParams` · `useTableParams` · `useNumericParams`.

> ⚠️ **두 훅의 setter 를 한 이벤트 핸들러에서 같이 부르면 뒤엣것이 앞엣것을 덮습니다.**
> 두 훅의 주석에 이유와 우회법이 있습니다. 반드시 읽고 쓰십시오.

### 저장을 막는 이유를 미리 보여줍니다

서버가 막는 조건은 화면에서도 미리 거릅니다. 버튼을 비활성으로 두되 **왜 막혔는지
문구로 함께 띄웁니다.** 눌러 보고 알게 하지 않습니다.

### 낙관적 반영에는 롤백을 함께

응답을 기다렸다 바꾸면 눌러도 한참 아무 일이 없어 사용자가 다시 누릅니다. 반대로
실패했는데 바뀐 채로 두면 저장된 줄 알고 화면을 떠납니다. `onMutate` 로 먼저 바꾸고
`onError` 에서 되돌립니다.

### 폼은 조회한 뒤에 마운트

`useState` 초기값으로 기존 값을 넣습니다. `useEffect` 로 채우지 않습니다.
**대상이 바뀔 수 있으면 `key` 를 줍니다** — 캐시에 이미 있는 대상으로 옮기면 데이터가
곧바로 채워져 폼이 언마운트되지 않고, 앞 대상에서 고치던 값이 남습니다.

### 저장 결과는 값이 바뀌면 지웁니다

저장한 뒤 한 글자만 고쳐도 "저장했습니다." 가 남아 있으면, 아직 보내지 않은 값을
저장된 것으로 읽게 됩니다. 입력이 바뀌면 `mutation.reset()` 합니다.

---

## 공통 컴포넌트 — 네이티브 props 를 막지 마십시오

**이 레포에서 자주 발생한 문제입니다.** 공통 컴포넌트가 필요한 속성을 안 받아서
첫 소비자가 쓰지 못하는 일이 반복됐습니다.

```tsx
// ❌ maxLength · onBlur · name · ref 를 못 쓴다
interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

// ✅ 네이티브 속성을 통째로 열어둔다
type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "onChange"> & {
  label?: string;
  error?: string;
  onChange: (value: string) => void;
};
```

`onChange` 가 값을 직접 주는 시그니처는 유지해도 됩니다. **나머지를 막지만 않으면 됩니다.**
React 19 라 `forwardRef` 없이 `ref` 가 prop 으로 들어옵니다.

버튼은 `type` 을 열어두십시오. 하드코딩하면 폼 submit 을 못 합니다
(기본값을 `"button"` 으로 두는 것은 맞습니다).

`Input` 의 `type` union 처럼 **여러 브랜치가 같은 줄을 늘리는 곳은 머지 충돌이 잦습니다.**
나란히 두면 되는 충돌이니 당황하지 마십시오.

---

## 접근성 — 선언한 role 의 계약을 지킵니다

**`role` 을 직접 지정하면 그 role 의 키보드 동작을 반드시 함께 구현합니다.**

```tsx
// ❌ 포커스는 가는데 Enter/Space 가 안 먹는다. 접근성이 없는 것보다 나쁘다
<div role="button" tabIndex={0} onClick={onClick}>

// ✅
<div role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
```

Space 는 `preventDefault()` 로 페이지 스크롤을 막습니다.

### 입력 컴포넌트

`useId` 로 label 을 연결하고, **에러도 필드에 연결합니다.**

```tsx
<input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />;
{
  error && (
    <p id={errorId} role="alert">
      {error}
    </p>
  );
}
```

`role="alert"` 만으로는 에러가 나타나는 순간 한 번 읽힐 뿐, 필드에 포커스했을 때는 안 읽힙니다.

### 모달

`Modal` 이 `role="dialog"` · `aria-modal` · `aria-labelledby` · 포커스 트랩 ·
포커스 복귀 · 오버레이 클릭 처리를 이미 갖고 있습니다. **직접 만들지 말고 쓰십시오.**

**헤더를 직접 그리는 경우**(순차 탐색 모달처럼 헤더에 다른 것이 더 들어갈 때)에는
`useModalTitleId()` 로 제목 id 를 받아 `<h2 id={titleId}>` 에 붙여야 `aria-labelledby`
가 이어집니다. 이 훅은 **`Modal` 안쪽에서 호출해야** 값이 옵니다.

### 시각적 어포던스와 실제 동작을 일치시킵니다

배경색·그림자·둥근 모서리로 **버튼처럼 보이게 만들었으면 눌려야 합니다.**
아직 이동할 화면이 없어 비활성이라면 상태를 드러내십시오.

```tsx
<span className={styles.cta} aria-disabled="true" title="준비 중입니다">
  지원하기
</span>
```

---

## 스타일 — 색은 토큰에서만

`src/styles/abstracts/_variables.scss` 에 전역 토큰이 있습니다
(`$color-text-primary` · `$color-accent` · `$color-border` · `$color-danger` ·
`$color-surface` · `$color-heading` 등). **디자인 토큰은 협업자 소유입니다** — 확정본을 따릅니다.

**`.module.scss` 에 hex 리터럴을 쓰지 마십시오.** "팔레트 정렬 대상이 아니다" 와
"토큰이 아니다" 는 다릅니다. 예외값도 토큰 파일에 별도 섹션으로 정의합니다.

어드민 영역은 예외적으로 `AdminLayout.module.scss` 의 `--admin-*` CSS 변수를 씁니다.
어드민 화면에서는 hex 대신 이 변수를 쓰십시오.

### 대비 기준

**다크 배경 위에서 `$color-text-secondary` 를 쓰지 마십시오.** 밝은 배경 전제라
어두운 배경에서 WCAG AA(4.5:1)에 미달합니다 (`#6a7282` on `#101828` = 3.67:1, 실측).
본문 텍스트는 4.5:1 이상을 확보하고, 다크 배경에는 `#9ca3af` 이상을 쓰십시오.

### 그 외

- 조건부 클래스는 `clsx()` 로 결합합니다.
- 반투명 sticky 헤더에는 `backdrop-filter: blur()` 를 같이 겁니다.
- 전체 높이는 `min-height: 100vh;` 다음 줄에 `min-height: 100dvh;` (모바일 주소창).
- 폼 필드의 반복 블록은 `_form-field.scss` 의 placeholder 를 씁니다.
- 라이트 테마만 지원합니다. `color-scheme: light` 는 `src/index.css` 에 한 번만 선언돼 있습니다.
- `@use` 를 씁니다. `@import` 는 쓰지 않습니다.

---

## 라우팅

```tsx
{
  // 공개 화면은 반드시 이 children 안에 넣는다. 밖에 두면 Nav/Footer 없이 렌더된다.
  lazy: layout(() => import("./components/layout/PublicLayout"), "PublicLayout"),
  children: [{ path: "/", lazy: page(() => import("./pages/HomePage")) }],
},
{ path: "/oauth/callback", lazy: page(() => import("./pages/OAuthCallbackPage")) },
```

레이아웃이 필요 없는 화면(콜백·403)만 pathless layout route 밖에 둡니다.
**레이아웃도 지연 로딩합니다** — 정적 import 하면 로그인도 안 한 방문자가 어드민
사이드바 구성을 통째로 내려받습니다.

권한 검사는 각 영역의 부모 라우트에서 `RequireRole` 로 **한 번만** 합니다.

---

## 테스트

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
```

- vitest globals 를 쓰지 않습니다. `it` · `expect` · `vi` 를 명시적으로 import 합니다.
- 테스트 이름은 **동작을 한국어 문장으로** 씁니다 (`"필터를 바꾸면 첫 페이지로 되돌린다"`).
- 쿼리는 **role 우선** 입니다. `parentElement` 같은 DOM 구조 탐색은 쓰지 마십시오 —
  래퍼 한 겹만 추가돼도 조용히 틀립니다.
- **"아직 구현하지 않았음" 을 테스트로 고정하면 좋습니다.** 나중에 바꿀 때 깨지면서
  "여기도 고쳐라" 를 알려줍니다.

### 뮤테이션으로 확인합니다

작성한 뒤 **검증하려는 코드를 일부러 깨뜨려 테스트가 실제로 깨지는지** 봅니다.
안 깨지면 그 테스트는 아무것도 지키지 않는 것입니다. 이 레포에서 실제로 걸렸던 가짜 통과들:

- 목록에 행이 하나뿐이라 "그 행만 삭제" 와 "전부 삭제" 가 같은 결과
- 첫/마지막 행을 지워 "앞에서 자르기"·"뒤에서 자르기" 와 구분되지 않음
  → **가운데 행을 지워야** 가려낼 수 있습니다
- 롤백 테스트인데 실패 후 재조회가 값을 되돌려 줘서 **롤백을 지워도 통과**
  → 재조회도 실패시켜야 롤백만이 상태를 되돌립니다
- `alert` 존재만 보고 문구를 확인하지 않아 **엉뚱한 도메인의 에러 함수로도 통과**
- 두 응답의 집계를 서로 비교만 해서 **둘 다 똑같이 틀려도 통과**

`TZ=UTC pnpm test` 로도 돌려 보십시오. 시간대에 기대는 테스트가 CI 에서만 깨집니다.

---

## 자주 걸리는 것

| 규칙                                   | 내용                                                              |
| -------------------------------------- | ----------------------------------------------------------------- |
| `max-lines: 300`                       | 넘으면 컴포넌트를 쪼갭니다 (컨벤션 3절 "객체당 300줄")            |
| `react-refresh/only-export-components` | 컴포넌트 파일에서 훅·상수를 내보내면 막힙니다. 별도 파일로 뺍니다 |
| `react-hooks/purity`                   | 렌더 중 `Date.now()` 금지 → `useState(() => Date.now())`          |
| `react-hooks/refs`                     | 렌더 중 ref 접근 금지 → 콜백 안으로                               |
| `import-x/order`                       | 그룹 사이 빈 줄 필수. `eslint --fix` 가 고쳐 줍니다               |

**`Date` 파싱을 믿지 마십시오.** V8 은 `new Date("아무거나:00Z")` 를 2000-01-01 로 읽습니다.
형식을 정규식으로 먼저 검사하십시오.

---

## 로컬에서 어드민 화면 보기

`/admin/*` 은 `RequireRole` 이 `GET /api/auth/me` 로 ADMIN 을 확인합니다. **BE 가 없으면
홈으로 튕겨 볼 수 없습니다.** `src/hooks/auth/useSession.ts` 의 `return` 을 잠시
고정값으로 바꾸고 확인한 뒤 **반드시 되돌립니다.**

```ts
return { user: { id: 1, name: "미리보기", role: "ADMIN" } as never, isLoading: false, isAuthenticated: true };
```

커밋 전에 `git diff src/hooks/auth/useSession.ts` 가 비어 있는지 보십시오.
이 스텁이 들어가면 인증이 통째로 무력화됩니다.

---

## 주석

**무엇을 하는지가 아니라 왜 그렇게 했는지**를 씁니다. 직관에 어긋나는 선택, 안 하면
생기는 문제, 명세의 근거를 남깁니다.

```ts
// 소분류는 트랙에 딸려 있다. 트랙을 바꾸면 남아 있던 소분류가 다른 트랙 것이 돼
// 결과가 늘 비어 버린다. 함께 지운다.
```

---

## 컨벤션

브랜치·커밋·PR 규칙은 [README](../README.md) 에 있습니다. 요약하면:

|                |                                                                |
| -------------- | -------------------------------------------------------------- |
| 브랜치         | `{type}/{이슈번호}-{작업내용}` — **`#` 를 붙이지 않습니다**    |
| 커밋 · PR 제목 | `feat: ...` · `fix: ...` · `refactor: ...` · `chore: ...`      |
| PR 전          | `pnpm lint` · `type-check` · `format:check` · `build` · `test` |

**PR 을 스택으로 쌓지 않습니다.** 이슈마다 `develop` 에서 직접 브랜치를 땁니다.
아직 머지되지 않은 다른 브랜치의 파일이 필요하면 그 파일을 **바이트 단위로 같게**
복사해 둡니다 — 내용이 같으면 git 이 머지할 때 자동 해소하고, 먼저 머지된 쪽이
develop 에 올라가면 리베이스만으로 중복이 사라집니다.

리베이스 시 `src/apis/queryKeys.ts` 와 `src/types/{domain}/index.ts` 는 거의 항상
충돌합니다. **대부분 "양쪽 순수 추가" 라 둘 다 살리면 됩니다** — 한쪽을 고르지 마십시오.

---

## 코드 리뷰 체크리스트

**전부 실제로 발생한 문제입니다.**

- [ ] 공통 컴포넌트가 **네이티브 props · ref** 를 막고 있지 않은가
- [ ] `role` 을 선언했는데 **키보드 핸들러가 빠지지** 않았는가
- [ ] 버튼처럼 **보이는데 눌리지 않는** 요소가 없는가
- [ ] 입력 에러가 `aria-invalid` · `aria-describedby` 로 **필드에 연결**됐는가
- [ ] 헤더를 직접 그린 모달의 제목이 **`aria-labelledby` 에 연결**됐는가
- [ ] `.module.scss` 에 **hex 리터럴**이 들어가지 않았는가
- [ ] 다크 배경 위 텍스트의 **대비가 4.5:1** 이상인가
- [ ] 서버 상태를 `useEffect` + `useState` 로 직접 다루지 않았는가
- [ ] 에러 분기를 `error.message` 가 아니라 **`error.code`** 로 하는가
- [ ] 대체 문구가 **그 화면의 것**인가 (조회 실패에 저장 문구를 쓰지 않았는가)
- [ ] 항상 `null` 인 응답 필드에 **기능을 얹지** 않았는가
- [ ] 낙관적으로 반영했으면 **실패 시 되돌리는가**
- [ ] 목의 시각에 **오프셋**이 붙어 있는가
- [ ] 같은 데이터를 **두 목이 따로** 들고 있지 않은가
- [ ] 테스트가 `parentElement` 같은 **DOM 구조에 결합**되지 않았는가
- [ ] 테스트가 **뮤테이션으로 검증**됐는가 (지워도 통과하는 테스트가 아닌가)
- [ ] `useSession` **미리보기 스텁**이 남아 있지 않은가

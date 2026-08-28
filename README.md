# GETIT_Site_FE

> GETIT 프론트엔드 프로젝트

## 기술 스택

- **Frontend**: React, TypeScript, Vite, pnpm
- **Hosting**: Cloudflare Pages
- **CI/CD**: GitHub Actions
- **Backend**: Spring Boot (Azure VM) + Nginx reverse proxy (연동 예정)

## 코딩 컨벤션

이 README는 자주 참조하는 항목의 요약입니다. 훅 선언 순서, Props 규칙, 컴포넌트 책임 분리 등 세부 규칙과 그 이유는 아래 문서를 참고하세요.

- [Coding Convention-FE](https://app.notion.com/p/3b5694c484f780689bebc7b501057385) — FE 전체 컨벤션
- [Coding Convention-Common](https://app.notion.com/p/3ba694c484f781f39024c44469c56229) — FE/BE 공통 규칙

## 시작하기

### 요구 사항

- Node.js LTS
- pnpm

### 설치 및 실행

```bash
pnpm install
pnpm dev
```

### 주요 스크립트

| 명령어              | 설명                             |
| ------------------- | -------------------------------- |
| `pnpm dev`          | 개발 서버 실행                   |
| `pnpm build`        | 타입 체크 + 프로덕션 빌드        |
| `pnpm type-check`   | 타입 검사만 실행                 |
| `pnpm lint`         | ESLint 검사 (경고 0개 기준)      |
| `pnpm format:check` | Prettier 포맷 검사               |
| `pnpm test`         | 컴포넌트/훅 테스트 실행          |
| `pnpm test:watch`   | 테스트를 변경 감지하며 반복 실행 |
| `pnpm test:e2e`     | Playwright E2E 테스트 실행       |
| `pnpm preview`      | 빌드 결과 미리보기               |

## 브랜치 전략

- `main`: 배포 브랜치 (직접 push 금지, **`develop`에서 시작한 PR로만 머지 가능** — 다른 브랜치가 실수로 `main`을 대상으로 열리면 CI에서 자동으로 막힘)
- `develop`: 기본/통합 브랜치 (직접 push 금지, PR을 통해서만 머지)
- 작업 브랜치: `{type}/{이슈번호}-{작업내용}` 형식으로 `develop`에서 분기

### 브랜치 타입

| 타입       | 설명                            |
| ---------- | ------------------------------- |
| `feat`     | 새로운 기능 추가                |
| `fix`      | 버그 수정                       |
| `refactor` | 코드 리팩토링 (기능 변경 없음)  |
| `chore`    | 빌드/설정 등 기능과 무관한 작업 |
| `docs`     | 문서 작성 및 수정               |

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `style:` SCSS/CSS 스타일링, 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- `refactor:` 코드 리팩토링 (기능 변경 없음)
- `design`: UI 디자인 요소 변경(피드백 반영 등)
- `chore:` 기타 영향을 크게 미치지 않는 자잘한 수정
- `test`: 테스트 코드 추가 또는 수정
- `docs`: 문서 수정(README 등)

## PR / 이슈 규칙

- 1 Issue - 1 Branch 원칙
- PR 본문에 `close #이슈번호` 작성 시 머지되면 이슈가 자동으로 닫힘
- `develop`은 PR을 통해서만 머지 가능 (direct push 차단, 서버에서 강제)
- PR/Issue 생성 시 `.github` 템플릿이 자동으로 채워짐
- PR 타이틀은 커밋 컨벤션과 동일한 형식(`type: 설명`)을 따름 — Squash & Merge 시 PR 타이틀이 그대로 커밋 메시지가 됨
- `develop` 머지 시 Approve는 팀 특성상 0명, Squash & Merge로 제한

## Git Hooks

Husky + lint-staged로 커밋/푸시 전 자동 검사합니다.

- `pre-commit`: 변경된 파일에 ESLint `--fix` + Prettier 실행
- `pre-push`: `pnpm type-check` 실행 (타입 에러가 있으면 push 차단)

`pnpm install` 시 `prepare` 스크립트로 자동 설치됩니다.

## 디렉토리 구조

타입 우선 구조를 사용합니다. `{domain}`은 기능별 도메인(예: `recruitment`, `auth`)을 뜻합니다.

```
src/
├── pages/         # 라우팅 및 페이지
├── assets/        # 정적 리소스
├── components/
│   ├── ui/        # domain 무관한 컴포넌트 (layout 포함)
│   └── {domain}/  # 해당 도메인에서만 사용하는 컴포넌트
├── contexts/      # 상태 관리 (Context API)
├── apis/
│   ├── client.ts     # axios 인스턴스, 인터셉터
│   ├── generated.ts  # OpenAPI 자동 생성 - 손으로 수정 금지
│   └── {domain}/     # 해당 도메인에서만 사용하는 api
├── hooks/
│   ├── ui/        # domain 무관한 hooks
│   └── {domain}/  # 해당 도메인에서만 사용하는 hooks
├── mocks/
│   ├── ui/        # domain 무관한 목업 데이터
│   └── {domain}/  # 해당 도메인에서만 사용하는 목업 데이터
├── styles/
│   ├── abstracts/ # 변수, 믹스인, 함수
│   ├── layout/    # 헤더, 푸터 등 레이아웃 구조
│   └── main.scss
├── libs/          # 공통 코드, 유틸리티 함수, 외부 라이브러리 파일 등
├── types/
│   ├── api/       # generated.ts 재노출 공통 타입
│   └── {domain}/  # 해당 도메인별 타입 재노출
└── errors/
    ├── ErrorBoundary.tsx
    └── {domain}/
```

## API 타입 생성

`src/apis/generated.ts`는 BE의 OpenAPI 스펙(`/v3/api-docs`)에서 [openapi-typescript](https://openapi-ts.dev/)로 생성합니다. **손으로 수정하지 않습니다** — 다시 생성하면 덮어써집니다.

```bash
pnpm generate:api http://localhost:8080/v3/api-docs
```

BE를 로컬에서 띄운 상태에서 위 명령을 실행하면 됩니다. 스펙 URL은 로컬/배포 환경마다 다르므로 명령 인자로 매번 넘깁니다(예: 배포된 BE 주소로 바꿔서 실행). `types/{domain}/index.ts`는 이 파일에서 필요한 타입만 재노출하는 용도로 씁니다(직접 새 타입을 정의하지 않음).

## 스타일링

- CSS Modules(SCSS)를 사용합니다. 컴포넌트와 같은 위치에 `ComponentName.module.scss`로 작성하고 `import styles from "./ComponentName.module.scss"`로 가져옵니다.
- 인라인 `style` 속성은 쓰지 않습니다 (동적으로 계산된 값이 꼭 필요한 경우만 예외).
- 조건부 클래스는 `clsx()`로 결합합니다 (문자열 템플릿 결합 금지).
- 전역 디자인 토큰(색상·spacing·breakpoint)은 `styles/`에 두고 `@use`로 가져옵니다 (`@import`는 deprecated).

## 테스트

- **컴포넌트/훅**: Vitest + React Testing Library + jest-dom
- **E2E**: Playwright — 로그인 등 핵심 플로우만 다룸 (`e2e/`), `npx playwright codegen`으로 초안을 뽑아 다듬는 방식을 권장
- 작성 규칙과 예시 코드는 [Coding Convention-FE](https://app.notion.com/p/3b5694c484f780689bebc7b501057385) 8절, E2E 시나리오는 별도 [E2E 시나리오](https://app.notion.com/p/3bd694c484f780c19e1dc565c2e8e909) 문서 참고
- 현재 CI에는 연동하지 않고 로컬에서 확인 후 PR 체크리스트에 표시하는 방식으로 운영

## 환경 변수

`.env.example`을 참고해 `.env.local`을 만듭니다.

| 변수                | 설명                                                        |
| ------------------- | ----------------------------------------------------------- |
| `VITE_API_BASE_URL` | 백엔드 API 서버 주소 (로컬 개발 시 `http://localhost:8080`) |

프로덕션 값은 로컬과 다르므로 코드/`.env` 파일에 넣지 않고 Cloudflare Pages 대시보드의 **Settings → Environment variables**에 등록합니다(아래 배포 섹션 참고). BE가 실제로 배포되어 주소가 확정되면 그 값을 `VITE_API_BASE_URL`로 등록합니다.

## 배포

- PR 생성 시 GitHub Actions에서 Lint / TypeCheck / Format / Build 4개 검증이 자동으로 실행되며, `develop` 브랜치 보호 규칙의 필수 상태 체크로 등록되어 있음
- Cloudflare Pages가 이 저장소와 **Git 연동**되어 있어, 별도 배포 워크플로우 없이 Cloudflare가 알아서 빌드·배포합니다.
  - **Production**: Cloudflare 대시보드에서 Production branch를 `main`으로 지정 — `main`에 push되면 자동으로 프로덕션에 배포됩니다.
  - **Preview**: 그 외 모든 브랜치/PR은 push할 때마다 자동으로 프리뷰 URL이 생성됩니다 — 리뷰 시 실제 동작을 바로 확인할 수 있습니다.

### Cloudflare Pages 대시보드 설정

Pages 프로젝트를 새로 만들 때(또는 기존 프로젝트의 Settings → Build & deployments에서) 아래 값을 입력합니다.

| 항목                   | 값                                                                     |
| ---------------------- | ---------------------------------------------------------------------- |
| Framework preset       | Vite                                                                   |
| Build command          | `pnpm build`                                                           |
| Build output directory | `dist`                                                                 |
| Root directory         | `/` (저장소 루트)                                                      |
| Production branch      | `main`                                                                 |
| Node.js version        | `.nvmrc`(`24.15.0`) 기준 — Environment variables에 `NODE_VERSION` 추가 |

- SPA 라우팅 처리(`/admin` 같은 하위 경로 새로고침 시 404 방지)는 `public/_redirects`로 이미 구성되어 있어 별도 설정이 필요 없습니다.
- 커스텀 도메인은 아직 구매 전이라, 이 문서 기준으로는 Cloudflare가 자동 발급하는 `*.pages.dev` 기본 주소로 서비스됩니다. 도메인 구매 후 Custom domains에서 연결하고, BE CORS 허용 origin에도 추가해야 합니다.
- Git 연동 방식이라 API 토큰을 GitHub Secrets에 등록할 필요가 없습니다.

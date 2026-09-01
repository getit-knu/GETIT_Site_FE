import { Link } from "react-router";

/** 로그인은 됐지만 권한이 모자랄 때. RequireRole 이 여기로 보낸다. */
export default function ForbiddenPage() {
  return (
    <main>
      <h1>접근 권한이 없습니다</h1>
      <Link viewTransition to="/">
        홈으로
      </Link>
    </main>
  );
}

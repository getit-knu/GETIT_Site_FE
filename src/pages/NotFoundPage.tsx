import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main>
      <h1>페이지를 찾을 수 없습니다</h1>
      <Link to="/">홈으로</Link>
    </main>
  );
}

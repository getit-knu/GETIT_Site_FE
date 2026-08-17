import { Outlet } from "react-router";

import { Footer } from "./Footer";
import { Nav } from "./Nav";
import styles from "./PublicLayout.module.scss";

/** 공개 사이트 전 화면이 올라가는 셸. Home 외 프로젝트·운영진 등도 여기에 얹힌다. */
export function PublicLayout() {
  return (
    <div className={styles.layout}>
      <Nav />
      <main className={styles.content}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

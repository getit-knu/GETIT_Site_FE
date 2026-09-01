import { useState } from "react";

import type { PublicStaff } from "../../types/site";

import styles from "./LeaderCard.module.scss";

/** `profileImageUrl`이 없는(비었거나 아직 안 올린) 운영진은 `order`(1·2·3)로 고정 팔레트를 순서대로 배정한다. */
const PHOTO_GRADIENTS = [
  "linear-gradient(150deg, #2b7fff 0%, #ad46ff 100%)",
  "linear-gradient(150deg, #ad46ff 0%, #f6339a 100%)",
  "linear-gradient(150deg, #f6339a 0%, #fb2c36 100%)",
];

interface LeaderCardProps {
  staff: PublicStaff;
  /** Leader(회장단)만 회장·부회장·총무 구분이 의미 있어 역할을 보여준다. Staff는 안 보여준다. */
  showRole?: boolean;
}

/** 계정이 없는 운영진은 `githubUrl`/`instagramUrl`이 `null`이라 아이콘 자체를 숨긴다. */
export function LeaderCard({ staff, showRole = true }: LeaderCardProps) {
  const { profileImageUrl } = staff;
  const gradient = PHOTO_GRADIENTS[(staff.order - 1) % PHOTO_GRADIENTS.length];
  const [photoLoaded, setPhotoLoaded] = useState(false);
  // 깨진 CDN 주소일 수 있다 — onError가 뜨면 그라디언트로 되돌아간다.
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <div className={styles.card}>
      {/*
        그라디언트는 사진 유무와 무관하게 항상 배경으로 깔아 둔다. 사진이 로드되는 동안
        빈칸 없이 자리를 채우고, 실제 사진은 로드가 끝나야 위에 올라온다(opacity 전환).
      */}
      <div className={styles.photo} style={{ backgroundImage: gradient }} aria-hidden="true">
        {profileImageUrl !== null && profileImageUrl !== "" && !photoFailed && (
          <>
            <img
              className={`${styles.photoImg} ${photoLoaded ? styles.photoImgLoaded : ""}`}
              src={profileImageUrl}
              alt=""
              loading="lazy"
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoFailed(true)}
            />
            {!photoLoaded && <span className={styles.spinner} aria-hidden="true" />}
          </>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{staff.name}</span>
          {staff.githubUrl !== null && (
            <a
              href={staff.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${staff.name} GitHub`}
              className={styles.snsIcon}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                <path
                  d="M10 2.5C5.86 2.5 2.5 5.86 2.5 10c0 3.31 2.15 6.12 5.13 7.11.38.07.51-.16.51-.36v-1.4c-2.09.45-2.53-.9-2.53-.9-.34-.87-.83-1.1-.83-1.1-.68-.46.05-.45.05-.45.75.05 1.15.77 1.15.77.67 1.14 1.75.82 2.18.62.07-.48.26-.82.48-1-1.73-.2-3.55-.87-3.55-3.86 0-.85.3-1.55.79-2.1-.08-.2-.35-1 .08-2.08 0 0 .65-.21 2.12.79a7.3 7.3 0 0 1 3.86 0c1.47-1 2.12-.79 2.12-.79.43 1.08.16 1.88.08 2.08.5.55.79 1.25.79 2.1 0 3-1.83 3.65-3.57 3.85.27.24.51.7.51 1.42v2.1c0 .2.13.44.52.36A7.51 7.51 0 0 0 17.5 10c0-4.14-3.36-7.5-7.5-7.5Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          )}
          {staff.instagramUrl !== null && (
            <a
              href={staff.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${staff.name} Instagram`}
              className={styles.snsIcon}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="3.25" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="13.75" cy="6.25" r="0.75" fill="currentColor" />
              </svg>
            </a>
          )}
        </div>
        {showRole && <p className={styles.role}>{staff.staffRole}</p>}
        <p className={styles.department}>{staff.department}</p>
        {staff.introduction !== "" && <p className={styles.introduction}>{staff.introduction}</p>}
      </div>
    </div>
  );
}

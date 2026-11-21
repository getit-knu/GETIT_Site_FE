import type { ProjectDetailFields } from "../types/project";

/** BE#227 상세 항목(한 줄 소개·진행 상태·스토어 링크)을 아직 채우지 않은 프로젝트. 픽스처가 펼쳐 쓴다. */
export const NO_PROJECT_DETAILS: ProjectDetailFields = {
  oneLiner: null,
  progressStatus: null,
  progressStatusLabel: null,
  playStoreUrl: null,
  appStoreUrl: null,
};

/** 이미지가 하나도 없는 어드민·부원 프로젝트. 픽스처끼리 배열을 나눠 쓰지 않게 매번 새로 만든다. */
export function noProjectImages(): {
  galleryFileIds: number[];
  galleryImageUrls: string[];
  descriptionImageFileIds: number[];
} {
  return { galleryFileIds: [], galleryImageUrls: [], descriptionImageFileIds: [] };
}

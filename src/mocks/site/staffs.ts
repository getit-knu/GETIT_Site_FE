import type { FeatureToggle } from "../../types/site";

/**
 * 기능 토글 목.
 *
 * 운영진 CRUD(#194)와 공개 운영진 조회(#187, `GET /api/public/staffs`)가 모두 실제
 * 엔드포인트로 옮겨가면서 이 파일에 남아 있던 운영진 시드 데이터는 더 쓰이지 않는다.
 * 기능 토글만 아직 실제 엔드포인트가 없어 목으로 남긴다.
 */

let features: FeatureToggle[] = [
  {
    key: "STOCK_GAME",
    label: "주식 게임",
    enabled: false,
    updatedAt: "2026-07-01T10:00:00+09:00",
    updatedBy: "김운영",
  },
  {
    key: "MOCK_INVESTMENT",
    label: "모의 투자",
    enabled: true,
    updatedAt: "2026-07-20T14:30:00+09:00",
    updatedBy: "김운영",
  },
];

const delay = () => new Promise((r) => setTimeout(r, 200));

export async function fetchFeatures(): Promise<FeatureToggle[]> {
  await delay();
  return structuredClone(features);
}

export async function toggleFeature(key: string, enabled: boolean): Promise<FeatureToggle> {
  await delay();
  const found = features.find((f) => f.key === key);
  if (found === undefined) throw { code: "FEATURE_NOT_FOUND", message: "기능을 찾을 수 없습니다." };

  features = features.map((f) =>
    f.key === key ? { ...f, enabled, updatedAt: new Date().toISOString(), updatedBy: "김운영" } : f,
  );
  return structuredClone(features.find((f) => f.key === key) as FeatureToggle);
}

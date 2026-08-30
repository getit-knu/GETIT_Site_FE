import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../apis/site/siteApi";
import type { FeatureToggle } from "../../../types/site";

import { FeaturesSection } from "./FeaturesSection";

vi.mock("../../../apis/site/siteApi");

const FEATURES: FeatureToggle[] = [
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

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FeaturesSection />
    </QueryClientProvider>,
  );
}

const box = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe("FeaturesSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getFeatures).mockResolvedValue(FEATURES);
  });

  it("BE 가 준 목록을 그대로 그린다", async () => {
    // 키 목록을 화면에 두면 BE 가 기능을 추가해도 나오지 않는다.
    renderSection();

    expect(await screen.findByLabelText("주식 게임")).not.toBeChecked();
    expect(box("모의 투자")).toBeChecked();
  });

  it("마지막으로 바꾼 사람과 시각을 보여준다", async () => {
    renderSection();

    expect(await screen.findByText(/2026\. 07\. 01\..*김운영/)).toBeInTheDocument();
  });

  it("한 번도 토글한 적 없으면 변경 이력이 없다고 알린다", async () => {
    // 시드 데이터 그대로면 updatedAt · updatedBy 가 null 로 온다(BE 확인함).
    vi.mocked(api.getFeatures).mockResolvedValue([{ ...FEATURES[0], updatedAt: null, updatedBy: null }]);
    renderSection();

    expect(await screen.findByText("변경 이력 없음")).toBeInTheDocument();
  });

  it("켜면 그 키만 서버에 보낸다", async () => {
    vi.mocked(api.toggleFeature).mockResolvedValue({ ...FEATURES[0], enabled: true });
    renderSection();

    await userEvent.click(await screen.findByLabelText("주식 게임"));

    expect(api.toggleFeature).toHaveBeenCalledWith("STOCK_GAME", true);
  });

  it("응답을 기다리지 않고 먼저 켜진다", async () => {
    // 눌러도 한참 아무 일이 없으면 사용자가 다시 누른다.
    let resolve: (value: FeatureToggle) => void = () => {};
    vi.mocked(api.toggleFeature).mockReturnValue(
      new Promise<FeatureToggle>((r) => {
        resolve = r;
      }),
    );
    renderSection();

    await userEvent.click(await screen.findByLabelText("주식 게임"));

    expect(box("주식 게임")).toBeChecked();
    resolve({ ...FEATURES[0], enabled: true });
  });

  it("실패하면 원래 상태로 되돌아가고 이유를 보여준다", async () => {
    /*
      이 값은 공개 사이트 노출을 제어한다. 켜진 것처럼 보이는데 안 켜져 있으면
      미완성 화면이 외부에 나간 줄 모른다.

      재조회도 실패시킨다. 서버에서 다시 받아오는 것이 되돌려 주면 롤백이 없어도
      통과해 버려, 정작 롤백이 빠진 것을 잡지 못한다.
    */
    vi.mocked(api.toggleFeature).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();
    await screen.findByLabelText("주식 게임");
    vi.mocked(api.getFeatures).mockRejectedValue({ code: "FORBIDDEN", message: "?" });

    await userEvent.click(box("주식 게임"));

    await waitFor(() => expect(box("주식 게임")).not.toBeChecked());
    // 재조회 실패 안내와 토글 실패 안내가 같은 문구라 둘 다 잡힌다.
    expect(screen.getAllByText(/권한이 없습니다/).length).toBeGreaterThan(0);
  });

  it("실패해도 다른 토글은 건드리지 않는다", async () => {
    vi.mocked(api.toggleFeature).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();
    await screen.findByLabelText("주식 게임");
    vi.mocked(api.getFeatures).mockRejectedValue({ code: "FORBIDDEN", message: "?" });

    await userEvent.click(box("주식 게임"));

    await waitFor(() => expect(box("주식 게임")).not.toBeChecked());
    expect(box("모의 투자")).toBeChecked();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getFeatures).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});

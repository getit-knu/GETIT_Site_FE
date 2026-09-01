import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../../apis/site/siteApi";
import type { Staff } from "../../../types/site";

import { StaffsSection } from "./StaffsSection";

vi.mock("../../../apis/site/siteApi");

function staff(over: Partial<Staff> & { id: number; name: string }): Staff {
  return {
    userId: null,
    staffRole: "SW 운영진",
    section: "SW",
    department: "컴퓨터공학과 21",
    introduction: "",
    profileImageUrl: null,
    githubUrl: null,
    instagramUrl: null,
    order: 1,
    generationNo: 9,
    ...over,
  };
}

const STAFFS: Staff[] = [
  staff({ id: 1, name: "홍길동", staffRole: "회장", section: "EXECUTIVE", order: 1 }),
  staff({ id: 3, name: "이재민", order: 1 }),
  staff({ id: 4, name: "박서연", order: 2 }),
  staff({ id: 5, name: "정하늘", order: 3 }),
];

/** 저장을 막지 않을 만큼만 채운다. 필수 항목이 늘어도 각 테스트를 고치지 않게 한 곳에 둔다. */
async function fillRequired(name: string) {
  await userEvent.type(screen.getByLabelText("이름 *"), name);
  await userEvent.type(screen.getByLabelText("직책 *"), "SW 운영진");
  await userEvent.type(screen.getByLabelText("학과 · 학번 *"), "컴퓨터공학과 21");
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <StaffsSection generationNo={9} />
    </QueryClientProvider>,
  );
}

/** SW 구역에 보이는 이름 순서. */
function swOrder(): string[] {
  const heading = screen.getByRole("heading", { name: "SW" });
  const list = heading.parentElement?.querySelector("ul");
  return [...(list?.querySelectorAll("li strong") ?? [])].map((el) => el.textContent ?? "");
}

describe("StaffsSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getStaffs).mockResolvedValue(STAFFS);
    vi.mocked(api.reorderStaffs).mockResolvedValue();
    vi.mocked(api.deleteStaff).mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("구역별로 나눠 보여준다", async () => {
    renderSection();

    expect(await screen.findByText("홍길동")).toBeInTheDocument();
    expect(swOrder()).toEqual(["이재민", "박서연", "정하늘"]);
  });

  it("운영진이 없는 구역은 안내를 보여준다", async () => {
    renderSection();
    await screen.findByText("홍길동");

    // 창업 구역은 비어 있다.
    expect(screen.getAllByText("등록된 운영진이 없습니다.")).toHaveLength(1);
  });

  it("구역 안에서만 순서를 다시 매겨 보낸다", async () => {
    // 10.22 는 section 안에서만 순서를 재부여한다.
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "박서연 위로" }));

    expect(api.reorderStaffs).toHaveBeenCalledWith("SW", [4, 3, 5]);
  });

  it("응답을 기다리지 않고 먼저 옮긴다", async () => {
    let resolve: () => void = () => {};
    vi.mocked(api.reorderStaffs).mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "박서연 위로" }));

    expect(swOrder()).toEqual(["박서연", "이재민", "정하늘"]);
    resolve();
  });

  it("순서 변경에 실패하면 이전 순서로 되돌아간다", async () => {
    /*
      바뀐 채로 두면 저장된 줄 알고 화면을 떠난다.

      재조회도 실패시킨다. 서버에서 다시 받아오는 것이 되돌려 주면 롤백이 없어도
      통과해 버려, 정작 롤백이 빠진 것을 잡지 못한다.
    */
    vi.mocked(api.reorderStaffs).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();
    await screen.findByText("이재민");
    vi.mocked(api.getStaffs).mockRejectedValue({ code: "FORBIDDEN", message: "?" });

    await userEvent.click(screen.getByRole("button", { name: "박서연 위로" }));

    await waitFor(() => expect(swOrder()).toEqual(["이재민", "박서연", "정하늘"]));
    // 재조회 실패 안내와 순서 변경 실패 안내가 같은 문구라 둘 다 잡힌다.
    expect(screen.getAllByText(/권한이 없습니다/).length).toBeGreaterThan(0);
  });

  it("맨 위·맨 아래에서는 더 옮길 수 없다", async () => {
    renderSection();
    await screen.findByText("이재민");

    expect(screen.getByRole("button", { name: "이재민 위로" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "정하늘 아래로" })).toBeDisabled();
  });

  it("추가와 수정이 같은 폼을 쓴다", async () => {
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    expect(screen.getByLabelText("이름 *")).toHaveValue("");
    expect(screen.getByRole("button", { name: "추가" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    await userEvent.click(screen.getAllByRole("button", { name: "수정" })[1]);
    expect(screen.getByLabelText("이름 *")).toHaveValue("이재민");
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  });

  it("이름 · 직책 · 학과가 비면 저장을 막는다", async () => {
    // 셋 다 공개 운영진 카드에 그대로 나가고, BE 도 `@NotBlank` 로 막는다.
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));

    expect(screen.getByText("이름을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("이름 *"), "새 운영진");
    expect(screen.getByText("직책을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("직책 *"), "SW 운영진");
    expect(screen.getByText("학과 · 학번을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("학과 · 학번 *"), "컴퓨터공학과 21");
    expect(screen.getByRole("button", { name: "추가" })).toBeEnabled();
  });

  it("공백만 넣은 학과는 채운 것으로 보지 않는다", async () => {
    // BE `@NotBlank` 는 공백만 있는 값도 거절한다.
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    await userEvent.type(screen.getByLabelText("이름 *"), "새 운영진");
    await userEvent.type(screen.getByLabelText("직책 *"), "SW 운영진");
    await userEvent.type(screen.getByLabelText("학과 · 학번 *"), "   ");

    expect(screen.getByText("학과 · 학번을 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("구역은 고르는 값이라 비지 않지만 필수 표시는 붙는다", async () => {
    // `Select` 에 "선택 안 함" 이 없어 검증할 것이 없다 — 표시만 맞으면 된다.
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));

    expect(screen.getByLabelText("구역 *")).toHaveValue("SW");
  });

  it("추가는 고른 구역으로 보낸다", async () => {
    vi.mocked(api.createStaff).mockResolvedValue(staff({ id: 9, name: "새 운영진" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    await fillRequired("새 운영진");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createStaff).toHaveBeenCalled());
    expect(vi.mocked(api.createStaff).mock.lastCall?.[0]).toMatchObject({
      name: "새 운영진",
      section: "SW",
      generationNo: 9,
      githubUrl: null,
      instagramUrl: null,
    });
  });

  it("GitHub · Instagram 링크를 입력하면 그대로 보낸다", async () => {
    vi.mocked(api.createStaff).mockResolvedValue(staff({ id: 9, name: "새 운영진" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    await fillRequired("새 운영진");
    await userEvent.type(screen.getByLabelText("GitHub 링크"), "https://github.com/new");
    await userEvent.type(screen.getByLabelText("Instagram 링크"), "https://instagram.com/new");
    await userEvent.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(api.createStaff).toHaveBeenCalled());
    expect(vi.mocked(api.createStaff).mock.lastCall?.[0]).toMatchObject({
      githubUrl: "https://github.com/new",
      instagramUrl: "https://instagram.com/new",
    });
  });

  it("http · https로 시작하지 않는 SNS 링크는 저장을 막는다", async () => {
    // BE `@HttpUrl` 검증(http · https만 허용)을 클라이언트에도 미리 둔다.
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getByRole("button", { name: "+ SW 운영진 추가" }));
    await fillRequired("새 운영진");
    await userEvent.type(screen.getByLabelText("GitHub 링크"), "github.com/new");

    expect(screen.getByText(/GitHub 링크은\(는\) http 또는 https로 시작하는 주소여야 합니다\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("수정은 그 사람의 id 로 보낸다", async () => {
    vi.mocked(api.updateStaff).mockResolvedValue(staff({ id: 3, name: "이재민!" }));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(screen.getAllByRole("button", { name: "수정" })[1]);
    await userEvent.type(screen.getByLabelText("이름 *"), "!");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(api.updateStaff).toHaveBeenCalled());
    expect(vi.mocked(api.updateStaff).mock.lastCall?.[0]).toBe(3);
  });

  it("삭제는 확인을 묻고, 취소하면 지우지 않는다", async () => {
    // 되돌릴 수 없고 공개 사이트에서 바로 사라진다.
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(
      within(screen.getByText("이재민").closest("li") as HTMLElement).getByRole("button", { name: "삭제" }),
    );

    expect(api.deleteStaff).not.toHaveBeenCalled();
  });

  it("확인하면 삭제한다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderSection();
    await screen.findByText("이재민");

    await userEvent.click(
      within(screen.getByText("이재민").closest("li") as HTMLElement).getByRole("button", { name: "삭제" }),
    );

    expect(api.deleteStaff).toHaveBeenCalledWith(3);
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getStaffs).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});

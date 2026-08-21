import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/group/groupsApi";
import type { GroupBoard } from "../../types/group";

import { GroupsTab } from "./GroupsTab";

vi.mock("../../apis/group/groupsApi");

const member = (id: number, name: string) => ({
  userId: id,
  name,
  major: "경영학과",
  role: "MEMBER" as const,
  roleLabel: "부원",
});

function board(over: Partial<GroupBoard> = {}): GroupBoard {
  return {
    generationNo: 9,
    groups: [{ id: 1, name: "1조", memberCount: 2, members: [member(21, "김부원"), member(22, "이회원")] }],
    unassigned: [member(30, "최미배정")],
    ...over,
  };
}

function renderTab() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <GroupsTab />
    </QueryClientProvider>,
  );
}

describe("GroupsTab", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getGroups).mockResolvedValue(board());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("조와 조원, 미배정 인원을 함께 보여준다", async () => {
    renderTab();

    // "1조" 는 조 제목과 배정 Select 의 option 양쪽에 있다. 제목으로 좁힌다.
    expect(await screen.findByRole("heading", { name: /1조/ })).toBeInTheDocument();
    expect(screen.getByText("김부원")).toBeInTheDocument();
    expect(screen.getByText("미배정")).toBeInTheDocument();
    expect(screen.getByText("최미배정")).toBeInTheDocument();
  });

  it("조 인원 수를 표기한다", async () => {
    renderTab();

    expect(await screen.findByText("2명")).toBeInTheDocument();
    expect(screen.getByText("1명")).toBeInTheDocument();
  });

  it("조를 만들면 이름을 비운다", async () => {
    vi.mocked(api.createGroup).mockResolvedValue();
    renderTab();

    const input = await screen.findByRole("textbox", { name: "새 조 이름" });
    await userEvent.type(input, "3조");
    await userEvent.click(screen.getByRole("button", { name: "조 추가" }));

    expect(api.createGroup).toHaveBeenCalledWith("3조");
    expect(input).toHaveValue("");
  });

  it("빈 이름으로는 조를 만들 수 없다", async () => {
    renderTab();

    await screen.findByRole("button", { name: "조 추가" });
    expect(screen.getByRole("button", { name: "조 추가" })).toBeDisabled();
  });

  it("미배정 인원을 조에 넣는다", async () => {
    vi.mocked(api.addMember).mockResolvedValue();
    renderTab();

    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "최미배정 조 배정" }), "1");

    expect(api.addMember).toHaveBeenCalledWith(1, 30);
  });

  it("조원을 빼면 서버에 알린다", async () => {
    vi.mocked(api.removeMember).mockResolvedValue();
    renderTab();

    await userEvent.click(await screen.findByRole("button", { name: "김부원 조에서 빼기" }));

    expect(api.removeMember).toHaveBeenCalledWith(1, 21);
  });

  it("조원이 있는 조를 지울 때 어디로 가는지 알려 준다", async () => {
    // 조를 지우면 사람이 사라진다고 오해하기 쉽다.
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirm);
    vi.mocked(api.deleteGroup).mockResolvedValue();
    renderTab();

    await userEvent.click(await screen.findByRole("button", { name: "1조 삭제" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("미배정으로 돌아갑니다"));
    expect(api.deleteGroup).toHaveBeenCalledWith(1);
  });

  it("확인을 취소하면 조를 지우지 않는다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderTab();

    await userEvent.click(await screen.findByRole("button", { name: "1조 삭제" }));

    expect(api.deleteGroup).not.toHaveBeenCalled();
  });

  it("이름을 고치고 포커스를 벗어나면 저장한다", async () => {
    vi.mocked(api.renameGroup).mockResolvedValue();
    renderTab();

    await userEvent.click(await screen.findByRole("button", { name: "1조 이름 수정" }));
    const input = screen.getByRole("textbox", { name: "1조 이름" });
    await userEvent.clear(input);
    await userEvent.type(input, "A조");
    await userEvent.tab();

    expect(api.renameGroup).toHaveBeenCalledWith(1, "A조");
  });

  it("빈 이름으로는 조 이름을 바꾸지 않는다", async () => {
    // 저장되면 어느 조인지 알 수 없게 된다.
    renderTab();

    await userEvent.click(await screen.findByRole("button", { name: "1조 이름 수정" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "1조 이름" }));
    await userEvent.tab();

    expect(api.renameGroup).not.toHaveBeenCalled();
  });

  it("조가 하나도 없으면 배정할 곳을 묻지 않는다", async () => {
    vi.mocked(api.getGroups).mockResolvedValue(board({ groups: [] }));
    renderTab();

    expect(await screen.findByText("아직 만든 조가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("모두 배정됐으면 미배정 자리를 비워 둔다", async () => {
    vi.mocked(api.getGroups).mockResolvedValue(board({ unassigned: [] }));
    renderTab();

    expect(await screen.findByText("모두 배정되었습니다.")).toBeInTheDocument();
  });

  it("조원이 없는 조도 그대로 보여준다", async () => {
    vi.mocked(api.getGroups).mockResolvedValue(
      board({ groups: [{ id: 2, name: "2조", memberCount: 0, members: [] }] }),
    );
    renderTab();

    const card = (await screen.findByRole("heading", { name: /2조/ })).closest("section");
    expect(within(card!).getByText("아직 조원이 없습니다.")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getGroups).mockRejectedValue({ code: "UNKNOWN_ERROR", message: "실패" });
    renderTab();

    expect(await screen.findByRole("alert")).toHaveTextContent("조 목록을 불러오지 못했습니다.");
  });
});

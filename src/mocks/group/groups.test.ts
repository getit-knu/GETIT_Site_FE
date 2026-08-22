import { beforeEach, describe, expect, it } from "vitest";

import * as mock from "./groups";

/**
 * 목 데이터가 서버처럼 움직이는지 본다.
 *
 * 화면 테스트는 API 를 가짜로 바꾸므로 이 규칙을 검증하지 못한다.
 * 여기가 어긋나면 개발 중에만 이상하게 동작하고 원인을 찾기 어렵다.
 */
async function counts() {
  const board = await mock.fetchGroups();
  return {
    inGroups: board.groups.reduce((n, g) => n + g.members.length, 0),
    unassigned: board.unassigned.length,
    groups: board.groups.length,
  };
}

describe("조 목 데이터", () => {
  let initial: Awaited<ReturnType<typeof counts>>;

  beforeEach(async () => {
    initial = await counts();
  });

  it("조원을 옮겨도 사람 수는 그대로다", async () => {
    const before = await mock.fetchGroups();
    const target = before.unassigned[0];

    await mock.addMember(1, target.userId);
    const after = await counts();

    expect(after.inGroups).toBe(initial.inGroups + 1);
    expect(after.unassigned).toBe(initial.unassigned - 1);

    await mock.removeMember(1, target.userId);
    expect(await counts()).toMatchObject({
      inGroups: initial.inGroups,
      unassigned: initial.unassigned,
    });
  });

  it("조를 지우면 조원이 미배정으로 돌아간다", async () => {
    // 사람이 사라지면 안 된다.
    const before = await mock.fetchGroups();
    const doomed = before.groups[0];

    await mock.deleteGroup(doomed.id);
    const after = await counts();

    expect(after.groups).toBe(initial.groups - 1);
    expect(after.unassigned).toBe(initial.unassigned + doomed.members.length);

    // 되돌려 다음 테스트에 영향을 주지 않는다.
    await mock.createGroup(doomed.name);
    const restored = await mock.fetchGroups();
    for (const m of doomed.members) {
      await mock.addMember(restored.groups[restored.groups.length - 1].id, m.userId);
    }
  });

  it("memberCount 가 실제 인원과 어긋나지 않는다", async () => {
    const board = await mock.fetchGroups();

    for (const group of board.groups) {
      expect(group.memberCount).toBe(group.members.length);
    }
  });

  it("돌려준 값을 고쳐도 원본이 바뀌지 않는다", async () => {
    // 복사해 넘기지 않으면 화면이 캐시를 직접 헤집게 된다.
    const board = await mock.fetchGroups();
    board.groups[0].members.pop();

    expect((await counts()).inGroups).toBe(initial.inGroups);
  });
});

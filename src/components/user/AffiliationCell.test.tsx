import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AdminUser } from "../../types/user";

import { AffiliationCell } from "./AffiliationCell";

const USER: AdminUser = {
  id: 1,
  name: "홍길동",
  email: "hong@getit.com",
  phoneNumber: null,
  college: "경영대학",
  major: "경영학과",
  studentYear: null,
  role: "MEMBER",
  roleLabel: "부원",
  generationNo: 9,
  status: "ACTIVE",
  group: null,
};

describe("AffiliationCell", () => {
  it("현재 단과대학·학과를 보여준다", () => {
    render(<AffiliationCell user={USER} disabled={false} onSave={vi.fn()} />);

    expect(screen.getByLabelText("홍길동 단과대학")).toHaveValue("경영대학");
    expect(screen.getByLabelText("홍길동 학과")).toHaveValue("경영학과");
  });

  it("단과대학을 바꾸고 벗어나면 그 값만 저장한다", async () => {
    const onSave = vi.fn();
    render(<AffiliationCell user={USER} disabled={false} onSave={onSave} />);

    const collegeInput = screen.getByLabelText("홍길동 단과대학");
    await userEvent.clear(collegeInput);
    await userEvent.type(collegeInput, "IT대학");
    await userEvent.tab();

    expect(onSave).toHaveBeenCalledWith({ college: "IT대학" });
  });

  it("바뀐 게 없으면 저장을 부르지 않는다", async () => {
    const onSave = vi.fn();
    render(<AffiliationCell user={USER} disabled={false} onSave={onSave} />);

    await userEvent.click(screen.getByLabelText("홍길동 학과"));
    await userEvent.tab();

    expect(onSave).not.toHaveBeenCalled();
  });

  it("빈 값으로 비우고 벗어나면 지운 채로 저장한다 — 잘못 채운 소속을 되돌릴 수 있어야 한다", async () => {
    const onSave = vi.fn();
    render(<AffiliationCell user={USER} disabled={false} onSave={onSave} />);

    await userEvent.clear(screen.getByLabelText("홍길동 학과"));
    await userEvent.tab();

    expect(onSave).toHaveBeenCalledWith({ major: "" });
  });

  it("소속이 아예 없던 사용자는 빈칸으로 시작한다", () => {
    render(<AffiliationCell user={{ ...USER, college: null, major: null }} disabled={false} onSave={vi.fn()} />);

    expect(screen.getByLabelText("홍길동 단과대학")).toHaveValue("");
    expect(screen.getByLabelText("홍길동 학과")).toHaveValue("");
  });
});

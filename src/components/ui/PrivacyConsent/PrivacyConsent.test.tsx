import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PrivacyConsent } from "./PrivacyConsent";

const NOTICE = "**수집 항목**\n\n- 이메일\n- 이름";

describe("PrivacyConsent", () => {
  it("체크하면 onChange를 부른다", async () => {
    const onChange = vi.fn();
    render(<PrivacyConsent checked={false} onChange={onChange} notice={NOTICE} />);

    await userEvent.click(screen.getByLabelText(/개인정보 수집·이용에 동의합니다/));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("기본으로는 고지 내용을 접어 둔다", () => {
    render(<PrivacyConsent checked={false} onChange={vi.fn()} notice={NOTICE} />);

    // <details>가 닫혀 있으면 내용은 DOM에는 있지만 화면엔 안 보인다 — 접힘 자체를 확인한다.
    const details = screen.getByText("자세히 보기").closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("펼치면 고지 내용이 마크다운으로 보인다", async () => {
    render(<PrivacyConsent checked={false} onChange={vi.fn()} notice={NOTICE} />);

    await userEvent.click(screen.getByText("자세히 보기"));

    expect(screen.getByText("이메일")).toBeInTheDocument();
    expect(screen.getByText("수집 항목", { selector: "strong" })).toBeInTheDocument();
  });

  it("error가 있으면 보여주고 체크박스에 연결한다", () => {
    render(<PrivacyConsent checked={false} onChange={vi.fn()} notice={NOTICE} error="동의해 주세요." />);

    const checkbox = screen.getByLabelText(/개인정보 수집·이용에 동의합니다/);
    expect(screen.getByRole("alert")).toHaveTextContent("동의해 주세요.");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAccessibleDescription("동의해 주세요.");
  });

  it("error가 없으면 아무것도 안 보여준다", () => {
    render(<PrivacyConsent checked={false} onChange={vi.fn()} notice={NOTICE} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

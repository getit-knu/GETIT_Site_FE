import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MaskedPhone } from "./MaskedPhone";

function renderPhone(reveal: () => Promise<string | null>, phoneNumber: string | null = "010-****-5678") {
  render(<MaskedPhone phoneNumber={phoneNumber} owner="김부원" reveal={reveal} />);
  return {
    toggle: () => screen.getByRole("button", { name: /김부원 연락처/ }),
  };
}

describe("MaskedPhone (#411)", () => {
  it("서버가 가려 준 번호를 다시 가리지 않고 그대로 보여준다", () => {
    // 다시 가리면 남은 숫자가 7개라 `***-****-****` 가 됐다(운영에서 실제로 그랬다).
    const reveal = vi.fn();
    renderPhone(reveal);

    expect(screen.getByText("010-****-5678")).toBeInTheDocument();
    expect(reveal).not.toHaveBeenCalled();
  });

  it("'보기'를 누를 때마다 전체 번호를 새로 받고, '숨기기'를 누르면 버린다", async () => {
    // 다시 볼 때도 서버를 거쳐야 열람 기록이 남는다.
    const reveal = vi.fn().mockResolvedValue("010-1234-5678");
    const { toggle } = renderPhone(reveal);

    await userEvent.click(toggle());
    expect(await screen.findByText("010-1234-5678")).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName("김부원 연락처 숨기기");

    await userEvent.click(toggle());
    expect(screen.getByText("010-****-5678")).toBeInTheDocument();

    await userEvent.click(toggle());
    await screen.findByText("010-1234-5678");
    expect(reveal).toHaveBeenCalledTimes(2);
  });

  it("받아 오지 못하면 가린 번호를 둔 채 이유를 보여주고, 다시 누를 수 있다", async () => {
    const reveal = vi.fn().mockRejectedValueOnce(new Error("403")).mockResolvedValueOnce("010-1234-5678");
    const { toggle } = renderPhone(reveal);

    await userEvent.click(toggle());
    expect(await screen.findByRole("alert")).toHaveTextContent("번호를 불러오지 못했어요");
    expect(screen.getByText("010-****-5678")).toBeInTheDocument();

    await userEvent.click(toggle());
    expect(await screen.findByText("010-1234-5678")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("번호가 없으면 '-' 만 보여주고 버튼을 두지 않는다", () => {
    renderPhone(vi.fn(), null);

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

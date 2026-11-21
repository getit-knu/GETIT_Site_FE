import { describe, expect, it } from "vitest";

import { descriptionImageFileIds } from "./projectImages";

describe("descriptionImageFileIds (#385)", () => {
  const uploaded = [
    { fileId: 31, url: "https://cdn/31.png" },
    { fileId: 32, url: "https://cdn/32.png" },
  ];

  it("이번에 올린 것 중 본문에 남은 것만 연결하고, 예전 id는 그대로 둔다", () => {
    expect(descriptionImageFileIds([21], uploaded, "글 ![](https://cdn/32.png)")).toEqual([21, 32]);
  });

  it("같은 이미지를 두 번 넣어도 id는 한 번만 보낸다 — BE가 중복을 거절한다", () => {
    expect(descriptionImageFileIds([], uploaded, "![](https://cdn/31.png) ![](https://cdn/31.png)")).toEqual([31]);
  });
});

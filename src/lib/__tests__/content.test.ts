import { describe, it, expect } from "vitest";
import { parseHero } from "@/lib/content";

describe("parseHero", () => {
  it("extracts kicker, subtitle, and headline from H1", () => {
    const md = [
      "---",
      'kicker: "K"',
      'subtitle: "S"',
      "---",
      "",
      "# 标题",
      "",
    ].join("\n");

    expect(parseHero(md)).toEqual({
      kicker: "K",
      subtitle: "S",
      headline: "标题",
    });
  });

  it("strips inline markdown from H1 (plain text only)", () => {
    const md = ['---', 'kicker: "x"', 'subtitle: "y"', "---", "", "# *斜* 体", ""].join("\n");
    expect(parseHero(md).headline).toBe("斜 体");
  });
});

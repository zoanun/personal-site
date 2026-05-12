import { describe, it, expect } from "vitest";
import { parseHero, parseSection } from "@/lib/content";

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

describe("parseSection", () => {
  const fm = ['---', 'heading: H', 'empty: E', "---"].join("\n");

  it("returns empty items when no H2 present", () => {
    const result = parseSection(fm + "\n\n");
    expect(result).toEqual({ heading: "H", empty: "E", items: [] });
  });

  it("captures items by H2 sections", () => {
    const md = fm + "\n\n## 个人网站\n\n你正在看到的这一页。\n\n## 知识库\n\n系统化整理。\n";
    const result = parseSection(md);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      title: "个人网站",
      meta: undefined,
      desc: "你正在看到的这一页。",
    });
    expect(result.items[1]).toEqual({
      title: "知识库",
      meta: undefined,
      desc: "系统化整理。",
    });
  });

  it("detects meta from a single-emphasis first paragraph", () => {
    const md = fm + "\n\n## 知识库\n\n*知识整理*\n\n系统化整理大模型相关知识。\n";
    const item = parseSection(md).items[0];
    expect(item.meta).toBe("知识整理");
    expect(item.desc).toBe("系统化整理大模型相关知识。");
  });

  it("does NOT treat mixed-emphasis first paragraph as meta", () => {
    const md = fm + "\n\n## X\n\n这是 *混合* 文本\n\n下一段。\n";
    const item = parseSection(md).items[0];
    expect(item.meta).toBeUndefined();
    expect(item.desc).toContain("这是");
    expect(item.desc).toContain("下一段");
  });

  it("preserves inline links in desc", () => {
    const md = fm + "\n\n## X\n\n看看 [OpenKB](https://example.com)。\n";
    const item = parseSection(md).items[0];
    expect(item.desc).toContain("[OpenKB](https://example.com)");
  });
});

# 主页内容外部化 + Obsidian 风格详情页 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把主页正文搬到 `content/` 下的 markdown 文件,并新增 Obsidian 风格的详情页 wiki (双向链接、嵌入图片、反向链接、别名、跨版块、heading 锚点)。

**Architecture:** 构建期 Server Component 读 `content/`,gray-matter 拆 frontmatter,自定义 remark 插件解析 `[[]]`/`![[]]` 语法,vault 索引提供别名映射 + 反向链接。

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + gray-matter + react-markdown + remark + remark-gfm + unist-util-visit + github-slugger;Vitest 单测纯函数。

**Spec:** [docs/superpowers/specs/2026-05-11-markdown-content-design.md](../specs/2026-05-11-markdown-content-design.md)

---

## 阶段结构

- **Phase 1**(Task 1–10):Hero + 主页卡片外部化,可独立 ship
- **Phase 2**(Task 11–24):Obsidian 风格详情页 wiki

---

## 类型契约(全计划一致)

后续每个任务都引用这些类型,提前在此列出以便对照:

```ts
// src/lib/content.ts
export type SectionSlug = "now" | "curious" | "works";

export interface HeroContent {
  kicker: string;
  subtitle: string;
  headline: string;
}

export interface SectionItem {
  title: string;
  meta?: string;
  desc: string;
}

export interface SectionContent {
  num: string;
  heading: string;
  empty: string;
  items: SectionItem[];
}

// src/lib/vault.ts
export interface NoteRef {
  section: SectionSlug;
  slug: string;
  title: string;
  aliases: string[];
  fsPath: string;
  isIndex: boolean;
}

export interface VaultIndex {
  byKey: Map<string, NoteRef>;      // `${section}/${slug}` → NoteRef
  byAlias: Map<string, string>;     // alias 小写 → `${section}/${slug}`
  backlinks: Map<string, NoteRef[]>;
}

// src/lib/remark-wiki-link.ts
export interface WikiLinkOptions {
  currentSection: SectionSlug;
  vault: VaultIndex;
  attachmentBase: string;           // "/_attachments"
}

export interface ResolvedWikiLink {
  kind: "internal" | "anchor" | "broken";
  url: string;                      // e.g., "/now/foo#heading" or "#heading"
  text: string;                     // 显示文本
}
```

---

# Phase 1: 主页内容外部化

## Task 1: 安装基础依赖 + Vitest

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装运行时依赖**

```bash
npm install gray-matter react-markdown remark mdast-util-to-markdown unist-util-visit server-only
```

预期 `package.json` 的 `dependencies` 多六项,版本由 npm 解析。

- [ ] **Step 2: 安装 Vitest 作为 devDependency**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: 加 npm test 脚本**

修改 `package.json` 的 `scripts` 块:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: 验证 vitest 能跑(空跑)**

Run: `npm test`
Expected: vitest 报告 "No test files found" 并退出 0(还没写测试)。

- [ ] **Step 5: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add gray-matter, react-markdown, remark, vitest"
```

---

## Task 2: 配置 Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `test/server-only-shim.ts`(shim Next.js 的 `server-only` 包)

`server-only` 是 Next.js 用来防止把 server 模块误 import 到 client 的运行时 guard,被 import 时无条件抛错。Vitest 在 node 环境跑测试时也会被抛,所以要在测试环境把它别名到一个空 shim。

- [ ] **Step 1: 创建 shim 文件**

创建 `test/server-only-shim.ts`:

```ts
export {};
```

- [ ] **Step 2: 创建 vitest.config.ts**

写入 `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./test/server-only-shim.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: 写一个 sanity test 验证管线**

创建 `src/lib/__tests__/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("vitest is wired up", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: 跑通**

Run: `npm test`
Expected: 1 passed。

- [ ] **Step 5: 删 sanity test,留空目录**

```bash
rm src/lib/__tests__/sanity.test.ts
```

- [ ] **Step 6: 提交**

```bash
git add vitest.config.ts test/
git commit -m "chore: configure vitest with server-only shim"
```

---

## Task 3: 创建 content/ 目录骨架 + 种入现有文案

**Files:**
- Create: `content/hero.md`
- Create: `content/now/card.md`
- Create: `content/curious/card.md`
- Create: `content/works/card.md`

- [ ] **Step 1: 创建 content/hero.md**

```markdown
---
kicker: "PERSONAL · 2026"
subtitle: "这里记录我正在做什么、对什么好奇,以及偶尔留下的一些痕迹。"
---

# 安静地写代码,读论文,做笔记。
```

- [ ] **Step 2: 创建 content/now/card.md**

```markdown
---
num: "01"
heading: 我正在做的事
empty: 正在整理中。
---

## 个人网站

你正在看到的这一页。一次推送,即可上线。

## 大模型知识库

*知识整理*

系统化整理大模型相关知识,作为长期可检索的资料库。底层尝试用 [OpenKB](https://github.com/VectifyAI/OpenKB) —— 不依赖向量库,自动生成知识库,可对接 Obsidian,支持多模态。
```

- [ ] **Step 3: 创建 content/curious/card.md**

```markdown
---
num: "02"
heading: 我感兴趣的事
empty: 正在整理中 —— 大模型、知识管理、安静的工具。
---
```

(无 `##`,正文为空 → 渲染 empty 字段)

- [ ] **Step 4: 创建 content/works/card.md**

```markdown
---
num: "03"
heading: 我的成果
empty: 敬请期待。
---
```

- [ ] **Step 5: 提交**

```bash
git add content/
git commit -m "content: seed hero and section cards from current page.tsx"
```

---

## Task 4: 实现并测试 parseHero(纯函数)

**Files:**
- Create: `src/lib/content.ts`(增量,先只写 parseHero 和类型)
- Test: `src/lib/__tests__/content.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/lib/__tests__/content.test.ts`:

```ts
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
```

- [ ] **Step 2: 跑测试,确认失败**

Run: `npm test`
Expected: FAIL,`Cannot find module '@/lib/content'`。

- [ ] **Step 3: 实现 parseHero**

创建 `src/lib/content.ts`:

```ts
import matter from "gray-matter";
import { remark } from "remark";
import { visit } from "unist-util-visit";
import type { Root, Heading } from "mdast";

export type SectionSlug = "now" | "curious" | "works";

export interface HeroContent {
  kicker: string;
  subtitle: string;
  headline: string;
}

export interface SectionItem {
  title: string;
  meta?: string;
  desc: string;
}

export interface SectionContent {
  num: string;
  heading: string;
  empty: string;
  items: SectionItem[];
}

function plainText(node: { children?: Array<{ type: string; value?: string; children?: Array<{ type: string; value?: string }> }> }): string {
  let out = "";
  visit(node as Root, (n) => {
    if ((n as { type: string }).type === "text") {
      out += (n as { value: string }).value;
    }
  });
  return out;
}

export function parseHero(markdown: string): HeroContent {
  const { data, content } = matter(markdown);
  const tree = remark().parse(content) as Root;
  let headline = "";
  visit(tree, "heading", (node: Heading) => {
    if (node.depth === 1 && !headline) {
      headline = plainText(node).trim();
    }
  });
  return {
    kicker: String(data.kicker ?? ""),
    subtitle: String(data.subtitle ?? ""),
    headline,
  };
}
```

(Task 1 已显式装 `unist-util-visit`,直接 import 即可。)

- [ ] **Step 4: 跑测试,确认通过**

Run: `npm test`
Expected: 2 passed。

- [ ] **Step 5: lint + 类型检查**

Run: `npm run lint`
Expected: no errors。

- [ ] **Step 6: 提交**

```bash
git add src/lib/content.ts src/lib/__tests__/content.test.ts
git commit -m "feat(content): parseHero — extract kicker/subtitle/headline from markdown"
```

---

## Task 5: 实现并测试 parseSection(H2 切片 + meta 检测)

**Files:**
- Modify: `src/lib/content.ts`(追加 parseSection)
- Test: `src/lib/__tests__/content.test.ts`(追加 describe 块)

- [ ] **Step 1: 写失败测试**

在 `src/lib/__tests__/content.test.ts` 末尾追加:

```ts
import { parseSection } from "@/lib/content";

describe("parseSection", () => {
  const fm = ['---', 'num: "01"', 'heading: H', 'empty: E', "---"].join("\n");

  it("returns empty items when no H2 present", () => {
    const result = parseSection(fm + "\n\n");
    expect(result).toEqual({ num: "01", heading: "H", empty: "E", items: [] });
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
```

- [ ] **Step 2: 跑测试,确认 5 个新测试都 FAIL**

Run: `npm test`
Expected: 5 failed, 2 passed。

- [ ] **Step 3: 实现 parseSection**

追加到 `src/lib/content.ts`:

```ts
import { toMarkdown } from "mdast-util-to-markdown";
import type { RootContent, Paragraph, Emphasis } from "mdast";

function isMetaParagraph(node: RootContent): string | null {
  if (node.type !== "paragraph") return null;
  const p = node as Paragraph;
  if (p.children.length !== 1) return null;
  const only = p.children[0];
  if (only.type !== "emphasis") return null;
  const em = only as Emphasis;
  const text = plainText(em).trim();
  return text || null;
}

function stringifyChildren(children: RootContent[]): string {
  if (children.length === 0) return "";
  return toMarkdown({ type: "root", children }).trimEnd();
}

export function parseSection(markdown: string): SectionContent {
  const { data, content } = matter(markdown);
  const tree = remark().parse(content) as Root;

  const items: SectionItem[] = [];
  let currentTitle: string | null = null;
  let currentChildren: RootContent[] = [];

  const flush = (): void => {
    if (currentTitle === null) return;
    let meta: string | undefined;
    let descChildren = currentChildren;
    if (descChildren.length > 0) {
      const detected = isMetaParagraph(descChildren[0]);
      if (detected !== null) {
        meta = detected;
        descChildren = descChildren.slice(1);
      }
    }
    items.push({
      title: currentTitle,
      meta,
      desc: stringifyChildren(descChildren),
    });
    currentTitle = null;
    currentChildren = [];
  };

  for (const node of tree.children) {
    if (node.type === "heading" && (node as Heading).depth === 2) {
      flush();
      currentTitle = plainText(node as Heading).trim();
      currentChildren = [];
    } else if (currentTitle !== null) {
      currentChildren.push(node);
    }
  }
  flush();

  return {
    num: String(data.num ?? ""),
    heading: String(data.heading ?? ""),
    empty: String(data.empty ?? ""),
    items,
  };
}
```

(Task 1 已显式装 `mdast-util-to-markdown`。)

- [ ] **Step 4: 跑测试,全部通过**

Run: `npm test`
Expected: 7 passed。

- [ ] **Step 5: lint**

Run: `npm run lint`
Expected: no errors。

- [ ] **Step 6: 提交**

```bash
git add src/lib/content.ts src/lib/__tests__/content.test.ts
git commit -m "feat(content): parseSection — H2 splitting + italic meta detection"
```

---

## Task 6: 加 fs 读取层 loadHero / loadSection

**Files:**
- Modify: `src/lib/content.ts`(追加 fs 入口)

- [ ] **Step 1: 追加 fs 入口**

追加到 `src/lib/content.ts` 顶部 import 区:

```ts
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
```

追加到文件末尾:

```ts
const CONTENT_ROOT = path.join(process.cwd(), "content");

export async function loadHero(): Promise<HeroContent> {
  const md = await fs.readFile(path.join(CONTENT_ROOT, "hero.md"), "utf8");
  return parseHero(md);
}

export async function loadSection(slug: SectionSlug): Promise<SectionContent> {
  const md = await fs.readFile(path.join(CONTENT_ROOT, slug, "card.md"), "utf8");
  return parseSection(md);
}
```

- [ ] **Step 2: 确认现有 7 个测试仍通过**

Run: `npm test`
Expected: 7 passed(fs 入口本身不直接测,纯函数已覆盖)。

- [ ] **Step 3: 提交**

```bash
git add src/lib/content.ts
git commit -m "feat(content): loadHero / loadSection — server-only fs wrappers"
```

---

## Task 7: 创建 `<Markdown>` 组件

**Files:**
- Create: `src/components/Markdown.tsx`

- [ ] **Step 1: 写组件**

```tsx
import ReactMarkdown from "react-markdown";
import type { ComponentProps, ReactElement } from "react";

interface MarkdownProps {
  children: string;
}

const linkClass =
  "underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition";

function MarkdownLink(props: ComponentProps<"a">): ReactElement {
  const href = props.href ?? "";
  const external = /^https?:\/\//.test(href);
  return (
    <a
      {...props}
      className={linkClass}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    />
  );
}

export function Markdown({ children }: MarkdownProps): ReactElement {
  return (
    <ReactMarkdown components={{ a: MarkdownLink }}>{children}</ReactMarkdown>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: no errors。

- [ ] **Step 3: 提交**

```bash
git add src/components/Markdown.tsx
git commit -m "feat: <Markdown> component with styled links"
```

---

## Task 8: 改写 page.tsx,接通 markdown 数据流

**Files:**
- Modify: `src/app/page.tsx`(基本重写,但保留 Logo / PageShell / 视觉容器)

- [ ] **Step 1: 全文替换 page.tsx**

```tsx
import type { ReactElement, ReactNode } from "react";
import { ChevronDownLink } from "@/components/ChevronDownLink";
import { Logo } from "@/components/Logo";
import { Markdown } from "@/components/Markdown";
import {
  loadHero,
  loadSection,
  type SectionContent,
  type SectionSlug,
} from "@/lib/content";

const SECTION_ORDER: SectionSlug[] = ["now", "curious", "works"];

interface PageShellProps {
  id: string;
  next?: { href: string; label: string };
  children: ReactNode;
  showFooter?: boolean;
}

function PageShell({ id, next, children, showFooter }: PageShellProps): ReactElement {
  return (
    <section id={id} className="snap-start min-h-[100dvh] flex flex-col pt-14">
      <div className="flex-1 flex items-center">
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12 py-10">
          {children}
        </div>
      </div>
      {next ? (
        <div className="flex justify-center pb-8 sm:pb-10">
          <ChevronDownLink href={next.href} label={next.label} />
        </div>
      ) : showFooter ? (
        <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12 pb-6">
          <hr className="border-border mb-4" />
          <footer className="text-xs text-muted">
            © {new Date().getFullYear()} 佐纳
          </footer>
        </div>
      ) : null}
    </section>
  );
}

interface SectionPanelProps {
  section: SectionContent;
}

function SectionPanel({ section }: SectionPanelProps): ReactElement {
  return (
    <div className="rise" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-sm text-muted">{section.num}</span>
        <span className="h-px w-12 bg-border" aria-hidden />
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-10">
        {section.heading}
      </h2>

      {section.items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {section.items.map((item) => (
            <li
              key={item.title}
              className="group py-6 sm:py-7 grid sm:grid-cols-[10rem_1fr] gap-2 sm:gap-8 items-baseline"
            >
              <div className="flex flex-col">
                <span className="text-lg font-medium tracking-tight">{item.title}</span>
                {item.meta && (
                  <span className="text-xs text-muted mt-1">{item.meta}</span>
                )}
              </div>
              <div className="text-muted leading-relaxed">
                <Markdown>{item.desc}</Markdown>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted italic">{section.empty}</p>
      )}
    </div>
  );
}

export default async function Home(): Promise<ReactElement> {
  const hero = await loadHero();
  const sections = await Promise.all(SECTION_ORDER.map((slug) => loadSection(slug)));

  return (
    <>
      <div className="aurora" aria-hidden />
      <div className="grid-bg" aria-hidden />

      <PageShell id="top" next={{ href: "#now", label: `向下:${sections[0].heading}` }}>
        <header className="rise relative">
          <Logo
            strokeWidth={1.2}
            className="hidden sm:block pointer-events-none absolute -right-6 -top-10 h-72 w-72 lg:h-[22rem] lg:w-[22rem] text-foreground/[0.06]"
          />
          <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
            <span className="text-foreground/50">{"//"}</span>{"  "}
            {hero.kicker}
          </div>
          <h1 className="mt-8 max-w-2xl text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.25]">
            <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              {hero.headline}
            </span>
            <span className="caret" aria-hidden />
          </h1>
          <div className="mt-8 max-w-xl">
            <div className="h-px w-8 bg-foreground/40 mb-5" aria-hidden />
            <p className="text-base sm:text-lg text-muted leading-relaxed">
              {hero.subtitle}
            </p>
          </div>
        </header>
      </PageShell>

      {sections.map((section, i) => {
        const next = sections[i + 1];
        const nextSlug = SECTION_ORDER[i + 1];
        return (
          <PageShell
            key={SECTION_ORDER[i]}
            id={SECTION_ORDER[i]}
            next={next ? { href: `#${nextSlug}`, label: `向下:${next.heading}` } : undefined}
            showFooter={!next}
          >
            <SectionPanel section={section} />
          </PageShell>
        );
      })}
    </>
  );
}
```

- [ ] **Step 2: lint + 类型检查**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors。

- [ ] **Step 3: dev server 启动**

Run: `npm run dev`(后台)
打开 http://localhost:3000

- [ ] **Step 4: 视觉对比验证**

逐项核对:
- Hero kicker: `// PERSONAL · 2026`
- Hero 主标题:渐变 + 闪烁光标
- Hero 副标题:水平横线下灰色文字
- 版块 01 "我正在做的事":两个 items,OpenKB 是带下划线的链接,鼠标 hover 加深
- "知识整理" meta 出现在 "大模型知识库" 标题下方,小灰字
- 版块 02 / 03:无 items,显示 empty 文案斜体灰色
- 滚轮翻页正常,触屏滑动正常

如视觉不符,回 page.tsx 调,直到 1:1 对齐当前 main 分支视觉。

- [ ] **Step 5: 关 dev server,提交**

```bash
git add src/app/page.tsx
git commit -m "feat(page): drive Hero and section cards from markdown"
```

---

## Task 9: 删除已不再使用的常量定义,确保零残留

**Files:**
- Read: `src/app/page.tsx`(确认无遗留 sections 数组)

- [ ] **Step 1: grep 残留**

```bash
grep -n "SectionConfig\|SectionItemConfig" src/
```

Expected: no matches。若有,删除对应代码。

- [ ] **Step 2: lint**

Run: `npm run lint`
Expected: clean。

- [ ] **Step 3: 跑构建确认通过**

Run: `npm run build`
Expected: 构建成功,主页标记为 `○ (Static)` 预渲染。

- [ ] **Step 4: 提交(如有清理)**

```bash
git add -A
git diff --cached --quiet && echo "nothing to commit" || git commit -m "chore: remove dead SectionConfig/SectionItemConfig"
```

---

## Task 10: Phase 1 收尾 — 验证 + 提交 CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md`(更新「主页是数据驱动的」一节)

- [ ] **Step 1: 找出当前 CLAUDE.md 中提到 `sections` 数组的段落**

```bash
grep -n "sections" CLAUDE.md
```

预期定位到「主页是数据驱动的」一节。

- [ ] **Step 2: 替换为指向新位置**

把那一节改成:

```markdown
**2. 主页是数据驱动的**

主页正文来自 `content/` 下的 markdown 文件:
- [content/hero.md](content/hero.md) — Hero 区(frontmatter `kicker`/`subtitle`,正文 H1 是主标题)
- [content/<section>/card.md](content/) — 三个版块的卡片内容(frontmatter `num`/`heading`/`empty`,`##` 拆 items,紧跟 `##` 后的独立 `*斜体*` 段被识别为 item 的 meta)

加载逻辑在 [src/lib/content.ts](src/lib/content.ts),由 [src/app/page.tsx](src/app/page.tsx) 在 Server Component 中 await 调用。改文案只动 markdown,改渲染才动 `page.tsx`。
```

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md — point to markdown content sources"
```

**Phase 1 完成。此时主页内容完全由 markdown 驱动,且视觉与之前一致。**

---

# Phase 2: Obsidian 风格详情页 wiki

## Task 11: 安装 Phase 2 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装**

```bash
npm install remark-gfm unist-util-visit github-slugger
```

(`unist-util-visit` 可能已是传递依赖;显式声明更清晰。)

- [ ] **Step 2: 验证 build 仍通过**

Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add remark-gfm, unist-util-visit, github-slugger for wiki layer"
```

---

## Task 12: 附件复制脚本 + npm 钩子

**Files:**
- Create: `scripts/copy-attachments.mjs`
- Create: `content/_attachments/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: 写脚本**

创建 `scripts/copy-attachments.mjs`:

```js
import { cp, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(root, "..", "content", "_attachments");
const dst = path.resolve(root, "..", "public", "_attachments");

try {
  await access(src);
} catch {
  console.log("[copy-attachments] no content/_attachments/, skipping");
  process.exit(0);
}

await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });
await cp(src, dst, { recursive: true });
console.log(`[copy-attachments] ${src} → ${dst}`);
```

- [ ] **Step 2: 创建 .gitkeep**

```bash
mkdir -p content/_attachments
touch content/_attachments/.gitkeep
```

- [ ] **Step 3: 挂 npm 钩子**

修改 `package.json` 的 `scripts`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "predev": "node scripts/copy-attachments.mjs",
  "prebuild": "node scripts/copy-attachments.mjs"
}
```

- [ ] **Step 4: 把 public/_attachments/ 加入 gitignore**

修改 `.gitignore`,添加一行:

```
/public/_attachments/
```

- [ ] **Step 5: 验证脚本能跑**

Run: `node scripts/copy-attachments.mjs`
Expected: 输出 "no content/_attachments/..." 或 "/path → /path"。

- [ ] **Step 6: 提交**

```bash
git add scripts/ content/_attachments/.gitkeep package.json .gitignore
git commit -m "build: copy content/_attachments → public/_attachments on dev/build"
```

---

## Task 13: 实现并测试 vault 索引(纯函数)

**Files:**
- Create: `src/lib/vault.ts`
- Test: `src/lib/__tests__/vault.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/lib/__tests__/vault.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildVault, type NoteRef } from "@/lib/vault";

function note(section: NoteRef["section"], slug: string, opts: Partial<NoteRef> = {}): NoteRef {
  return {
    section,
    slug,
    title: opts.title ?? slug,
    aliases: opts.aliases ?? [],
    fsPath: opts.fsPath ?? `/fake/${section}/${slug}.md`,
    isIndex: opts.isIndex ?? false,
  };
}

describe("buildVault", () => {
  it("indexes notes by section/slug key", () => {
    const v = buildVault([note("now", "foo")], new Map());
    expect(v.byKey.get("now/foo")?.slug).toBe("foo");
  });

  it("indexes filenames as aliases (lowercased)", () => {
    const v = buildVault([note("now", "Foo")], new Map());
    expect(v.byAlias.get("foo")).toBe("now/Foo");
  });

  it("indexes explicit aliases (lowercased)", () => {
    const v = buildVault([note("now", "x", { aliases: ["Bar", "BAZ"] })], new Map());
    expect(v.byAlias.get("bar")).toBe("now/x");
    expect(v.byAlias.get("baz")).toBe("now/x");
  });

  it("builds backlinks from [[target]] references", () => {
    const a = note("now", "a");
    const b = note("now", "b");
    const bodies = new Map([
      ["now/a", "see [[b]]"],
      ["now/b", ""],
    ]);
    const v = buildVault([a, b], bodies);
    expect(v.backlinks.get("now/b")?.map((n) => n.slug)).toEqual(["a"]);
  });

  it("resolves [[target]] cross-section via alias map", () => {
    const a = note("now", "a");
    const b = note("works", "b");
    const bodies = new Map([
      ["now/a", "see [[b]]"],
      ["works/b", ""],
    ]);
    const v = buildVault([a, b], bodies);
    expect(v.backlinks.get("works/b")?.map((n) => `${n.section}/${n.slug}`)).toEqual([
      "now/a",
    ]);
  });

  it("excludes card.md and INDEX.md from byKey", () => {
    const card = note("now", "card");
    const index = note("now", "INDEX", { isIndex: true });
    const real = note("now", "real");
    const v = buildVault([card, index, real], new Map());
    expect(v.byKey.has("now/card")).toBe(false);
    expect(v.byKey.has("now/INDEX")).toBe(false);
    expect(v.byKey.has("now/real")).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试,确认 FAIL**

Run: `npm test`
Expected: 6 failed (module not found)。

- [ ] **Step 3: 实现 buildVault**

创建 `src/lib/vault.ts`:

```ts
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import type { SectionSlug } from "@/lib/content";

export interface NoteRef {
  section: SectionSlug;
  slug: string;
  title: string;
  aliases: string[];
  fsPath: string;
  isIndex: boolean;
}

export interface VaultIndex {
  byKey: Map<string, NoteRef>;
  byAlias: Map<string, string>;
  backlinks: Map<string, NoteRef[]>;
}

const SECTIONS: SectionSlug[] = ["now", "curious", "works"];
const CONTENT_ROOT = path.join(process.cwd(), "content");

const WIKI_LINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;

function isExcluded(slug: string): boolean {
  return slug === "card" || slug === "INDEX";
}

export function buildVault(
  notes: NoteRef[],
  bodies: Map<string, string>,
): VaultIndex {
  const byKey = new Map<string, NoteRef>();
  const byAlias = new Map<string, string>();
  const backlinks = new Map<string, NoteRef[]>();

  for (const note of notes) {
    const key = `${note.section}/${note.slug}`;
    if (!isExcluded(note.slug)) {
      byKey.set(key, note);
      byAlias.set(note.slug.toLowerCase(), key);
      for (const alias of note.aliases) {
        byAlias.set(alias.toLowerCase(), key);
      }
    }
  }

  for (const note of notes) {
    const sourceKey = `${note.section}/${note.slug}`;
    const body = bodies.get(sourceKey);
    if (!body) continue;
    for (const m of body.matchAll(WIKI_LINK_RE)) {
      const targetRaw = m[1].trim().toLowerCase();
      const targetKey =
        byAlias.get(`${note.section}/${targetRaw}`.toLowerCase()) ??
        byAlias.get(targetRaw);
      if (!targetKey) continue;
      if (!backlinks.has(targetKey)) backlinks.set(targetKey, []);
      const list = backlinks.get(targetKey)!;
      if (!list.some((n) => n.section === note.section && n.slug === note.slug)) {
        list.push(note);
      }
    }
  }

  return { byKey, byAlias, backlinks };
}

async function readNote(section: SectionSlug, file: string): Promise<{ ref: NoteRef; body: string }> {
  const fsPath = path.join(CONTENT_ROOT, section, file);
  const raw = await fs.readFile(fsPath, "utf8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.md$/, "");
  const aliases: string[] = Array.isArray(data.aliases)
    ? data.aliases.map((a: unknown) => String(a))
    : [];
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : (content.match(/^#\s+(.+)$/m)?.[1].trim() ?? slug);
  return {
    ref: {
      section,
      slug,
      title,
      aliases,
      fsPath,
      isIndex: slug === "INDEX",
    },
    body: content,
  };
}

export const loadVault = cache(async (): Promise<VaultIndex> => {
  const notes: NoteRef[] = [];
  const bodies = new Map<string, string>();
  for (const section of SECTIONS) {
    const dir = path.join(CONTENT_ROOT, section);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const { ref, body } = await readNote(section, entry);
      notes.push(ref);
      bodies.set(`${ref.section}/${ref.slug}`, body);
    }
  }
  return buildVault(notes, bodies);
});

export async function loadNoteBody(section: SectionSlug, slug: string): Promise<{ ref: NoteRef; body: string } | null> {
  try {
    return await readNote(section, `${slug}.md`);
  } catch {
    return null;
  }
}
```

注意 `WIKI_LINK_RE` 是粗匹配,只为构建反链;真正的解析在 remark 插件里做。

- [ ] **Step 4: 跑测试**

Run: `npm test`
Expected: 6 passed (vault) + 之前 7 个 (content) = 13 passed。

- [ ] **Step 5: 提交**

```bash
git add src/lib/vault.ts src/lib/__tests__/vault.test.ts
git commit -m "feat(vault): scan content/, build alias map and backlink index"
```

---

## Task 14: 写并测试 wiki-link resolver(纯函数)

**Files:**
- Create: `src/lib/remark-wiki-link.ts`(只放 resolveWikiLink 纯函数)
- Test: `src/lib/__tests__/remark-wiki-link.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/lib/__tests__/remark-wiki-link.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveWikiLink } from "@/lib/remark-wiki-link";
import { buildVault, type NoteRef } from "@/lib/vault";
import type { VaultIndex } from "@/lib/vault";

function makeVault(notes: NoteRef[]): VaultIndex {
  return buildVault(notes, new Map());
}

const N = (section: NoteRef["section"], slug: string, aliases: string[] = []): NoteRef => ({
  section,
  slug,
  title: slug,
  aliases,
  fsPath: "",
  isIndex: false,
});

describe("resolveWikiLink", () => {
  const vault = makeVault([
    N("now", "alpha", ["aleph"]),
    N("now", "beta"),
    N("works", "gamma"),
  ]);
  const opts = { currentSection: "now" as const, vault, attachmentBase: "/_attachments" };

  it("resolves same-section name", () => {
    const r = resolveWikiLink("alpha", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha", text: "alpha" });
  });

  it("resolves with alias text", () => {
    const r = resolveWikiLink("alpha|看这", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha", text: "看这" });
  });

  it("resolves cross-section via alias map", () => {
    const r = resolveWikiLink("gamma", opts);
    expect(r).toEqual({ kind: "internal", url: "/works/gamma", text: "gamma" });
  });

  it("resolves cross-section explicit path", () => {
    const r = resolveWikiLink("../works/gamma", opts);
    expect(r).toEqual({ kind: "internal", url: "/works/gamma", text: "gamma" });
  });

  it("resolves heading anchor on target", () => {
    const r = resolveWikiLink("alpha#Setup", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha#setup", text: "alpha > Setup" });
  });

  it("resolves same-page anchor", () => {
    const r = resolveWikiLink("#Setup", opts);
    expect(r).toEqual({ kind: "anchor", url: "#setup", text: "Setup" });
  });

  it("resolves frontmatter alias to target", () => {
    const r = resolveWikiLink("aleph", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha", text: "aleph" });
  });

  it("marks broken when target not found", () => {
    const r = resolveWikiLink("ghost", opts);
    expect(r.kind).toBe("broken");
    expect(r.url).toBe("");
    expect(r.text).toBe("ghost");
  });
});
```

- [ ] **Step 2: 跑测试,确认 FAIL**

Run: `npm test`
Expected: 8 new failures。

- [ ] **Step 3: 实现 resolveWikiLink**

创建 `src/lib/remark-wiki-link.ts`:

```ts
import GithubSlugger from "github-slugger";
import type { SectionSlug } from "@/lib/content";
import type { VaultIndex } from "@/lib/vault";

export interface WikiLinkOptions {
  currentSection: SectionSlug;
  vault: VaultIndex;
  attachmentBase: string;
}

export interface ResolvedWikiLink {
  kind: "internal" | "anchor" | "broken";
  url: string;
  text: string;
}

interface ParsedWikiLink {
  target: string;        // "" if same-page
  heading?: string;
  display?: string;
}

export function parseWikiLink(raw: string): ParsedWikiLink {
  const [linkPart, ...displayParts] = raw.split("|");
  const display = displayParts.length > 0 ? displayParts.join("|").trim() : undefined;
  const hashIdx = linkPart.indexOf("#");
  if (hashIdx === -1) {
    return { target: linkPart.trim(), display };
  }
  const target = linkPart.slice(0, hashIdx).trim();
  const heading = linkPart.slice(hashIdx + 1).trim();
  return { target, heading, display };
}

function slugifyHeading(heading: string): string {
  return new GithubSlugger().slug(heading);
}

export function resolveWikiLink(
  raw: string,
  options: WikiLinkOptions,
): ResolvedWikiLink {
  const { target, heading, display } = parseWikiLink(raw);

  // Same-page anchor: [[#Heading]]
  if (target === "" && heading) {
    return {
      kind: "anchor",
      url: `#${slugifyHeading(heading)}`,
      text: display ?? heading,
    };
  }

  // Explicit cross-section path: [[../works/x]]
  let resolvedKey: string | undefined;
  const explicit = target.match(/^\.\.\/(now|curious|works)\/(.+)$/);
  if (explicit) {
    const tryKey = `${explicit[1]}/${explicit[2]}`;
    if (options.vault.byKey.has(tryKey)) resolvedKey = tryKey;
  } else {
    const local = `${options.currentSection}/${target.toLowerCase()}`;
    resolvedKey =
      options.vault.byAlias.get(local) ??
      options.vault.byAlias.get(target.toLowerCase());
  }

  if (!resolvedKey) {
    return { kind: "broken", url: "", text: display ?? target };
  }

  const note = options.vault.byKey.get(resolvedKey);
  const displayBase = display ?? note?.title ?? target;
  const url = heading
    ? `/${resolvedKey}#${slugifyHeading(heading)}`
    : `/${resolvedKey}`;
  const text = heading && !display ? `${displayBase} > ${heading}` : displayBase;

  return { kind: "internal", url, text };
}
```

注:`title` 在 `NoteRef` 默认是 slug,所以 `text: displayBase` 在简单测试用例里和 target 相同。

- [ ] **Step 4: 跑测试**

Run: `npm test`
Expected: all passing (13 + 8 = 21)。

- [ ] **Step 5: 提交**

```bash
git add src/lib/remark-wiki-link.ts src/lib/__tests__/remark-wiki-link.test.ts
git commit -m "feat(wiki): resolveWikiLink — handle [[name]], aliases, anchors, cross-section"
```

---

## Task 15: 把 resolver 包成 unified/remark 插件

**Files:**
- Modify: `src/lib/remark-wiki-link.ts`(追加 remark 插件 export)

- [ ] **Step 1: 追加插件实现**

在 `src/lib/remark-wiki-link.ts` 末尾追加:

```ts
import { visit } from "unist-util-visit";
import type { Root, Text, Parent, Link, Image, RootContent } from "mdast";
import type { Plugin } from "unified";

const WIKI_TOKEN_RE = /(!?)\[\[([^\]]+)\]\]/g;

function makeLinkNode(target: ResolvedWikiLink): Link {
  return {
    type: "link",
    url: target.url || "#",
    title: target.kind === "broken" ? "broken wiki link" : null,
    data: {
      hProperties:
        target.kind === "broken"
          ? { className: ["wiki-link-broken"] }
          : { className: ["wiki-link"] },
    },
    children: [{ type: "text", value: target.text }],
  };
}

function makeImageNode(raw: string, options: WikiLinkOptions): Image {
  const [file, ...altParts] = raw.split("|");
  return {
    type: "image",
    url: `${options.attachmentBase}/${file.trim()}`,
    alt: altParts.length > 0 ? altParts.join("|").trim() : file.trim(),
    title: null,
  };
}

export const remarkWikiLink: Plugin<[WikiLinkOptions], Root> = (options) => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const value = node.value;
      WIKI_TOKEN_RE.lastIndex = 0;
      const matches = [...value.matchAll(WIKI_TOKEN_RE)];
      if (matches.length === 0) return;

      const replacement: RootContent[] = [];
      let cursor = 0;
      for (const m of matches) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        if (start > cursor) {
          replacement.push({ type: "text", value: value.slice(cursor, start) });
        }
        const isImage = m[1] === "!";
        const inner = m[2];
        if (isImage) {
          replacement.push(makeImageNode(inner, options));
        } else {
          replacement.push(makeLinkNode(resolveWikiLink(inner, options)));
        }
        cursor = end;
      }
      if (cursor < value.length) {
        replacement.push({ type: "text", value: value.slice(cursor) });
      }
      (parent as Parent).children.splice(index, 1, ...replacement);
      return index + replacement.length;
    });
  };
};
```

- [ ] **Step 2: 加集成测试,跑一次完整 unified 流水线**

在 `src/lib/__tests__/remark-wiki-link.test.ts` 末尾追加:

```ts
import { remark } from "remark";
import { remarkWikiLink } from "@/lib/remark-wiki-link";

describe("remarkWikiLink plugin", () => {
  const vault = makeVault([N("now", "alpha")]);
  const opts = { currentSection: "now" as const, vault, attachmentBase: "/_attachments" };

  function run(input: string): string {
    const tree = remark().use(remarkWikiLink, opts).parse(input);
    const processed = remark().use(remarkWikiLink, opts).runSync(tree);
    return remark().stringify(processed);
  }

  it("rewrites [[alpha]] to a markdown link", () => {
    const out = run("see [[alpha]] now");
    expect(out).toContain("[alpha](/now/alpha)");
  });

  it("rewrites ![[image.png]] to an image", () => {
    const out = run("![[demo.png]]");
    expect(out).toContain("![demo.png](/_attachments/demo.png)");
  });

  it("leaves non-wiki text untouched", () => {
    const out = run("hello world").trim();
    expect(out).toBe("hello world");
  });
});
```

- [ ] **Step 3: 跑测试**

Run: `npm test`
Expected: 24 passed。

- [ ] **Step 4: 提交**

```bash
git add src/lib/remark-wiki-link.ts src/lib/__tests__/remark-wiki-link.test.ts
git commit -m "feat(wiki): remark plugin — rewrite [[..]] and ![[..]] tokens in MDAST"
```

---

## Task 16: 把 SnapScroller 从全局挪到首页

**Files:**
- Modify: `src/app/layout.tsx`(删 `<SnapScroller />`)
- Modify: `src/app/page.tsx`(加 `<SnapScroller />`)

- [ ] **Step 1: 改 layout.tsx**

删除这两行(import 和 JSX 中的元素):

```tsx
import { SnapScroller } from "@/components/SnapScroller";
...
<SnapScroller />
```

- [ ] **Step 2: 改 page.tsx**

在 `page.tsx` 顶部 import 加:

```tsx
import { SnapScroller } from "@/components/SnapScroller";
```

在 `return (` 后的 `<>` 内、`aurora` 之前加:

```tsx
<SnapScroller />
```

- [ ] **Step 3: dev 检查首页翻页仍正常**

Run: `npm run dev`
打开 http://localhost:3000,滚轮翻页应仍工作。

- [ ] **Step 4: 提交**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "refactor(scroll): scope SnapScroller to homepage only"
```

---

## Task 17: 加 `.prose` 详情页正文样式

**Files:**
- Modify: `src/app/globals.css`(追加 .prose 块)

- [ ] **Step 1: 在 globals.css 末尾追加**

```css
/* ─── 详情页正文(.prose) ────────────────────────── */
.prose {
  max-width: 65ch;
  line-height: 1.7;
  color: var(--foreground);
}
.prose h1 {
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 2rem 0 1rem;
}
.prose h2 {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin: 2.5rem 0 1rem;
  scroll-margin-top: 5rem;
}
.prose h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 2rem 0 0.75rem;
  scroll-margin-top: 5rem;
}
.prose p {
  margin: 1rem 0;
  color: var(--muted);
}
.prose a {
  color: var(--foreground);
  text-decoration: underline;
  text-decoration-color: rgb(0 0 0 / 0.3);
  text-underline-offset: 4px;
  transition: text-decoration-color 0.2s;
}
.prose a:hover {
  text-decoration-color: currentColor;
}
.prose ul, .prose ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: var(--muted);
}
.prose li {
  margin: 0.25rem 0;
}
.prose img {
  border-radius: 0.5rem;
  margin: 1.5rem 0;
  max-width: 100%;
  height: auto;
}
.prose table {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: collapse;
  font-size: 0.95em;
}
.prose th, .prose td {
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.prose th {
  font-weight: 600;
}
.prose code {
  background: rgb(0 0 0 / 0.06);
  padding: 0.1em 0.3em;
  border-radius: 0.25rem;
  font-size: 0.92em;
  font-family: var(--font-mono);
}
.prose pre {
  background: rgb(0 0 0 / 0.06);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
.prose pre code {
  background: transparent;
  padding: 0;
}
.prose .wiki-link-broken {
  color: #c0392b;
  text-decoration: line-through;
}
@media (prefers-color-scheme: dark) {
  .prose code, .prose pre {
    background: rgb(255 255 255 / 0.08);
  }
  .prose .wiki-link-broken {
    color: #ff6b6b;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/globals.css
git commit -m "feat(prose): typography for detail pages and broken-link style"
```

---

## Task 18: 创建 `<NoteShell>` + `<Backlinks>` 组件

**Files:**
- Create: `src/components/NoteShell.tsx`
- Create: `src/components/Backlinks.tsx`

- [ ] **Step 1: 写 Backlinks**

创建 `src/components/Backlinks.tsx`:

```tsx
import Link from "next/link";
import type { ReactElement } from "react";
import type { NoteRef } from "@/lib/vault";

interface BacklinksProps {
  links: NoteRef[];
}

export function Backlinks({ links }: BacklinksProps): ReactElement | null {
  if (links.length === 0) return null;
  return (
    <aside className="mt-16 pt-8 border-t border-border">
      <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted mb-4">
        被引用
      </h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {links.map((n) => (
          <li key={`${n.section}/${n.slug}`}>
            <Link
              href={`/${n.section}/${n.slug}`}
              className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition"
            >
              {n.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 2: 写 NoteShell**

创建 `src/components/NoteShell.tsx`:

```tsx
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

interface NoteShellProps {
  section: string;        // section slug, e.g., "now"
  sectionHeading: string; // human heading, e.g., "我正在做的事"
  noteTitle?: string;     // omit for INDEX
  children: ReactNode;
  backlinks?: ReactNode;
}

export function NoteShell({
  section,
  sectionHeading,
  noteTitle,
  children,
  backlinks,
}: NoteShellProps): ReactElement {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 sm:px-8 lg:px-12 pt-24 pb-16">
      <nav className="mb-10 flex items-center gap-3 font-mono text-xs tracking-[0.2em] uppercase text-muted">
        <Link
          href={`/#${section}`}
          className="hover:text-foreground transition"
          aria-label="返回主页对应版块"
        >
          ← 返回
        </Link>
        <span aria-hidden>·</span>
        <span>{sectionHeading}</span>
        {noteTitle && (
          <>
            <span aria-hidden>·</span>
            <span className="text-foreground/80 normal-case tracking-normal">
              {noteTitle}
            </span>
          </>
        )}
      </nav>
      <article className="prose">{children}</article>
      {backlinks}
    </div>
  );
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: clean。

- [ ] **Step 4: 提交**

```bash
git add src/components/NoteShell.tsx src/components/Backlinks.tsx
git commit -m "feat(components): NoteShell + Backlinks for detail pages"
```

---

## Task 19: 加一个 `<NoteRenderer>` 把 markdown + wiki 插件渲染成 React

**Files:**
- Create: `src/components/NoteRenderer.tsx`

- [ ] **Step 1: 写组件**

```tsx
/* eslint-disable @next/next/no-img-element */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import type { ComponentProps, ReactElement } from "react";
import { remarkWikiLink } from "@/lib/remark-wiki-link";
import type { VaultIndex } from "@/lib/vault";
import type { SectionSlug } from "@/lib/content";

interface NoteRendererProps {
  body: string;
  currentSection: SectionSlug;
  vault: VaultIndex;
}

function headingId(children: React.ReactNode): string {
  const text = typeof children === "string" ? children : String(children);
  return new GithubSlugger().slug(text);
}

function H2(props: ComponentProps<"h2">): ReactElement {
  return <h2 {...props} id={typeof props.children === "string" ? headingId(props.children) : undefined} />;
}
function H3(props: ComponentProps<"h3">): ReactElement {
  return <h3 {...props} id={typeof props.children === "string" ? headingId(props.children) : undefined} />;
}

function MdImage(props: ComponentProps<"img">): ReactElement {
  return <img {...props} alt={props.alt ?? ""} loading="lazy" decoding="async" />;
}

export function NoteRenderer({ body, currentSection, vault }: NoteRendererProps): ReactElement {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkWikiLink, { currentSection, vault, attachmentBase: "/_attachments" }]]}
      components={{ h2: H2, h3: H3, img: MdImage }}
    >
      {body}
    </ReactMarkdown>
  );
}
```

**关于 `<img>` 而非 `next/image`**:`next/image` 要求构建期已知 `width`/`height`,markdown 流是动态的(任意尺寸的附件),给一个假尺寸会触发 aspect-ratio 警告。本期为简单起见用原生 `<img>` + `loading="lazy"`,在文件顶部局部禁用 `@next/next/no-img-element` lint 规则。若以后想做图片优化再切回 `next/image`(届时需要在前置 pipeline 里探测尺寸)。

**关于 heading id**:每次 H2/H3 渲染时新建一个 `GithubSlugger` —— 这导致单文档内重复 H2 会有相同 id(无 `-1`/`-2` 后缀)。本期接受此妥协(同名 heading 是写作问题不是渲染问题)。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: clean。

- [ ] **Step 3: 提交**

```bash
git add src/components/NoteRenderer.tsx
git commit -m "feat(components): NoteRenderer — markdown + GFM + wiki-links + next/image"
```

---

## Task 20: 创建 `/[section]` 路由(渲染 INDEX.md)

**Files:**
- Create: `src/app/[section]/page.tsx`

- [ ] **Step 1: 写路由**

创建 `src/app/[section]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { Metadata } from "next";
import { NoteShell } from "@/components/NoteShell";
import { NoteRenderer } from "@/components/NoteRenderer";
import { Backlinks } from "@/components/Backlinks";
import { loadVault, loadNoteBody } from "@/lib/vault";
import { loadSection, type SectionSlug } from "@/lib/content";

const SECTIONS: SectionSlug[] = ["now", "curious", "works"];

export function generateStaticParams(): Array<{ section: string }> {
  return SECTIONS.map((s) => ({ section: s }));
}

interface PageProps {
  params: Promise<{ section: string }>;
}

function isSectionSlug(s: string): s is SectionSlug {
  return (SECTIONS as string[]).includes(s);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (!isSectionSlug(section)) return {};
  const card = await loadSection(section);
  return { title: `${card.heading} — 佐纳` };
}

export default async function SectionIndexPage({ params }: PageProps): Promise<ReactElement> {
  const { section } = await params;
  if (!isSectionSlug(section)) notFound();

  const note = await loadNoteBody(section, "INDEX");
  if (!note) notFound();

  const card = await loadSection(section);
  const vault = await loadVault();
  const indexKey = `${section}/INDEX`;
  const incoming = vault.backlinks.get(indexKey) ?? [];

  return (
    <NoteShell
      section={section}
      sectionHeading={card.heading}
      noteTitle={undefined}
      backlinks={<Backlinks links={incoming} />}
    >
      <NoteRenderer body={note.body} currentSection={section} vault={vault} />
    </NoteShell>
  );
}
```

- [ ] **Step 2: 加最小 INDEX.md 测试样本**

创建 `content/now/INDEX.md`:

```markdown
---
title: 我正在做的事
---

# 我正在做的事

这里之后会写详细的内容。先放个占位的链接 [[test-note]]。
```

创建 `content/now/test-note.md`:

```markdown
---
title: 测试笔记
---

# 测试笔记

这是一篇用来打通流水线的笔记。
```

- [ ] **Step 3: 启动 dev,访问 /now**

Run: `npm run dev`
打开 http://localhost:3000/now

Expected:
- 顶部:`← 返回 · 我正在做的事`
- 大标题 "我正在做的事"
- 段落里 `test-note` 是一个可点击的链接,指向 `/now/test-note`(虽然该路由还没建,先不点)

- [ ] **Step 4: 提交**

```bash
git add src/app/[section]/ content/now/INDEX.md content/now/test-note.md
git commit -m "feat(route): /[section] renders INDEX.md with backlinks"
```

---

## Task 21: 创建 `/[section]/[slug]` 路由(单篇笔记)

**Files:**
- Create: `src/app/[section]/[slug]/page.tsx`

- [ ] **Step 1: 写路由**

创建 `src/app/[section]/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { Metadata } from "next";
import { NoteShell } from "@/components/NoteShell";
import { NoteRenderer } from "@/components/NoteRenderer";
import { Backlinks } from "@/components/Backlinks";
import { loadVault, loadNoteBody } from "@/lib/vault";
import { loadSection, type SectionSlug } from "@/lib/content";

const SECTIONS: SectionSlug[] = ["now", "curious", "works"];

export async function generateStaticParams(): Promise<Array<{ section: string; slug: string }>> {
  const vault = await loadVault();
  return [...vault.byKey.values()].map((n) => ({
    section: n.section,
    slug: n.slug,
  }));
}

interface PageProps {
  params: Promise<{ section: string; slug: string }>;
}

function isSectionSlug(s: string): s is SectionSlug {
  return (SECTIONS as string[]).includes(s);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  if (!isSectionSlug(section)) return {};
  const note = await loadNoteBody(section, slug);
  if (!note) return {};
  return { title: `${note.ref.title} — 佐纳` };
}

export default async function NotePage({ params }: PageProps): Promise<ReactElement> {
  const { section, slug } = await params;
  if (!isSectionSlug(section) || slug === "INDEX" || slug === "card") notFound();

  const note = await loadNoteBody(section, slug);
  if (!note) notFound();

  const card = await loadSection(section);
  const vault = await loadVault();
  const incoming = vault.backlinks.get(`${section}/${slug}`) ?? [];

  return (
    <NoteShell
      section={section}
      sectionHeading={card.heading}
      noteTitle={note.ref.title}
      backlinks={<Backlinks links={incoming} />}
    >
      <NoteRenderer body={note.body} currentSection={section} vault={vault} />
    </NoteShell>
  );
}
```

- [ ] **Step 2: dev 验证**

Run: `npm run dev`
- 访问 `/now/test-note`,看到测试笔记内容
- 在 `/now` 点 `[[test-note]]` 跳转,验证导航工作
- 看 `/now/test-note` 底部的 "被引用",应显示 INDEX 的链接(INDEX 标题是 "我正在做的事",会作为反链显示)

注:INDEX 被 buildVault 排除在 byKey 之外,但反链记录里 INDEX 可以作为"引用源" —— 因为 backlinks 的 value 是 source `NoteRef`,不是 target。这里需要再次审视代码:`buildVault` 里循环 `notes` 时,INDEX 也参与了反链产出。是的,看 Task 13 实现:循环 `notes`(全部,包括 INDEX),只跳过 `isExcluded(target)`。所以 INDEX 是 source 可以出现在 backlinks 里。

但目前 `NoteRef.title` 对 INDEX 来说会是 frontmatter title("我正在做的事")或者 H1 文本。点 INDEX 类型的反链应该跳到 `/now`,不是 `/now/INDEX`。需要在 Backlinks 组件里做特殊化处理。

- [ ] **Step 3: 修复 Backlinks 对 INDEX 的链接**

修改 `src/components/Backlinks.tsx` 的 Link href:

```tsx
<Link
  href={n.isIndex ? `/${n.section}` : `/${n.section}/${n.slug}`}
  ...
```

- [ ] **Step 4: 再次验证 /now/test-note 底部反链点过去到 /now**

打开 `/now/test-note`,点 "被引用" 区里的 "我正在做的事",应跳到 `/now`。

- [ ] **Step 5: 提交**

```bash
git add src/app/[section]/[slug]/ src/components/Backlinks.tsx
git commit -m "feat(route): /[section]/[slug] note pages with INDEX-aware backlinks"
```

---

## Task 22: 主页加 "深入 →" 入口

**Files:**
- Create: `src/components/DeepLink.tsx`
- Modify: `src/app/page.tsx`(向 SectionPanel 传入 hasIndex 标志,渲染按钮)

- [ ] **Step 1: 加一个 hasIndex 判断函数**

修改 `src/lib/vault.ts` 末尾追加:

```ts
export async function hasIndex(section: SectionSlug): Promise<boolean> {
  try {
    await fs.access(path.join(CONTENT_ROOT, section, "INDEX.md"));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: 写 DeepLink 组件**

创建 `src/components/DeepLink.tsx`:

```tsx
import Link from "next/link";
import type { ReactElement } from "react";

interface DeepLinkProps {
  href: string;
}

export function DeepLink({ href }: DeepLinkProps): ReactElement {
  return (
    <Link
      href={href}
      className="group mt-10 inline-flex items-center gap-2 text-sm font-mono tracking-[0.2em] uppercase text-muted hover:text-foreground transition"
    >
      <span>深入</span>
      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
```

- [ ] **Step 3: 在 page.tsx 中加载并传入**

修改 `src/app/page.tsx`:

import 新增:

```tsx
import { DeepLink } from "@/components/DeepLink";
import { hasIndex } from "@/lib/vault";
```

完整替换 `SectionPanel`:

```tsx
interface SectionPanelProps {
  section: SectionContent;
  deepHref?: string;
}

function SectionPanel({ section, deepHref }: SectionPanelProps): ReactElement {
  return (
    <div className="rise" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-sm text-muted">{section.num}</span>
        <span className="h-px w-12 bg-border" aria-hidden />
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-10">
        {section.heading}
      </h2>

      {section.items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {section.items.map((item) => (
            <li
              key={item.title}
              className="group py-6 sm:py-7 grid sm:grid-cols-[10rem_1fr] gap-2 sm:gap-8 items-baseline"
            >
              <div className="flex flex-col">
                <span className="text-lg font-medium tracking-tight">{item.title}</span>
                {item.meta && (
                  <span className="text-xs text-muted mt-1">{item.meta}</span>
                )}
              </div>
              <div className="text-muted leading-relaxed">
                <Markdown>{item.desc}</Markdown>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted italic">{section.empty}</p>
      )}

      {deepHref && <DeepLink href={deepHref} />}
    </div>
  );
}
```

`Home` 中并行加载 hasIndex:

```tsx
const [hero, sections, indexFlags] = await Promise.all([
  loadHero(),
  Promise.all(SECTION_ORDER.map((slug) => loadSection(slug))),
  Promise.all(SECTION_ORDER.map((slug) => hasIndex(slug))),
]);
```

并在 sections.map 中传:

```tsx
<SectionPanel
  section={section}
  deepHref={indexFlags[i] ? `/${SECTION_ORDER[i]}` : undefined}
/>
```

- [ ] **Step 4: dev 检查**

Run: `npm run dev`
- 主页 "我正在做的事" 卡片下方应出现 `深入 →`,鼠标悬停箭头右移
- "我感兴趣的事" / "我的成果" 没有 INDEX.md,不显示按钮
- 点 "深入" 跳到 `/now`

- [ ] **Step 5: 提交**

```bash
git add src/components/DeepLink.tsx src/app/page.tsx src/lib/vault.ts
git commit -m "feat(page): 深入 → entry on cards when INDEX.md exists"
```

---

## Task 23: 端到端 Obsidian 语法验证

**Files:**
- Modify: `content/now/test-note.md`(加多语法验证内容)
- Create: `content/now/_attachments/sample.png` —— 你可以从 public/favicon.ico 替换或用任意 100×100 png

- [ ] **Step 1: 把 test-note 改成 syntax 大全样本**

```markdown
---
title: 测试笔记
aliases: ["TN", "测试"]
---

# 测试笔记

跨版块: [[../works/none]] 应该是 broken,渲染红色删除线。

同段链接: [[#二级]](应跳到下面的二级)

跨页带锚点: [[test-note#二级]]

别名: 写 [[TN]] 跳到自身。

显式文本: [[test-note|看这个]]

嵌入图:

![[sample.png]]

| 列 1 | 列 2 |
| --- | --- |
| A | B |

## 二级

下面是二级。

### 三级

下面是三级。
```

- [ ] **Step 2: 放一张图到全局附件目录**

```bash
cp public/favicon.ico content/_attachments/sample.png
```

(用 favicon 当占位 png;实际应该是 .png 文件,但本步只验证管线 —— 浏览器会按 src 后缀判断,因 favicon.ico 实质是 ico 格式可能显示为破图,这一步只是建文件让 next/image 拿到非 404。如果你想干净点,放任何小 png。)

- [ ] **Step 3: 跑 predev 复制附件**

Run: `npm run predev`
Expected: 输出 `[copy-attachments] /content/_attachments → /public/_attachments`。

- [ ] **Step 4: dev 验证全套语法**

Run: `npm run dev`

逐项核对在 `/now/test-note`:
- [[../works/none]] → 红色删除线
- [[#二级]] → 点击页面平滑滚到 ## 二级
- [[test-note#二级]] → 点击跳转到当前页同一锚点 `/now/test-note#二级`
- [[TN]] → 跳到 `/now/test-note`,显示文本 "TN"(因为 TN 是 alias,resolveWikiLink 把 alias 拿来作为默认 displayBase)
- [[test-note|看这个]] → 渲染为"看这个",点击跳到 `/now/test-note`
- ![[sample.png]] → 渲染成图(broken 也行,关键看路径是 `/_attachments/sample.png`)
- table → 表格正常渲染
- 标题 `## 二级` 有 id="二级"(github-slugger 中文是直接保留,所以 id 是 `二级`,锚点 hash 也是 `#二级`)

- [ ] **Step 5: 浏览器 devtools 看链接 URL 是否正确**

右键 [[TN]] → check element,`<a href="/now/test-note">TN</a>` 即正确。
右键 `[[#二级]]`,`<a href="#二级">` 即正确。

- [ ] **Step 6: 关 dev,跑 build**

Run: `npm run build`
Expected: 构建成功,`/now`、`/now/test-note` 显示为预渲染静态页。

- [ ] **Step 7: 提交**

```bash
git add content/now/test-note.md content/_attachments/sample.png
git commit -m "test(content): end-to-end Obsidian syntax sample note"
```

---

## Task 24: 文档收尾

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 在 CLAUDE.md 「主页是数据驱动的」一节后追加新一节**

在 Phase 1 修改过的「2. 主页是数据驱动的」之后追加:

```markdown
**3. 详情页 wiki(Obsidian 风格)**

每个版块有可选的 `INDEX.md` + 任意笔记。结构 + URL 对应关系:

| 文件 | URL |
| --- | --- |
| `content/<section>/card.md` | 主页卡片(非独立 URL) |
| `content/<section>/INDEX.md` | `/<section>` |
| `content/<section>/<slug>.md` | `/<section>/<slug>` |
| `content/_attachments/<file>` | `/_attachments/<file>`(由 [scripts/copy-attachments.mjs](scripts/copy-attachments.mjs) 在 `predev`/`prebuild` 时复制) |

支持的 Obsidian 语法(由 [src/lib/remark-wiki-link.ts](src/lib/remark-wiki-link.ts) 实现):
- `[[note]]` — 解析当前版块 → 全局别名 → broken
- `[[note|显示]]` — 自定义显示文本
- `[[note#Heading]]` / `[[#Heading]]` — heading 锚点,锚 id 由 github-slugger 生成
- `[[../section/note]]` — 跨版块显式路径
- `![[image.png]]` — 嵌入 `/_attachments/image.png`(经 `next/image` 渲染)
- frontmatter `aliases: ["..."]` —— 可作为 `[[..]]` 的目标

全局索引(别名 + 反链)在 [src/lib/vault.ts](src/lib/vault.ts) 用 React `cache()` 缓存,构建期跑一次。

约束:
- `card.md` 和 `INDEX.md` **不**进 wikilink 索引(写 `[[card]]` / `[[INDEX]]` 不会匹配)
- 同名冲突时优先当前版块;仍多个 → 按 section 字典序;断链 → 红色删除线 + 控制台 warn
- 详情页**不**使用 snap-scroll;`SnapScroller` 已挪到 [src/app/page.tsx](src/app/page.tsx),仅在首页挂载

新增笔记 / 改文案:不用动代码,只动 `content/`。新增图片:放进 `content/_attachments/`,重启 `npm run dev`(`predev` 钩子会拷贝)。
```

- [ ] **Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md — describe detail-page wiki layer"
```

**Phase 2 完成。**

---

## 完成验证清单

最后跑一遍:

- [ ] `npm test` — 24 个测试全过
- [ ] `npm run lint` — 无错
- [ ] `npx tsc --noEmit` — 无错
- [ ] `npm run build` — 构建成功,主页 + `/now` + `/now/test-note` 均预渲染
- [ ] `npm run dev`,手动确认:
  - 主页视觉与改造前一致
  - "我正在做的事" 卡片下方出现 `深入 →`
  - 点击进入 `/now`,看到 INDEX 渲染
  - 点 `[[test-note]]` 进入笔记,所有 Obsidian 语法可用
  - 笔记底部反向链接区显示 INDEX 的引用
  - 浏览器后退 → 主页正常翻页 snap-scroll

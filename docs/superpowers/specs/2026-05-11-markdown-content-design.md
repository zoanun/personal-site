# 把主页正文外部化为 markdown — 设计文档

日期:2026-05-11
状态:已确认,待实施

## 背景

主页 [src/app/page.tsx](../../../src/app/page.tsx) 当前把所有文本(Hero 标题、副标题、三个版块的 heading 和 items)硬编码在 `sections: SectionConfig[]` 数组里。每次改文案都要动 `.tsx` 文件,触发完整重新构建,且对非编码场景(快速编辑、未来可能的 CMS)不友好。

目标:把页面正文搬到 markdown 文件,让作者改内容时只动 `content/` 目录下的 `.md` 文件,不碰 React 代码。

## 范围

**纳入外部化**:
- Hero:小标签(kicker)、主标题、副标题
- 三个版块:`num`(编号)、`heading`(版块大标题)、`items[]`(title / meta / desc)、`empty`(空状态文案)

**保留在代码里**:
- 翻页按钮的 `向下:xxx` 标签(由下一个版块的 `heading` 拼接而成)
- 版块编号到版块 slug 的固定顺序(由 `SECTION_IDS` 决定,JS 滚动逻辑需要)
- 视觉效果:Hero 的渐变文字 + 闪烁光标、`rise` 渐入动画、网格底纹、aurora 光晕

## 架构

```
content/                     ← 内容目录(repo 根,新增)
├── hero.md
├── now.md
├── curious.md
└── works.md

src/lib/content.ts           ← 读取 + 解析(Server-only)
src/components/Markdown.tsx  ← react-markdown 包装,统一注入样式
src/app/page.tsx             ← 改成 async,await 加载内容后渲染
```

**渲染管线**:
1. `page.tsx` 是 Server Component,改成 `async function Home()`。
2. 调用 `loadHero()` + `loadSection(slug)`(每个版块各一次),内部用 `fs.readFile` + `gray-matter` 解析。
3. 解析结果交给现有的 `<PageShell>` 渲染。Hero 用 `<Markdown>` 渲染主标题字符串(只取 `<p>`/`<a>` 等内联元素,套渐变 span + 光标);items 的 `desc` 用 `<Markdown>` 渲染。
4. 由于页面是静态的,以上全发生在构建时,客户端 bundle 不变大。

**`<Markdown>` 组件**:对 `react-markdown` 的轻包装,负责:
- 给所有 `<a>` 套现有 Tailwind 样式:`underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition`
- 外链(`href` 以 `http` 开头)自动加 `target="_blank"` 和 `rel="noreferrer"`
- 段落用 `<p>` 不加额外类名(继承父级颜色 / 行高)

**`content.ts` 接口**:

```ts
interface HeroContent {
  kicker: string;
  subtitle: string;
  headline: string;   // 取自 markdown 正文的 H1
}

interface SectionItem {
  title: string;
  meta?: string;
  desc: string;       // markdown 字符串,交给 <Markdown> 渲染
}

interface SectionContent {
  num: string;
  heading: string;
  empty: string;
  items: SectionItem[];
}

export async function loadHero(): Promise<HeroContent>;
export async function loadSection(slug: "now" | "curious" | "works"): Promise<SectionContent>;
```

## 文件格式

**`content/hero.md`** — frontmatter 装 kicker / subtitle,正文一行 H1 是主标题:

```markdown
---
kicker: "PERSONAL · 2026"
subtitle: "这里记录我正在做什么、对什么好奇,以及偶尔留下的一些痕迹。"
---

# 安静地写代码,读论文,做笔记。
```

**`content/<slug>.md`** — frontmatter 装版块元数据,items 用 `##` 分隔:

```markdown
---
num: "01"
heading: 我正在做的事
empty: 正在整理中 —— 大模型、知识管理、安静的工具。
---

## 个人网站

你正在看到的这一页。一次推送,即可上线。

## 大模型知识库

*知识整理*

系统化整理大模型相关知识,作为长期可检索的资料库。底层尝试用 [OpenKB](https://github.com/VectifyAI/OpenKB) —— 不依赖向量库,自动生成知识库,可对接 Obsidian,支持多模态。
```

**约定**:
- 每个 `##` 标题 = 一个 item,标题文本是 `title`
- 紧跟在 `##` 后面、独占一段的 `*斜体*` = `meta`(可选)
- 该 `##` 之后到下一个 `##`(或文件末尾)之间的所有内容 = `desc`(可含链接、强调、列表等 markdown)
- 没有任何 `##` = 空版块,渲染 `empty` 字段

## 解析逻辑

`loadSection` 内部:
1. `fs.readFile` 读取 `content/<slug>.md`。
2. `gray-matter` 拆 frontmatter(`num` / `heading` / `empty`)和 body。
3. 用 `remark` 把 body 解析成 AST,按 H2 节点切片得到 items 数组。每个 item 内:
   - 第一段如果是单一 `emphasis` 节点(整段全是 `*...*`),取出文本作为 `meta`,从 desc 里移除该段。
   - 其余节点 stringify 回 markdown,作为 `desc`。
4. 返回 `SectionContent`。

`loadHero` 内部:
1. `fs.readFile` + `gray-matter`。
2. body 取第一个 H1 节点,提取其纯文本作为 `headline`(忽略任何 inline markdown;Hero 主标题不需要链接或强调)。
3. 返回 `HeroContent`。

**meta 判定细节**:`##` 后的第一段如果**整段只含一个 emphasis(`*...*`)节点且无其它内容**,才视为 meta。如果第一段是普通段落或第一段是斜体但混合了其他文本,都按普通 desc 处理。

## 依赖

新增到 `package.json` dependencies:
- `gray-matter` — frontmatter 解析
- `react-markdown` — `<Markdown>` 组件内部把 desc 字符串渲染成 React
- `remark` — `content.ts` 服务端切 H2 + 提取 meta 用(unified + remark-parse + remark-stringify 的整合包)

注:解析在两层各做一次(content.ts 切片 + react-markdown 渲染),但都发生在构建时的 Server Component 里,运行时无影响,胜在数据层不携带 React 节点。

预计新增 dev 依赖体积约 50–80 KB;**客户端 bundle 不增加**(react-markdown 在 Server Component 中渲染,产物是预生成的 HTML)。

## 现状改动清单

- ✅ 新增 `content/hero.md`、`content/now.md`、`content/curious.md`、`content/works.md`
- ✅ 新增 `src/lib/content.ts`(纯 server,顶部加 `import "server-only"`)
- ✅ 新增 `src/components/Markdown.tsx`
- ✅ 改写 `src/app/page.tsx`:
  - 转 `async function`
  - 删 `sections` 常量和 `SectionConfig` / `SectionItemConfig` interface(移到 `content.ts`)
  - Hero 区从 `loadHero()` 取数据
  - 三个 `PageShell` 用 `loadSection()` 喂数据
- ✅ `package.json` 加依赖
- ✅ 更新 `CLAUDE.md`「主页是数据驱动的」一节,指向新位置

## 不在范围内 (YAGNI)

- 不做 CMS / 后台编辑界面
- 不做内容热重载(`npm run dev` 已经监听 fs,够用)
- 不为 markdown 加目录树扫描(三个版块的 slug 是硬编码的,顺序由代码控制)
- 不引入 MDX(纯 markdown + 链接组件覆盖已够用)
- 不为 items 排序加 frontmatter 字段(用 markdown 里 `##` 的自然顺序)

## 验证

实施完成后:
- `npm run dev`,主页视觉无变化(像素级对比 Hero、三个版块、items 的 OpenKB 链接样式)
- 改 `content/now.md` 加一个新 `##` item,刷新后正确出现
- `npm run build` 通过,`npm run lint` 通过
- `next build` 输出主页仍标记为 静态预渲染

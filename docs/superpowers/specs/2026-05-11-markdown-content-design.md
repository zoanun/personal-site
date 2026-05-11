# 主页内容外部化 + Obsidian 风格详情页 — 设计文档

日期:2026-05-11
状态:已确认,待实施

## 背景

主页 [src/app/page.tsx](../../../src/app/page.tsx) 当前把所有文本(Hero 标题、副标题、三个版块的 heading 和 items)硬编码在 `sections: SectionConfig[]` 数组里。每次改文案都要动 `.tsx` 文件。

同时希望:每个版块都能进一个"深入"详情页,详情页用 Obsidian 风格的双向链接 wiki 写作,支持嵌入图片、反向链接、跨版块引用、frontmatter 别名、heading 锚点。

目标:把内容写作完全搬到 markdown,作者只动 `content/` 目录下的 `.md` 文件,不碰 React 代码。整个 `content/` 目录可以直接被 Obsidian 当作一个 vault 打开。

## 分阶段

- **Phase 1**:Hero + 主页三个版块的卡片正文(items)外部化。
- **Phase 2**:每个版块加 "深入 →" 入口,接 Obsidian 风格的详情页 wiki。

Phase 1 不依赖 Phase 2,可单独 ship 测试。

## 范围

**Phase 1 纳入外部化**:
- Hero:小标签(kicker)、主标题、副标题
- 三个版块:`num`(编号)、`heading`(版块大标题)、`items[]`(title / meta / desc)、`empty`(空状态文案)

**Phase 2 纳入外部化**:
- 每个版块的 `INDEX.md`(详情页入口)
- 每个版块下任意数量的笔记 `.md` 文件
- 图片附件(支持 Obsidian `![[image.png]]` 嵌入语法)

**保留在代码里**:
- 翻页按钮的 `向下:xxx` 标签(由下一个版块的 `heading` 拼接而成)
- "深入 →" 按钮文本本身(只有目标 URL 来自数据)
- 版块编号到版块 slug 的固定顺序(由 `SECTION_IDS` 决定,JS 滚动逻辑需要)
- 视觉效果:Hero 的渐变文字 + 闪烁光标、`rise` 渐入动画、网格底纹、aurora 光晕、snap 滚动(仅在首页生效)

## 架构

### 目录布局

```
content/                          ← repo 根,可直接作为 Obsidian vault 打开
├── hero.md                       ← Hero 区(无对应版块)
├── now/                          ← "我正在做的事" 版块
│   ├── card.md                   ← Phase 1:主页卡片内容(num/heading/items/empty)
│   ├── INDEX.md                  ← Phase 2:/now 详情页入口
│   └── *.md                      ← Phase 2:任意笔记
├── curious/
│   ├── card.md
│   └── INDEX.md (可选)
├── works/
│   ├── card.md
│   └── INDEX.md (可选)
└── _attachments/                 ← 全局图片附件,所有版块共享
    └── *.png, *.jpg, ...
```

**特殊文件名约定**:`card.md`(主页卡片)、`INDEX.md`(详情页入口)被 vault 索引特判:
- `card.md` 不进 `byKey`,不参与 wikilink 解析(写 `[[card]]` 不会跳到它)
- `INDEX.md` 也不进 `byKey` 作为可链接目标(它本身是一个版块的根,通过版块 URL 而非 `[[]]` 抵达)
- 其它 `.md` 都进 vault,可被 `[[]]` 引用

src/
├── app/
│   ├── page.tsx                  ← 改成 async,渲染主页
│   ├── [section]/
│   │   ├── page.tsx              ← INDEX.md 渲染,URL: /now, /curious, /works
│   │   └── [slug]/
│   │       └── page.tsx          ← 单篇笔记,URL: /now/personal-site 等
│   ├── layout.tsx                ← 不动
│   └── globals.css
├── components/
│   ├── Markdown.tsx              ← react-markdown 薄包装
│   ├── NoteShell.tsx             ← 详情页布局(顶部返回 + 标题 + 内容 + 反链)
│   ├── Backlinks.tsx             ← 反链区
│   └── ... (现有组件)
└── lib/
    ├── content.ts                ← Phase 1 内容加载
    ├── vault.ts                  ← Phase 2 全局笔记/别名/反链索引
    ├── remark-wiki-link.ts       ← 自定义 remark 插件:[[..]] / ![[..]]
    └── snapScroll.ts             ← 仅在首页挂载(见下)

scripts/
└── copy-attachments.mjs          ← prebuild/predev 把 content/_attachments/ → public/_attachments/
```

### URL 设计

- `/` — 主页(snap-scroll 整页翻)
- `/now`, `/curious`, `/works` — 各版块详情页,渲染 `content/<section>/INDEX.md`
- `/now/<slug>` — 单篇笔记,渲染 `content/<section>/<slug>.md`
- 主页内的 `#now` 等哈希锚点继续工作(版块 ID 不变),与详情页路由无冲突

构建期通过 `generateStaticParams` 把所有已存在的 `(section, slug)` 组合预渲染成静态页;运行时找不到对应 md 返回 404。

### snap-scroll 边界

[SnapScroller](../../../src/components/SnapScroller.tsx) 当前在 `layout.tsx` 全局挂载,会拦截所有页面的滚轮事件。详情页是普通长文,需要正常滚动。改动:把 `<SnapScroller />` 从 `layout.tsx` 挪到 `src/app/page.tsx` 顶部(只在首页挂载)。详情页直接走浏览器默认滚动。

CSS 的 `snap-y snap-mandatory` 在 `<html>` 上,详情页没有 `snap-start` 元素,所以不会触发 snap 行为,可以保留全局开关。

### Phase 1 内容加载流程

(Phase 1 部分,与原方案一致,见下面"文件格式"和"解析逻辑"两节。)

### Phase 2 vault 索引

`vault.ts` 在第一次被调用时(通过 React 的 `cache()` 缓存)扫描 `content/<section>/*.md`,产出:

```ts
interface NoteRef {
  section: "now" | "curious" | "works";
  slug: string;          // 文件名去 .md
  title: string;         // frontmatter.title || 首个 H1 || slug
  aliases: string[];     // frontmatter.aliases || []
  fsPath: string;
  isIndex: boolean;      // slug === "INDEX"
}

interface VaultIndex {
  byKey: Map<string, NoteRef>;             // key: `${section}/${slug}`
  byAlias: Map<string, string>;            // alias 或 文件名(小写)→ key
  backlinks: Map<string, NoteRef[]>;       // key → 反向引用列表
}
```

构建步骤:
1. 扫描 + 读取所有 `content/*/*.md`,解析 frontmatter 得到 `NoteRef`。
2. 建别名映射:文件名(小写)和 frontmatter.aliases 都进 `byAlias`。
3. 第二遍 pass:解析每篇 markdown,提取所有 `[[...]]` 目标,写入 `backlinks`。

### `remark-wiki-link.ts` 插件

把以下 5 种语法转换为标准 MDAST 节点。注入到 `react-markdown` 的 `remarkPlugins`:

| 语法 | 转换为 | 备注 |
| --- | --- | --- |
| `[[note]]` | link → `/<section>/<slug>`,文本 = note 的 title | 优先当前版块,找不到全局搜 |
| `[[note\|显示]]` | link → `/<section>/<slug>`,文本 = "显示" | |
| `[[note#Heading]]` | link → `/<section>/<slug>#heading-id` | `#` 后用 GitHub 风格 slug 化 |
| `[[#Heading]]` | link → `#heading-id`(同页) | |
| `![[image.png]]` | image → `/_attachments/image.png` | 走 `next/image` 或原生 `<img>`,设计上用 `next/image` |
| `![[image.png\|alt 文本]]` | image,alt = "alt 文本" | |

插件运行时拿到 `VaultIndex` 解析目标:
- 先在 `byKey` 里按 `<current-section>/<target>` 查
- 再按 `byAlias.get(target.toLowerCase())` 查别名 / 跨版块
- 找不到则渲染成红色的 "broken link",同时 console.warn(构建期 stderr)

### 附件流转

写作期:用户把图片放在 `content/_attachments/`(Obsidian 配置该路径为 attachment folder)。
构建期:`scripts/copy-attachments.mjs` 在 `predev` 和 `prebuild` 钩子里把 `content/_attachments/` 整个 `cp -r` 到 `public/_attachments/`。Next.js `public/` 自动以根路径暴露。

dev 模式下新增图片需要重启或手动重跑 `predev`。后续可以加 chokidar 监听,本期 YAGNI。

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

### Phase 1

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

### Phase 2

注:之前在 Phase 1 写的 `content/<section>/card.md` 即上文 `content/<slug>.md` 等价的文件,内容格式完全一致(frontmatter num/heading/empty + body 用 `##` 拆 items)。

**`content/<section>/INDEX.md`** — 详情页入口。frontmatter 可选,正文是自由 markdown:

```markdown
---
title: 我正在做的事
---

我在追踪两条线:个人工程和模型笔记。详细分见 [[personal-site]] 和 [[ai-knowledge-base]]。

## 这周的小动作

- 把这个站搬到 Vercel,[[deployment-notes]]
- 给 OpenKB 跑了一遍 ingestion,[[openkb-walkthrough]]
```

**`content/<section>/<slug>.md`** — 单篇笔记,完全自由 markdown,可用所有 Obsidian 语法:

```markdown
---
title: 部署笔记
aliases: ["Vercel 部署", "deploy"]
---

# 部署笔记

记一下踩到的坑。配置见 [[#环境变量]],架构图:

![[architecture.png]]

| 服务 | 用途 |
| --- | --- |
| Vercel | 静态托管 + Edge |
| Cloudflare | DNS |

相关:[[../works/personal-site]] (跨版块引用,full path 写法)。

## 环境变量
...
```

**约定**:
- 文件名(去 `.md`,小写)即默认 slug,URL 用它
- frontmatter `title` 决定页面 `<h1>` 和 `[[]]` 的默认显示文本;省略则用文件首个 H1 或 slug
- frontmatter `aliases` 数组里的每一项都能作为 `[[别名]]` 的目标
- 同名冲突:`[[foo]]` 优先解析为当前版块的 foo.md;若当前版块没有,搜索全局;仍多个则取按 section 字典序首个,并在构建期 warn
- 跨版块显式写法:`[[../works/personal-site]]`(以 `../<section>/<slug>` 开头)

## 详情页 UI

每个详情页(无论 INDEX.md 还是单篇笔记)都用 `<NoteShell>` 包,结构:

```
┌──────────────────────────────────────────┐
│ ← 返回   |   我正在做的事 / 部署笔记      │  ← 顶部条:回首页对应锚点 + 面包屑
├──────────────────────────────────────────┤
│                                          │
│            <h1> 标题 </h1>               │
│                                          │
│            markdown 正文                 │
│            (Tailwind typography 风格)     │
│                                          │
├──────────────────────────────────────────┤
│ 被引用                                    │  ← Backlinks(若有)
│  · [[personal-site]] · [[deployment]]    │
└──────────────────────────────────────────┘
```

- 顶部条:返回链接指向 `/#<section>`,面包屑显示版块 heading + 笔记 title
- 正文容器约束最大宽度(沿用主页的 `max-w-5xl px-6 sm:px-8 lg:px-12`)
- Backlinks 在底部,从 `VaultIndex.backlinks.get(currentKey)` 拉,没有反链则不渲染该区
- 详情页页面 metadata 用笔记 title 生成

## "深入 →" 按钮

主页每个版块卡片的内容区下方加一个按钮,样式与现有 chevron 翻页按钮区分(右箭头 + 文字 + 下划线悬停)。点击 `<Link href="/<section>">` 走 Next.js 路由。

按钮**只在** `content/<section>/INDEX.md` 存在时渲染。这样还没准备好详情的版块自动不显示按钮。

## 解析逻辑

`loadSection` 内部:
1. `fs.readFile` 读取 `content/<slug>/card.md`。
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
- `gray-matter` — frontmatter 解析(Phase 1 + 2)
- `react-markdown` — `<Markdown>` 组件内部把 markdown 字符串渲染成 React(Phase 1 + 2)
- `remark` — `content.ts` 服务端切 H2 + 提取 meta 用(unified + remark-parse + remark-stringify 的整合包,Phase 1 + 2)
- `remark-gfm` — 表格、删除线、任务列表支持(Phase 2 详情页要)
- `unist-util-visit` — 写 `remark-wiki-link.ts` 插件遍历 AST 用(Phase 2)
- `github-slugger` — heading 锚点 slug 化,和 GitHub / Obsidian 渲染一致(Phase 2)

`devDependencies`:无新增。

注:解析在两层各做一次(content.ts / vault.ts 切片 + react-markdown 渲染),但都发生在构建时的 Server Component 里,运行时无影响。

## Tailwind typography(详情页正文样式)

详情页正文走 `@tailwindcss/typography` 或手写一套受控样式。**初版选手写**:在 `globals.css` 加一个 `.prose` 类,显式列出 `h1`/`h2`/`p`/`ul`/`a`/`table`/`img` 的样式 token。理由:`@tailwindcss/typography` 体积不小且默认样式偏向博客美学,与本站极简调性不完全匹配;手写更可控。如果手写超过 100 行,再考虑切回插件。

预计新增 dev 依赖体积约 50–80 KB;**客户端 bundle 不增加**(react-markdown 在 Server Component 中渲染,产物是预生成的 HTML)。

## 现状改动清单

### Phase 1
- 新增 `content/hero.md`,`content/{now,curious,works}/card.md`
- 新增 `src/lib/content.ts`(顶部 `import "server-only"`)
- 新增 `src/components/Markdown.tsx`
- 改写 `src/app/page.tsx`:转 `async function`,删 `sections` 常量,Hero/版块数据来自 markdown
- `package.json` 加 `gray-matter` / `react-markdown` / `remark`
- 更新 `CLAUDE.md`「主页是数据驱动的」一节指向新位置

### Phase 2
- 新增 `content/now/INDEX.md` 等(可由空模板起步)
- 新增 `content/_attachments/` 目录,加 `.gitkeep`
- 新增 `src/lib/vault.ts`
- 新增 `src/lib/remark-wiki-link.ts`
- 新增 `src/app/[section]/page.tsx` 和 `src/app/[section]/[slug]/page.tsx`
- 新增 `src/components/NoteShell.tsx` 和 `src/components/Backlinks.tsx`
- 新增 `scripts/copy-attachments.mjs`,挂到 `package.json` 的 `predev` / `prebuild`
- 把 `<SnapScroller />` 从 `src/app/layout.tsx` 挪到 `src/app/page.tsx`(详情页禁用 snap 行为)
- 主页每个版块加 "深入 →" 链接(仅当 INDEX.md 存在时渲染)
- `package.json` 加 `remark-gfm` / `unist-util-visit` / `github-slugger`
- `globals.css` 加 `.prose` 详情页正文样式
- 更新 `CLAUDE.md`:新增 "详情页 wiki" 一节描述路由结构 + Obsidian 语法支持

## 不在范围内 (YAGNI)

- 不做 CMS / 后台编辑界面
- 不做内容热重载(`npm run dev` 改 markdown 已经自动刷;附件改动需重启,后续可加 watcher)
- 不为主页三个版块 slug 加目录树扫描(`now/curious/works` 硬编码,顺序由代码控制)
- 不引入 MDX(纯 markdown + 自定义 remark 插件已够)
- 不做笔记列表 / TOC 自动索引(让 INDEX.md 手写目录)
- 不做 Obsidian graph view、tags、dataview
- 不做 broken link 的运行时友好回退(直接红字 + 构建期 warn)
- 不做笔记编辑 / 草稿状态
- 不做笔记 frontmatter 中的 published date 排序(让 INDEX.md 控制)

## 验证

### Phase 1
- `npm run dev`,主页视觉无变化(像素级对比 Hero、三个版块、items 的 OpenKB 链接样式)
- 改 `content/now/card.md` 加一个新 `##` item,刷新后正确出现
- `npm run build` 通过,`npm run lint` 通过

### Phase 2
- 创建 `content/now/INDEX.md` 含一条 `[[test-note]]` 和一张 `![[sample.png]]`,创建 `test-note.md` 和 `_attachments/sample.png`
- 主页 now 版块出现 "深入 →"
- 点击进入 `/now`,看到 INDEX 渲染、wikilink 可点
- 点击 `[[test-note]]` 进入 `/now/test-note`,顶部返回链接回 `/#now`
- `test-note` 底部 Backlinks 区显示 `← INDEX`
- 别名:给 test-note 加 `aliases: ["TN"]`,在 INDEX 里写 `[[TN]]`,正常跳转
- 跨版块:`content/works/INDEX.md` 写 `[[test-note]]`,跳到 `/now/test-note`
- 锚点:`test-note` 内有 `## 配置`,在 INDEX 里写 `[[test-note#配置]]`,跳过去并滚到对应位置
- 详情页是正常滚动(不被 SnapScroller 接管)
- `npm run build` 通过,`generateStaticParams` 为每个笔记生成静态页

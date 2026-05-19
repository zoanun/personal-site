---
title: LLM Wiki
aliases: ["LLM Wiki"]
---

## LLM Wiki 是什么

核心理念是让 AI 不是每次从原始文档里临时检索，而是持续地、增量式地构建和维护一个 Wiki——知识被"编译"一次，然后持续更新，形成可复利增长的资产。

跟传统 RAG 的区别：RAG 每次查询都从头检索，啥也不记得；LLM Wiki 是 LLM 把你的文档读一遍后，**主动整理成结构化 Markdown 知识库**，之后回答问题是基于这个已经组织好的 Wiki，而不是重新推导。

---

## 最简单的实践：纯文件夹 + Claude Code / Cursor

三层架构，三种核心操作：

- **原始资料层**（只读，LLM 不改）：你的论文、文章、笔记、截图、网页剪藏
- **Wiki 层**（LLM 写和维护，你只看）：结构化的 Markdown 文件，摘要、卡片、索引、综述，全部自动生成
- **Schema 层**（告诉 LLM 怎么干活）：一个 `CLAUDE.md` 或 `AGENTS.md`，写清楚目录结构、命名规范、工作流程

### 目录结构

```
my-wiki/
├── purpose.md        # 这个 Wiki 的目标和研究范围
├── schema.md         # 结构规则、页面类型
├── raw/
│   └── sources/      # 你上传的文档（不可变）
├── wiki/
│   ├── index.md      # 内容目录
│   ├── log.md        # 操作历史
│   ├── entities/     # 人物、产品、工具
│   ├── concepts/     # 理论、方法、技术
│   └── sources/      # 每篇资料的摘要页
```

### 三个核心操作

**摄入（Ingest）**：把新文件放进 `raw/` 后告诉 LLM 处理，它会：读原文 → 在 `sources/` 写摘要 → 更新 `index.md` → 更新相关 concepts/ 和 entities/ 页面 → 在 `log.md` 追加记录。一个资料可能涉及 10–15 个页面的更新。

**查询（Query）**：问问题时，LLM 先读 `index.md` 找到相关页面，深入阅读后综合回答，有价值的回答存为 `outputs/` 下的新页面。

**健康检查（Lint）**：定期检查页面之间有没有矛盾、有没有孤立页面、有没有提到但没建页面的概念。

---

## 最懒上手方式

两条路：

**路线 A（零代码，直接用现成桌面应用）** 有个叫 `llm_wiki` 的项目（nashsu 开发），是 Karpathy 理念的完整桌面 App，跨平台（macOS/Windows/Linux），三栏布局：知识树 + 聊天 + 预览，配好 API Key 就能用。地址：`github.com/nashsu/llm_wiki`

**路线 B（用 Claude Code + 一个 Prompt 自己搭）** 把架构描述和这段 Prompt 直接发给 Claude Code 或 Codex：

```
你是我的个人知识库管理员。请帮我在本地搭建一个 LLM Wiki 系统。
- raw/ → 原始资料（你只读不改）
- wiki/ → 你生成并维护的 Markdown 知识库
- CLAUDE.md → 工作规范
先帮我创建目录结构和空的 index.md + log.md，然后告诉我怎么开始。
```

---

## 一个实战经验

一个精辟的类比：**Obsidian 是 IDE，LLM 是程序员，Wiki 是代码库。** 维护知识库的繁重工作不是阅读和思考，而是"记账"——更新交叉引用、保持摘要最新、标注矛盾。人类因维护负担增长快于价值而放弃 Wiki；LLM 不会厌倦，维护成本趋近于零。


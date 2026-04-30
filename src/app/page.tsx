import type { ReactElement, ReactNode } from "react";

interface SectionItemConfig {
  title: string;
  desc: ReactNode;
  meta?: string;
}

interface SectionConfig {
  num: string;
  label: string;
  heading: string;
  items: SectionItemConfig[];
  empty?: string;
}

const sections: SectionConfig[] = [
  {
    num: "01",
    label: "Currently",
    heading: "我正在做的事",
    items: [
      {
        title: "个人网站",
        meta: "Next.js · Vercel",
        desc: "你正在看到的这一页。Push to GitHub, ship to the world。",
      },
      {
        title: "LLM Wiki",
        meta: "Knowledge Base",
        desc: (
          <>
            系统化整理大模型相关知识,作为长期可检索的资料库。底层尝试用{" "}
            <a
              href="https://github.com/VectifyAI/OpenKB"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition"
            >
              OpenKB
            </a>
            {" "}—— 不依赖向量库、自动生成 Wiki、Obsidian 兼容、支持多模态。
          </>
        ),
      },
    ],
  },
  {
    num: "02",
    label: "Interests",
    heading: "我感兴趣的事",
    items: [],
    empty: "正在整理中 —— 大模型、知识管理、安静的工具。",
  },
  {
    num: "03",
    label: "Work",
    heading: "我的成果",
    items: [],
    empty: "敬请期待。",
  },
];

export default function Home(): ReactElement {
  return (
    <>
      <div className="aurora" aria-hidden />
      <div className="grid-bg" aria-hidden />

      <main className="mx-auto w-full max-w-3xl px-6 sm:px-8 py-20 sm:py-28">
        {/* Hero */}
        <header className="rise">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
            zoanu · 个人主页
          </div>
          <h1 className="mt-6 text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05]">
            Hi, I&apos;m{" "}
            <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              zoanu
            </span>
            <span className="caret" aria-hidden />
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-muted leading-relaxed">
            一个安静地写代码、读论文、做笔记的人。这里记录我正在做什么、对什么好奇,
            以及偶尔留下的一些痕迹。
          </p>
        </header>

        <hr className="my-20 border-border" />

        {/* Sections */}
        <div className="flex flex-col gap-24">
          {sections.map((section, i) => (
            <section
              key={section.num}
              className="rise"
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
            >
              <div className="flex items-baseline gap-4 mb-10">
                <span className="font-mono text-sm text-muted">{section.num}</span>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                  {section.label}
                </span>
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
                        <span className="text-lg font-medium tracking-tight">
                          {item.title}
                        </span>
                        {item.meta && (
                          <span className="font-mono text-xs text-muted mt-1">
                            {item.meta}
                          </span>
                        )}
                      </div>
                      <p className="text-muted leading-relaxed">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted italic">{section.empty}</p>
              )}
            </section>
          ))}
        </div>

        <hr className="my-20 border-border" />

        <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs text-muted">
          <span>© {new Date().getFullYear()} zoanu</span>
          <span>built with Next.js · deployed on Vercel</span>
        </footer>
      </main>
    </>
  );
}

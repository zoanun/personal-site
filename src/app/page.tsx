import type { ReactElement, ReactNode } from "react";
import { ChevronDownLink } from "@/components/ChevronDownLink";
import { Logo } from "@/components/Logo";

interface SectionItemConfig {
  title: string;
  desc: ReactNode;
  meta?: string;
}

interface SectionConfig {
  id: string;
  num: string;
  heading: string;
  items: SectionItemConfig[];
  empty?: string;
}

const sections: SectionConfig[] = [
  {
    id: "now",
    num: "01",
    heading: "我正在做的事",
    items: [
      {
        title: "个人网站",
        desc: "你正在看到的这一页。一次推送,即可上线。",
      },
      {
        title: "大模型知识库",
        meta: "知识整理",
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
            {" "}—— 不依赖向量库,自动生成知识库,可对接 Obsidian,支持多模态。
          </>
        ),
      },
    ],
  },
  {
    id: "curious",
    num: "02",
    heading: "我感兴趣的事",
    items: [],
    empty: "正在整理中 —— 大模型、知识管理、安静的工具。",
  },
  {
    id: "works",
    num: "03",
    heading: "我的成果",
    items: [],
    empty: "敬请期待。",
  },
];

interface PageShellProps {
  id: string;
  next?: { href: string; label: string };
  children: ReactNode;
  showFooter?: boolean;
}

function PageShell({
  id,
  next,
  children,
  showFooter,
}: PageShellProps): ReactElement {
  return (
    <section
      id={id}
      className="snap-start min-h-[100dvh] flex flex-col pt-14"
    >
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

export default function Home(): ReactElement {
  return (
    <>
      <div className="aurora" aria-hidden />
      <div className="grid-bg" aria-hidden />

      {/* Page 1: Hero */}
      <PageShell id="top" next={{ href: "#now", label: "向下:我正在做的事" }}>
        <header className="rise relative">
          <Logo
            strokeWidth={1.2}
            className="hidden sm:block pointer-events-none absolute -right-6 -top-10 h-72 w-72 lg:h-[22rem] lg:w-[22rem] text-foreground/[0.06]"
          />

          <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
            <span className="text-foreground/50">{"//"}</span>{"  "}PERSONAL · 2026
          </div>

          <h1 className="mt-8 max-w-2xl text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.25]">
            <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              安静地写代码,读论文,做笔记。
            </span>
            <span className="caret" aria-hidden />
          </h1>

          <div className="mt-8 max-w-xl">
            <div className="h-px w-8 bg-foreground/40 mb-5" aria-hidden />
            <p className="text-base sm:text-lg text-muted leading-relaxed">
              这里记录我正在做什么、对什么好奇,以及偶尔留下的一些痕迹。
            </p>
          </div>
        </header>
      </PageShell>

      {/* Pages 2-4: Sections */}
      {sections.map((section, i) => {
        const next = sections[i + 1];
        return (
          <PageShell
            key={section.id}
            id={section.id}
            next={
              next
                ? { href: `#${next.id}`, label: `向下:${next.heading}` }
                : undefined
            }
            showFooter={!next}
          >
            <div
              className="rise"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-sm text-muted">
                  {section.num}
                </span>
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
                        <span className="text-lg font-medium tracking-tight">
                          {item.title}
                        </span>
                        {item.meta && (
                          <span className="text-xs text-muted mt-1">
                            {item.meta}
                          </span>
                        )}
                      </div>
                      <p className="text-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted italic">{section.empty}</p>
              )}
            </div>
          </PageShell>
        );
      })}
    </>
  );
}

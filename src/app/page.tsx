import type { ReactElement, ReactNode } from "react";
import { ChevronDownLink } from "@/components/ChevronDownLink";
import { DeepLink } from "@/components/DeepLink";
import { Logo } from "@/components/Logo";
import { Markdown } from "@/components/Markdown";
import { SnapScroller } from "@/components/SnapScroller";
import {
  loadHero,
  loadSection,
  type SectionContent,
} from "@/lib/content";
import { hasIndex } from "@/lib/vault";
import { loadSections } from "@/lib/sections";

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

export default async function Home(): Promise<ReactElement> {
  const sectionMetas = await loadSections();
  const sectionOrder: string[] = sectionMetas.map((s) => s.slug);
  const [hero, sections, indexFlags] = await Promise.all([
    loadHero(),
    Promise.all(sectionOrder.map((slug: string) => loadSection(slug))),
    Promise.all(sectionOrder.map((slug: string) => hasIndex(slug))),
  ]);
  const snapIds: string[] = ["top", ...sectionOrder];
  const firstHeading = sections[0]?.heading ?? "";

  return (
    <>
      <SnapScroller ids={snapIds} />
      <div className="aurora" aria-hidden />
      <div className="grid-bg" aria-hidden />

      <PageShell
        id="top"
        next={
          sectionOrder[0]
            ? { href: `#${sectionOrder[0]}`, label: `向下:${firstHeading}` }
            : undefined
        }
        showFooter={sectionOrder.length === 0}
      >
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

      {sections.map((section: SectionContent, i: number) => {
        const next = sections[i + 1];
        const nextSlug = sectionOrder[i + 1];
        return (
          <PageShell
            key={sectionOrder[i]}
            id={sectionOrder[i]}
            next={next ? { href: `#${nextSlug}`, label: `向下:${next.heading}` } : undefined}
            showFooter={!next}
          >
            <SectionPanel
                section={section}
                deepHref={indexFlags[i] ? `/${sectionOrder[i]}` : undefined}
              />
          </PageShell>
        );
      })}
    </>
  );
}

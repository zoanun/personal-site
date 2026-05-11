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

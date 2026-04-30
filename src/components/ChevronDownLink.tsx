"use client";

import type { MouseEvent, ReactElement } from "react";
import { snapToId } from "@/lib/snapScroll";

interface ChevronDownLinkProps {
  href: string;
  label: string;
}

export function ChevronDownLink({
  href,
  label,
}: ChevronDownLinkProps): ReactElement {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    const id = href.startsWith("#") ? href.slice(1) : href;
    snapToId(id);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-label={label}
      className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground/40 transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="h-4 w-4 nudge"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </a>
  );
}

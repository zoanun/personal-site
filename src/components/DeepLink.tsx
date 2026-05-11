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

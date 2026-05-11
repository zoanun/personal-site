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
              href={n.isIndex ? `/${n.section}` : `/${n.section}/${n.slug}`}
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

import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

export interface SectionMeta {
  slug: string;
  nav: string;
  order: number;
}

const CONTENT_ROOT = path.join(process.cwd(), "content");
const RESERVED_DIRS = new Set(["_attachments"]);

async function readCardMeta(slug: string): Promise<SectionMeta | null> {
  const cardPath = path.join(CONTENT_ROOT, slug, "card.md");
  let raw: string;
  try {
    raw = await fs.readFile(cardPath, "utf8");
  } catch {
    return null;
  }
  const { data } = matter(raw);
  const nav = typeof data.nav === "string" ? data.nav.trim() : "";
  const order = typeof data.order === "number" ? data.order : Number.NaN;
  if (!nav || !Number.isFinite(order)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[sections] skipped content/${slug}: card.md needs both 'nav' (string) and 'order' (number) in frontmatter`,
      );
    }
    return null;
  }
  return { slug, nav, order };
}

export const loadSections = cache(async (): Promise<SectionMeta[]> => {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }
  const candidates = entries
    .filter((e) => e.isDirectory() && !RESERVED_DIRS.has(e.name))
    .map((e) => e.name);
  const metas = await Promise.all(candidates.map(readCardMeta));
  return metas
    .filter((m): m is SectionMeta => m !== null)
    .sort((a, b) => a.order - b.order);
});

export async function getSectionSlugs(): Promise<string[]> {
  return (await loadSections()).map((s) => s.slug);
}

export async function isKnownSection(slug: string): Promise<boolean> {
  return (await getSectionSlugs()).includes(slug);
}

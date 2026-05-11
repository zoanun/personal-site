import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import type { SectionSlug } from "@/lib/content";
import { getSectionSlugs } from "@/lib/sections";

export interface NoteRef {
  section: SectionSlug;
  slug: string;
  title: string;
  aliases: string[];
  fsPath: string;
  isIndex: boolean;
}

export interface VaultIndex {
  byKey: Map<string, NoteRef>;
  byAlias: Map<string, string>;
  backlinks: Map<string, NoteRef[]>;
}

const CONTENT_ROOT = path.join(process.cwd(), "content");

const WIKI_LINK_RE = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;

function isExcluded(slug: string): boolean {
  return slug === "card" || slug === "INDEX";
}

export function buildVault(
  notes: NoteRef[],
  bodies: Map<string, string>,
): VaultIndex {
  const byKey = new Map<string, NoteRef>();
  const byAlias = new Map<string, string>();
  const backlinks = new Map<string, NoteRef[]>();

  for (const note of notes) {
    const key = `${note.section}/${note.slug}`;
    if (!isExcluded(note.slug)) {
      byKey.set(key, note);
      byAlias.set(note.slug.toLowerCase(), key);
      byAlias.set(`${note.section}/${note.slug.toLowerCase()}`, key);
      for (const alias of note.aliases) {
        byAlias.set(alias.toLowerCase(), key);
      }
    }
  }

  for (const note of notes) {
    if (note.slug === "card") continue;
    const sourceKey = `${note.section}/${note.slug}`;
    const body = bodies.get(sourceKey);
    if (!body) continue;
    for (const m of body.matchAll(WIKI_LINK_RE)) {
      if (m[1] === "!") continue;
      const targetRaw = m[2].trim().toLowerCase();
      const targetKey =
        byAlias.get(`${note.section}/${targetRaw}`) ??
        byAlias.get(targetRaw);
      if (!targetKey) continue;
      if (!backlinks.has(targetKey)) backlinks.set(targetKey, []);
      const list = backlinks.get(targetKey)!;
      if (!list.some((n) => n.section === note.section && n.slug === note.slug)) {
        list.push(note);
      }
    }
  }

  return { byKey, byAlias, backlinks };
}

async function readNote(section: SectionSlug, file: string): Promise<{ ref: NoteRef; body: string }> {
  const fsPath = path.join(CONTENT_ROOT, section, file);
  const raw = await fs.readFile(fsPath, "utf8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.md$/, "");
  const aliases: string[] = Array.isArray(data.aliases)
    ? data.aliases.map((a: unknown) => String(a))
    : [];
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : (content.match(/^#\s+(.+)$/m)?.[1].trim() ?? slug);
  return {
    ref: {
      section,
      slug,
      title,
      aliases,
      fsPath,
      isIndex: slug === "INDEX",
    },
    body: content,
  };
}

export const loadVault = cache(async (): Promise<VaultIndex> => {
  const notes: NoteRef[] = [];
  const bodies = new Map<string, string>();
  const sections = await getSectionSlugs();
  for (const section of sections) {
    const dir = path.join(CONTENT_ROOT, section);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const { ref, body } = await readNote(section, entry);
      notes.push(ref);
      bodies.set(`${ref.section}/${ref.slug}`, body);
    }
  }
  return buildVault(notes, bodies);
});

export async function loadNoteBody(section: SectionSlug, slug: string): Promise<{ ref: NoteRef; body: string } | null> {
  try {
    return await readNote(section, `${slug}.md`);
  } catch {
    return null;
  }
}

export async function hasIndex(section: SectionSlug): Promise<boolean> {
  try {
    await fs.access(path.join(CONTENT_ROOT, section, "INDEX.md"));
    return true;
  } catch {
    return false;
  }
}

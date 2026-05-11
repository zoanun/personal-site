import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import { visit } from "unist-util-visit";
import type { Root, Heading, RootContent, Paragraph, Emphasis } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";

export type SectionSlug = "now" | "curious" | "works";

export interface HeroContent {
  kicker: string;
  subtitle: string;
  headline: string;
}

export interface SectionItem {
  title: string;
  meta?: string;
  desc: string;
}

export interface SectionContent {
  num: string;
  heading: string;
  empty: string;
  items: SectionItem[];
}

function plainText(node: { children?: Array<{ type: string; value?: string; children?: Array<{ type: string; value?: string }> }> }): string {
  let out = "";
  visit(node as Root, (n) => {
    if ((n as { type: string }).type === "text") {
      out += (n as { value: string }).value;
    }
  });
  return out;
}

function isMetaParagraph(node: RootContent): string | null {
  if (node.type !== "paragraph") return null;
  const p = node as Paragraph;
  if (p.children.length !== 1) return null;
  const only = p.children[0];
  if (only.type !== "emphasis") return null;
  const em = only as Emphasis;
  const text = plainText(em).trim();
  return text || null;
}

function stringifyChildren(children: RootContent[]): string {
  if (children.length === 0) return "";
  return toMarkdown({ type: "root", children }).trimEnd();
}

export function parseSection(markdown: string): SectionContent {
  const { data, content } = matter(markdown);
  const tree = remark().parse(content) as Root;

  const items: SectionItem[] = [];
  let currentTitle: string | null = null;
  let currentChildren: RootContent[] = [];

  const flush = (): void => {
    if (currentTitle === null) return;
    let meta: string | undefined;
    let descChildren = currentChildren;
    if (descChildren.length > 0) {
      const detected = isMetaParagraph(descChildren[0]);
      if (detected !== null) {
        meta = detected;
        descChildren = descChildren.slice(1);
      }
    }
    items.push({
      title: currentTitle,
      meta,
      desc: stringifyChildren(descChildren),
    });
    currentTitle = null;
    currentChildren = [];
  };

  for (const node of tree.children) {
    if (node.type === "heading" && (node as Heading).depth === 2) {
      flush();
      currentTitle = plainText(node as Heading).trim();
      currentChildren = [];
    } else if (currentTitle !== null) {
      currentChildren.push(node);
    }
  }
  flush();

  return {
    num: String(data.num ?? ""),
    heading: String(data.heading ?? ""),
    empty: String(data.empty ?? ""),
    items,
  };
}

export function parseHero(markdown: string): HeroContent {
  const { data, content } = matter(markdown);
  const tree = remark().parse(content) as Root;
  let headline = "";
  visit(tree, "heading", (node: Heading) => {
    if (node.depth === 1 && !headline) {
      headline = plainText(node).trim();
    }
  });
  return {
    kicker: String(data.kicker ?? ""),
    subtitle: String(data.subtitle ?? ""),
    headline,
  };
}

const CONTENT_ROOT = path.join(process.cwd(), "content");

export async function loadHero(): Promise<HeroContent> {
  const md = await fs.readFile(path.join(CONTENT_ROOT, "hero.md"), "utf8");
  return parseHero(md);
}

export async function loadSection(slug: SectionSlug): Promise<SectionContent> {
  const md = await fs.readFile(path.join(CONTENT_ROOT, slug, "card.md"), "utf8");
  return parseSection(md);
}

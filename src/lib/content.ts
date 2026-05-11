import matter from "gray-matter";
import { remark } from "remark";
import { visit } from "unist-util-visit";
import type { Root, Heading } from "mdast";

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

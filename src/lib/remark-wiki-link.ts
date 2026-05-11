import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";
import type { Root, Text, Parent, Link, Image, RootContent } from "mdast";
import type { Plugin } from "unified";
import type { SectionSlug } from "@/lib/content";
import type { VaultIndex } from "@/lib/vault";

export interface WikiLinkOptions {
  currentSection: SectionSlug;
  vault: VaultIndex;
  attachmentBase: string;
}

export interface ResolvedWikiLink {
  kind: "internal" | "anchor" | "broken";
  url: string;
  text: string;
}

interface ParsedWikiLink {
  target: string;        // "" if same-page
  heading?: string;
  display?: string;
}

export function parseWikiLink(raw: string): ParsedWikiLink {
  const [linkPart, ...displayParts] = raw.split("|");
  const display = displayParts.length > 0 ? displayParts.join("|").trim() : undefined;
  const hashIdx = linkPart.indexOf("#");
  if (hashIdx === -1) {
    return { target: linkPart.trim(), display };
  }
  const target = linkPart.slice(0, hashIdx).trim();
  const heading = linkPart.slice(hashIdx + 1).trim();
  return { target, heading, display };
}

function slugifyHeading(heading: string): string {
  return new GithubSlugger().slug(heading);
}

export function resolveWikiLink(
  raw: string,
  options: WikiLinkOptions,
): ResolvedWikiLink {
  const { target, heading, display } = parseWikiLink(raw);

  // Same-page anchor: [[#Heading]]
  if (target === "" && heading) {
    return {
      kind: "anchor",
      url: `#${slugifyHeading(heading)}`,
      text: display ?? heading,
    };
  }

  // Explicit cross-section path: [[../works/x]]
  let resolvedKey: string | undefined;
  let fallbackText: string = target;
  const explicit = target.match(/^\.\.\/([^/]+)\/(.+)$/);
  if (explicit) {
    const tryKey = `${explicit[1]}/${explicit[2]}`;
    if (options.vault.byKey.has(tryKey)) resolvedKey = tryKey;
    fallbackText = explicit[2]; // use slug portion for display
  } else {
    const local = `${options.currentSection}/${target.toLowerCase()}`;
    resolvedKey =
      options.vault.byAlias.get(local) ??
      options.vault.byAlias.get(target.toLowerCase());
  }

  if (!resolvedKey) {
    return { kind: "broken", url: "", text: display ?? target };
  }

  const note = options.vault.byKey.get(resolvedKey);
  const displayBase = display ?? (explicit ? (note?.title ?? fallbackText) : (target || (note?.title ?? resolvedKey)));
  const url = heading
    ? `/${resolvedKey}#${slugifyHeading(heading)}`
    : `/${resolvedKey}`;
  const text = heading && !display ? `${displayBase} > ${heading}` : displayBase;

  return { kind: "internal", url, text };
}

const WIKI_TOKEN_RE = /(!?)\[\[([^\]]+)\]\]/g;

function makeLinkNode(target: ResolvedWikiLink): Link {
  return {
    type: "link",
    url: target.url || "#",
    title: target.kind === "broken" ? "broken wiki link" : null,
    data: {
      hProperties:
        target.kind === "broken"
          ? { className: ["wiki-link-broken"] }
          : { className: ["wiki-link"] },
    },
    children: [{ type: "text", value: target.text }],
  };
}

function makeImageNode(raw: string, options: WikiLinkOptions): Image {
  const [file, ...altParts] = raw.split("|");
  return {
    type: "image",
    url: `${options.attachmentBase}/${file.trim()}`,
    alt: altParts.length > 0 ? altParts.join("|").trim() : file.trim(),
    title: null,
  };
}

export const remarkWikiLink: Plugin<[WikiLinkOptions], Root> = (options) => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const value = node.value;
      WIKI_TOKEN_RE.lastIndex = 0;
      const matches = [...value.matchAll(WIKI_TOKEN_RE)];
      if (matches.length === 0) return;

      const replacement: RootContent[] = [];
      let cursor = 0;
      for (const m of matches) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        if (start > cursor) {
          replacement.push({ type: "text", value: value.slice(cursor, start) });
        }
        const isImage = m[1] === "!";
        const inner = m[2];
        if (isImage) {
          replacement.push(makeImageNode(inner, options));
        } else {
          replacement.push(makeLinkNode(resolveWikiLink(inner, options)));
        }
        cursor = end;
      }
      if (cursor < value.length) {
        replacement.push({ type: "text", value: value.slice(cursor) });
      }
      (parent as Parent).children.splice(index, 1, ...replacement);
      return index + replacement.length;
    });
  };
};

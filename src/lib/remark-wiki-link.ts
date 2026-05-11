import GithubSlugger from "github-slugger";
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
  const explicit = target.match(/^\.\.\/(now|curious|works)\/(.+)$/);
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

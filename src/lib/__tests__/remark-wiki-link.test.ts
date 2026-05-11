import { describe, it, expect } from "vitest";
import { remark } from "remark";
import { remarkWikiLink } from "@/lib/remark-wiki-link";
import { resolveWikiLink } from "@/lib/remark-wiki-link";
import { buildVault, type NoteRef } from "@/lib/vault";
import type { VaultIndex } from "@/lib/vault";

function makeVault(notes: NoteRef[]): VaultIndex {
  return buildVault(notes, new Map());
}

const N = (section: NoteRef["section"], slug: string, aliases: string[] = []): NoteRef => ({
  section,
  slug,
  title: slug,
  aliases,
  fsPath: "",
  isIndex: false,
});

describe("resolveWikiLink", () => {
  const vault = makeVault([
    N("now", "alpha", ["aleph"]),
    N("now", "beta"),
    N("works", "gamma"),
  ]);
  const opts = { currentSection: "now" as const, vault, attachmentBase: "/_attachments" };

  it("resolves same-section name", () => {
    const r = resolveWikiLink("alpha", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha", text: "alpha" });
  });

  it("resolves with alias text", () => {
    const r = resolveWikiLink("alpha|看这", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha", text: "看这" });
  });

  it("resolves cross-section via alias map", () => {
    const r = resolveWikiLink("gamma", opts);
    expect(r).toEqual({ kind: "internal", url: "/works/gamma", text: "gamma" });
  });

  it("resolves cross-section explicit path", () => {
    const r = resolveWikiLink("../works/gamma", opts);
    expect(r).toEqual({ kind: "internal", url: "/works/gamma", text: "gamma" });
  });

  it("resolves heading anchor on target", () => {
    const r = resolveWikiLink("alpha#Setup", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha#setup", text: "alpha > Setup" });
  });

  it("resolves same-page anchor", () => {
    const r = resolveWikiLink("#Setup", opts);
    expect(r).toEqual({ kind: "anchor", url: "#setup", text: "Setup" });
  });

  it("resolves frontmatter alias to target", () => {
    const r = resolveWikiLink("aleph", opts);
    expect(r).toEqual({ kind: "internal", url: "/now/alpha", text: "aleph" });
  });

  it("marks broken when target not found", () => {
    const r = resolveWikiLink("ghost", opts);
    expect(r.kind).toBe("broken");
    expect(r.url).toBe("");
    expect(r.text).toBe("ghost");
  });
});

describe("remarkWikiLink plugin", () => {
  const vault = makeVault([N("now", "alpha")]);
  const opts = { currentSection: "now" as const, vault, attachmentBase: "/_attachments" };

  function run(input: string): string {
    const tree = remark().use(remarkWikiLink, opts).parse(input);
    const processed = remark().use(remarkWikiLink, opts).runSync(tree);
    return remark().stringify(processed);
  }

  it("rewrites [[alpha]] to a markdown link", () => {
    const out = run("see [[alpha]] now");
    expect(out).toContain("[alpha](/now/alpha)");
  });

  it("rewrites ![[image.png]] to an image", () => {
    const out = run("![[demo.png]]");
    expect(out).toContain("![demo.png](/_attachments/demo.png)");
  });

  it("leaves non-wiki text untouched", () => {
    const out = run("hello world").trim();
    expect(out).toBe("hello world");
  });
});

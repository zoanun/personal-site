import { describe, it, expect } from "vitest";
import { buildVault, type NoteRef } from "@/lib/vault";

function note(section: NoteRef["section"], slug: string, opts: Partial<NoteRef> = {}): NoteRef {
  return {
    section,
    slug,
    title: opts.title ?? slug,
    aliases: opts.aliases ?? [],
    fsPath: opts.fsPath ?? `/fake/${section}/${slug}.md`,
    isIndex: opts.isIndex ?? false,
  };
}

describe("buildVault", () => {
  it("indexes notes by section/slug key", () => {
    const v = buildVault([note("now", "foo")], new Map());
    expect(v.byKey.get("now/foo")?.slug).toBe("foo");
  });

  it("indexes filenames as aliases (lowercased)", () => {
    const v = buildVault([note("now", "Foo")], new Map());
    expect(v.byAlias.get("foo")).toBe("now/Foo");
  });

  it("indexes explicit aliases (lowercased)", () => {
    const v = buildVault([note("now", "x", { aliases: ["Bar", "BAZ"] })], new Map());
    expect(v.byAlias.get("bar")).toBe("now/x");
    expect(v.byAlias.get("baz")).toBe("now/x");
  });

  it("builds backlinks from [[target]] references", () => {
    const a = note("now", "a");
    const b = note("now", "b");
    const bodies = new Map([
      ["now/a", "see [[b]]"],
      ["now/b", ""],
    ]);
    const v = buildVault([a, b], bodies);
    expect(v.backlinks.get("now/b")?.map((n) => n.slug)).toEqual(["a"]);
  });

  it("resolves [[target]] cross-section via alias map", () => {
    const a = note("now", "a");
    const b = note("works", "b");
    const bodies = new Map([
      ["now/a", "see [[b]]"],
      ["works/b", ""],
    ]);
    const v = buildVault([a, b], bodies);
    expect(v.backlinks.get("works/b")?.map((n) => `${n.section}/${n.slug}`)).toEqual([
      "now/a",
    ]);
  });

  it("excludes card.md and INDEX.md from byKey", () => {
    const card = note("now", "card");
    const index = note("now", "INDEX", { isIndex: true });
    const real = note("now", "real");
    const v = buildVault([card, index, real], new Map());
    expect(v.byKey.has("now/card")).toBe(false);
    expect(v.byKey.has("now/INDEX")).toBe(false);
    expect(v.byKey.has("now/real")).toBe(true);
  });
});

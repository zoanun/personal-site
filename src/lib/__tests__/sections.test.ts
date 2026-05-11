import { describe, it, expect } from "vitest";
import { loadSections, getSectionSlugs } from "@/lib/sections";

describe("loadSections", () => {
  it("returns sections sorted by frontmatter order", async () => {
    const sections = await loadSections();
    const orders = sections.map((s) => s.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("includes nav and slug for each section", async () => {
    const sections = await loadSections();
    for (const s of sections) {
      expect(s.slug).toBeTruthy();
      expect(s.nav).toBeTruthy();
      expect(typeof s.order).toBe("number");
    }
  });

  it("does not include _attachments or non-section files", async () => {
    const slugs = await getSectionSlugs();
    expect(slugs).not.toContain("_attachments");
    expect(slugs).not.toContain("hero");
  });

  it("matches the current three-section layout", async () => {
    const slugs = await getSectionSlugs();
    expect(slugs).toEqual(["now", "curious", "works"]);
  });
});

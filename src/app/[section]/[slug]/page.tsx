import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { Metadata } from "next";
import { NoteShell } from "@/components/NoteShell";
import { NoteRenderer } from "@/components/NoteRenderer";
import { Backlinks } from "@/components/Backlinks";
import { loadVault, loadNoteBody } from "@/lib/vault";
import { loadSection, type SectionSlug } from "@/lib/content";

const SECTIONS: SectionSlug[] = ["now", "curious", "works"];

export async function generateStaticParams(): Promise<Array<{ section: string; slug: string }>> {
  const vault = await loadVault();
  return [...vault.byKey.values()].map((n) => ({
    section: n.section,
    slug: n.slug,
  }));
}

interface PageProps {
  params: Promise<{ section: string; slug: string }>;
}

function isSectionSlug(s: string): s is SectionSlug {
  return (SECTIONS as string[]).includes(s);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  if (!isSectionSlug(section)) return {};
  const note = await loadNoteBody(section, slug);
  if (!note) return {};
  return { title: `${note.ref.title} — 佐纳` };
}

export default async function NotePage({ params }: PageProps): Promise<ReactElement> {
  const { section, slug } = await params;
  if (!isSectionSlug(section) || slug === "INDEX" || slug === "card") notFound();

  const note = await loadNoteBody(section, slug);
  if (!note) notFound();

  const card = await loadSection(section);
  const vault = await loadVault();
  const incoming = vault.backlinks.get(`${section}/${slug}`) ?? [];

  return (
    <NoteShell
      section={section}
      sectionHeading={card.heading}
      noteTitle={note.ref.title}
      backlinks={<Backlinks links={incoming} />}
    >
      <NoteRenderer body={note.body} currentSection={section} vault={vault} />
    </NoteShell>
  );
}

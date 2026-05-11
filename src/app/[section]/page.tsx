import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { Metadata } from "next";
import { NoteShell } from "@/components/NoteShell";
import { NoteRenderer } from "@/components/NoteRenderer";
import { Backlinks } from "@/components/Backlinks";
import { loadVault, loadNoteBody } from "@/lib/vault";
import { loadSection, type SectionSlug } from "@/lib/content";

const SECTIONS: SectionSlug[] = ["now", "curious", "works"];

export function generateStaticParams(): Array<{ section: string }> {
  return SECTIONS.map((s) => ({ section: s }));
}

interface PageProps {
  params: Promise<{ section: string }>;
}

function isSectionSlug(s: string): s is SectionSlug {
  return (SECTIONS as string[]).includes(s);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (!isSectionSlug(section)) return {};
  const card = await loadSection(section);
  return { title: `${card.heading} — 佐纳` };
}

export default async function SectionIndexPage({ params }: PageProps): Promise<ReactElement> {
  const { section } = await params;
  if (!isSectionSlug(section)) notFound();

  const note = await loadNoteBody(section, "INDEX");
  if (!note) notFound();

  const card = await loadSection(section);
  const vault = await loadVault();
  const indexKey = `${section}/INDEX`;
  const incoming = vault.backlinks.get(indexKey) ?? [];

  return (
    <NoteShell
      section={section}
      sectionHeading={card.heading}
      noteTitle={undefined}
      backlinks={<Backlinks links={incoming} />}
    >
      <NoteRenderer body={note.body} currentSection={section} vault={vault} />
    </NoteShell>
  );
}

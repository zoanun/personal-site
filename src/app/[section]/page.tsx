import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { Metadata } from "next";
import { NoteShell } from "@/components/NoteShell";
import { NoteRenderer } from "@/components/NoteRenderer";
import { Backlinks } from "@/components/Backlinks";
import { loadVault, loadNoteBody } from "@/lib/vault";
import { loadSection } from "@/lib/content";
import { getSectionSlugs, isKnownSection } from "@/lib/sections";

export async function generateStaticParams(): Promise<Array<{ section: string }>> {
  return (await getSectionSlugs()).map((s) => ({ section: s }));
}

interface PageProps {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (!(await isKnownSection(section))) return {};
  const card = await loadSection(section);
  return { title: `${card.heading} — 佐纳` };
}

export default async function SectionIndexPage({ params }: PageProps): Promise<ReactElement> {
  const { section } = await params;
  if (!(await isKnownSection(section))) notFound();

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

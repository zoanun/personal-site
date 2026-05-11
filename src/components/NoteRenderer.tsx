/* eslint-disable @next/next/no-img-element */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import type { ComponentProps, ReactElement } from "react";
import { remarkWikiLink } from "@/lib/remark-wiki-link";
import type { VaultIndex } from "@/lib/vault";
import type { SectionSlug } from "@/lib/content";

interface NoteRendererProps {
  body: string;
  currentSection: SectionSlug;
  vault: VaultIndex;
}

function headingId(children: React.ReactNode): string {
  const text = typeof children === "string" ? children : String(children);
  return new GithubSlugger().slug(text);
}

function H2(props: ComponentProps<"h2">): ReactElement {
  return <h2 {...props} id={typeof props.children === "string" ? headingId(props.children) : undefined} />;
}
function H3(props: ComponentProps<"h3">): ReactElement {
  return <h3 {...props} id={typeof props.children === "string" ? headingId(props.children) : undefined} />;
}

function MdImage(props: ComponentProps<"img">): ReactElement {
  return <img {...props} alt={props.alt ?? ""} loading="lazy" decoding="async" />;
}

export function NoteRenderer({ body, currentSection, vault }: NoteRendererProps): ReactElement {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkWikiLink, { currentSection, vault, attachmentBase: "/_attachments" }]]}
      components={{ h2: H2, h3: H3, img: MdImage }}
    >
      {body}
    </ReactMarkdown>
  );
}

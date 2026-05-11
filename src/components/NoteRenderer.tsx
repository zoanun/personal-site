/* eslint-disable @next/next/no-img-element */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { remarkWikiLink } from "@/lib/remark-wiki-link";
import type { VaultIndex } from "@/lib/vault";
import type { SectionSlug } from "@/lib/content";

interface NoteRendererProps {
  body: string;
  currentSection: SectionSlug;
  vault: VaultIndex;
}

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) {
    const { children } = (node.props ?? {}) as { children?: ReactNode };
    return nodeText(children);
  }
  return "";
}

function headingId(children: ReactNode): string {
  return new GithubSlugger().slug(nodeText(children));
}

function H2(props: ComponentProps<"h2">): ReactElement {
  return <h2 {...props} id={headingId(props.children)} />;
}
function H3(props: ComponentProps<"h3">): ReactElement {
  return <h3 {...props} id={headingId(props.children)} />;
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

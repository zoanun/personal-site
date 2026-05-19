import ReactMarkdown from "react-markdown";
import type { PluggableList } from "unified";
import type { ComponentProps, ReactElement } from "react";
import { remarkWikiLink } from "@/lib/remark-wiki-link";
import type { VaultIndex } from "@/lib/vault";
import type { SectionSlug } from "@/lib/content";

interface MarkdownProps {
  children: string;
  vault?: VaultIndex;
  currentSection?: SectionSlug;
}

const linkClass =
  "underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition";

function MarkdownLink(props: ComponentProps<"a">): ReactElement {
  const href = props.href ?? "";
  const external = /^https?:\/\//.test(href);
  return (
    <a
      {...props}
      className={linkClass}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    />
  );
}

export function Markdown({ children, vault, currentSection }: MarkdownProps): ReactElement {
  const remarkPlugins: PluggableList =
    vault && currentSection
      ? [[remarkWikiLink, { currentSection, vault, attachmentBase: "/_attachments" }]]
      : [];
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={{ a: MarkdownLink }}>
      {children}
    </ReactMarkdown>
  );
}

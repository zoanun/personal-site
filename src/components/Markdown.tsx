import ReactMarkdown from "react-markdown";
import type { ComponentProps, ReactElement } from "react";

interface MarkdownProps {
  children: string;
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

export function Markdown({ children }: MarkdownProps): ReactElement {
  return (
    <ReactMarkdown components={{ a: MarkdownLink }}>{children}</ReactMarkdown>
  );
}

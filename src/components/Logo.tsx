import type { ReactElement } from "react";

interface LogoProps {
  className?: string;
  strokeWidth?: number;
}

export function Logo({
  className,
  strokeWidth = 2,
}: LogoProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <line x1="5" y1="6" x2="19" y2="6" />
      <line x1="20.5" y1="4.5" x2="3.5" y2="19.5" />
      <line x1="5" y1="18" x2="19" y2="18" />
    </svg>
  );
}

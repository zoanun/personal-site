"use client";

import {
  useEffect,
  useState,
  type MouseEvent,
  type ReactElement,
} from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { snapToId } from "@/lib/snapScroll";

export interface NavItemConfig {
  label: string;
  href: string;
  id: string;
}

interface SiteHeaderProps {
  items: NavItemConfig[];
}

export function SiteHeader({ items }: SiteHeaderProps): ReactElement {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const trackedIds = ["top", ...items.map((item) => item.id)];
    const targets = trackedIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items, isHome]);

  const currentSectionId = !isHome
    ? items.find(
        (it) => pathname === `/${it.id}` || pathname.startsWith(`/${it.id}/`),
      )?.id ?? null
    : activeId;

  return (
    <header
      className={
        scrolled
          ? "sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border transition-colors"
          : "sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-transparent transition-colors"
      }
    >
      <div className="mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
        <a
          href={isHome ? "#top" : "/"}
          aria-label="返回顶部"
          onClick={
            isHome
              ? (e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  snapToId("top");
                }
              : undefined
          }
          className="group flex items-center gap-2.5"
        >
          <Logo className="h-5 w-5 text-foreground transition-transform duration-500 group-hover:rotate-[20deg]" />
          <span className="text-sm font-medium tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">
            佐纳
          </span>
        </a>

        <nav className="flex items-center gap-5 sm:gap-7">
          {items.map((item) => (
            <a
              key={item.id}
              href={isHome ? item.href : `/${item.href}`}
              onClick={
                isHome
                  ? (e: MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      snapToId(item.id);
                    }
                  : undefined
              }
              className={
                currentSectionId === item.id
                  ? "font-mono text-xs sm:text-sm tracking-tight text-foreground transition-colors"
                  : "font-mono text-xs sm:text-sm tracking-tight text-muted hover:text-foreground transition-colors"
              }
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

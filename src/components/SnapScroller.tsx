"use client";

import { useEffect } from "react";
import { installSnapScroll } from "@/lib/snapScroll";

interface SnapScrollerProps {
  ids: string[];
}

export function SnapScroller({ ids }: SnapScrollerProps): null {
  useEffect(() => installSnapScroll(ids), [ids]);
  return null;
}

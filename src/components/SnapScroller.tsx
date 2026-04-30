"use client";

import { useEffect } from "react";
import { installSnapScroll } from "@/lib/snapScroll";

export function SnapScroller(): null {
  useEffect(() => installSnapScroll(), []);
  return null;
}

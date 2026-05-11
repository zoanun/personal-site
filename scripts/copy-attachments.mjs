import { cp, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(root, "..", "content", "_attachments");
const dst = path.resolve(root, "..", "public", "_attachments");

try {
  await access(src);
} catch {
  console.log("[copy-attachments] no content/_attachments/, skipping");
  process.exit(0);
}

await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });
await cp(src, dst, { recursive: true });
console.log(`[copy-attachments] ${src} → ${dst}`);

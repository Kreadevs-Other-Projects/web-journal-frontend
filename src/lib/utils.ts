import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { url } from "@/url";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a stored file path to a full URL.
 * Handles all formats:
 *   "/uploads/file.jpg"   → "http://localhost:5000/api/uploads/file.jpg"
 *   "uploads/file.jpg"    → "http://localhost:5000/api/uploads/file.jpg"
 *   "file.jpg"            → "http://localhost:5000/api/uploads/file.jpg"
 *   "http://..."          → returned as-is
 */
/**
 * Returns the canonical URL for a published paper.
 * Uses the new /:acronym/:slug format when available,
 * falls back to /articles/:id for backward compatibility.
 */
export function getPaperUrl(paper: {
  id?: string;
  paper_id?: string;
  acronym?: string;
  journal_acronym?: string;
  url_slug?: string;
}): string {
  const id = paper.id || paper.paper_id;
  const acronym = (paper.acronym || paper.journal_acronym || "").toLowerCase();
  if (acronym && paper.url_slug) {
    return `/${acronym}/${paper.url_slug}`;
  }
  return `/articles/${id}`;
}

export function getFileUrl(filePath: string | null | undefined): string {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  // Strip leading slash
  let clean = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  // Strip accidental "api/" prefix
  if (clean.startsWith("api/")) clean = clean.slice(4);
  // Ensure uploads/ prefix
  if (!clean.startsWith("uploads/")) clean = `uploads/${clean}`;
  return `${url}/${clean}`;
}

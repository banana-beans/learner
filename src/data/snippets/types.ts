// ============================================================
// Snippet types — shared by every per-language file.
// ============================================================

import type { BranchId } from "@/lib/types";

/**
 * Every branch is a valid snippet language. As content arrives for a
 * branch, add it; the type doesn't need updating because BranchId
 * already covers everything.
 */
export type SnippetLanguage = BranchId;

export interface Snippet {
  /** Stable, globally unique. Convention: `{branch-prefix}-{kebab-slug}`. */
  id: string;
  language: SnippetLanguage;
  title: string;
  /** Short tag (e.g., "syntax", "stdlib", "OOP"). Optional. */
  tag?: string;
  /**
   * Source code with INLINE COMMENTS explaining each non-obvious line.
   * The user reads this standalone — don't make them rely on the
   * explanation paragraph alone.
   */
  code: string;
  /** 1–2 sentence "why this matters" / context paragraph. */
  explanation: string;
}

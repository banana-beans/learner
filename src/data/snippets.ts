// ============================================================
// Backwards-compat re-export.
// ============================================================
// The original src/data/snippets.ts was a single big file. Content
// has moved into src/data/snippets/{lang}.ts. Existing imports
// (e.g. `from "@/data/snippets"`) still work via this shim because
// Next/TS resolve the module dir's index.ts.
//
// Keep this file empty-ish so the dir-or-file collision doesn't
// confuse anyone. New code should import from "@/data/snippets"
// (resolves to ./snippets/index.ts).
// ============================================================

export type { Snippet, SnippetLanguage } from "./snippets/index";
export { snippets } from "./snippets/index";

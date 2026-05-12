// ============================================================
// Master snippet registry
// ============================================================
// One file per language under src/data/snippets/. This index
// concatenates them and re-exports the unified array.
// ============================================================

import { pythonSnippets } from "./python";
import { typescriptSnippets } from "./typescript";
import { csharpSnippets } from "./csharp";
import { reactSnippets } from "./react";
import { dsaSnippets } from "./dsa";
import { databasesSnippets } from "./databases";
import { systemsDesignSnippets } from "./systems-design";
import { networkingSnippets } from "./networking";
import { securitySnippets } from "./security";
import { devopsSnippets } from "./devops";
import { pythonSnippets20260509P1 } from "./python-2026-05-09-p1";
import { pythonSnippets20260509P2 } from "./python-2026-05-09-p2";
import { pythonSnippets20260509P3 } from "./python-2026-05-09-p3";
import { pythonSnippets20260509P4 } from "./python-2026-05-09-p4";
import { csharpSnippets20260509P1 } from "./csharp-2026-05-09-p1";
import { csharpSnippets20260509P2 } from "./csharp-2026-05-09-p2";
import { csharpSnippets20260509P3 } from "./csharp-2026-05-09-p3";
import { csharpSnippets20260509P4 } from "./csharp-2026-05-09-p4";
import { pythonSnippets20260509B2P1 } from "./python-2026-05-09-b2-p1";
import { pythonSnippets20260509B2P2 } from "./python-2026-05-09-b2-p2";
import { pythonSnippets20260509B2P3 } from "./python-2026-05-09-b2-p3";
import { pythonSnippets20260509B2P4 } from "./python-2026-05-09-b2-p4";
import { csharpSnippets20260509B2P1 } from "./csharp-2026-05-09-b2-p1";
import { csharpSnippets20260509B2P2 } from "./csharp-2026-05-09-b2-p2";
import { csharpSnippets20260509B2P3 } from "./csharp-2026-05-09-b2-p3";
import { csharpSnippets20260509B2P4 } from "./csharp-2026-05-09-b2-p4";
import { pythonSnippets20260509B3P1 } from "./python-2026-05-09-b3-p1";
import { pythonSnippets20260509B3P2 } from "./python-2026-05-09-b3-p2";
import { pythonSnippets20260509B3P3 } from "./python-2026-05-09-b3-p3";
import { pythonSnippets20260509B3P4 } from "./python-2026-05-09-b3-p4";
import { csharpSnippets20260509B3P1 } from "./csharp-2026-05-09-b3-p1";
import { csharpSnippets20260509B3P2 } from "./csharp-2026-05-09-b3-p2";
import { csharpSnippets20260509B3P3 } from "./csharp-2026-05-09-b3-p3";
import { csharpSnippets20260509B3P4 } from "./csharp-2026-05-09-b3-p4";
import { pythonSnippets20260510B1 } from "./python-2026-05-10-b1";
import { csharpSnippets20260510B1 } from "./csharp-2026-05-10-b1";
import { pythonSnippets20260510B2 } from "./python-2026-05-10-b2";
import { csharpSnippets20260510B2 } from "./csharp-2026-05-10-b2";
import { pythonSnippets20260510B3 } from "./python-2026-05-10-b3";
import { csharpSnippets20260510B3 } from "./csharp-2026-05-10-b3";
import { pythonSnippets20260510B4 } from "./python-2026-05-10-b4";
import { csharpSnippets20260510B4 } from "./csharp-2026-05-10-b4";
import { pythonSnippets20260510B5 } from "./python-2026-05-10-b5";
import { csharpSnippets20260510B5 } from "./csharp-2026-05-10-b5";
import { pythonSnippets20260511B1 } from "./python-2026-05-11-b1";
import { csharpSnippets20260511B1 } from "./csharp-2026-05-11-b1";
import { pythonSnippets20260511B2 } from "./python-2026-05-11-b2";
import { csharpSnippets20260511B2 } from "./csharp-2026-05-11-b2";
import { pythonSnippets20260511B3 } from "./python-2026-05-11-b3";
import { csharpSnippets20260511B3 } from "./csharp-2026-05-11-b3";
import { pythonSnippets20260511B4 } from "./python-2026-05-11-b4";
import { csharpSnippets20260511B4 } from "./csharp-2026-05-11-b4";
import { pythonSnippets20260511B5 } from "./python-2026-05-11-b5";
import { csharpSnippets20260511B5 } from "./csharp-2026-05-11-b5";
import { pythonSnippets20260512B1 } from "./python-2026-05-12-b1";
import { csharpSnippets20260512B1 } from "./csharp-2026-05-12-b1";

import type { Snippet } from "./types";

export type { Snippet, SnippetLanguage } from "./types";

// The scheduled snippet agent occasionally regenerates a snippet under an
// existing id across batches. Dedupe on id, first occurrence wins — so the
// scroll feed renders unique React keys and the graveyard tracks a 1:1 map
// between viewed and remaining content.
function dedupeById(arr: Snippet[]): Snippet[] {
  const seen = new Set<string>();
  const out: Snippet[] = [];
  for (const s of arr) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

const allSnippets: Snippet[] = [
  ...pythonSnippets,
  ...typescriptSnippets,
  ...csharpSnippets,
  ...reactSnippets,
  ...dsaSnippets,
  ...databasesSnippets,
  ...systemsDesignSnippets,
  ...networkingSnippets,
  ...securitySnippets,
  ...devopsSnippets,
  ...pythonSnippets20260509P1,
  ...pythonSnippets20260509P2,
  ...pythonSnippets20260509P3,
  ...pythonSnippets20260509P4,
  ...csharpSnippets20260509P1,
  ...csharpSnippets20260509P2,
  ...csharpSnippets20260509P3,
  ...csharpSnippets20260509P4,
  ...pythonSnippets20260509B2P1,
  ...pythonSnippets20260509B2P2,
  ...pythonSnippets20260509B2P3,
  ...pythonSnippets20260509B2P4,
  ...csharpSnippets20260509B2P1,
  ...csharpSnippets20260509B2P2,
  ...csharpSnippets20260509B2P3,
  ...csharpSnippets20260509B2P4,
  ...pythonSnippets20260509B3P1,
  ...pythonSnippets20260509B3P2,
  ...pythonSnippets20260509B3P3,
  ...pythonSnippets20260509B3P4,
  ...csharpSnippets20260509B3P1,
  ...csharpSnippets20260509B3P2,
  ...csharpSnippets20260509B3P3,
  ...csharpSnippets20260509B3P4,
  ...pythonSnippets20260510B1,
  ...csharpSnippets20260510B1,
  ...pythonSnippets20260510B2,
  ...csharpSnippets20260510B2,
  ...pythonSnippets20260510B3,
  ...csharpSnippets20260510B3,
  ...pythonSnippets20260510B4,
  ...csharpSnippets20260510B4,
  ...pythonSnippets20260510B5,
  ...csharpSnippets20260510B5,
  ...pythonSnippets20260511B1,
  ...csharpSnippets20260511B1,
  ...pythonSnippets20260511B2,
  ...csharpSnippets20260511B2,
  ...pythonSnippets20260511B3,
  ...csharpSnippets20260511B3,
  ...pythonSnippets20260511B4,
  ...csharpSnippets20260511B4,
  ...pythonSnippets20260511B5,
  ...csharpSnippets20260511B5,
  ...pythonSnippets20260512B1,
  ...csharpSnippets20260512B1,
];

export const snippets: Snippet[] = dedupeById(allSnippets);

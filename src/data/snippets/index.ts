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

export type { Snippet, SnippetLanguage } from "./types";

export const snippets = [
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
];

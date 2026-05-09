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
import { pythonSnippets20260509 } from "./python-2026-05-09";
import { csharpSnippets20260509 } from "./csharp-2026-05-09";

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
  ...pythonSnippets20260509,
  ...csharpSnippets20260509,
];

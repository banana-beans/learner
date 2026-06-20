// ============================================================
// Master snippet registry
// ============================================================
// One file per language under src/data/snippets/. This index
// concatenates them and re-exports the unified array.
// ============================================================

import { pythonSnippets } from "./python";
import { typescriptSnippets } from "./typescript";
import { csharpSnippets } from "./csharp";
import { cppSnippets } from "./cpp";
import { pythonFinanceSnippets } from "./python-finance";
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
import { pythonSnippets20260512B2 } from "./python-2026-05-12-b2";
import { csharpSnippets20260512B2 } from "./csharp-2026-05-12-b2";
import { pythonSnippets20260513B1 } from "./python-2026-05-13-b1";
import { csharpSnippets20260513B1 } from "./csharp-2026-05-13-b1";
import { pythonSnippets20260514B1 } from "./python-2026-05-14-b1";
import { csharpSnippets20260514B1 } from "./csharp-2026-05-14-b1";
import { pythonSnippets20260515B1 } from "./python-2026-05-15-b1";
import { csharpSnippets20260515B1 } from "./csharp-2026-05-15-b1";
import { pythonSnippets20260515B2 } from "./python-2026-05-15-b2";
import { csharpSnippets20260515B2 } from "./csharp-2026-05-15-b2";
import { pythonSnippets20260515B3 } from "./python-2026-05-15-b3";
import { csharpSnippets20260515B3 } from "./csharp-2026-05-15-b3";
import { pythonSnippets20260515B4 } from "./python-2026-05-15-b4";
import { csharpSnippets20260515B4 } from "./csharp-2026-05-15-b4";
import { pythonSnippets20260515B5 } from "./python-2026-05-15-b5";
import { csharpSnippets20260515B5 } from "./csharp-2026-05-15-b5";
import { pythonSnippets20260516B1 } from "./python-2026-05-16-b1";
import { csharpSnippets20260516B1 } from "./csharp-2026-05-16-b1";
import { pythonSnippets20260516B2 } from "./python-2026-05-16-b2";
import { csharpSnippets20260516B2 } from "./csharp-2026-05-16-b2";
import { pythonSnippets20260516B3 } from "./python-2026-05-16-b3";
import { csharpSnippets20260516B3 } from "./csharp-2026-05-16-b3";
import { pythonSnippets20260516B4 } from "./python-2026-05-16-b4";
import { csharpSnippets20260516B4 } from "./csharp-2026-05-16-b4";
import { pythonSnippets20260516B5 } from "./python-2026-05-16-b5";
import { csharpSnippets20260516B5 } from "./csharp-2026-05-16-b5";
import { pythonSnippets20260517B1 } from "./python-2026-05-17-b1";
import { csharpSnippets20260517B1 } from "./csharp-2026-05-17-b1";
import { pythonSnippets20260517B2 } from "./python-2026-05-17-b2";
import { csharpSnippets20260517B2 } from "./csharp-2026-05-17-b2";
import { pythonSnippets20260517B3 } from "./python-2026-05-17-b3";
import { csharpSnippets20260517B3 } from "./csharp-2026-05-17-b3";
import { pythonSnippets20260517B4 } from "./python-2026-05-17-b4";
import { csharpSnippets20260517B4 } from "./csharp-2026-05-17-b4";
import { pythonSnippets20260517B5 } from "./python-2026-05-17-b5";
import { csharpSnippets20260517B5 } from "./csharp-2026-05-17-b5";
import { pythonSnippets20260518B1 } from "./python-2026-05-18-b1";
import { csharpSnippets20260518B1 } from "./csharp-2026-05-18-b1";
import { pythonSnippets20260518B2 } from "./python-2026-05-18-b2";
import { csharpSnippets20260518B2 } from "./csharp-2026-05-18-b2";
import { pythonSnippets20260518B3 } from "./python-2026-05-18-b3";
import { csharpSnippets20260518B3 } from "./csharp-2026-05-18-b3";
import { pythonSnippets20260518B4 } from "./python-2026-05-18-b4";
import { csharpSnippets20260518B4 } from "./csharp-2026-05-18-b4";
import { pythonSnippets20260518B5 } from "./python-2026-05-18-b5";
import { csharpSnippets20260518B5 } from "./csharp-2026-05-18-b5";
import { pythonSnippets20260519B1 } from "./python-2026-05-19-b1";
import { csharpSnippets20260519B1 } from "./csharp-2026-05-19-b1";
import { pythonSnippets20260519B2 } from "./python-2026-05-19-b2";
import { csharpSnippets20260519B2 } from "./csharp-2026-05-19-b2";
import { pythonSnippets20260519B3 } from "./python-2026-05-19-b3";
import { csharpSnippets20260519B3 } from "./csharp-2026-05-19-b3";
import { pythonSnippets20260519B4 } from "./python-2026-05-19-b4";
import { csharpSnippets20260519B4 } from "./csharp-2026-05-19-b4";
import { cppSnippets20260519B1 } from "./cpp-2026-05-19-b1";
import { pythonFinanceSnippets20260519B1 } from "./python-finance-2026-05-19-b1";
import { pythonSnippets20260520B1 } from "./python-2026-05-20-b1";
import { csharpSnippets20260520B1 } from "./csharp-2026-05-20-b1";
import { cppSnippets20260520B1 } from "./cpp-2026-05-20-b1";
import { pythonFinanceSnippets20260520B1 } from "./python-finance-2026-05-20-b1";
import { cppSnippets20260521B1 } from "./cpp-2026-05-21-b1";
import { pythonFinanceSnippets20260521B1 } from "./python-finance-2026-05-21-b1";
import { cppSnippets20260522B1 } from "./cpp-2026-05-22-b1";
import { pythonFinanceSnippets20260522B1 } from "./python-finance-2026-05-22-b1";
import { pythonSnippets20260521B1 } from "./python-2026-05-21-b1";
import { csharpSnippets20260521B1 } from "./csharp-2026-05-21-b1";
import { pythonSnippets20260521B2 } from "./python-2026-05-21-b2";
import { csharpSnippets20260521B2 } from "./csharp-2026-05-21-b2";
import { pythonSnippets20260521B3 } from "./python-2026-05-21-b3";
import { csharpSnippets20260521B3 } from "./csharp-2026-05-21-b3";
import { cppSnippets20260523B1 } from "./cpp-2026-05-23-b1";
import { pythonFinanceSnippets20260523B1 } from "./python-finance-2026-05-23-b1";
import { cppSnippets20260524B1 } from "./cpp-2026-05-24-b1";
import { pythonFinanceSnippets20260524B1 } from "./python-finance-2026-05-24-b1";
import { cppSnippets20260525B1 } from "./cpp-2026-05-25-b1";
import { pythonFinanceSnippets20260525B1 } from "./python-finance-2026-05-25-b1";
import { cppSnippets20260526B1 } from "./cpp-2026-05-26-b1";
import { pythonFinanceSnippets20260526B1 } from "./python-finance-2026-05-26-b1";
import { cppSnippets20260527B1 } from "./cpp-2026-05-27-b1";
import { pythonFinanceSnippets20260527B1 } from "./python-finance-2026-05-27-b1";
import { cppSnippets20260528B1 } from "./cpp-2026-05-28-b1";
import { pythonFinanceSnippets20260528B1 } from "./python-finance-2026-05-28-b1";
import { cppSnippets20260529B1 } from "./cpp-2026-05-29-b1";
import { pythonFinanceSnippets20260529B1 } from "./python-finance-2026-05-29-b1";
import { cppSnippets20260530B1 } from "./cpp-2026-05-30-b1";
import { pythonFinanceSnippets20260530B1 } from "./python-finance-2026-05-30-b1";
import { cppSnippets20260531B1 } from "./cpp-2026-05-31-b1";
import { pythonFinanceSnippets20260531B1 } from "./python-finance-2026-05-31-b1";
import { cppSnippets20260601B1 } from "./cpp-2026-06-01-b1";
import { pythonFinanceSnippets20260601B1 } from "./python-finance-2026-06-01-b1";
import { cppSnippets20260602B1 } from "./cpp-2026-06-02-b1";
import { pythonFinanceSnippets20260602B1 } from "./python-finance-2026-06-02-b1";
import { cppSnippets20260603B1 } from "./cpp-2026-06-03-b1";
import { pythonFinanceSnippets20260603B1 } from "./python-finance-2026-06-03-b1";
import { cppSnippets20260604B1 } from "./cpp-2026-06-04-b1";
import { pythonFinanceSnippets20260604B1 } from "./python-finance-2026-06-04-b1";
import { cppSnippets20260605B1 } from "./cpp-2026-06-05-b1";
import { pythonFinanceSnippets20260605B1 } from "./python-finance-2026-06-05-b1";
import { cppSnippets20260606B1 } from "./cpp-2026-06-06-b1";
import { pythonFinanceSnippets20260606B1 } from "./python-finance-2026-06-06-b1";
import { cppSnippets20260607B1 } from "./cpp-2026-06-07-b1";
import { pythonFinanceSnippets20260607B1 } from "./python-finance-2026-06-07-b1";
import { cppSnippets20260608B1 } from "./cpp-2026-06-08-b1";
import { pythonFinanceSnippets20260608B1 } from "./python-finance-2026-06-08-b1";
import { cppSnippets20260609B1 } from "./cpp-2026-06-09-b1";
import { pythonFinanceSnippets20260609B1 } from "./python-finance-2026-06-09-b1";
import { cppSnippets20260610B1 } from "./cpp-2026-06-10-b1";
import { pythonFinanceSnippets20260610B1 } from "./python-finance-2026-06-10-b1";
import { cppSnippets20260611B1 } from "./cpp-2026-06-11-b1";
import { pythonFinanceSnippets20260611B1 } from "./python-finance-2026-06-11-b1";
import { cppSnippets20260612B1 } from "./cpp-2026-06-12-b1";
import { pythonFinanceSnippets20260612B1 } from "./python-finance-2026-06-12-b1";
import { cppSnippets20260613B1 } from "./cpp-2026-06-13-b1";
import { pythonFinanceSnippets20260613B1 } from "./python-finance-2026-06-13-b1";
import { cppSnippets20260614B1 } from "./cpp-2026-06-14-b1";
import { pythonFinanceSnippets20260614B1 } from "./python-finance-2026-06-14-b1";
import { cppSnippets20260615B1 } from "./cpp-2026-06-15-b1";
import { pythonFinanceSnippets20260615B1 } from "./python-finance-2026-06-15-b1";
import { cppSnippets20260616B1 } from "./cpp-2026-06-16-b1";
import { pythonFinanceSnippets20260616B1 } from "./python-finance-2026-06-16-b1";
import { cppSnippets20260617B1 } from "./cpp-2026-06-17-b1";
import { pythonFinanceSnippets20260617B1 } from "./python-finance-2026-06-17-b1";
import { cppSnippets20260618B1 } from "./cpp-2026-06-18-b1";
import { pythonFinanceSnippets20260618B1 } from "./python-finance-2026-06-18-b1";
import { cppSnippets20260619B1 } from "./cpp-2026-06-19-b1";
import { pythonFinanceSnippets20260619B1 } from "./python-finance-2026-06-19-b1";
import { cppSnippets20260620B1 } from "./cpp-2026-06-20-b1";
import { pythonFinanceSnippets20260620B1 } from "./python-finance-2026-06-20-b1";

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
  ...pythonFinanceSnippets,
  ...typescriptSnippets,
  ...csharpSnippets,
  ...cppSnippets,
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
  ...pythonSnippets20260512B2,
  ...csharpSnippets20260512B2,
  ...pythonSnippets20260513B1,
  ...csharpSnippets20260513B1,
  ...pythonSnippets20260514B1,
  ...csharpSnippets20260514B1,
  ...pythonSnippets20260515B1,
  ...csharpSnippets20260515B1,
  ...pythonSnippets20260515B2,
  ...csharpSnippets20260515B2,
  ...pythonSnippets20260515B3,
  ...csharpSnippets20260515B3,
  ...pythonSnippets20260515B4,
  ...csharpSnippets20260515B4,
  ...pythonSnippets20260515B5,
  ...csharpSnippets20260515B5,
  ...pythonSnippets20260516B1,
  ...csharpSnippets20260516B1,
  ...pythonSnippets20260516B2,
  ...csharpSnippets20260516B2,
  ...pythonSnippets20260516B3,
  ...csharpSnippets20260516B3,
  ...pythonSnippets20260516B4,
  ...csharpSnippets20260516B4,
  ...pythonSnippets20260516B5,
  ...csharpSnippets20260516B5,
  ...pythonSnippets20260517B1,
  ...csharpSnippets20260517B1,
  ...pythonSnippets20260517B2,
  ...csharpSnippets20260517B2,
  ...pythonSnippets20260517B3,
  ...csharpSnippets20260517B3,
  ...pythonSnippets20260517B4,
  ...csharpSnippets20260517B4,
  ...pythonSnippets20260517B5,
  ...csharpSnippets20260517B5,
  ...pythonSnippets20260518B1,
  ...csharpSnippets20260518B1,
  ...pythonSnippets20260518B2,
  ...csharpSnippets20260518B2,
  ...pythonSnippets20260518B3,
  ...csharpSnippets20260518B3,
  ...pythonSnippets20260518B4,
  ...csharpSnippets20260518B4,
  ...pythonSnippets20260518B5,
  ...csharpSnippets20260518B5,
  ...pythonSnippets20260519B1,
  ...csharpSnippets20260519B1,
  ...pythonSnippets20260519B2,
  ...csharpSnippets20260519B2,
  ...pythonSnippets20260519B3,
  ...csharpSnippets20260519B3,
  ...pythonSnippets20260519B4,
  ...csharpSnippets20260519B4,
  ...cppSnippets20260519B1,
  ...pythonFinanceSnippets20260519B1,
  ...pythonSnippets20260520B1,
  ...csharpSnippets20260520B1,
  ...cppSnippets20260520B1,
  ...pythonFinanceSnippets20260520B1,
  ...cppSnippets20260521B1,
  ...pythonFinanceSnippets20260521B1,
  ...cppSnippets20260522B1,
  ...pythonFinanceSnippets20260522B1,
  ...pythonSnippets20260521B1,
  ...csharpSnippets20260521B1,
  ...pythonSnippets20260521B2,
  ...csharpSnippets20260521B2,
  ...pythonSnippets20260521B3,
  ...csharpSnippets20260521B3,
  ...cppSnippets20260523B1,
  ...pythonFinanceSnippets20260523B1,
  ...cppSnippets20260524B1,
  ...pythonFinanceSnippets20260524B1,
  ...cppSnippets20260525B1,
  ...pythonFinanceSnippets20260525B1,
  ...cppSnippets20260526B1,
  ...pythonFinanceSnippets20260526B1,
  ...cppSnippets20260527B1,
  ...pythonFinanceSnippets20260527B1,
  ...cppSnippets20260528B1,
  ...pythonFinanceSnippets20260528B1,
  ...cppSnippets20260529B1,
  ...pythonFinanceSnippets20260529B1,
  ...cppSnippets20260530B1,
  ...pythonFinanceSnippets20260530B1,
  ...cppSnippets20260531B1,
  ...pythonFinanceSnippets20260531B1,
  ...cppSnippets20260601B1,
  ...pythonFinanceSnippets20260601B1,
  ...cppSnippets20260602B1,
  ...pythonFinanceSnippets20260602B1,
  ...cppSnippets20260603B1,
  ...pythonFinanceSnippets20260603B1,
  ...cppSnippets20260604B1,
  ...pythonFinanceSnippets20260604B1,
  ...cppSnippets20260605B1,
  ...pythonFinanceSnippets20260605B1,
  ...cppSnippets20260606B1,
  ...pythonFinanceSnippets20260606B1,
  ...cppSnippets20260607B1,
  ...pythonFinanceSnippets20260607B1,
  ...cppSnippets20260608B1,
  ...pythonFinanceSnippets20260608B1,
  ...cppSnippets20260609B1,
  ...pythonFinanceSnippets20260609B1,
  ...cppSnippets20260610B1,
  ...pythonFinanceSnippets20260610B1,
  ...cppSnippets20260611B1,
  ...pythonFinanceSnippets20260611B1,
  ...cppSnippets20260612B1,
  ...pythonFinanceSnippets20260612B1,
  ...cppSnippets20260613B1,
  ...pythonFinanceSnippets20260613B1,
  ...cppSnippets20260614B1,
  ...pythonFinanceSnippets20260614B1,
  ...cppSnippets20260615B1,
  ...pythonFinanceSnippets20260615B1,
  ...cppSnippets20260616B1,
  ...pythonFinanceSnippets20260616B1,
  ...cppSnippets20260617B1,
  ...pythonFinanceSnippets20260617B1,
  ...cppSnippets20260618B1,
  ...pythonFinanceSnippets20260618B1,
  ...cppSnippets20260619B1,
  ...pythonFinanceSnippets20260619B1,
  ...cppSnippets20260620B1,
  ...pythonFinanceSnippets20260620B1,
];

export const snippets: Snippet[] = dedupeById(allSnippets);

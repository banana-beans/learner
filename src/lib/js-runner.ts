// ============================================================
// In-browser JavaScript runner
// ============================================================
// Runs user code in an async Function with stdout captured from
// console.log / .info / .warn / .error. Strips obvious TS-only
// syntax (`: type`, `as Type`) so simple TS samples just work.
// ============================================================

export interface RunResult {
  stdout: string;
  error?: string;
}

function stringify(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint")
    return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function stripTSAnnotations(src: string): string {
  // Lightweight stripper for the TS-flavored snippets the lessons use.
  // Not a real parser — fine for short challenges.
  return src
    // remove `as Type` casts
    .replace(/\s+as\s+[A-Za-z_$][\w$<>[\],\s|&'".]*/g, "")
    // remove `: Type` annotations on params / vars (stops at = , ) ; { newline)
    .replace(/(\b[a-zA-Z_$][\w$]*)\s*:\s*[A-Za-z_$][\w$<>[\],\s|&'".]*?(?=[=,;){\n])/g, "$1")
    // remove `<T>` generic params on function/var declarations
    .replace(/(\bfunction\b\s*[a-zA-Z_$]?\w*)\s*<[^>]*>/g, "$1")
    // drop `interface ... {...}` blocks
    .replace(/\binterface\s+\w+\s*\{[^}]*\}/g, "")
    // drop `type Foo = ...;` aliases
    .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, "");
}

export async function runJavaScript(code: string): Promise<RunResult> {
  const buf: string[] = [];
  const cons = {
    log: (...args: unknown[]) => buf.push(args.map(stringify).join(" ")),
    info: (...args: unknown[]) => buf.push(args.map(stringify).join(" ")),
    warn: (...args: unknown[]) => buf.push(args.map(stringify).join(" ")),
    error: (...args: unknown[]) => buf.push(args.map(stringify).join(" ")),
  };

  const cleaned = stripTSAnnotations(code);

  try {
    const factory = new Function(
      "console",
      `"use strict"; return (async () => {\n${cleaned}\n})();`
    );
    await factory(cons);
    return { stdout: buf.join("\n") };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { stdout: buf.join("\n"), error: message };
  }
}

import type { Snippet } from "./types";

export const pythonSnippets20260511B1: Snippet[] = [
  {
    id: "py-fstring-conv",
    language: "python",
    title: "f-string conversion flags !r !s !a",
    tag: "snippet",
    code: `name = "café"
print(f"{name!r}")   # 'café'   — repr(): adds quotes, escapes non-ASCII if needed
print(f"{name!s}")   # café     — str(): plain string form (default)
print(f"{name!a}")   # 'caf\\xe9' — ascii(): like repr() but escapes non-ASCII

class Point:
    def __repr__(self): return "Point(1, 2)"
    def __str__(self):  return "(1, 2)"

p = Point()
print(f"{p!r}")  # Point(1, 2)
print(f"{p!s}")  # (1, 2)`,
    explanation:
      "The !r, !s, and !a conversion flags in f-strings call repr(), str(), and ascii() on the value before any format spec is applied — !r is especially handy for debugging because it reveals the type and escaping.",
  },
];
import { snippets, type SnippetLanguage } from "@/data/snippets";

export const dynamic = "force-static";

const LANG_KEYS: SnippetLanguage[] = [
  "python",
  "typescript",
  "csharp",
  "react",
  "dsa",
  "databases",
  "systems-design",
  "networking",
  "security",
  "devops",
];

const VALID = new Set<string>([...LANG_KEYS, "all"]);

export function generateStaticParams() {
  return [...LANG_KEYS, "all"].map((lang) => ({ lang }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  if (!VALID.has(lang)) {
    return Response.json({ error: "unknown language" }, { status: 404 });
  }
  const data =
    lang === "all"
      ? snippets
      : snippets.filter((s) => s.language === (lang as SnippetLanguage));
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
    },
  });
}

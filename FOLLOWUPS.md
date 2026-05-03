# Follow-ups

Open issues to pick up in future sessions. Add new items at the top; mark
done with `~~strikethrough~~` and date.

---

## Open

### Snippet bundle size will block scaling past ~few thousand total

**Discovered:** 2026-05-03 (after wiring graveyard + restructuring snippets).

**The problem.** Every snippet currently gets bundled into the client JS at
build time. We're at ~191 snippets and the existing model already generates
substantial bundles. The user goal is **10k per language × 10 branches =
100k total snippets**. At average ~400 bytes per snippet (code + explanation
+ inline comments), that's ~40 MB of raw JSON, ballooning to hundreds of MB
of JS once tree-shaking and minification do their work and the client tries
to parse and hold it all in memory.

This will break the app well before 10k per branch — likely somewhere
around 2–5 k total snippets across branches.

**Why it works today.** Next.js bundles `src/data/snippets/index.ts` →
imports every per-language file → ships everything to the client on first
visit to `/scroll`. Acceptable at 191; not acceptable at 100k.

**Fix path (sketch).**

1. Move each language file's array into a static JSON asset under
   `public/snippets/{lang}.json` at build time (or generate them with a
   small build script).
2. Replace the static `import` in `src/data/snippets/index.ts` with a
   dynamic per-language fetch:
   ```ts
   export async function loadSnippets(lang: SnippetLanguage): Promise<Snippet[]> {
     const res = await fetch(`/snippets/${lang}.json`);
     return res.json();
   }
   ```
3. Update `/scroll` to load only the active filter's shard (and prefetch
   "All" as a streaming concat).
4. Service worker (`public/sw.js`) already caches same-origin static —
   shards become free to revisit offline after first fetch.
5. For the "All" filter: server-rendered shuffle + paginated `/api/scroll`
   route, OR client-side concat of multiple shards lazy-loaded as the user
   nears the end of the current pool.

**When to do it.** Before adding more than ~500 more snippets to any one
language file, OR before wiring the scheduled-agent path that generates
content nightly. Whichever comes first.

**Effort estimate.** ~1–2 hours including tests and verifying offline
behavior with the SW.

---

### Per-snippet inline comments may feel cramped on iPhone

**Discovered:** 2026-05-03.

Some longer snippets (notably in security/devops) push visual density up.
Code blocks already horizontal-scroll on phone, but if the wrapped prose
inside `// ...` comments is too long the cards feel busy on a 6.1" screen.

**Action.** Open the live site on the actual iPhone 16, scroll through 30
snippets per category, flag any that feel cramped. Trim those specifically;
don't reformat globally.

---

### Live-on-iPhone smoke pass not done

**Discovered:** 2026-05-03.

The PWA, graveyard, and snippet content all shipped without me actually
opening the deployed site on a real phone viewport. Production smoke is
HTTP status checks only.

**Action (next session).** Open `learner-seven-mu.vercel.app` in iPhone
Safari, walk through:

- Add to Home Screen → standalone launch
- iOS install hint banner appears (then dismisses)
- Service worker registers (DevTools / `navigator.serviceWorker.controller`)
- Open `/learn/python:t1:hello-world`, run a challenge — Pyodide downloads
  once, then cached on subsequent runs
- Toggle airplane mode → previously-visited pages still load
- Scroll mode: graveyard counter updates, filter chips horizontal-scroll
- Code editor textarea: doesn't trigger iOS auto-zoom on focus

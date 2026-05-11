# Follow-ups

Open issues to pick up in future sessions. Add new items at the top; mark
done with `~~strikethrough~~` and date.

---

## Done

### ~~Snippet bundle size will block scaling past ~few thousand total~~ (2026-05-10)

Fixed by serving snippets from a static API route (`src/app/api/snippets/[lang]/route.ts`) with `force-static` + `generateStaticParams`. Each language shard is prerendered at build time:

- `all.body` 3.1M, `python.body` 1.5M, `csharp.body` 1.6M, others ~13–15K each
- Client `/scroll` chunk no longer carries snippet data (only types, which are erased)
- Service worker (`public/sw.js` v2) caches `/api/snippets/*` cache-first, so offline access still works after first visit
- Module-scoped shard cache in `scroll/page.tsx` makes filter switches instant

Also fixed during this session: duplicate snippet IDs caused by agent regenerating snippets across batches — `src/data/snippets/index.ts` now dedupes by id (first occurrence wins).

---

## Open

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

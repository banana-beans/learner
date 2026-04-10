# 07 — Code Execution & Sandboxing

> Research document 07 of 12 for **Learner** — a gamified developer learning app.
> This document addresses the most critical technical decision in the project: how to run user-written code safely inside the browser, fully offline, on both desktop and mobile devices.

---

## 1. Requirements

A developer learning app lives or dies on its code execution experience. If a learner writes a function and hits "Run," the feedback loop must be fast, correct, and safe. The following requirements are non-negotiable:

**Must-have:**

- **In-browser Python execution** — no server round-trip. The user writes Python, presses Run, and sees output. The entire execution happens on the client.
- **Complete offline support** — the app is designed for NYC subway commutes. No internet means no cloud-based execution services. The runtime must be cached locally after a single online load.
- **Safe sandboxing** — user code must not be able to access the host filesystem, make network requests, spawn processes, or interact with browser APIs. A beginner writing `import os; os.system("rm -rf /")` should get a harmless error, not a catastrophe.
- **Standard library access** — `collections`, `itertools`, `functools`, `math`, `re`, `json`, `string`, `random`, `datetime`, `typing`, and other modules that appear in curriculum exercises must work.
- **stdout/stderr/exception capture** — the app must intercept all output streams and present them to the user in a formatted panel.
- **Test case execution** — the app calls user-defined functions with specific inputs and compares return values to expected outputs. This is the core mechanic of every coding challenge.
- **Timeout handling** — infinite loops (`while True: pass`) must be killed, not allowed to freeze the browser tab. A 5-second ceiling per test case is reasonable for learning exercises.
- **Reasonable mobile performance** — the runtime must load and execute code on modern iPhones (A14+) and mid-range Android devices without unacceptable lag.

**Nice-to-have (Phase 2+):**

- TypeScript/React execution for front-end curriculum modules.
- Visual output (simple plots, HTML rendering) for advanced challenges.
- Multi-file project execution for capstone exercises.

---

## 2. Pyodide — Python in WebAssembly

### What It Is

Pyodide is CPython — the reference implementation of Python — compiled to WebAssembly via the Emscripten toolchain. It is not a reimplementation, not a transpiler, not a subset. It is the actual CPython interpreter, bytecode compiler, and standard library running inside a WebAssembly virtual machine in the browser.

This distinction matters enormously. Pyodide runs *real Python*. Every edge case, every standard library module, every language feature behaves identically to running `python3` on a desktop. For a learning app, this means students learn actual Python, not a dialect.

### Maturity and Adoption

Pyodide is currently at version 0.29.3 and has been in active development since 2019 (originally a Mozilla project, now an independent open-source effort). It powers several production-grade tools:

- **JupyterLite** — a full Jupyter notebook running entirely in the browser, used by the Jupyter team for documentation and workshops.
- **Marimo** — a reactive Python notebook that uses Pyodide for its WASM mode.
- **PyScript** — Anaconda's framework for embedding Python in HTML pages.
- **Online Python** — a browser-based Python REPL used by thousands of students daily.

This is not experimental technology. It is production-grade, actively maintained, and backed by a growing ecosystem.

### Bundle Size and Loading

The Pyodide core consists of several files:

| File | Uncompressed | Gzip/Brotli Compressed |
|------|-------------|----------------------|
| `pyodide.asm.wasm` | ~13 MB | ~5–6 MB |
| `pyodide.asm.js` | ~3 MB | ~800 KB |
| `pyodide.asm.data` (stdlib) | ~8 MB | ~3 MB |
| `pyodide.js` (loader) | ~20 KB | ~6 KB |
| **Total** | **~24 MB** | **~9–10 MB** |

The full distribution archive (200+ MB) includes optional scientific packages like NumPy, Pandas, and Matplotlib. Learner does not need these for the core curriculum — the standard library alone covers everything through intermediate Python.

**Loading timeline:**

- **First visit (online):** 2–5 seconds to download compressed bundle over a typical broadband or LTE connection. Slower on 3G (~10–15 seconds), but this is a one-time cost.
- **Subsequent visits (cached):** Pyodide loads from the Service Worker cache in under 1 second. The WASM binary is compiled and cached by the browser's built-in WASM compilation cache, making initialization near-instant.
- **Offline:** identical to cached performance. No network requests needed.

### What Works

The full Python 3.12+ standard library is available, including every module relevant to the Learner curriculum:

- `collections` (Counter, defaultdict, deque, OrderedDict)
- `itertools` (chain, product, permutations, combinations, groupby)
- `functools` (reduce, lru_cache, partial, wraps)
- `math`, `random`, `statistics`
- `re` (regular expressions)
- `json`, `csv`, `string`, `textwrap`
- `datetime`, `calendar`
- `typing` (type hints)
- `dataclasses`
- `enum`
- `abc` (abstract base classes)
- `heapq`, `bisect`, `array`
- `unittest`, `doctest`
- `copy`, `pprint`, `operator`

For advanced modules (NumPy, Pandas), Pyodide supports loading them on-demand via `micropip.install()`, but this requires network access. For offline use, these would need to be pre-cached — a Phase 3+ consideration.

### What Does NOT Work (Sandbox Boundaries)

Pyodide's WASM sandbox inherently prevents dangerous operations:

- **`os.system()`, `subprocess`** — no shell access. Calls raise `OSError` or return silently.
- **`socket`** — no raw network access. Cannot open TCP/UDP connections.
- **File I/O** — operates on an in-memory virtual filesystem (Emscripten's MEMFS), not the host disk. `open("foo.txt", "w")` writes to ephemeral memory that vanishes when the page closes.
- **`ctypes`, `cffi`** — cannot load native shared libraries.
- **Threading** — `threading` module exists but operates within WASM's single-threaded model. `multiprocessing` is non-functional.
- **Signal handling** — limited. Cannot catch `SIGTERM`, `SIGKILL`, etc.

This is not a feature we need to implement — it is a property of the WebAssembly execution model itself. WASM code runs in a linear memory sandbox with no access to host APIs unless explicitly bridged. Pyodide bridges only what is safe (JavaScript interop, virtual filesystem).

### Performance Characteristics

Pyodide runs approximately 3–10x slower than native CPython, depending on the workload:

- **Pure Python computation** (loops, string manipulation, list operations): ~3–5x slower. For learning exercises that typically run in under 100ms natively, this means under 500ms in Pyodide — imperceptible.
- **Numeric computation** (math-heavy loops without NumPy): ~5–10x slower. Still fine for the scale of exercises in a learning app.
- **Recent optimization work** has narrowed the gap — some benchmarks show Pyodide achieving 90–95% of native speed for tasks that can leverage WASM's optimizations.

For context: a typical Learner exercise ("implement a function that returns the nth Fibonacci number") executes in under 10ms in Pyodide. Even a brute-force solution to a medium-difficulty problem runs in under 1 second. Performance is not a concern for the learning use case.

### Mobile Performance

Pyodide works on:

- **iOS Safari** (iOS 15+): Full support. The WASM JIT compiler in Safari has been production-ready since 2021. Load time is slightly longer than desktop (~3–5 seconds first load), but cached loads are fast.
- **Chrome for Android**: Full support. V8's WASM pipeline is mature and optimized.
- **Firefox for Android**: Supported but less common among target users.

Memory usage is approximately 50 MB for the Pyodide runtime — well within the capabilities of any phone manufactured after 2019 (minimum 3–4 GB RAM). Testing on actual devices is essential before launch, but there are no known blockers.

---

## 3. Web Worker Execution Architecture

Running Pyodide on the main thread is a non-starter. The main thread handles UI rendering, scroll events, touch interactions, and animation. If a user's code takes 2 seconds to execute (or infinitely loops), the entire app freezes.

The solution is a **Web Worker** — a background thread with its own JavaScript execution context, completely isolated from the main thread.

### Architecture

```
Main Thread (UI)                    Web Worker (Pyodide)
┌──────────────────┐                ┌──────────────────┐
│  React App       │                │  Pyodide Runtime  │
│  Monaco Editor   │  postMessage   │  Python Interpreter│
│  Results Panel   │ ──────────────>│  Virtual FS       │
│                  │                │                    │
│  Loading States  │  postMessage   │  stdout capture   │
│  Test Results    │ <──────────────│  Test runner       │
└──────────────────┘                └──────────────────┘
```

**Communication flow:**

1. **User writes code** in the Monaco Editor on the main thread.
2. **User clicks "Run"** — the main thread sends a message to the Web Worker containing the user's code string and the test case definitions.
3. **Web Worker executes** the code inside Pyodide, captures stdout/stderr, runs test cases against user-defined functions, and packages results.
4. **Worker posts results back** to the main thread: stdout output, test results (pass/fail), any exceptions with formatted tracebacks.
5. **Main thread renders** the results in the output panel.

### Timeout Handling

The Web Worker model provides a clean solution to infinite loops:

```typescript
// Main thread
const worker = new Worker('pyodide-worker.js');
const timeoutId = setTimeout(() => {
  worker.terminate();  // Kills the worker instantly
  // Spawn a new worker for the next execution
  createNewWorker();
  showError("Your code took too long (>5 seconds). Check for infinite loops.");
}, 5000);

worker.onmessage = (event) => {
  clearTimeout(timeoutId);
  displayResults(event.data);
};
```

`Worker.terminate()` is the nuclear option — it immediately destroys the worker thread, freeing all memory. There is no graceful shutdown, no cleanup. This is exactly what we want for infinite loops. The cost is re-initializing Pyodide in a new worker, which takes ~500ms from cache (the WASM binary is already compiled and cached by the browser).

### stdout/stderr Capture

Inside the Web Worker, Pyodide's Python `sys.stdout` and `sys.stderr` can be redirected to JavaScript callbacks:

```python
import sys
from io import StringIO

captured_stdout = StringIO()
captured_stderr = StringIO()
sys.stdout = captured_stdout
sys.stderr = captured_stderr

# Execute user code
exec(user_code)

# Retrieve output
stdout_text = captured_stdout.getvalue()
stderr_text = captured_stderr.getvalue()
```

Pyodide also provides `pyodide.runPython()` which returns the result of the last expression evaluated, and `pyodide.runPythonAsync()` for code that uses `await`.

---

## 4. Monaco Editor Integration

### Why Monaco

Monaco is the editor component extracted from VS Code. It is the de facto standard for browser-based code editing and is used by VS Code for the Web, GitHub's web editor, TypeScript Playground, and hundreds of other tools.

For Learner, the key benefits are:

- **Syntax highlighting** for Python (and later TypeScript, JavaScript, HTML, CSS).
- **Autocomplete / IntelliSense** — Monaco's suggestion engine provides basic autocompletion for Python keywords and built-ins.
- **Bracket matching** — visual pairing of `()`, `[]`, `{}`.
- **Error markers** — red underlines for syntax errors (can be driven by Pyodide's parser).
- **Familiar UX** — millions of developers already know the VS Code editing experience. Zero learning curve.

### React Integration

The `@monaco-editor/react` package (v4+, supports React 19) provides a clean wrapper:

```tsx
import Editor from '@monaco-editor/react';

<Editor
  height="300px"
  language="python"
  theme="vs-dark"
  value={userCode}
  onChange={(value) => setUserCode(value)}
  options={{
    fontSize: 16,
    minimap: { enabled: false },
    wordWrap: 'on',
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoIndent: 'full',
    tabSize: 4,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    renderLineHighlight: 'all',
    padding: { top: 12 },
  }}
/>
```

### Configuration Notes

- **`minimap: { enabled: false }`** — the minimap wastes screen space on mobile and small windows. Disable it.
- **`fontSize: 16`** — anything below 16px on iOS triggers the browser's auto-zoom behavior when the user taps the editor, which is disorienting. 16–18px is the sweet spot.
- **`wordWrap: 'on'`** — prevents horizontal scrolling on narrow screens.
- **`scrollBeyondLastLine: false`** — prevents confusing empty space at the bottom.
- **`tabSize: 4`** — Python convention.

### Offline Support

Monaco's JavaScript and language grammars are loaded once and cached by the Service Worker alongside the rest of the app. There are no external network requests during editing. Autocomplete is local (no Language Server Protocol — we are not running a Python language server).

### Performance

Monaco is lightweight relative to a full IDE. It loads in under 500ms and consumes minimal memory. It works on mobile browsers, though touch interactions are less precise than mouse/keyboard. This is addressed in the Mobile UX section.

---

## 5. Test Case Execution Architecture

The test runner is the core engine of the learning experience. Every challenge is defined by a set of test cases, and the user's goal is to write code that passes all of them.

### Execution Pipeline

```
1. User writes code: def two_sum(nums, target): ...
2. User clicks "Submit"
3. Main thread sends to Web Worker:
   {
     code: "def two_sum(nums, target): ...",
     tests: [
       { id: "t1", fn: "two_sum", args: [[2,7,11,15], 9], expected: [0,1] },
       { id: "t2", fn: "two_sum", args: [[3,2,4], 6], expected: [1,2] },
       { id: "t3", fn: "two_sum", args: [[3,3], 6], expected: [0,1] },
     ]
   }
4. Web Worker:
   a. Resets Pyodide namespace (clear previous definitions)
   b. Executes user code (defines the function)
   c. For each test case:
      - Calls the function with the provided arguments
      - Captures the return value
      - Compares to expected output
      - Catches any exceptions
   d. Returns results array
5. Main thread renders pass/fail for each test
```

### Test Runner Implementation (Worker-Side)

The worker-side test runner executes inside Pyodide:

```python
import json, sys, traceback
from io import StringIO

def run_tests(user_code, tests):
    results = []
    
    # Execute user code in isolated namespace
    namespace = {}
    try:
        exec(user_code, namespace)
    except Exception as e:
        return [{"testId": t["id"], "passed": False, 
                 "error": f"Code failed to execute: {e}"} for t in tests]
    
    for test in tests:
        result = {"testId": test["id"], "input": test["args"], 
                  "expected": test["expected"]}
        
        # Capture stdout for this test
        old_stdout = sys.stdout
        sys.stdout = StringIO()
        
        try:
            fn = namespace.get(test["fn"])
            if fn is None:
                result["passed"] = False
                result["error"] = f"Function '{test['fn']}' not found"
            else:
                actual = fn(*test["args"])
                result["actual"] = actual
                result["passed"] = actual == test["expected"]
        except Exception as e:
            result["passed"] = False
            result["error"] = traceback.format_exc()
        finally:
            result["stdout"] = sys.stdout.getvalue()
            sys.stdout = old_stdout
        
        results.append(result)
    
    return results
```

### Test Result Format

Each test produces a result object:

```json
{
  "testId": "t1",
  "input": [[2, 7, 11, 15], 9],
  "expected": [0, 1],
  "actual": [0, 1],
  "passed": true,
  "stdout": "",
  "error": null
}
```

For failing tests, the `actual` field shows what the user's function returned, and `error` contains a formatted traceback if an exception occurred. This gives the learner precise feedback: "Your function returned `[1, 0]` but expected `[0, 1]`."

### Edge Cases

- **User redefines built-ins** — `exec(user_code, namespace)` uses an isolated namespace, so overwriting `print` or `len` in user code does not affect the test runner itself.
- **User code produces no function** — the runner checks `namespace.get(fn_name)` and returns a clear error.
- **Infinite loop in a single test** — handled by the 5-second timeout at the Worker level. If one test hangs, the entire worker is terminated.
- **Memory exhaustion** — e.g., `x = [0] * 10**9`. WASM has a memory limit (typically 2–4 GB). Pyodide will throw a `MemoryError` which the test runner catches.
- **Import of blocked modules** — `import requests` raises `ModuleNotFoundError`, which is caught and reported.

### Security Model

Pyodide's sandbox is inherent to WebAssembly:

- WASM code runs in a **linear memory sandbox** — it cannot read or write memory outside its allocated region.
- There are **no syscalls** — WASM has no concept of file descriptors, process IDs, or network sockets unless the embedding environment (JavaScript) explicitly provides them.
- Pyodide's Emscripten layer provides a **virtual filesystem** (MEMFS) that exists only in memory. Writes go nowhere.
- The Web Worker adds an additional layer of isolation — even if Pyodide's JavaScript bridge had a vulnerability, the worker cannot access the DOM, cookies, or localStorage.

This is defense in depth: WASM sandboxing + Emscripten virtual filesystem + Web Worker isolation. For a learning app (not a bank), this is more than sufficient.

---

## 6. Sandpack — React/TypeScript Execution (Phase 2)

### What It Is

Sandpack is CodeSandbox's open-source in-browser bundler and runtime, extracted into a reusable component library. It powers the live code examples on the React documentation site and hundreds of technical blogs.

Unlike Pyodide (which runs a compiled interpreter via WASM), Sandpack runs JavaScript and TypeScript natively — the browser already has a JS engine. Sandpack's job is to handle module resolution, JSX transformation, and bundling, all inside a Service Worker.

### Use Case for Learner

Phase 2 of the curriculum includes React and TypeScript challenges. Sandpack is the natural fit:

- **Live preview** — the learner writes a React component and sees it render in real-time in an iframe.
- **Hot reload** — changes update the preview without a full page reload.
- **NPM package resolution** — Sandpack can fetch and bundle packages like `react`, `react-dom`, and common libraries.
- **Multi-file support** — the learner can work with `App.tsx`, `styles.css`, and other files in a project structure.

### Offline Limitations

Here is where Sandpack diverges from Pyodide's offline story. Sandpack needs to fetch NPM packages on first use. Once fetched, its Service Worker caches the transpilers and can work offline for subsequent sessions. However:

- **First load requires internet** — to download React, ReactDOM, and any dependencies.
- **New packages require internet** — if a challenge introduces a package the user has not encountered before, it must be fetched.

This is a meaningful limitation for the subway use case.

### Offline Alternatives for TypeScript

For basic TypeScript exercises (type annotations, generics, utility types, interfaces), a full bundler is overkill. Alternative approaches:

1. **TypeScript compiler in WASM** — the TypeScript compiler can be loaded in the browser. Use it to type-check code and run the emitted JavaScript via `eval()` in a sandboxed iframe.
2. **Simple eval-in-iframe** — for exercises that are pure functions (no DOM, no imports), transpile TypeScript to JavaScript using a cached TypeScript compiler, then execute in a sandboxed `<iframe sandbox="allow-scripts">`.
3. **SWC in WASM** — the SWC (Speedy Web Compiler) Rust-based transpiler is available as a WASM module. It can strip type annotations and transform JSX at near-native speed, entirely offline.

### Recommendation

| Curriculum Phase | Challenge Type | Engine | Offline? |
|-----------------|---------------|--------|----------|
| Phase 1 | Python fundamentals | Pyodide | Yes |
| Phase 2a | TypeScript basics | TypeScript WASM + eval | Yes |
| Phase 2b | React components | Sandpack | Partial |
| Phase 3+ | Full-stack projects | Sandpack or WebContainers | No |

For Phase 2a (TypeScript exercises without React), the TypeScript-in-WASM approach keeps everything offline. For Phase 2b (React component challenges), accept that Sandpack requires initial online access but caches aggressively for subsequent offline use. Pre-cache the most common packages (react, react-dom) during the initial app setup.

---

## 7. Alternative Approaches Evaluated

### Judge0 API

**What it is:** A hosted code execution API that accepts source code, runs it in a Docker container, and returns output. Supports 60+ languages.

**Pros:** Full language support, real execution environment, handles edge cases perfectly.

**Cons:** Requires internet for every execution. Adds 500ms–2s latency per run. Costs money at scale ($0.002–0.01 per execution). Rate limits apply.

**Verdict:** Rejected. Fundamentally incompatible with the offline requirement. Even if offline were not a requirement, the latency would degrade the feedback loop that makes coding exercises effective.

### Piston API

**What it is:** Similar to Judge0 — a self-hostable code execution engine. Can be deployed on your own server.

**Pros:** Self-hosted eliminates cost-per-execution. Same multi-language support.

**Cons:** Still requires internet (or a local server). Still adds network latency. Requires server infrastructure to maintain.

**Verdict:** Rejected for the same reasons as Judge0.

### Brython

**What it is:** A Python-to-JavaScript transpiler. Python source code is parsed and converted to equivalent JavaScript, which then runs natively in the browser.

**Pros:** Lighter than Pyodide (~1 MB vs ~10 MB). Faster initial load. No WASM required.

**Cons:** Incomplete standard library coverage — many modules either do not work or behave differently than CPython. Performance can be worse than Pyodide for computation-heavy code because the generated JavaScript is not optimized. Compatibility issues accumulate as exercises get more complex. Maintenance has slowed; the project is less actively developed than Pyodide.

**Verdict:** Rejected. For a learning app, correctness is paramount. If a student writes valid Python and it behaves differently in Brython than in CPython, the app is teaching the wrong thing.

### Skulpt

**What it is:** A Python interpreter written in JavaScript. Parses and executes Python code directly without transpilation.

**Pros:** Lightweight (~1 MB). Was one of the first Python-in-browser solutions (used in early versions of Codecademy).

**Cons:** Stuck at Python 2/3 hybrid — never achieved full Python 3 compatibility. Standard library support is minimal. Development has largely stalled. Cannot run most real-world Python code.

**Verdict:** Rejected. A legacy tool from the pre-WASM era. Pyodide supersedes it in every dimension.

### WebContainers (StackBlitz)

**What it is:** A WebAssembly-based operating system that runs a full Node.js environment in the browser. Powers StackBlitz's online IDE.

**Pros:** Extremely powerful — can run npm, webpack, Vite, and full Node.js applications. Supports offline mode after initial load. Fast package installation (~10x faster than local npm).

**Cons:** Heavy — designed for full development environments, not lightweight exercises. Browser support is limited (full support only in Chromium; beta in Firefox and Safari). Does not run Python. The API is more complex than needed for our use case.

**Verdict:** Not rejected, but deferred to Phase 4+. If Learner ever needs full Node.js execution (e.g., building a full-stack project), WebContainers is the right tool. For Phase 1–3, it is overkill.

---

## 8. Offline Caching Strategy

The offline story is what makes Learner viable on the subway. Every component of the code execution pipeline must work without a network connection after the initial setup.

### Service Worker Architecture

A Service Worker intercepts all network requests and serves cached responses when offline. For Learner:

```
Service Worker Cache Contents:
├── App shell (HTML, CSS, JS)                    ~2 MB
├── Pyodide WASM bundle                          ~10 MB (compressed)
├── Monaco Editor assets                         ~3 MB
├── Lesson content (all unlocked lessons)        ~5 MB
├── User state (IndexedDB, not in SW cache)      ~1 MB
└── Total cached footprint                       ~21 MB
```

### Caching Strategy by Asset Type

| Asset | Cache Strategy | Storage |
|-------|---------------|---------|
| Pyodide WASM | Cache on first use, versioned | CacheStorage |
| Monaco Editor JS | Cache with app shell | CacheStorage |
| Lesson content | Pre-cache on first visit | CacheStorage |
| User code / progress | Persist locally | IndexedDB |
| Test case definitions | Bundled with lessons | CacheStorage |

### Pre-warm Strategy

On first app visit (when the user is online):

1. Register the Service Worker immediately.
2. Cache the app shell (HTML, CSS, core JS).
3. Begin background download of Pyodide WASM bundle while the user reads onboarding screens.
4. Show a progress indicator: "Downloading Python environment for offline use... 7/10 MB"
5. Once complete, display: "You're all set for offline coding."

This ensures Pyodide is cached before the user ever enters a code challenge. The 10 MB download happens once, in the background, and subsequent visits are instant.

### Cache Versioning

When Pyodide releases a new version (roughly every 2–3 months):

1. The app detects a version mismatch between the cached and current Pyodide version.
2. It downloads the new version in the background (only when online and on WiFi if possible).
3. Once downloaded, the old version is evicted from the cache.
4. The user is not interrupted — the new version is used on the next app restart.

### Storage Budget

Modern browsers allocate generous storage quotas:

- **Chrome:** Up to 80% of total disk space (effectively unlimited for our needs).
- **Safari:** 1 GB per origin by default, more with user permission (since iOS 17).
- **Firefox:** Up to 2 GB per origin.

Our total footprint (~21 MB in CacheStorage + ~1 MB in IndexedDB) is well within all limits.

---

## 9. Performance Optimization

### Lazy Loading

Do not load Pyodide on the home screen, the lesson browser, or the settings page. Only load it when the user opens a lesson that contains a code playground. This keeps initial app load fast (<1 second) and avoids wasting bandwidth/memory for users browsing content.

```typescript
// Load Pyodide only when needed
const loadPyodide = async () => {
  if (pyodideWorker) return; // Already loaded
  
  showLoadingState("Preparing Python environment...");
  pyodideWorker = new Worker('/workers/pyodide-worker.js');
  
  // Wait for Pyodide to initialize inside the worker
  await new Promise((resolve) => {
    pyodideWorker.onmessage = (e) => {
      if (e.data.type === 'ready') resolve();
    };
  });
  
  hideLoadingState();
};
```

### Worker Warm-Keeping

Once Pyodide is loaded in a Web Worker, keep the worker alive for the duration of the session. Do not terminate it after each execution — re-initialization costs ~500ms. Only terminate on:

- Timeout (infinite loop) — then immediately spawn a replacement.
- App backgrounded for >5 minutes — free memory.
- User navigates away from all code lessons.

### Pre-initialization

When the user opens a lesson that has code challenges, start loading Pyodide immediately — even before the user scrolls to the first code editor. By the time they read the problem description and start typing, Pyodide is ready.

### Memory Management

Pyodide allocates approximately 50 MB of WASM linear memory. On phones with 3+ GB RAM, this is ~1.5% of available memory. However:

- Clear the Pyodide namespace between submissions to prevent memory leaks from accumulated user-defined objects.
- Monitor memory usage and restart the worker if it exceeds 200 MB (indicating a user created very large data structures).

### Timeout Implementation Details

```typescript
const TIMEOUT_MS = 5000; // 5 seconds per submission

function executeCode(code: string, tests: TestCase[]): Promise<TestResult[]> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      worker.terminate();
      worker = createNewPyodideWorker(); // Respawn
      reject(new TimeoutError(
        "Your code took longer than 5 seconds. " +
        "This usually means an infinite loop. " +
        "Check your while/for loop conditions."
      ));
    }, TIMEOUT_MS);

    worker.postMessage({ type: 'execute', code, tests });
    worker.onmessage = (event) => {
      clearTimeout(timeoutId);
      resolve(event.data.results);
    };
  });
}
```

The error message is deliberately beginner-friendly. It does not say "Worker terminated due to execution timeout" — it says "Check your while/for loop conditions."

---

## 10. Code Editor UX for Mobile

Mobile code editing is notoriously difficult. The virtual keyboard consumes half the screen, touch targets are imprecise, and common programming characters (`{`, `}`, `[`, `]`, `:`, `_`) require multiple keyboard taps to reach. Learner must address this head-on.

### Font Size

Set the minimum font size to **16px**. Below this threshold, iOS Safari triggers an automatic zoom when the user taps the editor input, which shifts the entire viewport and is disorienting. 16px prevents this behavior and is readable on a 6-inch phone screen.

### Symbol Toolbar

Add a sticky toolbar above the virtual keyboard with one-tap access to frequently needed characters:

```
[ Tab ] [ ( ] [ ) ] [ [ ] [ ] ] [ { ] [ } ] [ : ] [ = ] [ _ ] [ " ] [ # ]
```

This toolbar should:

- Be visible only when the editor is focused and the keyboard is open.
- Use large touch targets (minimum 44x44px per Apple's HIG).
- Include an indent/dedent button (critical for Python, where whitespace is syntax).

### Layout Strategy

On mobile screens (<768px wide):

- **Default view:** Problem description on top, editor below (vertically stacked).
- **Editor focus mode:** Tap the editor to expand it full-screen. Problem description is accessible via a swipe or tab.
- **Output panel:** Slides up from the bottom as a half-sheet after "Run" is pressed. Can be dismissed with a swipe-down.
- **"Run" and "Submit" buttons:** Fixed at the bottom of the screen, above the keyboard/toolbar. Always visible and reachable with the thumb.

### Editor Height

On mobile, give the editor enough height to show 10–15 lines of code. Most beginner exercises fit in 5–15 lines. The editor should be scrollable but not so short that the user can only see 3 lines.

### Monaco Mobile Considerations

Monaco Editor works on mobile browsers but was designed for desktop. Specific considerations:

- **Touch selection** works but is less precise than mouse selection. The symbol toolbar reduces the need for precise touch.
- **Copy/paste** works via the OS clipboard.
- **Autocomplete** popups may be hard to tap on small screens — consider increasing the suggestion widget's font size and row height.
- **Test on real devices** — the iOS Simulator and Android Emulator do not accurately replicate touch keyboard behavior.

---

## 11. Implementation Checklist

### Phase 1 (MVP — Python)

- [ ] Create Pyodide Web Worker wrapper (`src/lib/pyodide-worker.ts`)
- [ ] Implement message protocol (execute, result, error, ready, timeout)
- [ ] Implement stdout/stderr capture via `sys.stdout` redirect
- [ ] Implement test case runner (call function, compare output)
- [ ] Implement timeout handling (5s per submission, worker termination)
- [ ] Configure Monaco Editor for Python (`src/components/CodeEditor.tsx`)
- [ ] Mobile-optimized editor settings (font size, word wrap, no minimap)
- [ ] Symbol toolbar component for mobile (`src/components/SymbolToolbar.tsx`)
- [ ] Service Worker caching for Pyodide WASM bundle
- [ ] Pre-warm strategy: background download on first visit
- [ ] Loading state management ("Preparing Python environment...")
- [ ] Error message formatting — make Python tracebacks readable for beginners
- [ ] Output panel component (stdout, test results, errors)

### Phase 2 (TypeScript/React)

- [ ] TypeScript compiler WASM integration for type-checking exercises
- [ ] Sandboxed iframe for TypeScript execution
- [ ] Sandpack integration for React component challenges
- [ ] Pre-cache React/ReactDOM packages for partial offline support

### Phase 3+ (Advanced)

- [ ] NumPy/Pandas optional packages (pre-cached for data science curriculum)
- [ ] Multi-file project execution
- [ ] Visual output panel (HTML rendering, simple charts)
- [ ] WebContainers evaluation for full-stack projects

---

## Application to Learner

The recommended architecture is clear and well-supported by mature tooling:

**Python execution:** Pyodide in a Web Worker. It is the only option that satisfies all requirements simultaneously — real CPython, full standard library, sandboxed by design, works offline, runs on mobile. The ~10 MB download is a one-time cost, invisible to returning users.

**Code editor:** Monaco Editor via `@monaco-editor/react`. It is the industry standard, provides a familiar experience, and works offline. Mobile UX requires careful attention (font size, symbol toolbar, layout) but is achievable.

**Test execution:** A simple protocol — send code and test definitions to the worker, run tests inside Pyodide, return structured results. The architecture handles edge cases (infinite loops, exceptions, missing functions) cleanly.

**Offline strategy:** Service Worker caches Pyodide, Monaco, and all lesson content. Total footprint ~21 MB. Pre-warm on first visit. The subway use case is fully supported.

**TypeScript/React (Phase 2):** TypeScript WASM compiler for offline type exercises. Sandpack for React challenges (requires initial online access but caches well). This is a reasonable compromise — Python is the offline priority, and React challenges can wait for WiFi.

The critical insight is that WebAssembly has made client-side code execution practical and safe. Five years ago, running real Python in the browser was a research project. Today, Pyodide is stable, fast enough, and used in production by Jupyter, Marimo, and others. Learner can build on this foundation with confidence.

---

*Sources: [Pyodide Documentation](https://pyodide.org/en/stable/), [Pyodide GitHub](https://github.com/pyodide/pyodide), [@monaco-editor/react](https://www.npmjs.com/package/@monaco-editor/react), [Monaco React GitHub](https://github.com/suren-atoyan/monaco-react), [Sandpack Documentation](https://sandpack.codesandbox.io/docs), [Sandpack GitHub](https://github.com/codesandbox/sandpack), [WebContainers](https://webcontainers.io/), [Pyodide WASM Constraints](https://pyodide.org/en/stable/usage/wasm-constraints.html), [Pyodide Web Worker Guide](https://pyodide.org/en/stable/usage/webworker.html), [Glinteco Pyodide 2026 Guide](https://glinteco.com/en/post/beyond-the-server-running-high-performance-python-in-the-browser-with-pyodide-and-webassembly-2026-guide/)*

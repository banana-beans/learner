// ============================================================
// Pyodide loader + Python runner
// ============================================================
// Loads Pyodide from CDN once per page and caches the promise.
// Each runPython call uses a fresh globals dict so user code
// from a previous attempt doesn't leak into the next.
// ============================================================

const PYODIDE_VERSION = "0.27.2";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideInterface {
  runPythonAsync(code: string, options?: { globals?: unknown }): Promise<unknown>;
  setStdout(opts: { batched?: (s: string) => void }): void;
  setStderr(opts: { batched?: (s: string) => void }): void;
  globals: { get(name: string): unknown };
  toPy(obj: unknown): unknown;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideInterface>;
    __pyodidePromise?: Promise<PyodideInterface>;
  }
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.loadPyodide) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("script load failed")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function loadPyodideOnce(): Promise<PyodideInterface> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide can only run in the browser"));
  }
  if (window.__pyodidePromise) return window.__pyodidePromise;

  window.__pyodidePromise = (async () => {
    await injectScript(`${PYODIDE_CDN}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error("loadPyodide not available after script injection");
    }
    return await window.loadPyodide({ indexURL: PYODIDE_CDN });
  })();

  return window.__pyodidePromise;
}

export interface RunResult {
  stdout: string;
  error?: string;
}

export async function runPython(code: string): Promise<RunResult> {
  const py = await loadPyodideOnce();

  const buf: string[] = [];
  const errBuf: string[] = [];
  py.setStdout({ batched: (s: string) => buf.push(s) });
  py.setStderr({ batched: (s: string) => errBuf.push(s) });

  try {
    const globals = py.toPy({});
    await py.runPythonAsync(code, { globals });
    return { stdout: buf.join("") };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { stdout: buf.join(""), error: message || errBuf.join("") };
  }
}

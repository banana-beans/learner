"use client";

interface TestResultItem {
  passed: boolean;
  description?: string;
  expected?: string;
  actual?: string;
}

interface TestResultsProps {
  results: TestResultItem[];
}

export function TestResults({ results }: TestResultsProps) {
  if (results.length === 0) return null;

  const passCount = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passCount === total;
  const progressPct = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm mb-1">
        <span
          className={
            allPassed
              ? "font-semibold text-green-400"
              : "font-medium text-[var(--text-secondary)]"
          }
        >
          {allPassed ? "All tests passed!" : `${passCount} / ${total} tests passed`}
        </span>
        <span className="text-xs text-[var(--text-muted)]">{progressPct}%</span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            allPassed ? "bg-green-400" : "bg-[var(--accent-blue)]",
          ].join(" ")}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Individual results */}
      <div className="space-y-2">
        {results.map((result, i) => (
          <div
            key={i}
            className={[
              "rounded-lg border p-3",
              result.passed
                ? "border-green-500/20 bg-green-500/5"
                : "border-red-500/20 bg-red-500/5",
            ].join(" ")}
          >
            <div className="flex items-start gap-2">
              {/* Icon */}
              {result.passed ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-green-400 shrink-0 mt-0.5"
                  aria-label="pass"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-red-400 shrink-0 mt-0.5"
                  aria-label="fail"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}

              <div className="flex-1 min-w-0">
                {result.description && (
                  <p
                    className={[
                      "text-sm font-medium",
                      result.passed
                        ? "text-green-300"
                        : "text-red-300",
                    ].join(" ")}
                  >
                    {result.description}
                  </p>
                )}

                {/* Expected vs actual for failures */}
                {!result.passed && (result.expected !== undefined || result.actual !== undefined) && (
                  <div className="mt-1.5 space-y-1 font-mono text-xs">
                    {result.expected !== undefined && (
                      <div className="flex gap-1.5">
                        <span className="text-[var(--text-muted)] shrink-0">Expected:</span>
                        <span className="text-green-300 break-all">{result.expected}</span>
                      </div>
                    )}
                    {result.actual !== undefined && (
                      <div className="flex gap-1.5">
                        <span className="text-[var(--text-muted)] shrink-0">Actual:</span>
                        <span className="text-red-300 break-all">{result.actual}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

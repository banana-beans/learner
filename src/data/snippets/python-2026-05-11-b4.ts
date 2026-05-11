import type { Snippet } from "./types";

export const pythonSnippets20260511B4: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "py-logging-basic",
    language: "python",
    title: "logging.basicConfig — quick root logger setup",
    tag: "snippet",
    code: `import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(message)s",
)

logging.debug("debug message")    # shown because level=DEBUG
logging.info("info message")
logging.warning("something odd")
logging.error("something failed")
logging.critical("system down")`,
    explanation:
      "basicConfig configures the root logger once; call it at program startup before any other logging calls — subsequent calls are silently ignored.",
  },
  {
    id: "py-logging-getlogger",
    language: "python",
    title: "logging.getLogger(__name__) — per-module logger",
    tag: "snippet",
    code: `import logging

# Each module gets its own logger named after the module path
logger = logging.getLogger(__name__)

def process(data: list) -> None:
    logger.debug("processing %d items", len(data))
    for item in data:
        if item < 0:
            logger.warning("negative value: %s", item)
    logger.info("done")

# In __main__ / app entry point, configure the root logger once:
logging.basicConfig(level=logging.DEBUG)
process([1, -2, 3])`,
    explanation:
      "Naming loggers after __name__ creates a hierarchy that mirrors your package layout; handlers attached to the root logger automatically receive messages from all child loggers.",
  },
  {
    id: "py-logging-levels",
    language: "python",
    title: "Logging levels — DEBUG through CRITICAL",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger(__name__)

# DEBUG   (10) — detailed diagnostic info for developers
logger.debug("sql query took %dms", 42)

# INFO    (20) — confirmation that things are working as expected
logger.info("server started on port 8080")

# WARNING (30) — something unexpected, but recoverable
logger.warning("disk usage at 85%%")

# ERROR   (40) — a serious problem; the operation failed
logger.error("failed to connect to %s", "db.host")

# CRITICAL(50) — program cannot continue
logger.critical("out of memory — shutting down")`,
    explanation:
      "The five levels let you tune verbosity without changing code: set DEBUG in development, INFO in staging, WARNING in production; messages below the configured level are dropped cheaply.",
  },
  {
    id: "py-logging-format",
    language: "python",
    title: "logging format string — asctime, name, levelname, message",
    tag: "snippet",
    code: `import logging

fmt = "%(asctime)s %(name)s %(levelname)-8s %(message)s"
datefmt = "%Y-%m-%dT%H:%M:%S"

logging.basicConfig(format=fmt, datefmt=datefmt, level=logging.DEBUG)

logger = logging.getLogger("myapp.core")
logger.info("started")
# 2026-05-11T12:00:00 myapp.core INFO     started

# Other useful fields:
# %(filename)s  %(lineno)d  %(funcName)s  %(process)d  %(thread)d`,
    explanation:
      "The format string uses %-style substitution with LogRecord attributes; %-8s left-pads levelname to 8 characters for aligned columns; datefmt follows strftime conventions.",
  },
  {
    id: "py-logging-filehandler",
    language: "python",
    title: "FileHandler — write logs to a file",
    tag: "snippet",
    code: `import logging
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("myapp")
logger.setLevel(logging.DEBUG)

# RotatingFileHandler limits file size and keeps backups
handler = RotatingFileHandler(
    "app.log", maxBytes=5 * 1024 * 1024, backupCount=3
)
handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
logger.addHandler(handler)

logger.info("app started")   # written to app.log`,
    explanation:
      "RotatingFileHandler rolls over when app.log reaches 5 MB and keeps up to 3 backups; plain FileHandler works too but never rotates, so files grow without bound in production.",
  },
  {
    id: "py-logging-stream",
    language: "python",
    title: "StreamHandler — log to stderr",
    tag: "snippet",
    code: `import logging
import sys

logger = logging.getLogger("myapp")
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stderr)   # default target is stderr
handler.setLevel(logging.WARNING)             # only WARNING+ goes to console
handler.setFormatter(
    logging.Formatter("%(levelname)s: %(message)s")
)
logger.addHandler(handler)

logger.debug("ignored — below handler level")
logger.warning("this appears on stderr")`,
    explanation:
      "You can add multiple handlers with different levels to the same logger; this pattern logs everything to a file but only warnings to the console to avoid cluttering stdout.",
  },
  {
    id: "py-logging-filter-fn",
    language: "python",
    title: "logging.Filter subclass — contextual filtering",
    tag: "snippet",
    code: `import logging

class RequestIdFilter(logging.Filter):
    """Attach a request_id attribute to every record."""
    def __init__(self, request_id: str):
        super().__init__()
        self.request_id = request_id

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = self.request_id
        return True   # True = keep the record

logger = logging.getLogger("myapp")
filt = RequestIdFilter("req-abc123")
logger.addFilter(filt)

fmt = logging.Formatter("%(levelname)s [%(request_id)s] %(message)s")
h = logging.StreamHandler(); h.setFormatter(fmt)
logger.addHandler(h)
logger.warning("payment failed")
# WARNING [req-abc123] payment failed`,
    explanation:
      "Filters can either drop records (return False) or mutate them to add extra context; attaching context in a filter keeps call sites clean — every log line automatically carries the request ID.",
  },
  {
    id: "py-logging-extra",
    language: "python",
    title: "logger.info(msg, extra={...}) — per-call structured fields",
    tag: "snippet",
    code: `import logging

logging.basicConfig(
    format="%(levelname)s %(user_id)s %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

def handle_request(user_id: int, path: str) -> None:
    logger.info("request received", extra={"user_id": user_id})
    logger.info("path=%s", path,   extra={"user_id": user_id})

handle_request(42, "/checkout")
# INFO 42 request received
# INFO 42 path=/checkout`,
    explanation:
      "extra injects arbitrary keys into the LogRecord; they must appear in the format string or a custom Formatter, otherwise basicConfig raises a KeyError — use LoggerAdapter for less repetition.",
  },
  {
    id: "py-logging-structured",
    language: "python",
    title: "Structured JSON logging with a custom Formatter",
    tag: "snippet",
    code: `import logging, json

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts":      self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level":   record.levelname,
            "logger":  record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

logging.getLogger("myapp").info("order placed")
# {"ts": "2026-05-11T12:00:00", "level": "INFO", ...}`,
    explanation:
      "JSON logs are trivially parseable by log aggregators (Datadog, Splunk, ELK); override format() in a Formatter subclass — all handler plumbing stays the same.",
  },
  {
    id: "py-logging-context",
    language: "python",
    title: "logging.LoggerAdapter — add context to every message",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger("myapp")
logging.basicConfig(
    format="%(levelname)s [%(user)s] %(message)s", level=logging.DEBUG
)

def handle_request(user: str) -> None:
    log = logging.LoggerAdapter(logger, extra={"user": user})
    log.info("started")       # INFO [alice] started
    log.debug("processing")   # DEBUG [alice] processing

handle_request("alice")
handle_request("bob")`,
    explanation:
      "LoggerAdapter wraps a logger and merges a fixed extra dict into every call, eliminating the need to pass extra={} at each log site — great for request-scoped context like user or trace ID.",
  },
  {
    id: "py-logging-lazy",
    language: "python",
    title: "Lazy log formatting — pass args, not f-strings",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.WARNING)

expensive_obj = list(range(10_000))

# BAD — string is always built even when DEBUG is disabled:
logger.debug(f"items: {expensive_obj}")

# GOOD — formatting only happens if the message will be emitted:
logger.debug("items: %s", expensive_obj)

# Also avoid:
if logger.isEnabledFor(logging.DEBUG):
    logger.debug("items: %s", expensive_obj)  # redundant guard`,
    explanation:
      "The % args are passed as-is to the LogRecord and only formatted if the record will actually be emitted; f-strings evaluate immediately regardless of log level, wasting CPU on disabled levels.",
  },
  {
    id: "py-logging-exception",
    language: "python",
    title: "logger.exception() — auto-attach traceback",
    tag: "snippet",
    code: `import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

def divide(a: float, b: float) -> float:
    try:
        return a / b
    except ZeroDivisionError:
        logger.exception("division failed for a=%s b=%s", a, b)
        # logs ERROR + full traceback automatically
        return float("nan")

result = divide(10, 0)
print(result)  # nan`,
    explanation:
      "logger.exception() is equivalent to logger.error(msg, exc_info=True); it captures the current exception and appends the traceback to the log record — only call it inside an except block.",
  },
  {
    id: "py-logging-warnings",
    language: "python",
    title: "logging.captureWarnings — route warnings to the logger",
    tag: "snippet",
    code: `import logging
import warnings

logging.basicConfig(level=logging.DEBUG)
logging.captureWarnings(True)   # redirect warnings → py.warnings logger

# This DeprecationWarning now appears in the log instead of stderr:
warnings.warn("old_api() is deprecated", DeprecationWarning, stacklevel=2)

# Filter to elevate certain warnings to errors:
warnings.filterwarnings("error", category=PendingDeprecationWarning)`,
    explanation:
      "captureWarnings routes all Python warnings through the 'py.warnings' logger so they benefit from log handlers, formatting, and level filtering rather than going straight to stderr.",
  },
  {
    id: "py-logging-propagate",
    language: "python",
    title: "logger.propagate = False — stop bubbling to root logger",
    tag: "snippet",
    code: `import logging

# Root logger writes everything to stderr
logging.basicConfig(level=logging.DEBUG)

child = logging.getLogger("myapp.requests")
child.setLevel(logging.DEBUG)

# Add a dedicated handler for this logger
child.addHandler(logging.FileHandler("requests.log"))

# Without this, messages go to requests.log AND root's stderr handler:
child.propagate = False   # stop here, don't pass up the hierarchy

child.info("GET /health 200")   # only in requests.log now`,
    explanation:
      "By default every logger passes records up to its parent; propagate=False stops the chain, preventing duplicate output when a logger has its own handler in addition to the root handler.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "py-pytest-fixture",
    language: "python",
    title: "@pytest.fixture — dependency injection for tests",
    tag: "understanding",
    code: `import pytest

@pytest.fixture
def db_conn():
    conn = {"connected": True, "rows": []}
    yield conn                # test runs here
    conn["connected"] = False  # teardown

@pytest.fixture
def seeded_db(db_conn):       # fixtures can depend on other fixtures
    db_conn["rows"] = [1, 2, 3]
    return db_conn

def test_query(seeded_db):
    assert len(seeded_db["rows"]) == 3

def test_empty(db_conn):
    assert db_conn["rows"] == []`,
    explanation:
      "pytest fixtures are injected by parameter name; yield fixtures run teardown after the test; fixtures can depend on other fixtures, forming a DAG that pytest resolves automatically.",
  },
  {
    id: "py-pytest-parametrize",
    language: "python",
    title: "@pytest.mark.parametrize — one test, many inputs",
    tag: "understanding",
    code: `import pytest

def is_even(n: int) -> bool:
    return n % 2 == 0

@pytest.mark.parametrize("n, expected", [
    (0,  True),
    (1,  False),
    (2,  True),
    (-3, False),
    (100, True),
])
def test_is_even(n: int, expected: bool):
    assert is_even(n) == expected

# pytest runs 5 independent test cases, each shown separately on failure`,
    explanation:
      "parametrize generates N test cases from a list of argument tuples; failures show exactly which input caused the problem; combine multiple parametrize decorators for a full combinatorial matrix.",
  },
  {
    id: "py-pytest-mark-skip",
    language: "python",
    title: "@pytest.mark.skip and skipif — conditional skipping",
    tag: "understanding",
    code: `import sys
import pytest

@pytest.mark.skip(reason="not implemented yet")
def test_future_feature():
    assert False  # never runs

@pytest.mark.skipif(sys.platform == "win32", reason="POSIX only")
def test_symlinks():
    import os
    os.symlink("/tmp/src", "/tmp/dst")
    assert os.path.islink("/tmp/dst")

def test_dynamic_skip():
    if not __import__("importlib.util").util.find_spec("numpy"):
        pytest.skip("numpy not installed")
    import numpy as np
    assert np.array([1]).shape == (1,)`,
    explanation:
      "skip prevents a test from running at all; skipif evaluates a condition at collection time; pytest.skip() inside the test body skips only that test and is useful when the condition depends on runtime state.",
  },
  {
    id: "py-pytest-raises",
    language: "python",
    title: "pytest.raises — assert expected exceptions",
    tag: "understanding",
    code: `import pytest

def parse_age(s: str) -> int:
    age = int(s)
    if age < 0:
        raise ValueError(f"age must be non-negative, got {age}")
    return age

def test_bad_string():
    with pytest.raises(ValueError):
        parse_age("abc")   # int("abc") raises ValueError

def test_negative():
    with pytest.raises(ValueError, match="non-negative"):
        parse_age("-5")    # match checks the exception message

def test_exception_info():
    with pytest.raises(ValueError) as exc_info:
        parse_age("-1")
    assert "non-negative" in str(exc_info.value)`,
    explanation:
      "pytest.raises as a context manager asserts both the exception type and (optionally) a regex match on the message; exc_info.value gives the actual exception object for further assertions.",
  },
  {
    id: "py-mock-patch-obj",
    language: "python",
    title: "patch.object — replace a specific attribute on an object",
    tag: "understanding",
    code: `import unittest
from unittest.mock import patch, MagicMock

class EmailService:
    def send(self, to: str, body: str) -> bool:
        # real SMTP call here
        return True

class OrderService:
    def __init__(self, email: EmailService):
        self.email = email

    def place(self, user: str) -> str:
        self.email.send(user, "Order confirmed")
        return "ok"

svc = OrderService(EmailService())

with patch.object(svc.email, "send", return_value=True) as mock_send:
    result = svc.place("alice@example.com")
    mock_send.assert_called_once_with("alice@example.com", "Order confirmed")
    assert result == "ok"`,
    explanation:
      "patch.object replaces a named attribute on an already-instantiated object for the duration of the with block; it restores the original after the block, keeping tests isolated.",
  },
  {
    id: "py-mock-side-effect",
    language: "python",
    title: "mock.side_effect — return different values per call",
    tag: "understanding",
    code: `from unittest.mock import MagicMock

mock_fetch = MagicMock()

# List: each call pops the next value
mock_fetch.side_effect = ["page1", "page2", StopIteration]
print(mock_fetch())   # page1
print(mock_fetch())   # page2
# mock_fetch()        # raises StopIteration

# Callable: full control
mock_fetch.side_effect = lambda url: f"data:{url}"
print(mock_fetch("https://api.example.com"))  # data:https://api.example.com

# Raise on any call:
mock_fetch.side_effect = ConnectionError("network down")
try:
    mock_fetch()
except ConnectionError as e:
    print(e)   # network down`,
    explanation:
      "side_effect can be a list (consumed in order), a callable (called with the same args), or an exception class/instance (raised on every call); it overrides return_value when set.",
  },
  {
    id: "py-mock-call-count",
    language: "python",
    title: "mock.call_count and mock.called — call assertions",
    tag: "understanding",
    code: `from unittest.mock import MagicMock

notify = MagicMock()

def process(items: list, notify_fn) -> None:
    for item in items:
        if item < 0:
            notify_fn(item)

process([1, -2, 3, -4], notify)

print(notify.called)        # True
print(notify.call_count)    # 2
print(notify.call_args_list)
# [call(-2), call(-4)]

notify.reset_mock()
print(notify.called)        # False — reset clears history`,
    explanation:
      "call_count lets you verify how many times a function was called without asserting exact arguments; reset_mock() clears call history between sub-tests when reusing a mock.",
  },
  {
    id: "py-mock-assert-called",
    language: "python",
    title: "mock.assert_called_once_with — verify exact arguments",
    tag: "understanding",
    code: `from unittest.mock import MagicMock, call

save = MagicMock()

save(user_id=42, data={"score": 100})

# Exact single call:
save.assert_called_once_with(user_id=42, data={"score": 100})

# Any call (one or more):
save.assert_called_with(user_id=42, data={"score": 100})

# Check all calls in order:
save(user_id=7, data={"score": 50})
save.assert_has_calls([
    call(user_id=42, data={"score": 100}),
    call(user_id=7,  data={"score": 50}),
])`,
    explanation:
      "assert_called_once_with fails if the mock was called zero times, more than once, or with different arguments; use assert_has_calls to verify a sequence of calls without caring about extras.",
  },
  {
    id: "py-doctest-run",
    language: "python",
    title: "doctest.testmod — run examples in docstrings",
    tag: "understanding",
    code: `def add(a: float, b: float) -> float:
    """Return the sum of a and b.

    >>> add(1, 2)
    3
    >>> add(0.1, 0.2)  # doctest: +ELLIPSIS
    0.30...
    >>> add("x", "y")
    Traceback (most recent call last):
        ...
    TypeError: unsupported operand type(s) for +: 'str' and 'str'
    """
    return a + b

if __name__ == "__main__":
    import doctest
    doctest.testmod(verbose=True)`,
    explanation:
      "doctest extracts >>> lines from docstrings and verifies the output; directives like +ELLIPSIS allow fuzzy matching for floating-point and long reprs; great for keeping examples in sync with code.",
  },
  {
    id: "py-hypothesis-basic",
    language: "python",
    title: "@given — property-based testing with Hypothesis",
    tag: "understanding",
    code: `from hypothesis import given, assume
import hypothesis.strategies as st

def reverse(lst: list) -> list:
    return lst[::-1]

@given(st.lists(st.integers()))
def test_reverse_twice(lst):
    assert reverse(reverse(lst)) == lst  # reversing twice gives original

@given(st.lists(st.integers(), min_size=1))
def test_reverse_length(lst):
    assert len(reverse(lst)) == len(lst)

@given(st.integers(), st.integers())
def test_add_commutative(a, b):
    assert a + b == b + a`,
    explanation:
      "Hypothesis generates hundreds of random inputs and shrinks failing cases to the minimal reproducer; @given with strategies replaces hand-crafted test tables for mathematical properties.",
  },
  {
    id: "py-unittest-setup",
    language: "python",
    title: "setUp / tearDown — run before and after each test",
    tag: "understanding",
    code: `import unittest

class DatabaseTest(unittest.TestCase):
    def setUp(self):
        """Called before every test method."""
        self.conn = {"rows": [], "open": True}

    def tearDown(self):
        """Called after every test method, even if the test fails."""
        self.conn["open"] = False

    def test_insert(self):
        self.conn["rows"].append("user1")
        self.assertEqual(len(self.conn["rows"]), 1)

    def test_empty(self):
        self.assertEqual(self.conn["rows"], [])

if __name__ == "__main__":
    unittest.main()`,
    explanation:
      "setUp creates a fresh fixture before each test; tearDown cleans up after each test even on failure; unlike pytest fixtures, they live on the test class itself.",
  },
  {
    id: "py-unittest-teardown",
    language: "python",
    title: "addCleanup — called even if setUp or the test fails",
    tag: "understanding",
    code: `import unittest
import tempfile, os

class TempFileTest(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp()
        os.close(fd)
        # addCleanup runs even if setUp raises after this line
        self.addCleanup(os.unlink, self.path)

    def test_write(self):
        with open(self.path, "w") as f:
            f.write("hello")
        self.assertTrue(os.path.exists(self.path))

    def test_size(self):
        self.assertEqual(os.path.getsize(self.path), 0)`,
    explanation:
      "addCleanup registers a callback that fires after tearDown (or after setUp if setUp raises); it works like a stack — last-registered cleanups run first, making resource release order predictable.",
  },
  {
    id: "py-coverage-report",
    language: "python",
    title: "coverage run + coverage report -m — find uncovered lines",
    tag: "understanding",
    code: `# Run tests under coverage:
# $ coverage run -m pytest tests/

# Show a text summary with uncovered line numbers (-m = show missing):
# $ coverage report -m
# Name          Stmts   Miss  Cover   Missing
# -----------------------------------------
# myapp/core.py    42      5    88%   23-25, 67, 91

# Generate HTML report (open htmlcov/index.html):
# $ coverage html

# Enforce a minimum coverage percentage in CI:
# $ coverage report --fail-under=90

# .coveragerc example:
# [run]
# source = myapp
# omit = myapp/migrations/*`,
    explanation:
      "coverage instruments bytecode to track which lines execute; --fail-under makes CI fail when coverage drops below a threshold; omit excludes generated or third-party code from the report.",
  },
  {
    id: "py-type-checking-mypy",
    language: "python",
    title: "mypy --strict — catch type errors before runtime",
    tag: "understanding",
    code: `# myapp/calc.py
def add(a: int, b: int) -> int:
    return a + b

result = add("1", 2)   # mypy error: Argument 1 has incompatible type "str"

# Suppress a single line (use sparingly):
x: int = get_value()  # type: ignore[assignment]

# Run strict mode (enables all optional checks):
# $ mypy --strict myapp/

# Common flags:
# --disallow-untyped-defs   require annotations on all functions
# --no-implicit-optional    don't treat Optional as default for None defaults
# --warn-return-any         warn when returning Any from typed function`,
    explanation:
      "--strict enables all optional checks including disallow-untyped-defs and warn-return-any; add per-file ignores via # type: ignore[code] to silence known issues without disabling the whole file.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "py-pandas-series",
    language: "python",
    title: "pd.Series — creation, indexing, and basic operations",
    tag: "structures",
    code: `import pandas as pd

s = pd.Series([10, 20, 30, 40], index=["a", "b", "c", "d"])
print(s["b"])          # 20   — label indexing
print(s.iloc[1])       # 20   — positional indexing
print(s[s > 15])       # b 20, c 30, d 40  — boolean mask

# Arithmetic broadcasts element-wise:
print(s * 2)           # a 20, b 40, c 60, d 80
print(s.mean())        # 25.0
print(s.describe())    # count, mean, std, min, 25%, 50%, 75%, max`,
    explanation:
      "A Series is a 1-D labelled array; integer and label indexing can coexist via .loc (label) and .iloc (position); arithmetic operations align on the index automatically.",
  },
  {
    id: "py-pandas-dataframe",
    language: "python",
    title: "pd.DataFrame — creation from dict, column access",
    tag: "structures",
    code: `import pandas as pd

df = pd.DataFrame({
    "name":  ["Alice", "Bob", "Carol"],
    "score": [88, 72, 95],
    "grade": ["B", "C", "A"],
})

print(df.shape)          # (3, 3)
print(df["score"])       # Series of scores
print(df[["name", "score"]])  # sub-DataFrame
print(df.loc[1])         # row by label (same as position here)
print(df.iloc[0, 1])     # 88  — row 0, column 1
print(df[df["score"] > 80])  # Alice and Carol rows`,
    explanation:
      "DataFrames are 2-D labelled structures; column access with [] returns a Series; .loc uses labels and .iloc uses integer positions — mixing them is a common source of bugs.",
  },
  {
    id: "py-pandas-groupby",
    language: "python",
    title: "df.groupby().agg() — split-apply-combine aggregation",
    tag: "structures",
    code: `import pandas as pd

df = pd.DataFrame({
    "dept":   ["eng", "eng", "hr", "hr", "eng"],
    "salary": [120, 130, 80, 90, 140],
    "bonus":  [10,  15,  5,  8,  12],
})

result = df.groupby("dept").agg(
    avg_salary=("salary", "mean"),
    total_bonus=("bonus",  "sum"),
    headcount=("salary",  "count"),
)
print(result)
#       avg_salary  total_bonus  headcount
# dept
# eng       130.0           37          3
# hr         85.0           13          2`,
    explanation:
      "groupby().agg() with named aggregations (pandas 0.25+) produces clearly labelled output columns; you can mix different aggregation functions across columns in one pass.",
  },
  {
    id: "py-numpy-array",
    language: "python",
    title: "np.array — dtype, shape, ndim basics",
    tag: "structures",
    code: `import numpy as np

a = np.array([1, 2, 3, 4, 5])
print(a.dtype)   # int64
print(a.shape)   # (5,)
print(a.ndim)    # 1

b = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
print(b.dtype)   # float32
print(b.shape)   # (2, 3)
print(b.ndim)    # 2

# Explicit dtype prevents surprises:
c = np.array([1, 2, 3], dtype=np.int8)
print(c.dtype)   # int8
print(c * 2)     # [2 4 6]`,
    explanation:
      "Always specify dtype when precision matters; numpy infers from the input (usually int64 or float64) but mixing integer and float data silently upgrades to float64.",
  },
  {
    id: "py-numpy-broadcast",
    language: "python",
    title: "numpy broadcasting — shapes align from the right",
    tag: "structures",
    code: `import numpy as np

a = np.array([1, 2, 3])          # shape (3,)
b = np.array([[10], [20], [30]]) # shape (3, 1)

# Broadcasting: (3,) → (1, 3) → (3, 3) against (3, 1)
result = a + b
print(result)
# [[11 12 13]
#  [21 22 23]
#  [31 32 33]]

# Row vector × column vector → outer product:
row = np.array([1, 2, 3])        # (3,)
col = np.array([[1], [2], [3]])  # (3, 1)
print(row * col)                 # (3, 3) outer product`,
    explanation:
      "Broadcasting compares shapes from the right; dimensions of size 1 are stretched to match the other operand; this avoids explicit tiling but requires understanding the alignment rules.",
  },
  {
    id: "py-numpy-vectorize",
    language: "python",
    title: "np.vectorize — apply a Python function element-wise",
    tag: "structures",
    code: `import numpy as np

def classify(x: float) -> str:
    if x < 0:   return "negative"
    if x == 0:  return "zero"
    return "positive"

vclassify = np.vectorize(classify)

arr = np.array([-2, 0, 3, -1, 5])
print(vclassify(arr))
# ['negative' 'zero' 'positive' 'negative' 'positive']

# Note: np.vectorize is a convenience wrapper — it loops in Python.
# For performance, use np.where or np.select instead:
result = np.where(arr < 0, "negative", np.where(arr == 0, "zero", "positive"))`,
    explanation:
      "np.vectorize makes any Python function accept array inputs via broadcasting, but it is not faster than a Python loop; use it for readability and fall back to np.where/np.select for performance.",
  },
  {
    id: "py-csv-dictreader",
    language: "python",
    title: "csv.DictReader — rows as ordered dicts",
    tag: "structures",
    code: `import csv
from pathlib import Path

# Write a sample CSV for the demo
Path("people.csv").write_text("name,age,city\\nAlice,30,NYC\\nBob,25,LA\\n")

with open("people.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["age"])
# Alice 30
# Bob   25

# Access fieldnames:
with open("people.csv", newline="", encoding="utf-8") as f:
    r = csv.DictReader(f)
    print(r.fieldnames)  # None until first read
    next(r)              # advance
    print(r.fieldnames)  # ['name', 'age', 'city']`,
    explanation:
      "DictReader uses the first row as field names and returns each data row as an OrderedDict (plain dict in 3.8+); always pass newline='' to open() so the csv module handles line endings correctly.",
  },
  {
    id: "py-sqlite3-basic",
    language: "python",
    title: "sqlite3 — connect, execute, fetchall",
    tag: "structures",
    code: `import sqlite3

conn = sqlite3.connect(":memory:")   # in-memory DB for demos
cur  = conn.cursor()

cur.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)")
cur.executemany(
    "INSERT INTO users (name, age) VALUES (?, ?)",
    [("Alice", 30), ("Bob", 25), ("Carol", 35)],
)
conn.commit()

cur.execute("SELECT name, age FROM users WHERE age > ?", (28,))
rows = cur.fetchall()   # list of tuples
for name, age in rows:
    print(name, age)
# Alice 30
# Carol 35

conn.close()`,
    explanation:
      "Always use parameterised queries (?) instead of string formatting to prevent SQL injection; executemany is more efficient than a loop of single-row inserts.",
  },
  {
    id: "py-re-compile-flags",
    language: "python",
    title: "re.compile with IGNORECASE and MULTILINE flags",
    tag: "structures",
    code: `import re

text = """Error: file not found
WARNING: disk 85% full
error: timeout on connect
"""

# IGNORECASE — match regardless of case
# MULTILINE  — ^ and $ match each line boundary
pattern = re.compile(r"^(error|warning):\s+(.+)$",
                     re.IGNORECASE | re.MULTILINE)

for m in pattern.finditer(text):
    level, msg = m.group(1), m.group(2)
    print(f"[{level.upper()}] {msg}")
# [ERROR] file not found
# [WARNING] disk 85% full
# [ERROR] timeout on connect`,
    explanation:
      "Compiling a pattern avoids recompiling on every call when the same regex is used many times; combine flags with | (bitwise OR); DOTALL makes . match newlines too.",
  },
  {
    id: "py-json-load-dump",
    language: "python",
    title: "json.dumps / json.loads — serialise and parse JSON",
    tag: "structures",
    code: `import json
from datetime import date

data = {
    "user":   "Alice",
    "scores": [88, 92, 77],
    "active": True,
    "meta":   None,
}

# Serialise to a pretty-printed string:
s = json.dumps(data, indent=2, sort_keys=True)
print(s)

# Parse back:
obj = json.loads(s)
print(obj["scores"][0])   # 88

# Custom encoder for types json doesn't know:
class DateEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, date): return o.isoformat()
        return super().default(o)

print(json.dumps({"day": date(2026, 5, 11)}, cls=DateEncoder))
# {"day": "2026-05-11"}`,
    explanation:
      "json only handles str, int, float, bool, None, list, and dict natively; subclass JSONEncoder to handle custom types; use json.load / json.dump for file objects instead of strings.",
  },
  {
    id: "py-configparser",
    language: "python",
    title: "configparser — read INI-style config files",
    tag: "structures",
    code: `import configparser

config = configparser.ConfigParser()
config.read_string("""
[database]
host = db.example.com
port = 5432
name = mydb

[logging]
level = INFO
file  = app.log
""")

# Keys are lowercased by default
print(config["database"]["host"])          # db.example.com
print(config.getint("database", "port"))   # 5432  (as int)
print(config.get("logging", "level"))      # INFO

# Fallback values:
timeout = config.getint("database", "timeout", fallback=30)
print(timeout)  # 30`,
    explanation:
      "configparser returns strings; use getint / getfloat / getboolean for typed values; the fallback parameter avoids NoSectionError / NoOptionError for optional keys.",
  },
  {
    id: "py-csv-writer",
    language: "python",
    title: "csv.writer / DictWriter — write CSV files",
    tag: "structures",
    code: `import csv
import io

# csv.writer — list of values per row
out = io.StringIO()
writer = csv.writer(out, quoting=csv.QUOTE_NONNUMERIC)
writer.writerow(["name", "score", "grade"])
writer.writerows([["Alice", 88, "B"], ["Bob", 72, "C"]])
print(out.getvalue())

# csv.DictWriter — dict per row, enforces field order
out2 = io.StringIO()
fields = ["name", "score", "grade"]
dw = csv.DictWriter(out2, fieldnames=fields, extrasaction="raise")
dw.writeheader()
dw.writerow({"name": "Carol", "score": 95, "grade": "A"})
print(out2.getvalue())`,
    explanation:
      "Always open CSV files with newline='' to suppress Python's universal newline translation; QUOTE_NONNUMERIC wraps non-numeric fields in quotes and converts numeric fields to float on read.",
  },
  {
    id: "py-xml-etree-parse",
    language: "python",
    title: "xml.etree.ElementTree — parse and query XML",
    tag: "structures",
    code: `import xml.etree.ElementTree as ET

xml_src = """<catalog>
  <book id="1"><title>Clean Code</title><price>35.00</price></book>
  <book id="2"><title>Pragmatic Programmer</title><price>42.00</price></book>
</catalog>"""

root = ET.fromstring(xml_src)

for book in root.findall("book"):
    bid   = book.get("id")           # attribute
    title = book.findtext("title")   # child element text
    price = float(book.findtext("price"))
    print(f"[{bid}] {title} \${price:.2f}")

# XPath-like: find all prices > 40
for p in root.findall(".//price"):
    if float(p.text) > 40:
        print("expensive:", p.text)`,
    explanation:
      "ElementTree is the stdlib XML parser; findall uses a subset of XPath; for large files use iterparse to process elements one-by-one without loading the entire tree into memory.",
  },
  {
    id: "py-hashlib-digest",
    language: "python",
    title: "hashlib.sha256 — file checksums",
    tag: "structures",
    code: `import hashlib
from pathlib import Path

def sha256_file(path: str | Path) -> str:
    """Return hex SHA-256 digest of a file, streaming in 64 KiB chunks."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65_536), b""):
            h.update(chunk)
    return h.hexdigest()

# Quick digest for small data:
digest = hashlib.sha256(b"hello world").hexdigest()
print(digest)
# b94d27b9934d3e08a52e52d7da7dabfac484efe04294e576

# Available algorithms:
print(hashlib.algorithms_guaranteed)`,
    explanation:
      "Streaming chunks avoids loading the whole file into memory; algorithms_guaranteed lists names that work on every Python platform; use hashlib.new('sha256') when the algorithm is selected dynamically.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "py-pandas-view-copy",
    language: "python",
    title: "pandas view vs copy — use .loc to avoid silent bugs",
    tag: "caveats",
    code: `import pandas as pd

df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})

# DANGEROUS — may edit a view or a copy, behaviour is undefined:
df["a"][0] = 99   # SettingWithCopyWarning in some pandas versions

# SAFE — .loc always targets the original DataFrame:
df.loc[0, "a"] = 99
print(df.loc[0, "a"])  # 99

# Also safe — assign back to the column:
df["a"] = df["a"].where(df["a"] > 1, other=0)

# Filter then modify — must re-assign or use .loc:
mask = df["b"] > 4
df.loc[mask, "b"] = 0
print(df)`,
    explanation:
      "Chained indexing df[col][row] may operate on a temporary copy depending on internal layout; .loc[row, col] always modifies the original and silences the SettingWithCopyWarning.",
  },
  {
    id: "py-numpy-int-overflow",
    language: "python",
    title: "np.int32 overflow — use np.int64 for safety",
    tag: "caveats",
    code: `import numpy as np

a = np.array([2_000_000_000], dtype=np.int32)
print(a * 2)    # [-294967296]  — silent overflow!

b = np.array([2_000_000_000], dtype=np.int64)
print(b * 2)    # [4000000000]  — correct

# Python int is arbitrary precision — numpy integers are not:
x: int = 2_000_000_000
print(x * 2)    # 4000000000  — Python int, no overflow

# Check for overflow risk before operating:
np.seterr(over="raise")   # raise FloatingPointError on overflow
try:
    np.array([2**31 - 1], dtype=np.int32) + 1
except FloatingPointError as e:
    print(e)`,
    explanation:
      "numpy uses fixed-width C integers; int32 wraps at ±2 billion silently by default; np.seterr(over='raise') converts silent overflow to an exception, useful for debugging.",
  },
  {
    id: "py-numpy-nan-sum",
    language: "python",
    title: "np.sum with NaN — use np.nansum to skip missing values",
    tag: "caveats",
    code: `import numpy as np

data = np.array([1.0, 2.0, np.nan, 4.0])

print(np.sum(data))     # nan   — any NaN poisons the result
print(np.nansum(data))  # 7.0   — NaN treated as 0 for summation
print(np.mean(data))    # nan
print(np.nanmean(data)) # 2.333...

# Count non-NaN values:
print(np.count_nonzero(~np.isnan(data)))  # 3

# Replace NaN before operating:
clean = np.where(np.isnan(data), 0, data)
print(np.sum(clean))    # 7.0`,
    explanation:
      "NaN propagates through all arithmetic; the nan* family of functions (nansum, nanmean, nanmax, etc.) skip NaN values; always check for NaN in sensor or user data before aggregating.",
  },
  {
    id: "py-float-sorting",
    language: "python",
    title: "NaN in sort — non-deterministic ordering",
    tag: "caveats",
    code: `import math

data = [3.0, float("nan"), 1.0, float("nan"), 2.0]
print(sorted(data))
# order of NaNs is undefined — may vary across Python versions

# Safe: remove NaN before sorting
clean = [x for x in data if not math.isnan(x)]
print(sorted(clean))   # [1.0, 2.0, 3.0]

# Or sort NaN to the end:
print(sorted(data, key=lambda x: (math.isnan(x), x)))
# [1.0, 2.0, 3.0, nan, nan]

# NaN comparison is always False:
print(float("nan") < 1.0)   # False
print(float("nan") > 1.0)   # False
print(float("nan") == float("nan"))  # False`,
    explanation:
      "NaN is not less than, greater than, or equal to any value including itself; sorting a list with NaN values uses comparisons internally, so the result is non-deterministic and platform-dependent.",
  },
  {
    id: "py-csv-encoding",
    language: "python",
    title: "csv encoding — open in text mode with explicit encoding",
    tag: "caveats",
    code: `import csv

# WRONG — binary mode raises TypeError in csv.reader:
# with open("data.csv", "rb") as f:
#     reader = csv.reader(f)   # TypeError

# CORRECT — text mode, explicit encoding and newline='':
with open("data.csv", "r", encoding="utf-8", newline="") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)

# Windows BOM: use 'utf-8-sig' to strip the BOM automatically:
with open("win_data.csv", "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f)
    print(next(reader))   # first row without ﻿ prefix`,
    explanation:
      "csv.reader expects a text-mode file; newline='' prevents Python's universal newline translation from interfering with the csv module's own line-ending handling; utf-8-sig handles Windows BOM-prefixed exports.",
  },
  {
    id: "py-json-nan-issue",
    language: "python",
    title: "json.dumps(NaN) — produces invalid JSON",
    tag: "caveats",
    code: `import json
import math

# Python allows this but the output is NOT valid JSON:
s = json.dumps(float("nan"))
print(s)         # NaN  — not a valid JSON literal!
print(json.dumps(float("inf")))   # Infinity  — also invalid!

# Strict mode raises ValueError:
try:
    json.dumps(float("nan"), allow_nan=False)
except ValueError as e:
    print(e)   # Out of range float values are not JSON compliant

# Replace NaN/Inf before serialising:
def sanitise(obj):
    if isinstance(obj, float) and not math.isfinite(obj):
        return None
    return obj

print(json.dumps({"v": float("nan")}, default=sanitise))
# {"v": null}`,
    explanation:
      "Python's json module accepts NaN and Infinity by default for compatibility with JavaScript's JSON.parse, but they are not in the JSON spec; use allow_nan=False to detect them and convert to null.",
  },
  {
    id: "py-re-greedy",
    language: "python",
    title: "regex greedy vs non-greedy — .* vs .*?",
    tag: "caveats",
    code: `import re

html = "<b>bold</b> and <i>italic</i>"

# Greedy — matches as much as possible
greedy = re.findall(r"<.+>", html)
print(greedy)   # ['<b>bold</b> and <i>italic</i>']  — one big match!

# Non-greedy — matches as little as possible
lazy = re.findall(r"<.+?>", html)
print(lazy)     # ['<b>', '</b>', '<i>', '</i>']

# Even better — character class excludes < and >:
tags = re.findall(r"<[^>]+>", html)
print(tags)     # ['<b>', '</b>', '<i>', '</i>']`,
    explanation:
      "Greedy .* matches up to the last occurrence of the following pattern; .*? stops at the first; a character class [^>]+ is often more efficient and readable than a non-greedy quantifier.",
  },
  {
    id: "py-re-backtrack",
    language: "python",
    title: "catastrophic backtracking — avoid nested quantifiers",
    tag: "caveats",
    code: `import re, time

# Nested quantifiers (a+)+ on a string with no match can cause
# exponential backtracking — O(2^n) attempts:
bad_pattern = re.compile(r"(a+)+b")

start = time.perf_counter()
bad_pattern.match("aaaaaaaaaaaaaaaaaac")   # no match, but slow!
elapsed = time.perf_counter() - start
print(f"took {elapsed:.3f}s")   # can take seconds for n=20+

# Fix 1: possessive quantifiers (Python 3.11+ via regex library)
# Fix 2: atomic groups (regex library)
# Fix 3: rewrite to avoid nesting:
good_pattern = re.compile(r"a+b")         # no nesting`,
    explanation:
      "When a nested quantifier pattern fails, the engine tries every possible grouping combinatorially; use atomic groups or the third-party regex module for possessive quantifiers to prevent this.",
  },
  {
    id: "py-sqlite3-row-factory",
    language: "python",
    title: "conn.row_factory = sqlite3.Row — column-name access",
    tag: "caveats",
    code: `import sqlite3

conn = sqlite3.connect(":memory:")
conn.row_factory = sqlite3.Row   # set BEFORE creating cursors

cur = conn.cursor()
cur.execute("CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)")
cur.execute("INSERT INTO users VALUES (1, 'Alice', 30)")
conn.commit()

cur.execute("SELECT * FROM users")
row = cur.fetchone()

# Access by column name instead of index:
print(row["name"])   # Alice
print(row["age"])    # 30
print(dict(row))     # {'id': 1, 'name': 'Alice', 'age': 30}

conn.close()`,
    explanation:
      "Without row_factory, rows are plain tuples and you must remember column positions; sqlite3.Row supports both integer indexing and column-name access with minimal overhead.",
  },
  {
    id: "py-requests-session",
    language: "python",
    title: "requests.Session — connection pooling and shared headers",
    tag: "caveats",
    code: `import requests

# BAD — each call opens and closes a TCP connection
resp1 = requests.get("https://api.example.com/users/1")
resp2 = requests.get("https://api.example.com/users/2")

# GOOD — Session reuses connections and shares headers / cookies
session = requests.Session()
session.headers.update({"Authorization": "Bearer TOKEN"})

resp1 = session.get("https://api.example.com/users/1")
resp2 = session.get("https://api.example.com/users/2")

# Always close or use as context manager:
with requests.Session() as s:
    s.headers.update({"User-Agent": "MyApp/1.0"})
    resp = s.get("https://api.example.com/status")
    print(resp.status_code)`,
    explanation:
      "Session maintains a connection pool (via urllib3) so repeated requests to the same host reuse TCP connections; headers, cookies, and auth set on the session apply to every request.",
  },
  {
    id: "py-http-timeout",
    language: "python",
    title: "requests timeout — always set it, default is None",
    tag: "caveats",
    code: `import requests

# BAD — hangs forever if the server never responds:
# resp = requests.get("https://slow.example.com")

# GOOD — (connect_timeout, read_timeout) in seconds:
try:
    resp = requests.get(
        "https://api.example.com/data",
        timeout=(3.05, 10),   # 3s to connect, 10s to read
    )
    resp.raise_for_status()
except requests.Timeout:
    print("request timed out")
except requests.HTTPError as e:
    print("HTTP error:", e)`,
    explanation:
      "The connect timeout limits how long to wait for the TCP handshake; the read timeout limits the time between bytes in the response; omitting timeout leaves threads blocked forever.",
  },
  {
    id: "py-ssl-verify",
    language: "python",
    title: "requests verify=False — dev-only SSL bypass",
    tag: "caveats",
    code: `import requests

# NEVER in production — disables certificate verification entirely:
resp = requests.get("https://self-signed.example.com", verify=False)
# InsecureRequestWarning: Unverified HTTPS request is being made.

# Suppress the warning (still insecure!):
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# BETTER — point to a custom CA bundle:
resp = requests.get(
    "https://internal.corp.com",
    verify="/etc/ssl/certs/corp-ca.pem",
)`,
    explanation:
      "verify=False leaves you open to man-in-the-middle attacks; for internal services with self-signed certificates, provide the CA certificate path instead of disabling verification entirely.",
  },
  {
    id: "py-env-var-type",
    language: "python",
    title: "os.environ returns strings — cast manually",
    tag: "caveats",
    code: `import os

# All values are strings, even numeric ones:
os.environ["PORT"] = "8080"
os.environ["DEBUG"] = "true"

port = int(os.environ["PORT"])          # 8080  (int)
debug = os.environ["DEBUG"].lower() == "true"   # True (bool)

# os.environ.get provides a default and avoids KeyError:
log_level = os.environ.get("LOG_LEVEL", "INFO")

# WRONG — comparing string "true" to True always fails:
wrong = os.environ["DEBUG"] == True   # always False!
print(wrong)

# Use a helper for bool envvars:
def env_bool(key: str, default: bool = False) -> bool:
    return os.environ.get(key, str(default)).lower() in ("1", "true", "yes")`,
    explanation:
      "os.environ is a mapping of strings to strings; forgetting to cast is a common bug where comparisons silently fail — wrap env-var reads in a typed helper to catch this at the boundary.",
  },
  {
    id: "py-config-parse",
    language: "python",
    title: "configparser lowercases keys by default",
    tag: "caveats",
    code: `import configparser

config = configparser.ConfigParser()
config.read_string("""
[Server]
Host = db.example.com
MaxConnections = 50
""")

# Keys are lowercased — 'Host' becomes 'host':
print(config["Server"]["host"])            # db.example.com
print(config["Server"].get("Host"))        # db.example.com (same key)
# config["Server"]["Host"] also works — lookups are case-insensitive

# Disable lowercasing with a custom optionxform:
config2 = configparser.ConfigParser()
config2.optionxform = str   # preserve case
config2.read_string("[S]\\nMyKey = value")
print(list(config2["S"].keys()))   # ['MyKey']`,
    explanation:
      "configparser normalises all option names through optionxform which defaults to str.lower; override it to str if your config keys are case-sensitive (e.g., environment variable names).",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "py-pandas-dtype",
    language: "python",
    title: "pandas dtypes — int64, float64, object, category, datetime64",
    tag: "types",
    code: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    "name":   ["Alice", "Bob"],
    "score":  [88,      72],
    "price":  [1.5,     2.0],
    "active": [True,    False],
    "joined": pd.to_datetime(["2024-01-01", "2024-06-15"]),
})
df["grade"] = pd.Categorical(["B", "C"], categories=["A", "B", "C"], ordered=True)

print(df.dtypes)
# name             object
# score             int64
# price           float64
# active             bool
# joined    datetime64[ns]
# grade           category`,
    explanation:
      "category dtype stores repeated strings as integer codes, saving memory and speeding up groupby; use pd.to_datetime() to parse date strings — it avoids the slow object dtype for date columns.",
  },
  {
    id: "py-numpy-dtype",
    language: "python",
    title: "numpy dtype hierarchy — int8 to int64, float32 to float64",
    tag: "types",
    code: `import numpy as np

# Integer dtypes: np.int8, int16, int32, int64 (signed)
#                 np.uint8, uint16, uint32, uint64 (unsigned)
print(np.iinfo(np.int8).max)    # 127
print(np.iinfo(np.int32).max)   # 2147483647
print(np.iinfo(np.uint8).max)   # 255

# Float dtypes: np.float16, float32, float64 (= Python float)
print(np.finfo(np.float16).max) # 65504.0
print(np.finfo(np.float32).max) # 3.4028235e+38

# Complex:
c = np.array([1+2j], dtype=np.complex64)
print(c.dtype)  # complex64

# Check dtype of an expression:
print((np.int32(1) + np.float32(1.0)).dtype)  # float64`,
    explanation:
      "numpy follows C promotion rules: mixing int32 and float32 yields float64; iinfo/finfo expose the range and precision of each dtype so you can choose the smallest safe type.",
  },
  {
    id: "py-numpy-shape-broadcast",
    language: "python",
    title: "numpy broadcast rules — dimensions align from the right",
    tag: "types",
    code: `import numpy as np

# Rule: align shapes from the right, pad with 1s on the left.
# Dimensions must be equal OR one of them must be 1.

a = np.ones((3, 1, 5))   # shape (3, 1, 5)
b = np.ones((   4, 5))   # shape    (4, 5) → padded to (1, 4, 5)
c = a + b                 # shape (3, 4, 5) — broadcast

# (3, 1, 5)
# (1, 4, 5)   ← padded
# ——————————
# (3, 4, 5)   ← result

print(c.shape)  # (3, 4, 5)

# Incompatible shapes raise ValueError:
try:
    np.ones((3, 5)) + np.ones((4, 5))
except ValueError as e:
    print(e)  # operands could not be broadcast together`,
    explanation:
      "Broadcasting eliminates explicit tiling; understanding alignment from the right prevents hard-to-debug shape mismatches — always print intermediate shapes when a broadcast error is mysterious.",
  },
  {
    id: "py-numpy-view-vs-copy",
    language: "python",
    title: "numpy view vs copy — slice shares memory",
    tag: "types",
    code: `import numpy as np

original = np.array([1, 2, 3, 4, 5])
view     = original[1:4]    # slice → view, shared memory
copy_    = original[1:4].copy()  # explicit copy

view[0] = 99
print(original)  # [ 1 99  3  4  5]  — modified!

copy_[0] = 77
print(original)  # [ 1 99  3  4  5]  — unchanged

# Check whether an array owns its memory:
print(view.base is original)   # True
print(copy_.base)              # None  — owns its memory

# Fancy indexing always returns a copy:
fancy = original[[0, 2, 4]]
fancy[0] = 0
print(original)  # unchanged`,
    explanation:
      "Slices are views sharing the underlying buffer — fast but side-effecting; fancy indexing (integer arrays, boolean masks) always copies; check .base is not None to detect views.",
  },
  {
    id: "py-typing-dataframe",
    language: "python",
    title: "Annotating DataFrames — pd.DataFrame vs pandas-stubs",
    tag: "types",
    code: `from __future__ import annotations
import pandas as pd

# Basic annotation — type checker accepts pd.DataFrame anywhere
def summarise(df: pd.DataFrame) -> pd.Series:
    return df.mean()

# pandas-stubs (pip install pandas-stubs) adds column-aware stubs,
# but the standard approach is to use typed dicts for row shapes:
from typing import TypedDict

class UserRow(TypedDict):
    name:  str
    score: float

# pandera for runtime DataFrame schema validation:
# import pandera as pa
# schema = pa.DataFrameSchema({
#     "score": pa.Column(float, pa.Check.ge(0)),
# })
# validated = schema.validate(df)

df: pd.DataFrame = pd.DataFrame([UserRow(name="Alice", score=88.0)])
result: pd.Series = summarise(df)`,
    explanation:
      "pd.DataFrame has no column-level generic parameters in the stdlib; pandas-stubs improves mypy support, and pandera adds runtime validation — use all three layers for production pipelines.",
  },
  {
    id: "py-pathlib-vs-str",
    language: "python",
    title: "Path objects vs str — interoperability via os.fspath",
    tag: "types",
    code: `from pathlib import Path
import os

p = Path("/tmp/data/results.csv")

# Path objects work directly with most stdlib functions:
print(os.path.exists(p))    # True/False — accepts Path
print(os.path.basename(p))  # results.csv

# Convert to string explicitly when needed:
s: str = str(p)
s2: str = os.fspath(p)     # calls p.__fspath__(), preferred

# open() accepts Path directly:
with open(p, "w") as f:
    f.write("data")

# Path-specific operations not on os.path:
print(p.suffix)    # .csv
print(p.stem)      # results
print(p.parent)    # /tmp/data`,
    explanation:
      "os.fspath() is the canonical conversion and calls __fspath__ so it works with any path-like object; most modern stdlib functions accept Path directly — explicit str() is only needed for third-party code.",
  },
  {
    id: "py-os-path-vs-pathlib",
    language: "python",
    title: "os.path vs pathlib — both accept str and Path",
    tag: "types",
    code: `import os
from pathlib import Path

# os.path — string-oriented, procedural, accepts Path objects
p1 = os.path.join("/tmp", "data", "file.txt")      # str
p2 = os.path.join(Path("/tmp"), "data", "file.txt") # also ok

# pathlib — OOP, richer API, returns Path objects
p3 = Path("/tmp") / "data" / "file.txt"

# Equivalent operations:
print(os.path.basename(p1))  # file.txt
print(Path(p1).name)         # file.txt

print(os.path.splitext(p1))  # ('/tmp/data/file', '.txt')
print(Path(p1).suffix)       # .txt

# pathlib extras with no os.path equivalent:
print(Path(p1).read_text(encoding="utf-8") if Path(p1).exists() else "n/a")`,
    explanation:
      "Prefer pathlib for new code — it is more readable and expressive; os.path remains useful in performance-sensitive loops since Path objects have construction overhead.",
  },
  {
    id: "py-bytes-bytearray-buffer",
    language: "python",
    title: "bytes, bytearray, memoryview — the buffer protocol",
    tag: "types",
    code: `# bytes — immutable sequence of integers 0-255
b = b"hello"
print(b[0])        # 104 (ASCII 'h')
# b[0] = 72        # TypeError — immutable

# bytearray — mutable version
ba = bytearray(b"hello")
ba[0] = 72         # 'H'
print(ba)          # bytearray(b'Hello')

# memoryview — zero-copy view over a buffer
mv = memoryview(ba)
mv[1:3] = b"EL"   # modifies ba in place without copying
print(ba)          # bytearray(b'HELlo')

# All three support the buffer protocol — pass directly to socket.send,
# struct.pack_into, and other C-extension functions:
import struct
struct.pack_into(">H", ba, 0, 0xCAFE)
print(ba[:2])      # bytearray(b'\\xca\\xfe')`,
    explanation:
      "The buffer protocol lets bytes, bytearray, array.array, and numpy arrays share memory with C extensions without copying; memoryview slices are zero-copy views over the underlying buffer.",
  },
  {
    id: "py-io-abstract",
    language: "python",
    title: "io hierarchy — RawIOBase → BufferedIOBase → TextIOBase",
    tag: "types",
    code: `import io

# RawIOBase — unbuffered binary (e.g. FileIO)
raw = io.FileIO("demo.bin", "wb")
raw.write(b"\\x00\\x01")
raw.close()

# BufferedIOBase — adds buffering layer (e.g. BufferedWriter)
buf = io.BufferedWriter(io.FileIO("demo.bin", "wb"), buffer_size=8192)
buf.write(b"buffered")
buf.flush()
buf.close()

# TextIOBase — text encoding layer (e.g. TextIOWrapper)
text = io.TextIOWrapper(io.FileIO("demo.bin", "rb"), encoding="utf-8")
# text.read()

# In-memory variants used in tests:
bin_buf  = io.BytesIO(b"binary data")
text_buf = io.StringIO("text data")
print(text_buf.read())  # text data`,
    explanation:
      "The io hierarchy mirrors the layered design: raw I/O → buffering → text encoding; type-annotate with io.IOBase, io.RawIOBase, or io.TextIOBase to accept the right level of abstraction.",
  },
  {
    id: "py-io-rawio",
    language: "python",
    title: "io.RawIOBase — unbuffered binary I/O",
    tag: "types",
    code: `import io

class CountingRaw(io.RawIOBase):
    """A readable RawIOBase that serves bytes from a source and counts reads."""
    def __init__(self, source: bytes):
        self._data = source
        self._pos = 0
        self.read_calls = 0

    def readinto(self, b: bytearray) -> int:
        self.read_calls += 1
        n = min(len(b), len(self._data) - self._pos)
        b[:n] = self._data[self._pos:self._pos + n]
        self._pos += n
        return n

    def readable(self) -> bool:
        return True

raw = CountingRaw(b"hello world")
buf = io.BufferedReader(raw, buffer_size=4)
print(buf.read(5))         # b'hello'
print(raw.read_calls)      # multiple small reads coalesced`,
    explanation:
      "Custom RawIOBase only needs readinto(); wrapping it in BufferedReader adds read-ahead and reduces system call overhead — implement raw I/O at the RawIOBase level, consume at the buffered level.",
  },
  {
    id: "py-io-buffered",
    language: "python",
    title: "io.BufferedReader / BufferedWriter — configurable buffer size",
    tag: "types",
    code: `import io

# Write with custom buffer size:
raw_w = io.FileIO("demo.bin", "wb")
writer = io.BufferedWriter(raw_w, buffer_size=65_536)  # 64 KiB
writer.write(b"A" * 1000)
writer.flush()   # ensure buffer is flushed before close
writer.close()

# Read with custom buffer size:
raw_r = io.FileIO("demo.bin", "rb")
reader = io.BufferedReader(raw_r, buffer_size=65_536)
chunk  = reader.read(100)
print(len(chunk))   # 100

# BufferedRandom for read+write:
bio = io.BytesIO(b"hello world")
print(bio.read(5))      # b'hello'
bio.seek(0)
print(bio.read())       # b'hello world'`,
    explanation:
      "Increasing buffer_size reduces the number of underlying OS read/write calls; the default is 8192 bytes; for large sequential reads 64–256 KiB buffers typically give the best throughput.",
  },
  {
    id: "py-io-textio",
    language: "python",
    title: "io.TextIOWrapper — encoding layer over binary streams",
    tag: "types",
    code: `import io

# Wrap a binary BytesIO with a text encoder:
binary = io.BytesIO()
text   = io.TextIOWrapper(binary, encoding="utf-8", line_buffering=True)

text.write("Hello, 世界\\n")
text.flush()

binary.seek(0)
raw_bytes = binary.read()
print(raw_bytes)   # b'Hello, \\xe4\\xb8\\x96\\xe7\\x95\\x8c\\n'

# Decode back:
binary.seek(0)
reader = io.TextIOWrapper(binary, encoding="utf-8")
print(reader.read())  # Hello, 世界

# Use write_through=True to flush to the underlying buffer on every write:
text2 = io.TextIOWrapper(io.BytesIO(), encoding="utf-8", write_through=True)`,
    explanation:
      "TextIOWrapper sits above BufferedIOBase; it handles encoding, decoding, and newline translation; line_buffering flushes after each newline — useful for interactive or log streams.",
  },
  {
    id: "py-file-mode-types",
    language: "python",
    title: "File mode types — text vs binary, read/write/append",
    tag: "types",
    code: `# Mode string = [r|w|a|x] + [b|t] + [+]
# Default is 'rt' (text read)

# Text mode — str in/out, newline translation, encoding applied
with open("demo.txt", "w",  encoding="utf-8") as f: f.write("hi\\n")  # write
with open("demo.txt", "r",  encoding="utf-8") as f: print(f.read())   # read
with open("demo.txt", "a",  encoding="utf-8") as f: f.write("more\\n") # append
with open("demo.txt", "x",  encoding="utf-8") as f: ...               # create, fail if exists
# (x raises FileExistsError)

# Binary mode — bytes in/out, no newline translation
with open("demo.bin", "wb") as f: f.write(b"\\x00\\xff")  # binary write
with open("demo.bin", "rb") as f: print(f.read())         # binary read

# + adds read+write to any mode:
# "r+"  read+write text, file must exist
# "w+"  read+write text, truncates
# "rb+" read+write binary`,
    explanation:
      "Text mode applies the platform newline convention and decodes bytes to str; binary mode is a raw byte stream; 'x' mode is useful to atomically create a file and fail if it already exists.",
  },
  {
    id: "py-typing-ndarray",
    language: "python",
    title: "Type annotations for numpy arrays — NDArray[np.float64]",
    tag: "types",
    code: `from __future__ import annotations
import numpy as np
import numpy.typing as npt

# np.ndarray is a valid type but carries no dtype or shape info:
def scale(arr: np.ndarray, factor: float) -> np.ndarray:
    return arr * factor

# npt.NDArray[dtype] adds dtype info (shape info requires third-party libs):
def normalise(arr: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    return (arr - arr.mean()) / arr.std()

# ArrayLike accepts lists, tuples, arrays, etc.:
def to_array(data: npt.ArrayLike) -> np.ndarray:
    return np.asarray(data)

# DTypeLike accepts dtype strings, types, and dtype objects:
def zeros(shape: tuple[int, ...], dtype: npt.DTypeLike = np.float64) -> np.ndarray:
    return np.zeros(shape, dtype=dtype)`,
    explanation:
      "numpy.typing.NDArray[dtype] gives mypy dtype-level checking; for shape-level typing consider the third-party jaxtyping or beartype libraries; ArrayLike broadens signatures to accept non-array inputs.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "py-csv-vs-pandas",
    language: "python",
    title: "csv module vs pandas — row-by-row vs in-memory vectorised",
    tag: "families",
    code: `# csv — stdlib, row-by-row, memory-efficient for large files
import csv
total = 0
with open("sales.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        total += float(row["amount"])

# pandas — loads entire file into RAM, vectorised operations
import pandas as pd
df = pd.read_csv("sales.csv")
total = df["amount"].sum()   # much faster on large data

# pandas also handles: missing values, dtypes, groupby, merge,
# multi-format I/O (excel, parquet, json, sql) out of the box

# Rule of thumb:
# csv  → huge files you can't fit in RAM, simple transforms
# pandas → analytical queries, joins, reshaping`,
    explanation:
      "csv is zero-dependency and streams line-by-line; pandas loads everything into columnar arrays for fast vectorised operations — use csv when memory is the constraint, pandas when speed is.",
  },
  {
    id: "py-json-vs-msgpack",
    language: "python",
    title: "json vs MessagePack — human-readable vs compact binary",
    tag: "families",
    code: `import json

data = {"user": "Alice", "scores": list(range(1000)), "active": True}

# json — human-readable, universally supported
j = json.dumps(data)
print(f"json:    {len(j.encode())} bytes")   # ~5900 bytes

# msgpack (pip install msgpack) — binary, 2-3x smaller, faster
import msgpack
m = msgpack.packb(data)
print(f"msgpack: {len(m)} bytes")            # ~2500 bytes

# Decode msgpack:
obj = msgpack.unpackb(m, raw=False)
print(obj["user"])  # Alice

# json supports any JSON consumer; msgpack needs a msgpack library
# Choose msgpack for: inter-service messaging, caches, log storage`,
    explanation:
      "MessagePack serialises to binary with no field-name repetition, making it 2–4x smaller and faster than JSON; the trade-off is that you need a msgpack library on both sides.",
  },
  {
    id: "py-sqlite-vs-postgres",
    language: "python",
    title: "SQLite vs PostgreSQL — serverless file vs production server",
    tag: "families",
    code: `# SQLite — file-based, zero config, single writer at a time
import sqlite3
conn = sqlite3.connect("app.db")   # creates file if absent
# Great for: development, testing, embedded, single-user desktop apps

# PostgreSQL — server-based, concurrent writers, production-grade
import psycopg2  # pip install psycopg2-binary
conn_pg = psycopg2.connect(
    host="localhost", dbname="mydb", user="admin", password="secret"
)
# Great for: web apps, multi-process services, large datasets, JSONB, full-text search

# SQLAlchemy abstracts both behind one API:
from sqlalchemy import create_engine
dev  = create_engine("sqlite:///app.db")
prod = create_engine("postgresql+psycopg2://admin:secret@localhost/mydb")`,
    explanation:
      "SQLite writes are serialised at the database level — fine for one writer; PostgreSQL supports concurrent MVCC transactions and row-level locks, which are required for multi-process web services.",
  },
  {
    id: "py-requests-vs-httpx",
    language: "python",
    title: "requests vs httpx — sync vs async + HTTP/2",
    tag: "families",
    code: `# requests — sync, mature, simple (pip install requests)
import requests
resp = requests.get("https://api.example.com/data", timeout=5)
print(resp.json())

# httpx — sync AND async, HTTP/2, same-ish API (pip install httpx)
import httpx

# Sync (drop-in for requests):
with httpx.Client() as client:
    resp = client.get("https://api.example.com/data", timeout=5)
    print(resp.json())

# Async — high-concurrency scraping / microservices:
import asyncio
async def fetch():
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.example.com/data")
        return resp.json()

asyncio.run(fetch())`,
    explanation:
      "requests is the safe, widely-supported choice for synchronous code; httpx provides an almost identical API plus asyncio support and HTTP/2 — migrate gradually since the surface area is nearly the same.",
  },
  {
    id: "py-logging-vs-structlog",
    language: "python",
    title: "logging vs structlog — stdlib vs structured third-party",
    tag: "families",
    code: `# stdlib logging — format string, text output
import logging
logger = logging.getLogger(__name__)
logger.info("order placed user_id=%s amount=%s", 42, 99.99)
# 2026-05-11 12:00:00 INFO order placed user_id=42 amount=99.99

# structlog — key=value pairs, JSON-friendly, context binding
import structlog  # pip install structlog
log = structlog.get_logger()
log = log.bind(user_id=42)       # bound context carried forward
log.info("order placed", amount=99.99)
# {"user_id": 42, "amount": 99.99, "event": "order placed", ...}

# structlog integrates with stdlib logging as a backend,
# supports async, and chains processor pipelines for filtering/formatting`,
    explanation:
      "stdlib logging formats context into a message string, losing machine-parseable structure; structlog treats log entries as dicts through a processor pipeline, making log aggregation and filtering straightforward.",
  },
  {
    id: "py-yaml-vs-toml",
    language: "python",
    title: "YAML vs TOML — flexible vs simple config formats",
    tag: "families",
    code: `# YAML — flexible, expressive, supports anchors/aliases
import yaml   # pip install pyyaml
config_yaml = """
database:
  host: db.local
  port: 5432
servers: [web1, web2]   # inline list
"""
cfg = yaml.safe_load(config_yaml)   # always use safe_load!
print(cfg["database"]["port"])   # 5432

# TOML — simple, unambiguous, Python's pyproject.toml standard
import tomllib  # stdlib in Python 3.11+
config_toml = b"""
[database]
host = "db.local"
port = 5432
servers = ["web1", "web2"]
"""
cfg2 = tomllib.loads(config_toml.decode())
print(cfg2["database"]["port"])  # 5432`,
    explanation:
      "YAML's flexibility (anchors, multi-document, implicit types) is also a footgun — yaml.load() without safe_load can execute arbitrary Python; TOML is unambiguous and becoming the Python ecosystem standard.",
  },
  {
    id: "py-re-vs-parse",
    language: "python",
    title: "re vs parse — regex vs human-friendly pattern extraction",
    tag: "families",
    code: `import re

log_line = "2026-05-11 12:00:00 ERROR myapp: connection refused"

# re — powerful but noisy for simple extractions
m = re.match(r"(\\d{4}-\\d{2}-\\d{2}) (\\d{2}:\\d{2}:\\d{2}) (\\w+) (\\S+): (.+)", log_line)
if m:
    date, time_, level, logger, msg = m.groups()

# parse (pip install parse) — inverse of str.format(), readable
import parse
result = parse.parse("{date} {time} {level} {logger}: {msg}", log_line)
if result:
    print(result["level"])   # ERROR
    print(result["msg"])     # connection refused`,
    explanation:
      "parse is the 'reverse of format' — write the pattern in the same way you'd format it; it is less expressive than regex but dramatically more readable for log parsing and structured text extraction.",
  },
  {
    id: "py-argparse-vs-typer",
    language: "python",
    title: "argparse vs typer — stdlib vs type-hint-driven CLI",
    tag: "families",
    code: `# argparse — stdlib, verbose but no dependencies
import argparse
parser = argparse.ArgumentParser(description="Process files")
parser.add_argument("filename")
parser.add_argument("--count", type=int, default=10)
parser.add_argument("--verbose", action="store_true")
args = parser.parse_args()
print(args.filename, args.count, args.verbose)

# typer (pip install typer) — type hints drive the CLI automatically
import typer
app = typer.Typer()

@app.command()
def main(filename: str, count: int = 10, verbose: bool = False) -> None:
    typer.echo(f"Processing {filename} (count={count})")

if __name__ == "__main__":
    app()`,
    explanation:
      "typer generates argument parsing, help text, and shell completion from type annotations — no duplicate information; argparse is zero-dependency and more explicit, making it better for scripts shipped without extras.",
  },
  {
    id: "py-dataclass-vs-pydantic",
    language: "python",
    title: "dataclass vs pydantic — stdlib struct vs validated model",
    tag: "families",
    code: `from dataclasses import dataclass

# dataclass — no runtime validation, no coercion
@dataclass
class UserDC:
    name: str
    age:  int

u = UserDC(name="Alice", age="30")   # silently accepts wrong type!
print(u.age, type(u.age))            # "30" <class 'str'>

# pydantic — validates and coerces at construction time
from pydantic import BaseModel

class UserPD(BaseModel):
    name: str
    age:  int

u2 = UserPD(name="Alice", age="30")  # coerces "30" → 30
print(u2.age, type(u2.age))          # 30 <class 'int'>

# u3 = UserPD(name="Alice", age="bad")  # ValidationError`,
    explanation:
      "dataclass is a lightweight struct with no overhead; pydantic validates and coerces inputs, generates JSON schemas, and integrates with FastAPI — choose based on whether runtime validation is a requirement.",
  },
  {
    id: "py-threading-vs-multiprocessing",
    language: "python",
    title: "threading vs multiprocessing — I/O-bound vs CPU-bound",
    tag: "families",
    code: `import threading, multiprocessing, time

def io_task(n):
    time.sleep(0.1)   # simulates I/O wait

def cpu_task(n):
    sum(range(10_000_000))  # simulates CPU work

# threading — good for I/O (GIL released during sleep/socket/file)
threads = [threading.Thread(target=io_task, args=(i,)) for i in range(8)]
for t in threads: t.start()
for t in threads: t.join()

# multiprocessing — good for CPU (each worker is a separate process)
with multiprocessing.Pool(processes=4) as pool:
    pool.map(cpu_task, range(4))`,
    explanation:
      "The GIL lets only one thread execute Python bytecode at a time — threads still speed up I/O-bound work because the GIL is released during blocking I/O; use multiprocessing to bypass the GIL for CPU-bound work.",
  },
  {
    id: "py-sync-vs-async",
    language: "python",
    title: "Synchronous vs asynchronous I/O — blocking vs non-blocking",
    tag: "families",
    code: `# Synchronous — each call blocks until complete
import requests, time

def sync_main():
    t = time.perf_counter()
    for url in ["https://httpbin.org/delay/1"] * 3:
        requests.get(url, timeout=5)   # waits 1s each = ~3s total
    print(f"sync: {time.perf_counter()-t:.1f}s")

# Asynchronous — concurrent I/O without threads
import asyncio, httpx

async def async_main():
    t = time.perf_counter()
    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[client.get("https://httpbin.org/delay/1")
                                for _ in range(3)])
    print(f"async: {time.perf_counter()-t:.1f}s")  # ~1s total`,
    explanation:
      "Async I/O overlaps waiting time — while one request waits for bytes, another can send its request; with N concurrent requests the total time approaches the slowest single request, not N × average.",
  },
  {
    id: "py-process-vs-coroutine",
    language: "python",
    title: "multiprocessing.Process vs asyncio coroutine — parallelism vs concurrency",
    tag: "families",
    code: `import multiprocessing, asyncio

# multiprocessing.Process — TRUE parallelism, separate OS processes
def heavy(n):
    return sum(range(n))   # runs on a separate CPU core

if __name__ == "__main__":
    p = multiprocessing.Process(target=heavy, args=(10_000_000,))
    p.start()
    p.join()

# asyncio coroutine — CONCURRENCY, single thread, cooperative
async def wait_for_event():
    await asyncio.sleep(1)   # yields control, does NOT block the thread
    return "done"

async def main():
    results = await asyncio.gather(wait_for_event(), wait_for_event())
    print(results)   # ['done', 'done']

asyncio.run(main())`,
    explanation:
      "Parallelism (multiprocessing) runs code simultaneously on multiple cores; concurrency (asyncio) interleaves execution on one core by yielding at await points — they solve different bottlenecks.",
  },
  {
    id: "py-queue-vs-deque",
    language: "python",
    title: "queue.Queue vs collections.deque — thread-safe vs not",
    tag: "families",
    code: `import queue
from collections import deque
import threading

# queue.Queue — thread-safe FIFO, designed for producer-consumer
q: queue.Queue[int] = queue.Queue(maxsize=10)

def producer():
    for i in range(5):
        q.put(i)      # blocks if full
    q.put(None)       # sentinel

def consumer():
    while True:
        item = q.get()   # blocks if empty
        if item is None: break
        print("got", item)
    q.task_done()

threading.Thread(target=producer).start()
threading.Thread(target=consumer).start()

# collections.deque — fast O(1) at both ends, NOT thread-safe for concurrent access
d: deque[int] = deque(maxlen=5)
d.appendleft(1); d.append(2)
print(d.popleft(), d.pop())`,
    explanation:
      "queue.Queue uses an internal lock and condition variables so put/get are safe across threads; deque.append and .popleft are individually atomic in CPython but compound operations are not thread-safe.",
  },
  {
    id: "py-stack-queue-compare",
    language: "python",
    title: "Stack (LIFO) vs Queue (FIFO) — Python implementations",
    tag: "families",
    code: `from collections import deque
import queue

# Stack (LIFO) — Python list is fine for single-thread use
stack: list[int] = []
stack.append(1); stack.append(2); stack.append(3)
print(stack.pop())   # 3 (last in, first out)

# Queue (FIFO) — deque for single-thread, queue.Queue for threads
fifo: deque[int] = deque()
fifo.append(1); fifo.append(2); fifo.append(3)
print(fifo.popleft())   # 1 (first in, first out)

# Thread-safe alternatives:
safe_stack: queue.LifoQueue[int] = queue.LifoQueue()
safe_stack.put(1); safe_stack.put(2)
print(safe_stack.get())  # 2

safe_queue: queue.Queue[int] = queue.Queue()
safe_queue.put(1); safe_queue.put(2)
print(safe_queue.get())  # 1`,
    explanation:
      "list.append/pop are O(1) at the tail making list a natural stack; deque.appendleft/popleft are O(1) at both ends; use queue.LifoQueue and queue.Queue for thread-safe stack and queue respectively.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "py-pydantic-model",
    language: "python",
    title: "pydantic.BaseModel — typed fields and auto-validation",
    tag: "classes",
    code: `from pydantic import BaseModel
from datetime import date
from typing import Optional

class Address(BaseModel):
    street: str
    city:   str
    zip:    str

class User(BaseModel):
    id:      int
    name:    str
    email:   str
    dob:     Optional[date] = None
    address: Optional[Address] = None

u = User(id="42", name="Alice", email="alice@example.com",
         dob="1990-06-15",
         address={"street": "1 Main St", "city": "NYC", "zip": "10001"})

print(u.id,   type(u.id))    # 42 <class 'int'>   — "42" coerced
print(u.dob,  type(u.dob))   # 1990-06-15 <class 'datetime.date'>
print(u.model_dump_json(indent=2))`,
    explanation:
      "BaseModel coerces compatible types (str → int, str → date) and raises ValidationError for incompatible ones; nested models are instantiated from plain dicts automatically.",
  },
  {
    id: "py-pydantic-validator",
    language: "python",
    title: "@field_validator — custom field validation in pydantic",
    tag: "classes",
    code: `from pydantic import BaseModel, field_validator, ValidationError

class Product(BaseModel):
    name:  str
    price: float
    sku:   str

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return round(v, 2)   # normalise to 2 decimal places

    @field_validator("sku")
    @classmethod
    def sku_format(cls, v: str) -> str:
        v = v.upper()
        if not v.startswith("SKU-"):
            raise ValueError("SKU must start with 'SKU-'")
        return v

p = Product(name="Widget", price=9.999, sku="sku-abc123")
print(p.price)   # 10.0
print(p.sku)     # SKU-ABC123`,
    explanation:
      "@field_validator runs after type coercion; it must be a classmethod; raising ValueError inside it is wrapped in a pydantic ValidationError with the field name and location included.",
  },
  {
    id: "py-pydantic-field",
    language: "python",
    title: "pydantic Field — default, description, constraints",
    tag: "classes",
    code: `from pydantic import BaseModel, Field
from typing import Annotated

class Config(BaseModel):
    host:    str  = Field(default="localhost", description="DB hostname")
    port:    int  = Field(default=5432, ge=1, le=65535)
    timeout: int  = Field(default=30,  gt=0,  description="seconds")
    name:    str  = Field(min_length=1, max_length=64)

    # Annotated syntax is equivalent and composable:
    retries: Annotated[int, Field(ge=0, le=10)] = 3

cfg = Config(name="mydb")
print(cfg.port)       # 5432
print(cfg.retries)    # 3

try:
    Config(name="", port=99999)
except Exception as e:
    print(e)   # validation errors for name and port`,
    explanation:
      "Field() centralises metadata and constraints in one place; ge/le/gt/lt add numeric bounds; min_length/max_length add string bounds; these constraints also appear in the generated JSON Schema.",
  },
  {
    id: "py-pydantic-config",
    language: "python",
    title: "model_config = ConfigDict — frozen and other model settings",
    tag: "classes",
    code: `from pydantic import BaseModel, ConfigDict

class Point(BaseModel):
    model_config = ConfigDict(frozen=True)  # immutable after creation
    x: float
    y: float

p = Point(x=1.0, y=2.0)
try:
    p.x = 9.0   # ValidationError — frozen model
except Exception as e:
    print(e)

# Other useful ConfigDict options:
class Strict(BaseModel):
    model_config = ConfigDict(
        strict=True,          # no coercion — "42" is not an int
        str_strip_whitespace=True,
        validate_assignment=True,  # validate on attribute assignment
    )
    value: int`,
    explanation:
      "frozen=True makes instances hashable and prevents mutation — ideal for value objects and dict keys; validate_assignment re-runs validation when you set attributes after construction.",
  },
  {
    id: "py-attrs-class",
    language: "python",
    title: "@attrs.define — auto __init__, __repr__, __eq__",
    tag: "classes",
    code: `import attrs

@attrs.define
class Vector:
    x: float
    y: float
    z: float = 0.0   # default value

    def magnitude(self) -> float:
        return (self.x**2 + self.y**2 + self.z**2) ** 0.5

v1 = Vector(1.0, 2.0)
v2 = Vector(1.0, 2.0)
v3 = Vector(1.0, 2.0, 3.0)

print(repr(v1))        # Vector(x=1.0, y=2.0, z=0.0)
print(v1 == v2)        # True  — __eq__ compares all fields
print(v1 == v3)        # False
print(v1.magnitude())  # 2.23...

# attrs.evolve creates a copy with changed fields:
v4 = attrs.evolve(v1, x=9.0)
print(v4)  # Vector(x=9.0, y=2.0, z=0.0)`,
    explanation:
      "@attrs.define generates __init__, __repr__, __eq__, and __hash__ (if frozen) from class-level annotations; attrs.evolve is the equivalent of pydantic's model_copy for producing modified copies.",
  },
  {
    id: "py-attrs-validators",
    language: "python",
    title: "attrs.validators — instance_of and in_",
    tag: "classes",
    code: `import attrs

@attrs.define
class HTTPConfig:
    host:    str = attrs.field(validator=attrs.validators.instance_of(str))
    port:    int = attrs.field(
        validator=[
            attrs.validators.instance_of(int),
            attrs.validators.in_(range(1, 65536)),
        ]
    )
    method: str = attrs.field(
        validator=attrs.validators.in_(["GET", "POST", "PUT", "DELETE"])
    )

cfg = HTTPConfig(host="example.com", port=8080, method="GET")
print(cfg)

try:
    HTTPConfig(host="x", port=99999, method="GET")
except ValueError as e:
    print(e)   # 99999 is not in range(1, 65536)`,
    explanation:
      "attrs validators run at construction time; you can stack them in a list; write custom validators as functions with signature (instance, attribute, value) → None and raise ValueError/TypeError.",
  },
  {
    id: "py-enum-member",
    language: "python",
    title: "Enum member — .name, .value, list(MyEnum)",
    tag: "classes",
    code: `from enum import Enum

class Color(Enum):
    RED   = 1
    GREEN = 2
    BLUE  = 3

c = Color.RED
print(c)          # Color.RED
print(c.name)     # RED
print(c.value)    # 1
print(repr(c))    # <Color.RED: 1>

# Iterate all members:
print(list(Color))   # [<Color.RED: 1>, <Color.GREEN: 2>, <Color.BLUE: 3>]

# Lookup by value:
print(Color(2))      # Color.GREEN

# Lookup by name:
print(Color["BLUE"]) # Color.BLUE

# Membership test:
print(Color.RED in Color)   # True`,
    explanation:
      "Enum members are singletons; Color(value) and Color[name] are the canonical lookup methods; iterate with list(Color) to get all members in definition order.",
  },
  {
    id: "py-enum-methods",
    language: "python",
    title: "Enum with methods — adding behaviour to members",
    tag: "classes",
    code: `from enum import Enum

class Planet(Enum):
    MERCURY = (3.303e+23, 2.4397e6)
    VENUS   = (4.869e+24, 6.0518e6)
    EARTH   = (5.976e+24, 6.37814e6)

    def __init__(self, mass: float, radius: float):
        self.mass   = mass
        self.radius = radius

    G = 6.67430e-11   # class variable (not an enum member)

    def surface_gravity(self) -> float:
        return self.G * self.mass / (self.radius ** 2)

    def surface_weight(self, body_mass: float) -> float:
        return body_mass * self.surface_gravity()

print(Planet.EARTH.surface_weight(75))   # ~735 N
print(Planet.MERCURY.surface_gravity())  # ~3.7 m/s²`,
    explanation:
      "Enum members can carry multiple values via a tuple; define __init__ to unpack the tuple into named attributes; regular methods treat self as the enum member giving access to its data.",
  },
  {
    id: "py-enum-property",
    language: "python",
    title: "@property on an Enum class",
    tag: "classes",
    code: `from enum import Enum

class HTTPStatus(Enum):
    OK           = 200
    NOT_FOUND    = 404
    SERVER_ERROR = 500

    @property
    def is_success(self) -> bool:
        return 200 <= self.value < 300

    @property
    def is_error(self) -> bool:
        return self.value >= 400

    @property
    def phrase(self) -> str:
        return {200: "OK", 404: "Not Found", 500: "Internal Server Error"}.get(
            self.value, "Unknown"
        )

print(HTTPStatus.OK.is_success)      # True
print(HTTPStatus.NOT_FOUND.is_error) # True
print(HTTPStatus.OK.phrase)          # OK`,
    explanation:
      "@property works inside Enum just as in normal classes; it keeps derived values out of the enum value itself, which would otherwise create additional member look-up names.",
  },
  {
    id: "py-enum-classmethod",
    language: "python",
    title: "@classmethod on Enum — custom construction",
    tag: "classes",
    code: `from enum import Enum

class Direction(Enum):
    NORTH = "N"
    SOUTH = "S"
    EAST  = "E"
    WEST  = "W"

    @classmethod
    def from_arrow(cls, arrow: str) -> "Direction":
        mapping = {"↑": cls.NORTH, "↓": cls.SOUTH, "→": cls.EAST, "←": cls.WEST}
        try:
            return mapping[arrow]
        except KeyError:
            raise ValueError(f"Unknown arrow: {arrow!r}")

    @classmethod
    def from_degrees(cls, degrees: int) -> "Direction":
        buckets = {(315, 45): cls.NORTH, (45, 135): cls.EAST,
                   (135, 225): cls.SOUTH, (225, 315): cls.WEST}
        degrees %= 360
        for (lo, hi), d in buckets.items():
            if lo <= degrees < hi: return d
        return cls.NORTH

print(Direction.from_arrow("↑"))      # Direction.NORTH
print(Direction.from_degrees(90))     # Direction.EAST`,
    explanation:
      "@classmethod on an Enum enables alternative constructors without polluting the value namespace; note that cls refers to the Enum class itself so you can access all members via cls.MEMBER.",
  },
  {
    id: "py-enum-unique",
    language: "python",
    title: "@enum.unique — raise on duplicate values",
    tag: "classes",
    code: `import enum

@enum.unique
class Status(enum.Enum):
    PENDING   = 1
    ACTIVE    = 2
    SUSPENDED = 3
    # ARCHIVED = 3   # would raise ValueError: duplicate values

# Without @unique, duplicate values create aliases:
class AliasEnum(enum.Enum):
    A = 1
    B = 2
    C = 2   # alias for B

print(AliasEnum.C is AliasEnum.B)   # True
print(list(AliasEnum))              # [<AliasEnum.A: 1>, <AliasEnum.B: 2>]  — C absent

try:
    @enum.unique
    class Bad(enum.Enum):
        X = 1
        Y = 1
except ValueError as e:
    print(e)   # duplicate values found in <enum 'Bad'>: Y -> X`,
    explanation:
      "By default enum treats duplicate values as aliases pointing to the first member; @enum.unique raises ValueError at class-definition time, catching copy-paste errors before they cause subtle bugs.",
  },
  {
    id: "py-protocol-class",
    language: "python",
    title: "typing.Protocol — structural typing interface",
    tag: "classes",
    code: `from typing import Protocol

class Serialisable(Protocol):
    def to_bytes(self) -> bytes: ...
    def from_bytes(self, data: bytes) -> None: ...

# Any class with these methods satisfies the Protocol — no subclassing needed
class JsonPayload:
    def to_bytes(self) -> bytes:
        import json
        return json.dumps(self.__dict__).encode()

    def from_bytes(self, data: bytes) -> None:
        import json
        self.__dict__.update(json.loads(data))

def store(obj: Serialisable) -> None:
    data = obj.to_bytes()
    print(f"storing {len(data)} bytes")

store(JsonPayload())   # type-checks without explicit inheritance`,
    explanation:
      "Protocol enables duck typing with static analysis support — a class satisfies the Protocol if it has the required methods, without any inheritance or registration; similar to Go interfaces.",
  },
  {
    id: "py-protocol-runtime-checkable",
    language: "python",
    title: "@runtime_checkable Protocol — isinstance at runtime",
    tag: "classes",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

class FileWrapper:
    def close(self) -> None:
        print("file closed")

class NetworkConn:
    def close(self) -> None:
        print("connection closed")

class Timer:
    def stop(self) -> None:   # different method name
        pass

resources = [FileWrapper(), NetworkConn(), Timer(), open("/dev/null")]

for r in resources:
    if isinstance(r, Closeable):
        r.close()   # only FileWrapper, NetworkConn, and the file match`,
    explanation:
      "@runtime_checkable lets isinstance check for protocol compliance at runtime by verifying method names; it does not verify signatures or return types, just name presence.",
  },
  {
    id: "py-runtime-checkable-demo",
    language: "python",
    title: "Limits of @runtime_checkable — names only, not signatures",
    tag: "classes",
    code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Adder(Protocol):
    def add(self, a: int, b: int) -> int: ...

class GoodAdder:
    def add(self, a: int, b: int) -> int:
        return a + b

class BadAdder:
    def add(self, x: str) -> str:   # wrong signature!
        return x + x

# isinstance checks only that 'add' exists, NOT its signature:
print(isinstance(GoodAdder(), Adder))   # True  — correct
print(isinstance(BadAdder(),  Adder))   # True  — ALSO True!

# Only mypy / pyright detect the signature mismatch at check time:
# def use(a: Adder): ...
# use(BadAdder())   # mypy error: argument has incompatible type`,
    explanation:
      "Runtime protocol checks are name-only; the type checker catches signature mismatches statically, but isinstance passes as long as the method name exists — do not use runtime_checkable as a security boundary.",
  },
  {
    id: "py-abc-abstractmethod",
    language: "python",
    title: "@abc.abstractmethod — force subclass implementation",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        """Return the area of the shape."""
        ...

    @abstractmethod
    def perimeter(self) -> float: ...

    def describe(self) -> str:   # concrete method
        return f"{type(self).__name__}: area={self.area():.2f}"

class Circle(Shape):
    def __init__(self, r: float): self.r = r
    def area(self)      -> float: return 3.14159 * self.r ** 2
    def perimeter(self) -> float: return 2 * 3.14159 * self.r

# Shape()     # TypeError: Can't instantiate abstract class Shape
c = Circle(5)
print(c.describe())  # Circle: area=78.54`,
    explanation:
      "Marking methods @abstractmethod prevents the abstract class from being instantiated; any subclass that does not implement all abstract methods is also abstract and cannot be instantiated.",
  },
  {
    id: "py-abc-classmethod-abstract",
    language: "python",
    title: "@classmethod + @abstractmethod — abstract class methods",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Codec(ABC):
    @classmethod
    @abstractmethod
    def extensions(cls) -> list[str]:
        """Return supported file extensions."""
        ...

    @classmethod
    @abstractmethod
    def decode(cls, data: bytes) -> dict:
        ...

    def encode(self, obj: dict) -> bytes:   # concrete
        raise NotImplementedError

class JsonCodec(Codec):
    @classmethod
    def extensions(cls) -> list[str]:
        return [".json"]

    @classmethod
    def decode(cls, data: bytes) -> dict:
        import json
        return json.loads(data)

print(JsonCodec.extensions())            # ['.json']
print(JsonCodec.decode(b'{"a": 1}'))    # {'a': 1}`,
    explanation:
      "@classmethod must come before @abstractmethod (order matters in Python 3.3+); the subclass overrides the classmethod normally — cls refers to the concrete subclass when called on it.",
  },
];

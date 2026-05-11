import type { Snippet } from "./types";

export const pythonSnippets20260511B3: Snippet[] = [
  // ── snippet ──────────────────────────────────────────────────────────────
  {
    id: "py-pathlib-stem-suffix",
    language: "python",
    title: "Path.stem, Path.suffix, Path.suffixes",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/home/user/archive.tar.gz")
print(p.name)       # archive.tar.gz
print(p.stem)       # archive.tar   (name without last suffix)
print(p.suffix)     # .gz           (last suffix)
print(p.suffixes)   # ['.tar', '.gz']

q = Path("notes.txt")
print(q.stem)       # notes
print(q.suffix)     # .txt
print(q.with_suffix(".md"))  # notes.md`,
    explanation:
      "stem strips only the final suffix, so 'archive.tar.gz' becomes 'archive.tar'; suffixes returns all extensions as a list, which is useful for double-extension files like tarballs.",
  },
  {
    id: "py-pathlib-parent-chain",
    language: "python",
    title: "Path.parent / Path.parents[n] — navigating up",
    tag: "snippet",
    code: `from pathlib import Path

p = Path("/home/user/projects/myapp/src/main.py")

print(p.parent)        # /home/user/projects/myapp/src
print(p.parent.parent) # /home/user/projects/myapp

# parents is a sequence of all ancestor paths:
print(p.parents[0])    # /home/user/projects/myapp/src
print(p.parents[2])    # /home/user/projects
print(list(p.parents)) # all the way to /`,
    explanation:
      "parent is a shorthand for parents[0]; the parents sequence is lazily generated and supports indexing, so you can jump multiple levels without chaining .parent calls.",
  },
  {
    id: "py-os-path-join",
    language: "python",
    title: "os.path.join() vs pathlib / operator",
    tag: "snippet",
    code: `import os
from pathlib import Path

# os.path.join — classic, returns string
joined = os.path.join("/home/user", "projects", "app.py")
print(joined)  # /home/user/projects/app.py

# pathlib / operator — modern, returns Path
base = Path("/home/user")
p = base / "projects" / "app.py"
print(p)           # /home/user/projects/app.py
print(type(p))     # <class 'pathlib.PosixPath'>

# Absolute path on right side resets the chain:
print(Path("/a") / "/b")  # /b`,
    explanation:
      "The / operator is syntactic sugar for Path.joinpath() and returns a Path object, enabling further method calls; note that an absolute path on the right side discards the left side, mirroring os.path.join behaviour.",
  },
  {
    id: "py-shutil-copy",
    language: "python",
    title: "shutil.copy() vs shutil.copy2() — metadata preservation",
    tag: "snippet",
    code: `import shutil

# copy — copies content and permission bits only
shutil.copy("source.txt", "dest.txt")

# copy2 — also copies metadata (timestamps, extended attrs)
shutil.copy2("source.txt", "dest_with_meta.txt")

# copyfile — only content, no permissions
shutil.copyfile("source.txt", "content_only.txt")

# copy into a directory:
shutil.copy2("source.txt", "/tmp/")  # /tmp/source.txt`,
    explanation:
      "Use copy2 when you want to preserve the original modification time (e.g., backup tools); copy is sufficient for most uses; copyfile is the fastest when you only need the bytes.",
  },
  {
    id: "py-shutil-move",
    language: "python",
    title: "shutil.move() — rename or cross-device move",
    tag: "snippet",
    code: `import shutil, os

# Rename within the same filesystem (uses os.rename)
shutil.move("old_name.txt", "new_name.txt")

# Move to another directory
shutil.move("report.pdf", "/tmp/reports/")

# Cross-device: shutil.move falls back to copy + delete
shutil.move("/local/big_file.bin", "/mnt/nas/big_file.bin")

# Move a whole directory tree
shutil.move("mydir/", "/backup/mydir/")`,
    explanation:
      "shutil.move tries os.rename first (atomic on POSIX when on the same filesystem); when that fails (cross-device or different filesystems) it copies then deletes, which is not atomic.",
  },
  {
    id: "py-tempfile-named",
    language: "python",
    title: "tempfile.NamedTemporaryFile — file with a visible path",
    tag: "snippet",
    code: `import tempfile, os

# delete=True (default): file is removed when closed
with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
    f.write('{"key": "value"}')
    tmp_path = f.name  # e.g. /tmp/tmpXXXXXX.json

print("Created:", tmp_path)
os.unlink(tmp_path)  # manually remove since delete=False

# delete=True — auto-removed on context exit:
with tempfile.NamedTemporaryFile(suffix=".txt") as f:
    f.write(b"temporary bytes")
    print(f.name)`,
    explanation:
      "NamedTemporaryFile gives a file path (unlike SpooledTemporaryFile), which is useful when a subprocess or library needs to open it by name; on Windows you often need delete=False to re-open it.",
  },
  {
    id: "py-tempfile-dir",
    language: "python",
    title: "tempfile.TemporaryDirectory — temp folder",
    tag: "snippet",
    code: `import tempfile, pathlib

# Auto-deleted when the context exits
with tempfile.TemporaryDirectory(prefix="build_") as tmpdir:
    p = pathlib.Path(tmpdir)
    (p / "output.txt").write_text("hello")
    files = list(p.iterdir())
    print(files)  # [PosixPath('.../output.txt')]

# tmpdir is now deleted — accessing files would fail

# Explicit cleanup (when not using as context manager):
d = tempfile.TemporaryDirectory()
print(d.name)
d.cleanup()`,
    explanation:
      "TemporaryDirectory creates a directory and removes it plus all its contents on cleanup; the context manager form is safest because cleanup runs even if an exception is raised.",
  },
  {
    id: "py-glob-pattern",
    language: "python",
    title: "glob.glob() and pathlib.Path.glob()",
    tag: "snippet",
    code: `import glob
from pathlib import Path

# glob module — returns list of strings
py_files = glob.glob("src/**/*.py", recursive=True)
print(py_files[:3])

# pathlib — returns generator of Path objects (preferred)
for f in Path("src").rglob("*.py"):
    print(f.relative_to("src"))

# Single-level match
for f in Path(".").glob("*.json"):
    print(f)`,
    explanation:
      "glob.glob with recursive=True and ** finds files at any depth; pathlib's rglob is the cleaner modern equivalent, returning Path objects you can immediately call methods on.",
  },
  {
    id: "py-fnmatch",
    language: "python",
    title: "fnmatch.fnmatch() — shell-style pattern matching",
    tag: "snippet",
    code: `import fnmatch

# Case-sensitive on Unix, case-insensitive on Windows
print(fnmatch.fnmatch("report_2026.csv", "report_*.csv"))  # True
print(fnmatch.fnmatch("image.PNG", "*.png"))               # False (Unix)

# fnmatchcase — always case-sensitive
print(fnmatch.fnmatchcase("image.PNG", "*.png"))           # False

# Filter a list
files = ["data.csv", "notes.txt", "backup.csv", "log.log"]
csvs = fnmatch.filter(files, "*.csv")
print(csvs)  # ['data.csv', 'backup.csv']`,
    explanation:
      "fnmatch uses *, ?, and [seq] shell wildcards without the power of full regular expressions; it is useful for filtering file lists and is what glob uses under the hood.",
  },
  {
    id: "py-os-environ-get",
    language: "python",
    title: "os.environ.get() — safely reading environment variables",
    tag: "snippet",
    code: `import os

# KeyError if missing:
# db = os.environ["DATABASE_URL"]

# Safe with default:
db = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
debug = os.environ.get("DEBUG", "false").lower() == "true"
port = int(os.environ.get("PORT", "8080"))

print(db, debug, port)

# Set for child processes:
os.environ["MY_VAR"] = "hello"

# Check existence:
if "SECRET_KEY" not in os.environ:
    raise RuntimeError("SECRET_KEY must be set")`,
    explanation:
      "os.environ.get returns None (or a given default) instead of raising KeyError, making it safe for optional config values; always cast to the desired type since all values are strings.",
  },
  {
    id: "py-os-getcwd-chdir",
    language: "python",
    title: "os.getcwd() and os.chdir() — directory navigation",
    tag: "snippet",
    code: `import os

original = os.getcwd()
print(original)  # /home/user/projects

os.chdir("/tmp")
print(os.getcwd())  # /tmp

# Always restore on exit — use try/finally or a context manager:
import contextlib

@contextlib.contextmanager
def cd(path):
    old = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old)

with cd("/tmp"):
    print(os.getcwd())  # /tmp
print(os.getcwd())  # restored`,
    explanation:
      "os.chdir changes the process-wide working directory, affecting all threads; wrap it in a context manager to guarantee restoration even if an exception occurs.",
  },
  {
    id: "py-subprocess-run",
    language: "python",
    title: "subprocess.run() — capturing stdout/stderr",
    tag: "snippet",
    code: `import subprocess

# Capture both streams, text mode, raise on non-zero exit
result = subprocess.run(
    ["git", "log", "--oneline", "-5"],
    capture_output=True,
    text=True,
    check=True,           # raises CalledProcessError on failure
)
print(result.stdout)
print(result.returncode)  # 0

# Allow failure, inspect manually:
r = subprocess.run(["false"], capture_output=True)
print(r.returncode)  # 1`,
    explanation:
      "capture_output=True is shorthand for stdout=PIPE, stderr=PIPE; check=True raises CalledProcessError if the exit code is non-zero; always use a list (not a string) to avoid shell injection.",
  },
  {
    id: "py-subprocess-popen",
    language: "python",
    title: "subprocess.Popen — streaming output",
    tag: "snippet",
    code: `import subprocess

# Stream stdout line by line without buffering all output in memory
with subprocess.Popen(
    ["ping", "-c", "4", "localhost"],
    stdout=subprocess.PIPE,
    text=True
) as proc:
    for line in proc.stdout:  # type: ignore[union-attr]
        print(line, end="")
    proc.wait()
    print("exit code:", proc.returncode)`,
    explanation:
      "Popen doesn't block while the subprocess runs; iterating proc.stdout yields lines as they arrive, which is ideal for long-running commands where you want real-time output.",
  },
  {
    id: "py-sys-exit-code",
    language: "python",
    title: "sys.exit() — clean exit with status code",
    tag: "snippet",
    code: `import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: script.py <arg>", file=sys.stderr)
        sys.exit(1)   # non-zero = error

    arg = sys.argv[1]
    if arg == "bad":
        sys.exit("Error: bad argument")  # string prints to stderr

    print(f"Processing {arg}")
    sys.exit(0)   # 0 = success (also the default)

if __name__ == "__main__":
    main()`,
    explanation:
      "sys.exit raises SystemExit, which can be caught; exit code 0 means success, anything else means failure; passing a string sets the exit code to 1 and prints the message to stderr.",
  },

  // ── understanding ─────────────────────────────────────────────────────────
  {
    id: "py-import-system",
    language: "python",
    title: "Python import system: finder → loader → module object",
    tag: "understanding",
    code: `import sys

# The import system has three phases:
# 1. Finder: sys.meta_path finders look for the module spec
# 2. Loader: the spec's loader executes the module code
# 3. sys.modules: the resulting module object is cached

import json  # already cached
print(sys.modules["json"])         # <module 'json' ...>

# Inspect meta path finders:
for finder in sys.meta_path:
    print(type(finder).__name__)
# BuiltinImporter, FrozenImporter, PathFinder`,
    explanation:
      "Every import goes through the meta path finders in order; the first one that returns a non-None spec wins, allowing you to insert custom finders at the front of sys.meta_path.",
  },
  {
    id: "py-relative-import",
    language: "python",
    title: "Relative imports with . and .. inside packages",
    tag: "understanding",
    code: `# Inside package 'myapp/utils/helpers.py':
from . import validators          # same package (myapp/utils/)
from .validators import is_email  # specific name from sibling
from .. import models             # parent package (myapp/)
from ..models import User         # specific name from parent

# Relative imports only work inside a package (not in __main__):
# Running 'python helpers.py' directly → ImportError
# Run via 'python -m myapp.utils.helpers' instead`,
    explanation:
      "A single dot refers to the current package, two dots to the parent; relative imports make packages relocatable because they don't depend on knowing the absolute package name.",
  },
  {
    id: "py-circular-import",
    language: "python",
    title: "Circular imports cause AttributeError if order matters",
    tag: "understanding",
    code: `# a.py
# import b          # b.py will try to import a.py while a.py is loading
# from b import foo # AttributeError if 'foo' hasn't been defined yet

# Safe fix 1: import inside the function (deferred)
def use_b():
    from b import foo  # imported only when function is called
    return foo()

# Safe fix 2: restructure to extract shared code to a third module
# Safe fix 3: import the module, not the name
import b            # use b.foo later — b may not be fully loaded yet`,
    explanation:
      "Python starts executing a module before it is fully loaded; if A imports B and B imports A, the partial module object is returned, so any name not yet defined in A is missing — reorganise or defer imports to break the cycle.",
  },
  {
    id: "py-import-cache",
    language: "python",
    title: "sys.modules caches imports — second import is free",
    tag: "understanding",
    code: `import sys, time

# First import: module code executes
import json
print("json" in sys.modules)  # True

# Second import: returns cached object immediately
import json  # no re-execution, no disk I/O

# Remove from cache to force re-import:
del sys.modules["json"]
import json  # executes again

# Count how many modules are loaded:
print(len(sys.modules))  # hundreds`,
    explanation:
      "sys.modules is a plain dict; every successful import stores the module object there and subsequent imports skip all finder/loader logic, making repeated imports essentially free.",
  },
  {
    id: "py-module-all",
    language: "python",
    title: "__all__ controls what 'from module import *' exports",
    tag: "understanding",
    code: `# mymodule.py
__all__ = ["public_func", "PublicClass"]

def public_func(): pass
def _private_func(): pass   # underscore convention
def helper(): pass           # not in __all__ — excluded from *

class PublicClass: pass
class _Internal: pass

# In another file:
from mymodule import *
# Only 'public_func' and 'PublicClass' are imported
# helper, _private_func, _Internal are excluded`,
    explanation:
      "__all__ is the authoritative list of names exported by 'import *'; without it, all names not starting with underscore are exported — defining __all__ is considered good practice for library modules.",
  },
  {
    id: "py-package-init",
    language: "python",
    title: "__init__.py runs when a package is imported",
    tag: "understanding",
    code: `# Package structure:
# myapp/
#   __init__.py   ← runs on 'import myapp'
#   models.py
#   utils.py

# myapp/__init__.py:
from .models import User, Product   # re-export for convenience
from .utils import helper

__version__ = "1.0.0"

# Consumer:
import myapp
print(myapp.__version__)      # 1.0.0
from myapp import User        # works because of re-export in __init__`,
    explanation:
      "__init__.py makes a directory a package and runs exactly once when the package is first imported; it is commonly used to re-export names so consumers can use shorter import paths.",
  },
  {
    id: "py-lazy-module",
    language: "python",
    title: "Lazy import pattern using importlib.import_module",
    tag: "understanding",
    code: `# Avoid importing heavy optional dependency at module load time
_numpy = None

def get_numpy():
    global _numpy
    if _numpy is None:
        import importlib
        _numpy = importlib.import_module("numpy")
    return _numpy

def compute(data):
    np = get_numpy()          # imported only on first call
    return np.array(data).mean()`,
    explanation:
      "Lazy imports speed up module startup by deferring heavy imports until the feature is actually used; importlib.import_module is preferable to exec-based tricks and works well with type checkers when combined with TYPE_CHECKING guards.",
  },
  {
    id: "py-importlib-util",
    language: "python",
    title: "importlib.util.find_spec() — check if a module is available",
    tag: "understanding",
    code: `import importlib.util

def is_available(module_name: str) -> bool:
    return importlib.util.find_spec(module_name) is not None

print(is_available("json"))     # True  (stdlib)
print(is_available("numpy"))    # True/False depending on install
print(is_available("fakepkg"))  # False

# Load a module from an arbitrary file path:
spec = importlib.util.spec_from_file_location("mymod", "/tmp/mymod.py")
mod = importlib.util.module_from_spec(spec)   # type: ignore[arg-type]
spec.loader.exec_module(mod)                  # type: ignore[union-attr]`,
    explanation:
      "find_spec searches sys.meta_path finders without importing; it returns None if the module cannot be found, making it safe for optional-dependency feature flags without try/except ImportError.",
  },
  {
    id: "py-sys-modules",
    language: "python",
    title: "Adding to sys.modules makes a module importable by name",
    tag: "understanding",
    code: `import sys, types

# Create a module object programmatically
fake = types.ModuleType("fake_db")
fake.connect = lambda url: print(f"Connected to {url}")
fake.__version__ = "0.1"

# Register it — now 'import fake_db' works anywhere
sys.modules["fake_db"] = fake

import fake_db
fake_db.connect("sqlite:///test.db")  # Connected to sqlite:///test.db
print(fake_db.__version__)             # 0.1`,
    explanation:
      "Any object in sys.modules can be retrieved by import; this pattern is used in test mocks, plugin systems, and compatibility shims that want to intercept or fabricate module objects.",
  },
  {
    id: "py-name-main",
    language: "python",
    title: "if __name__ == '__main__' guard for runnable modules",
    tag: "understanding",
    code: `# mymodule.py

def greet(name: str) -> str:
    return f"Hello, {name}!"

def main():
    import sys
    name = sys.argv[1] if len(sys.argv) > 1 else "World"
    print(greet(name))

if __name__ == "__main__":
    main()

# python mymodule.py Alice  → Hello, Alice!
# import mymodule           → main() does NOT run
# python -m mymodule Alice  → Hello, Alice!`,
    explanation:
      "__name__ is '__main__' only when the file is run directly; when imported as a module it equals the module name, so the guard prevents side-effectful startup code from running on import.",
  },
  {
    id: "py-reload-module",
    language: "python",
    title: "importlib.reload() re-executes the module",
    tag: "understanding",
    code: `import importlib
import myconfig   # assume this reads a config file

# After the config file changes on disk:
importlib.reload(myconfig)   # re-reads the file, updates module globals

# Caveats:
# 1. Existing references to old objects are NOT updated
old_ref = myconfig.SETTING   # still points to old value if reassigned
importlib.reload(myconfig)
print(myconfig.SETTING)      # new value
print(old_ref)               # still old value!

# 2. Classes from old module ≠ classes from reloaded module (isinstance breaks)`,
    explanation:
      "reload re-executes the module file and updates the module's namespace in place, but existing references to objects from the old module are not automatically updated — useful in REPL development, dangerous in production.",
  },
  {
    id: "py-finder-loader",
    language: "python",
    title: "Custom MetaPathFinder and Loader to import from unusual sources",
    tag: "understanding",
    code: `import sys, types
from importlib.abc import MetaPathFinder, Loader
from importlib.machinery import ModuleSpec

class DictFinder(MetaPathFinder):
    def __init__(self, modules: dict):
        self._modules = modules

    def find_spec(self, fullname, path, target=None):
        if fullname in self._modules:
            return ModuleSpec(fullname, DictLoader(self._modules[fullname]))
        return None

class DictLoader(Loader):
    def __init__(self, source): self._source = source
    def exec_module(self, module): exec(self._source, module.__dict__)

sys.meta_path.insert(0, DictFinder({"greeting": "MSG = 'hello'"}))
import greeting
print(greeting.MSG)  # hello`,
    explanation:
      "A MetaPathFinder intercepts import statements by returning a ModuleSpec; paired with a Loader that calls exec_module, it can serve module source from any backing store — databases, network, or in-memory dicts.",
  },
  {
    id: "py-namespace-pkg",
    language: "python",
    title: "Namespace package (no __init__.py) spans multiple directories",
    tag: "understanding",
    code: `# Without __init__.py, Python 3 creates a namespace package
# that can span multiple directories on sys.path.

# /path/a/mypkg/module_a.py
# /path/b/mypkg/module_b.py

# sys.path = ['/path/a', '/path/b']
# import mypkg.module_a  → found in /path/a
# import mypkg.module_b  → found in /path/b

import mypkg        # namespace package — no __file__
print(mypkg.__path__)  # ['/path/a/mypkg', '/path/b/mypkg']`,
    explanation:
      "Namespace packages allow a logical package to be split across multiple directories or distributions, which is useful for large projects split into separately installed sub-packages (e.g., Google Cloud client libraries).",
  },
  {
    id: "py-frozen-module",
    language: "python",
    title: "Frozen modules (built into the interpreter) are fastest to import",
    tag: "understanding",
    code: `import sys, importlib.util

# Check if a module is frozen (compiled into the interpreter binary)
for name in ["_frozen_importlib", "_frozen_importlib_external", "zipimport"]:
    spec = importlib.util.find_spec(name)
    print(name, "→", type(spec.loader).__name__ if spec else "not found")

# Output (CPython 3.11+):
# _frozen_importlib → FrozenImporter
# _frozen_importlib_external → FrozenImporter

# Frozen modules skip disk I/O entirely — fastest possible import`,
    explanation:
      "Frozen modules are compiled bytecode embedded directly in the CPython binary; they are used for the import system's bootstrap modules so that the importer itself can be imported without needing the importer.",
  },

  // ── structures ────────────────────────────────────────────────────────────
  {
    id: "py-collections-counter-ops",
    language: "python",
    title: "Counter arithmetic: +, -, |, & on two Counters",
    tag: "structures",
    code: `from collections import Counter

a = Counter({"x": 4, "y": 2, "z": 1})
b = Counter({"x": 1, "y": 3, "w": 5})

print(a + b)  # Counter({'w': 5, 'x': 5, 'y': 5, 'z': 1})
print(a - b)  # Counter({'x': 3, 'z': 1})  (negative dropped)
print(a | b)  # Counter({'w': 5, 'x': 4, 'y': 3, 'z': 1})  max per key
print(a & b)  # Counter({'y': 2, 'x': 1})  min per key`,
    explanation:
      "Counter arithmetic respects the bag (multiset) semantics: + merges, - subtracts (dropping non-positive), | takes element-wise maximum, & takes element-wise minimum.",
  },
  {
    id: "py-lru-cache-stats",
    language: "python",
    title: "lru_cache.cache_info() — hits, misses, size",
    tag: "structures",
    code: `from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2: return n
    return fibonacci(n - 1) + fibonacci(n - 2)

fibonacci(30)
info = fibonacci.cache_info()
print(info.hits)     # 27
print(info.misses)   # 31
print(info.maxsize)  # 128
print(info.currsize) # 31  (distinct n values computed)`,
    explanation:
      "cache_info() returns a named tuple with hit/miss counters and capacity metadata; a high miss rate suggests the cache is too small or the arguments have too much variety.",
  },
  {
    id: "py-functools-cache-clear",
    language: "python",
    title: "lru_cache.cache_clear() — evict all entries",
    tag: "structures",
    code: `from functools import lru_cache

@lru_cache(maxsize=256)
def fetch_user(user_id: int) -> dict:
    print(f"Fetching {user_id} from DB")
    return {"id": user_id, "name": "Alice"}

fetch_user(1)   # Fetching 1 from DB
fetch_user(1)   # (cached — no print)

# Invalidate all cached results:
fetch_user.cache_clear()
fetch_user(1)   # Fetching 1 from DB — cache miss`,
    explanation:
      "cache_clear() removes all cached entries atomically; it is needed when the underlying data changes and you want the cache to reflect fresh results — there is no per-key eviction in lru_cache.",
  },
  {
    id: "py-cache-size-none",
    language: "python",
    title: "@cache (maxsize=None) — unbounded memo table",
    tag: "structures",
    code: `from functools import cache

@cache
def count_ways(n: int, step: int) -> int:
    """Stair-climbing: how many ways to climb n stairs taking 1 or 'step' steps."""
    if n <= 0: return 1
    return count_ways(n - 1, step) + count_ways(n - step, step)

print(count_ways(20, 2))  # 10946
print(count_ways.cache_info())
# CacheInfo(hits=..., misses=..., maxsize=None, currsize=...)`,
    explanation:
      "@cache is a Python 3.9+ alias for @lru_cache(maxsize=None) — it uses a plain dict with no eviction overhead, making it slightly faster than the bounded version but unbounded in memory use.",
  },
  {
    id: "py-ttl-cache-concept",
    language: "python",
    title: "TTL cache concept with cachetools.TTLCache",
    tag: "structures",
    code: `from cachetools import TTLCache, cached

# Cache up to 100 entries, each expiring after 60 seconds
ttl_cache: TTLCache = TTLCache(maxsize=100, ttl=60)

@cached(cache=ttl_cache)
def get_stock_price(symbol: str) -> float:
    print(f"Fetching price for {symbol}")
    return 42.0  # simulated API call

print(get_stock_price("AAPL"))  # Fetching price for AAPL; 42.0
print(get_stock_price("AAPL"))  # cached; 42.0  (within 60 s)`,
    explanation:
      "TTLCache (from the third-party cachetools library) evicts entries after a configurable time-to-live; it combines LRU eviction with time-based expiry, ideal for API responses and session data.",
  },
  {
    id: "py-bloom-filter-concept",
    language: "python",
    title: "Bloom filter — membership test with false positives, no false negatives",
    tag: "structures",
    code: `# Minimal Bloom filter using multiple hash functions
import hashlib

class BloomFilter:
    def __init__(self, size=1000, hashes=7):
        self._bits = bytearray(size)
        self._size = size
        self._hashes = hashes

    def _positions(self, item: str):
        for i in range(self._hashes):
            h = int(hashlib.md5(f"{i}:{item}".encode()).hexdigest(), 16)
            yield h % self._size

    def add(self, item: str):
        for pos in self._positions(item):
            self._bits[pos] = 1

    def __contains__(self, item: str) -> bool:
        return all(self._bits[pos] for pos in self._positions(item))

bf = BloomFilter()
bf.add("alice@example.com")
print("alice@example.com" in bf)  # True
print("bob@example.com" in bf)    # False (probably)`,
    explanation:
      "A Bloom filter sets multiple bits per element; a query returns True only if all bits are set, giving guaranteed no false negatives (misses) but some false positives — trade space for probabilistic membership.",
  },
  {
    id: "py-inverted-index",
    language: "python",
    title: "Building an inverted index with defaultdict",
    tag: "structures",
    code: `from collections import defaultdict

documents = {
    1: "the quick brown fox",
    2: "the fox jumped over",
    3: "quick brown dog runs",
}

index: dict[str, set[int]] = defaultdict(set)
for doc_id, text in documents.items():
    for word in text.split():
        index[word].add(doc_id)

# Search: documents containing both 'fox' and 'quick'
result = index["fox"] & index["quick"]
print(result)  # {1}  (doc 2 has fox, doc 1 has both)`,
    explanation:
      "An inverted index maps each word to the set of documents containing it; defaultdict(set) eliminates the boilerplate of checking key existence before adding to the set.",
  },
  {
    id: "py-sliding-window-deque",
    language: "python",
    title: "Sliding window maximum with a monotonic deque",
    tag: "structures",
    code: `from collections import deque

def sliding_max(nums: list, k: int) -> list:
    dq: deque = deque()  # stores indices, front = max
    result = []
    for i, n in enumerate(nums):
        # Remove indices outside window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # Remove indices with smaller values
        while dq and nums[dq[-1]] < n:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result

print(sliding_max([1,3,-1,-3,5,3,6,7], 3))  # [3, 3, 5, 5, 6, 7]`,
    explanation:
      "The deque maintains indices in decreasing order of their values (monotonic decreasing); expired indices are removed from the front and smaller values are removed from the back, giving O(n) overall.",
  },
  {
    id: "py-circular-buffer-deque",
    language: "python",
    title: "Fixed-size circular buffer using deque(maxlen=N)",
    tag: "structures",
    code: `from collections import deque

# Ring buffer — automatically discards oldest on overflow
log: deque = deque(maxlen=5)

for i in range(10):
    log.append(i)

print(list(log))   # [5, 6, 7, 8, 9]  (first 5 discarded)
print(log[0])      # 5  (oldest)
print(log[-1])     # 9  (newest)`,
    explanation:
      "Setting maxlen creates a bounded deque that silently drops the oldest element from the opposite end when a new item is appended, providing O(1) append and automatic size management.",
  },
  {
    id: "py-multidict-defaultdict",
    language: "python",
    title: "Multi-value dict: defaultdict(list) + all values",
    tag: "structures",
    code: `from collections import defaultdict

multi: dict[str, list[str]] = defaultdict(list)
multi["colors"].append("red")
multi["colors"].append("blue")
multi["sizes"].append("S")
multi["sizes"].append("M")

print(dict(multi))
# {'colors': ['red', 'blue'], 'sizes': ['S', 'M']}

# Get all values for a key safely:
print(multi.get("missing", []))  # []

# Build from pairs:
pairs = [("a", 1), ("b", 2), ("a", 3), ("b", 4)]
d: dict[str, list[int]] = defaultdict(list)
for k, v in pairs:
    d[k].append(v)
print(dict(d))  # {'a': [1, 3], 'b': [2, 4]}`,
    explanation:
      "defaultdict(list) is the idiomatic Python multi-value dictionary; it eliminates the if-key-in-dict pattern by auto-creating an empty list for missing keys on first access.",
  },
  {
    id: "py-nested-dict-access",
    language: "python",
    title: "Safe nested dict access with .get() chaining",
    tag: "structures",
    code: `data = {"user": {"profile": {"name": "Alice", "age": 30}}}

# Unsafe — KeyError if any level missing:
# name = data["user"]["profile"]["name"]

# Safe with .get() chaining:
name = (data.get("user") or {}).get("profile", {}).get("name")
print(name)   # Alice

missing = (data.get("x") or {}).get("y", {}).get("z")
print(missing)  # None — no exception`,
    explanation:
      "Chaining .get() calls returns None at the first missing key without raising; the 'or {}' guard handles the case where an intermediate value is explicitly None rather than missing.",
  },
  {
    id: "py-recursive-defaultdict",
    language: "python",
    title: "Recursive defaultdict for deeply nested structures",
    tag: "structures",
    code: `from collections import defaultdict

def tree():
    return defaultdict(tree)

config = tree()
config["database"]["host"] = "localhost"
config["database"]["port"] = 5432
config["cache"]["redis"]["host"] = "redis"

print(config["database"]["host"])  # localhost
print(config["cache"]["redis"]["host"])  # redis
print(config["missing"]["key"])    # defaultdict — no KeyError`,
    explanation:
      "A recursive defaultdict factory lets you build arbitrarily deep nested structures without pre-declaring keys; it is useful for aggregating hierarchical data but can hide typos since missing paths auto-create.",
  },
  {
    id: "py-object-registry",
    language: "python",
    title: "Class registry pattern with a module-level dict",
    tag: "structures",
    code: `_REGISTRY: dict[str, type] = {}

def register(name: str):
    def decorator(cls):
        _REGISTRY[name] = cls
        return cls
    return decorator

@register("json")
class JsonProcessor:
    def process(self, data): return str(data)

@register("csv")
class CsvProcessor:
    def process(self, data): return ",".join(str(x) for x in data)

def get_processor(name: str):
    cls = _REGISTRY.get(name)
    if cls is None:
        raise KeyError(f"No processor: {name}")
    return cls()

print(get_processor("json").process({"a": 1}))`,
    explanation:
      "The registry pattern decouples the factory from concrete types; new processors are self-registering via the decorator, so the factory never needs to be modified when a new type is added.",
  },
  {
    id: "py-weak-value-dict",
    language: "python",
    title: "weakref.WeakValueDictionary — caching without preventing GC",
    tag: "structures",
    code: `import weakref

cache: weakref.WeakValueDictionary = weakref.WeakValueDictionary()

class Resource:
    def __init__(self, name): self.name = name

# Cache the resource
r = Resource("db_conn")
cache["db"] = r

print(cache.get("db"))  # <Resource db_conn>

del r          # last strong reference dropped
import gc; gc.collect()
print(cache.get("db"))  # None — GC collected it`,
    explanation:
      "WeakValueDictionary stores weak references to values; when the last strong reference to a value is dropped the GC can collect it and the entry is automatically removed, preventing the cache from keeping objects alive.",
  },

  // ── caveats ───────────────────────────────────────────────────────────────
  {
    id: "py-class-method-bound",
    language: "python",
    title: "Bound method carries a reference to the instance",
    tag: "caveats",
    code: `class Counter:
    def __init__(self): self.count = 0
    def increment(self): self.count += 1

c = Counter()
m = c.increment   # bound method — holds strong ref to 'c'

import sys
print(sys.getrefcount(c))  # 3 (c, m.__self__, getrefcount arg)

m()
print(c.count)     # 1

# The bound method keeps 'c' alive even after del c:
del c
m()               # still works — m.__self__ holds the instance
print(m.__self__.count)  # 2`,
    explanation:
      "A bound method is an object with __self__ pointing to the instance and __func__ pointing to the function; storing a bound method in an event handler or callback prevents the instance from being garbage-collected.",
  },
  {
    id: "py-unbound-method-call",
    language: "python",
    title: "Calling an unbound method requires passing self explicitly",
    tag: "caveats",
    code: `class Greeter:
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"

g = Greeter()

# Bound method — instance is implicit
print(g.greet("Alice"))               # Hello, Alice!

# Unbound method (accessing via class) — must pass self
unbound = Greeter.greet
print(unbound(g, "Bob"))              # Hello, Bob!

# Useful for applying a method from a parent class:
class LoudGreeter(Greeter):
    def greet(self, name):
        return Greeter.greet(self, name).upper()  # explicit self`,
    explanation:
      "In Python 3 there are no unbound method objects — Greeter.greet is just a plain function; calling it requires passing the instance as the first argument explicitly.",
  },
  {
    id: "py-descriptor-inheritance",
    language: "python",
    title: "Descriptor lookup in the class hierarchy",
    tag: "caveats",
    code: `class Desc:
    def __get__(self, obj, objtype=None):
        return "descriptor value"

class Base:
    attr = Desc()

class Child(Base):
    pass  # inherits the descriptor

b = Base()
c = Child()
print(b.attr)    # descriptor value
print(c.attr)    # descriptor value  — inherited lookup works

# Shadowing with an instance variable:
b.__dict__["attr"] = "instance wins"
print(b.attr)    # "instance wins" if Desc is non-data (no __set__)`,
    explanation:
      "Descriptors are looked up on the type, following the MRO; data descriptors (defining __set__) take priority over instance __dict__, while non-data descriptors can be shadowed by instance attributes.",
  },
  {
    id: "py-property-classattr",
    language: "python",
    title: "Accessing a property on the class returns the property object",
    tag: "caveats",
    code: `class Circle:
    def __init__(self, radius): self._r = radius

    @property
    def area(self): return 3.14159 * self._r ** 2

c = Circle(5)
print(c.area)         # 78.53975  (descriptor __get__ with instance)

# Accessing on the CLASS — returns the property descriptor itself:
print(Circle.area)    # <property object at 0x...>
print(type(Circle.area))  # <class 'property'>

# Useful to access the getter function:
print(Circle.area.fget)   # <function Circle.area at 0x...>`,
    explanation:
      "When __get__ is called on the class (obj is None), property returns itself rather than calling the getter; this allows introspection of the property object and is how class-level documentation tools work.",
  },
  {
    id: "py-super-proxy-obj",
    language: "python",
    title: "super() returns a proxy object, not the parent class",
    tag: "caveats",
    code: `class Animal:
    def speak(self): return "..."

class Dog(Animal):
    def speak(self): return "Woof"
    def demo(self):
        s = super()           # proxy, not Animal
        print(type(s))        # <class 'super'>
        print(s.speak())      # "..." — delegates to Animal.speak(self)

        # super() with arguments (explicit form):
        s2 = super(Dog, self)
        print(s2.speak())     # "..."

Dog().demo()`,
    explanation:
      "super() creates a proxy that searches the MRO starting *after* the specified class, not a reference to the parent class; calling a method through super() passes self, enabling cooperative multiple inheritance.",
  },
  {
    id: "py-multiple-return-values",
    language: "python",
    title: "Python 'multiple return' is just tuple packing",
    tag: "caveats",
    code: `def minmax(data):
    return min(data), max(data)   # returns a tuple

result = minmax([3, 1, 4, 1, 5])
print(type(result))    # <class 'tuple'>
print(result)          # (1, 5)

# Unpacking is syntactic convenience:
lo, hi = minmax([3, 1, 4, 1, 5])
print(lo, hi)          # 1 5

# Explicit parentheses — same thing:
return_val = (lo, hi)  # still a tuple`,
    explanation:
      "Python has no true multiple return values; the comma operator packs a tuple and unpacking assignment destructures it — understanding this prevents surprises when the caller doesn't unpack.",
  },
  {
    id: "py-function-annotation-runtime",
    language: "python",
    title: "Function annotations are stored in __annotations__ at runtime",
    tag: "caveats",
    code: `def greet(name: str, *, loud: bool = False) -> str:
    return name.upper() if loud else name

print(greet.__annotations__)
# {'name': <class 'str'>, 'loud': <class 'bool'>, 'return': <class 'str'>}

# With 'from __future__ import annotations' they become strings:
# {'name': 'str', 'loud': 'bool', 'return': 'str'}

# Type checkers read annotations; at runtime they are just a dict:
greet.__annotations__["name"] = int  # you can mutate it (don't!)`,
    explanation:
      "__annotations__ is a regular dict on the function object; type checkers read it statically, but Python itself does not enforce it at runtime unless you use a runtime type-checking library.",
  },
  {
    id: "py-exec-scope",
    language: "python",
    title: "exec() in a function doesn't affect local scope in Python 3",
    tag: "caveats",
    code: `def demo():
    exec("x = 42")
    try:
        print(x)   # NameError — exec does NOT create locals
    except NameError as e:
        print(e)   # name 'x' is not defined

# exec can write to an explicit dict:
ns = {}
exec("y = 99", ns)
print(ns["y"])  # 99

# In Python 2, exec was a statement and DID affect locals.`,
    explanation:
      "In Python 3, exec() runs in its own temporary namespace and cannot inject names into the surrounding function's local scope because local variables are resolved at compile time, not at runtime.",
  },
  {
    id: "py-eval-security",
    language: "python",
    title: "eval() on user input is a security vulnerability",
    tag: "caveats",
    code: `# NEVER do this with user-supplied input:
user_input = "__import__('os').system('rm -rf /')"
# eval(user_input)  # executes arbitrary code!

# Safe alternative for math expressions: ast.literal_eval
import ast
safe = ast.literal_eval("[1, 2, {'key': 3}]")
print(safe)   # [1, 2, {'key': 3}]

# ast.literal_eval only accepts literals — raises ValueError on code:
try:
    ast.literal_eval("__import__('os').getcwd()")
except ValueError as e:
    print("Blocked:", e)`,
    explanation:
      "eval executes arbitrary Python code — any user-supplied string can delete files, exfiltrate data, or open a shell; ast.literal_eval safely parses only Python literals (strings, numbers, lists, dicts, tuples).",
  },
  {
    id: "py-global-mutable-default",
    language: "python",
    title: "Module-level mutable default is shared across all callers",
    tag: "caveats",
    code: `# Module-level mutable default
DEFAULT_HEADERS = {"Content-Type": "application/json"}

def make_request(url: str, headers=DEFAULT_HEADERS):
    headers["X-Request-Id"] = "abc"   # MUTATES the module-level dict!
    return headers

r1 = make_request("/api/foo")
r2 = make_request("/api/bar")  # DEFAULT_HEADERS already has X-Request-Id!

# Fix — use None sentinel and copy:
def make_request_safe(url: str, headers=None):
    h = dict(DEFAULT_HEADERS) if headers is None else headers
    h["X-Request-Id"] = "abc"
    return h`,
    explanation:
      "A mutable default at module level is the same object every time the function is called; mutations accumulate across calls — always use None as the default and create/copy inside the function body.",
  },
  {
    id: "py-thread-daemon",
    language: "python",
    title: "Daemon thread is killed when the main thread exits",
    tag: "caveats",
    code: `import threading, time

def background_task():
    for i in range(10):
        print(f"bg tick {i}")
        time.sleep(0.5)

# Daemon thread — killed abruptly when main thread exits
t = threading.Thread(target=background_task, daemon=True)
t.start()
time.sleep(1)
print("Main thread done — daemon thread killed here")
# bg tick 0 / bg tick 1 printed, then process exits`,
    explanation:
      "Daemon threads do not prevent the process from exiting; they are suitable for background monitoring or cache maintenance but should never perform I/O or hold resources that need cleanup.",
  },
  {
    id: "py-signal-in-thread",
    language: "python",
    title: "Signal handlers only run in the main thread",
    tag: "caveats",
    code: `import signal, threading

def handler(signum, frame):
    print(f"Received signal {signum}")

signal.signal(signal.SIGINT, handler)  # OK in main thread

def bad_thread():
    try:
        signal.signal(signal.SIGTERM, handler)  # ValueError!
    except ValueError as e:
        print(e)  # signal only works in main thread

t = threading.Thread(target=bad_thread)
t.start()
t.join()`,
    explanation:
      "Python only delivers signals to the main thread; calling signal.signal from a worker thread raises ValueError; use threading.Event or queue.Queue to communicate cancellation signals to worker threads.",
  },
  {
    id: "py-atexit-ordering",
    language: "python",
    title: "atexit functions run in LIFO order; not called on os._exit()",
    tag: "caveats",
    code: `import atexit, os

atexit.register(lambda: print("First registered"))
atexit.register(lambda: print("Second registered"))
atexit.register(lambda: print("Third registered"))

# On normal exit, order is LIFO (Last In, First Out):
# Third registered
# Second registered
# First registered

# os._exit() bypasses atexit entirely:
# os._exit(0)  # atexit handlers NOT called

# sys.exit() raises SystemExit and DOES call atexit`,
    explanation:
      "atexit handlers execute in LIFO order so that resources registered later (often dependencies) are cleaned up first; os._exit skips all cleanup including atexit, __del__, and finally blocks.",
  },
  {
    id: "py-exit-handler",
    language: "python",
    title: "sys.exit() raises SystemExit — it can be caught",
    tag: "caveats",
    code: `import sys

def risky_main():
    sys.exit(42)     # raises SystemExit(42)

try:
    risky_main()
except SystemExit as e:
    print(f"Caught SystemExit with code {e.code}")  # 42
    # You can suppress the exit here:
    # (usually a bad idea — only for test harnesses)

# The 'bare' except also catches it — avoid:
# except:  # catches SystemExit, KeyboardInterrupt, GeneratorExit!`,
    explanation:
      "SystemExit is an exception (not derived from Exception) that passes through most except clauses; test frameworks catch it to verify sys.exit calls; never use bare except as it intercepts process-level signals too.",
  },

  // ── types ─────────────────────────────────────────────────────────────────
  {
    id: "py-type-hints-pep526",
    language: "python",
    title: "PEP 526 — variable annotations: x: int = 5",
    tag: "types",
    code: `# Variable annotation without assignment (declaration only):
count: int
name: str

# With assignment:
score: float = 9.5
items: list[str] = []

# Class body annotations become __annotations__ on the class:
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

print(Config.__annotations__)
# {'host': <class 'str'>, 'port': <class 'int'>, 'debug': <class 'bool'>}`,
    explanation:
      "PEP 526 variable annotations are purely informational at runtime — Python stores them in __annotations__ but does not enforce types; they are used by type checkers, dataclasses, and attrs.",
  },
  {
    id: "py-pep604-union",
    language: "python",
    title: "PEP 604 — X | Y union type at runtime",
    tag: "types",
    code: `# Python 3.10+ — X | Y is valid in annotations AND at runtime
def process(value: int | str | None) -> str:
    if value is None:
        return ""
    return str(value)

# isinstance with | union type:
x = 42
print(isinstance(x, int | str))   # True
print(isinstance(x, float | str)) # False

# Pre-3.10 alternative:
from typing import Union
def old_process(value: Union[int, str, None]) -> str: ...`,
    explanation:
      "The | operator creates a UnionType at runtime (Python 3.10+), so isinstance(x, int | str) works without importing Union; in 3.9 and earlier you must use Union[int, str] from typing.",
  },
  {
    id: "py-pep634-match",
    language: "python",
    title: "PEP 634 — structural pattern matching intro",
    tag: "types",
    code: `command = {"action": "move", "direction": "north", "steps": 3}

match command:
    case {"action": "move", "direction": dir, "steps": n}:
        print(f"Moving {dir} {n} steps")   # Moving north 3 steps
    case {"action": "look"}:
        print("Looking around")
    case {"action": action}:
        print(f"Unknown action: {action}")
    case _:
        print("Not a valid command")`,
    explanation:
      "match/case performs structural matching against patterns; mapping patterns match dicts by checking key existence and binding values, making it far more readable than nested if/elif chains.",
  },
  {
    id: "py-pep647-typeguard",
    language: "python",
    title: "PEP 647 — TypeGuard[T] narrows types in branches",
    tag: "types",
    code: `from typing import TypeGuard

def is_list_of_str(val: list) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[int | str]) -> None:
    if is_list_of_str(items):
        # type checker knows 'items' is list[str] here
        total = "".join(items)
        print(total)`,
    explanation:
      "TypeGuard[T] on a return annotation tells the type checker that when the function returns True, the checked argument should be narrowed to type T — enabling type-safe predicate functions.",
  },
  {
    id: "py-pep673-self",
    language: "python",
    title: "PEP 673 — Self type for method return types",
    tag: "types",
    code: `from typing import Self

class Builder:
    def set_name(self, name: str) -> Self:
        self._name = name
        return self

    def set_value(self, value: int) -> Self:
        self._value = value
        return self

class SpecialBuilder(Builder):
    def extra(self) -> Self:
        return self

# Type-safe fluent API — subclass methods return Self, not Builder:
sb = SpecialBuilder().set_name("x").set_value(1).extra()`,
    explanation:
      "Self is the type of the current class, including subclasses; without it, methods returning self would be typed as returning the base class, breaking type safety for fluent builder subclasses.",
  },
  {
    id: "py-pep675-literal-string",
    language: "python",
    title: "PEP 675 — LiteralString for injection-safe APIs",
    tag: "types",
    code: `from typing import LiteralString

def execute_query(conn, sql: LiteralString) -> None:
    conn.execute(sql)   # type checker ensures sql is a string literal

# These are OK — hardcoded literals:
execute_query(conn, "SELECT * FROM users")
execute_query(conn, "SELECT * FROM users" + " WHERE id = 1")

# This is an error — dynamic user input could contain SQL injection:
user_input = input("Enter query: ")
# execute_query(conn, user_input)  # type error: user_input is not LiteralString`,
    explanation:
      "LiteralString only accepts string literals and concatenations of literals; passing user-controlled strings fails at type-check time, preventing SQL/shell/LDAP injection at the annotation level.",
  },
  {
    id: "py-pep681-dataclasses",
    language: "python",
    title: "PEP 681 — @dataclass_transform for custom dataclass-like decorators",
    tag: "types",
    code: `from typing import dataclass_transform

@dataclass_transform()
def my_model(cls):
    """Decorator that adds __init__ based on annotations."""
    fields = cls.__annotations__
    def __init__(self, **kwargs):
        for k in fields:
            setattr(self, k, kwargs.get(k))
    cls.__init__ = __init__
    return cls

@my_model
class User:
    name: str
    age: int

u = User(name="Alice", age=30)
print(u.name)  # Alice`,
    explanation:
      "@dataclass_transform tells type checkers (mypy, pyright) that the decorated class or function creates dataclass-like semantics, enabling proper type inference for __init__ parameters.",
  },
  {
    id: "py-pep702-deprecated",
    language: "python",
    title: "PEP 702 — @deprecated decorator with DeprecationWarning",
    tag: "types",
    code: `import warnings
from typing import deprecated   # Python 3.13+

@deprecated("Use new_api() instead")
def old_api(x: int) -> int:
    return x * 2

old_api(5)   # emits DeprecationWarning at the call site

# Backport via warnings module:
def legacy_func():
    warnings.warn(
        "legacy_func is deprecated; use new_func()",
        DeprecationWarning,
        stacklevel=2,   # points to caller, not this line
    )`,
    explanation:
      "@deprecated is a type-checker-recognised decorator that triggers a warning at the call site; stacklevel=2 in warnings.warn points the warning message at the caller's code, not at the definition.",
  },
  {
    id: "py-str-type-at-runtime",
    language: "python",
    title: "str type operations at runtime vs type-checker behavior",
    tag: "types",
    code: `s = "hello"

# Runtime operations on str:
print(type(s))          # <class 'str'>
print(isinstance(s, str))  # True
print(str.__mro__)      # (str, object)

# str is immutable — all operations return new strings:
upper = s.upper()       # new object
print(s is upper)       # False

# Type checker: str is a sequence of str (not of char)
for c in s:
    print(type(c))      # <class 'str'>  (single chars are still str)`,
    explanation:
      "Unlike many languages, Python has no separate character type — single characters are just length-1 strings; str is immutable and all methods return new string objects.",
  },
  {
    id: "py-bytes-type-ops",
    language: "python",
    title: "bytes: indexing returns int, slicing returns bytes",
    tag: "types",
    code: `b = b"hello"

print(b[0])       # 104  — an int, not a byte!
print(b[0:1])     # b'h' — a bytes object
print(type(b[0]))   # <class 'int'>
print(type(b[0:1])) # <class 'bytes'>

# Iteration yields ints:
for byte in b:
    print(byte, end=" ")  # 104 101 108 108 111

# Convert to list of ints:
print(list(b))  # [104, 101, 108, 108, 111]`,
    explanation:
      "Indexing bytes returns an integer (the byte value 0-255), not a single-byte bytes object; slicing returns bytes — this asymmetry is a common source of bugs when porting Python 2 code.",
  },
  {
    id: "py-range-type",
    language: "python",
    title: "range is a sequence type: supports len, in, slicing",
    tag: "types",
    code: `r = range(10, 100, 5)

print(len(r))          # 18
print(50 in r)         # True   (O(1) — not a linear scan)
print(49 in r)         # False
print(r[3])            # 25     (indexing)
print(r[-1])           # 95
print(r[::2])          # range(10, 100, 10)  — slicing returns range
print(list(r[:3]))     # [10, 15, 20]`,
    explanation:
      "range is a lazy sequence that computes elements on demand; membership testing and indexing are O(1) arithmetic operations, making it much faster than building a list for large ranges.",
  },
  {
    id: "py-slice-type-obj",
    language: "python",
    title: "slice object: .start, .stop, .step, .indices()",
    tag: "types",
    code: `s = slice(2, 10, 3)
print(s.start, s.stop, s.step)  # 2 10 3

# Apply to a sequence:
data = list(range(15))
print(data[s])   # [2, 5, 8]

# indices() resolves None and handles boundary clamping:
length = 7
start, stop, step = s.indices(length)
print(start, stop, step)   # 2 7 3  (clamped to length)
print(data[:length][s])    # [2, 5]`,
    explanation:
      "slice objects can be stored and reused; indices(length) normalises None values and clamps to sequence bounds, which is the method __getitem__ should call when implementing custom sliceable types.",
  },
  {
    id: "py-type-of-class",
    language: "python",
    title: "type(instance) returns the class; type(class) returns the metaclass",
    tag: "types",
    code: `class MyMeta(type): pass

class MyClass(metaclass=MyMeta):
    pass

obj = MyClass()

print(type(obj))        # <class '__main__.MyClass'>
print(type(MyClass))    # <class '__main__.MyMeta'>
print(type(MyMeta))     # <class 'type'>       (metaclass of metaclass)

# type is its own metaclass:
print(type(type))       # <class 'type'>`,
    explanation:
      "Every class is an instance of its metaclass; ordinary classes are instances of type; this chain terminates at type, which is its own metaclass — understanding this unlocks custom class creation.",
  },
  {
    id: "py-isinstance-tuple",
    language: "python",
    title: "isinstance(x, (A, B, C)) — tuple of types",
    tag: "types",
    code: `x = 3.14

# Verbose multi-check:
if isinstance(x, int) or isinstance(x, float) or isinstance(x, complex):
    print("numeric")

# Idiomatic — pass a tuple of types:
if isinstance(x, (int, float, complex)):
    print("numeric")  # numeric

# Also works for subclass checks:
class Animal: pass
class Dog(Animal): pass

d = Dog()
print(isinstance(d, (Animal, str)))  # True  (Dog is subclass of Animal)`,
    explanation:
      "Passing a tuple to isinstance is more efficient than chaining or-comparisons because it avoids repeated attribute lookups; the check short-circuits on the first match.",
  },

  // ── families ──────────────────────────────────────────────────────────────
  {
    id: "py-str-list-tuple-ops",
    language: "python",
    title: "Common operations on str / list / tuple",
    tag: "families",
    code: `s = "hello"
l = [1, 2, 3, 4, 5]
t = (10, 20, 30)

# Indexing (all three):
print(s[1], l[1], t[1])       # e 2 20

# Slicing:
print(s[1:4], l[1:4], t[1:3]) # ell [2, 3, 4] (20, 30)

# Membership:
print("e" in s, 3 in l, 20 in t)  # True True True

# Length:
print(len(s), len(l), len(t))  # 5 5 3

# Concatenation (list is mutable, others return new):
new_l = l + [6]
new_s = s + " world"`,
    explanation:
      "str, list, and tuple all implement the Sequence protocol with the same indexing, slicing, in-operator, and len() semantics; list is the only mutable one, so concatenation modifies nothing in place.",
  },
  {
    id: "py-dict-keys-values-items",
    language: "python",
    title: ".keys() / .values() / .items() views vs lists",
    tag: "families",
    code: `d = {"a": 1, "b": 2, "c": 3}

keys   = d.keys()    # dict_keys — live view
values = d.values()  # dict_values — live view
items  = d.items()   # dict_items — live view

d["d"] = 4
print(len(keys))     # 4  — view reflects the mutation

# Set-like operations on keys/items:
other = {"b": 9, "e": 5}
print(d.keys() & other.keys())  # {'b'}

# Convert to list when you need a snapshot:
key_list = list(d.keys())`,
    explanation:
      "Views are dynamic windows into the dict that update automatically when the dict changes; they support set operations (keys and items) but you need to convert to a list for an immutable snapshot.",
  },
  {
    id: "py-file-path-os-pathlib",
    language: "python",
    title: "os.path vs pathlib.Path — prefer Path for new code",
    tag: "families",
    code: `import os
from pathlib import Path

path_str = "/home/user/data/report.csv"
path_obj = Path(path_str)

# os.path style:
print(os.path.basename(path_str))  # report.csv
print(os.path.dirname(path_str))   # /home/user/data
print(os.path.splitext(path_str))  # ('/home/user/data/report', '.csv')

# pathlib style (chainable, object-oriented):
print(path_obj.name)        # report.csv
print(path_obj.parent)      # /home/user/data
print(path_obj.stem, path_obj.suffix)  # report .csv`,
    explanation:
      "os.path operates on strings and returns strings; pathlib.Path wraps paths in objects with methods like .read_text(), .write_bytes(), and .glob() — prefer pathlib for new code.",
  },
  {
    id: "py-subprocess-os-system",
    language: "python",
    title: "subprocess.run vs os.system — capture vs fire-and-forget",
    tag: "families",
    code: `import subprocess, os

# os.system — inherits stdio, no capture, returns exit code
ret = os.system("echo hello")
print(ret)    # 0

# subprocess.run — full control over I/O
r = subprocess.run(["echo", "hello"], capture_output=True, text=True)
print(r.stdout.strip())  # hello
print(r.returncode)      # 0

# subprocess.check_output — shorter but less flexible
out = subprocess.check_output(["echo", "hello"], text=True)
print(out.strip())  # hello`,
    explanation:
      "os.system passes the command to the shell and provides no way to capture output; subprocess.run is the modern API that handles stdin/stdout/stderr and raises on failure with check=True.",
  },
  {
    id: "py-re-vs-fnmatch",
    language: "python",
    title: "re (full regex) vs fnmatch (shell glob) — use cases",
    tag: "families",
    code: `import re, fnmatch

text = "error 404: page not found"

# re — full regex with groups, lookaheads, character classes
m = re.search(r"error (\d+): (.+)", text)
if m:
    print(m.group(1), m.group(2))  # 404 page not found

# fnmatch — shell-style globs for filenames only
files = ["data.csv", "data_backup.csv", "notes.txt"]
matches = fnmatch.filter(files, "data*.csv")
print(matches)   # ['data.csv', 'data_backup.csv']`,
    explanation:
      "Use re for text parsing, validation, and complex string matching; use fnmatch only for filename pattern matching where *, ?, and [seq] shell wildcards are the natural language.",
  },
  {
    id: "py-json-yaml-toml",
    language: "python",
    title: "JSON (stdlib) vs YAML (third-party) vs TOML (stdlib 3.11)",
    tag: "families",
    code: `import json, tomllib   # tomllib added in 3.11

# JSON — universal, no comments, strict types
data = json.loads('{"port": 8080, "debug": false}')
print(json.dumps(data, indent=2))

# TOML — human-friendly config, comments, typed
with open("config.toml", "rb") as f:
    cfg = tomllib.load(f)  # [server] / port = 8080

# YAML (pip install pyyaml) — superset of JSON, custom types
# import yaml
# cfg = yaml.safe_load("port: 8080\\ndebug: false")`,
    explanation:
      "JSON is the lingua franca of APIs; TOML (stdlib since 3.11) is the preferred format for config files like pyproject.toml; YAML is powerful but error-prone due to implicit type coercion.",
  },
  {
    id: "py-logging-print-compare",
    language: "python",
    title: "logging vs print — structured, level-filtered, configurable",
    tag: "families",
    code: `import logging

# print — simple, always outputs, no level filtering
print("debug info")  # always shown

# logging — level-controlled, goes to handlers
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

logger.debug("skipped if level=INFO")
logger.info("request processed")
logger.warning("disk space low: %d%%", 15)  # lazy formatting
logger.error("failed to connect")`,
    explanation:
      "Logging is lazy (the format string is only evaluated if the level is enabled), structured (level, logger name, timestamp), and configurable at deploy time — print is appropriate only for script output.",
  },
  {
    id: "py-unittest-pytest-compare",
    language: "python",
    title: "unittest (stdlib) vs pytest — boilerplate comparison",
    tag: "families",
    code: `# unittest — class-based, verbose
import unittest
class TestMath(unittest.TestCase):
    def test_addition(self):
        self.assertEqual(1 + 1, 2)
    def test_raises(self):
        with self.assertRaises(ZeroDivisionError):
            1 / 0

# pytest — plain functions, assert introspection, fixtures
def test_addition():
    assert 1 + 1 == 2

def test_raises():
    import pytest
    with pytest.raises(ZeroDivisionError):
        1 / 0`,
    explanation:
      "pytest requires no base class and uses plain assert with detailed failure messages; it is the de-facto choice for new projects; unittest is necessary only when extending existing test suites or when third-party dependencies are forbidden.",
  },
  {
    id: "py-threading-multiprocessing-async",
    language: "python",
    title: "threading / multiprocessing / asyncio — GIL and use cases",
    tag: "families",
    code: `# threading — shared memory, GIL limits CPU parallelism
# Use for: I/O-bound work, calling blocking APIs
import threading

# multiprocessing — separate processes, bypasses GIL
# Use for: CPU-bound work (compression, image processing)
import multiprocessing

# asyncio — single-threaded cooperative concurrency
# Use for: many concurrent I/O operations (web APIs, sockets)
import asyncio

# Decision rule:
# I/O-bound + many connections → asyncio
# I/O-bound + blocking libs    → threading
# CPU-bound                    → multiprocessing`,
    explanation:
      "The GIL prevents true parallelism in threads for CPU-bound code; asyncio avoids thread overhead for high-concurrency I/O; multiprocessing side-steps the GIL by using separate OS processes.",
  },
  {
    id: "py-argparse-click-compare",
    language: "python",
    title: "argparse (stdlib) vs click (third-party)",
    tag: "families",
    code: `# argparse — stdlib, verbose but no extra dependencies
import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--name", required=True)
args = parser.parse_args()
print(f"Hello {args.name}")

# click — decorator-based, auto-generates help, testing support
# pip install click
import click
@click.command()
@click.option("--name", required=True, help="Your name")
def greet(name):
    click.echo(f"Hello {name}")

if __name__ == "__main__":
    greet()`,
    explanation:
      "argparse is zero-dependency and sufficient for simple CLIs; click provides a cleaner decorator API, automatic help text, coloured output, and a test runner — worth the dependency for complex CLIs.",
  },
  {
    id: "py-contextlib-try-finally",
    language: "python",
    title: "contextlib.contextmanager vs explicit try/finally",
    tag: "families",
    code: `import contextlib

# Explicit — verbose but always clear
class ManagedConn:
    def __enter__(self):  return self
    def __exit__(self, *_): self.close()
    def close(self): print("closed")

# contextmanager — concise generator-based approach
@contextlib.contextmanager
def managed_conn():
    conn = {"open": True}
    try:
        yield conn
    finally:
        conn["open"] = False
        print("closed")

with managed_conn() as c:
    print(c["open"])  # True
# closed`,
    explanation:
      "@contextmanager is more concise for one-off context managers; the class approach is better when you need the context manager to be reusable, subclassable, or to carry significant state.",
  },
  {
    id: "py-property-slot-attr",
    language: "python",
    title: "Plain attribute vs @property vs __slots__ — trade-offs",
    tag: "families",
    code: `# Plain attribute — simplest, stored in __dict__
class A:
    def __init__(self): self.x = 0

# @property — computed on access, validation on set
class B:
    @property
    def x(self): return self._x
    @x.setter
    def x(self, v):
        if v < 0: raise ValueError
        self._x = v

# __slots__ — fixed attribute set, no __dict__, saves memory
class C:
    __slots__ = ("x",)
    def __init__(self): self.x = 0

import sys
print(sys.getsizeof(A()), sys.getsizeof(C()))  # C is smaller`,
    explanation:
      "Plain attributes are fastest for simple data; properties add validation/computation at the cost of a function call; __slots__ eliminates the per-instance dict, reducing memory by 30-50% for many small objects.",
  },
  {
    id: "py-classmethod-new",
    language: "python",
    title: "classmethod factory vs __new__ for alternative construction",
    tag: "families",
    code: `class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f: float) -> "Temperature":
        return cls((f - 32) * 5 / 9)   # preferred factory

    @classmethod
    def from_kelvin(cls, k: float) -> "Temperature":
        return cls(k - 273.15)

# __new__ — for immutable types or controlling object creation
class Singleton:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance`,
    explanation:
      "Classmethod factories are the standard pattern for named constructors — they are readable, subclass-friendly, and work naturally with inheritance; __new__ is reserved for immutable types (like int subclasses) or metaclass-level construction control.",
  },
  {
    id: "py-super-direct-call",
    language: "python",
    title: "super().method() vs BaseClass.method(self) — cooperative vs explicit",
    tag: "families",
    code: `class Base:
    def process(self): print("Base")

class Middle(Base):
    def process(self):
        super().process()       # cooperative: follows MRO
        print("Middle")

class Direct(Base):
    def process(self):
        Base.process(self)      # explicit: always calls Base
        print("Direct")

class Combined(Middle, Direct):
    pass

Combined().process()
# With super(): Base → Direct → Middle (MRO order)
# Direct.process uses Base.process — Middle is skipped`,
    explanation:
      "super() follows the MRO enabling cooperative multiple inheritance; calling the base class directly by name bypasses the MRO and breaks cooperation when used in a diamond hierarchy.",
  },

  // ── classes ───────────────────────────────────────────────────────────────
  {
    id: "py-mixin-composition",
    language: "python",
    title: "Composing behaviors with multiple mixins",
    tag: "classes",
    code: `class SerializeMixin:
    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items()
                if not k.startswith("_")}

class ValidateMixin:
    def validate(self) -> bool:
        return all(v is not None for v in self.__dict__.values())

class TimestampMixin:
    from datetime import datetime
    def touch(self): self.updated_at = self.datetime.utcnow()

class User(SerializeMixin, ValidateMixin, TimestampMixin):
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

u = User("Alice", "alice@example.com")
print(u.validate())   # True
print(u.to_dict())    # {'name': 'Alice', 'email': '...'}`,
    explanation:
      "Mixins are classes that provide a specific behaviour through multiple inheritance without being intended for standalone use; they must call super() if they override methods to participate cooperatively.",
  },
  {
    id: "py-abstract-template-method",
    language: "python",
    title: "Template Method pattern with ABC",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class DataProcessor(ABC):
    def process(self, data: list) -> list:
        """Template method — defines the algorithm skeleton."""
        data = self.validate(data)
        data = self.transform(data)
        return self.format(data)

    @abstractmethod
    def validate(self, data: list) -> list: ...

    @abstractmethod
    def transform(self, data: list) -> list: ...

    def format(self, data: list) -> list:  # default hook
        return data

class UpperProcessor(DataProcessor):
    def validate(self, data): return [x for x in data if isinstance(x, str)]
    def transform(self, data): return [x.upper() for x in data]

print(UpperProcessor().process(["hello", 42, "world"]))  # ['HELLO', 'WORLD']`,
    explanation:
      "Template Method defines the skeleton of an algorithm in the base class and defers specific steps to subclasses; abstract methods enforce that subclasses implement the required hooks.",
  },
  {
    id: "py-observer-pattern",
    language: "python",
    title: "Observer pattern — callable subscribers list",
    tag: "classes",
    code: `from typing import Callable

class EventEmitter:
    def __init__(self):
        self._listeners: dict[str, list[Callable]] = {}

    def on(self, event: str, fn: Callable):
        self._listeners.setdefault(event, []).append(fn)

    def emit(self, event: str, *args):
        for fn in self._listeners.get(event, []):
            fn(*args)

emitter = EventEmitter()
emitter.on("data", lambda x: print(f"Received: {x}"))
emitter.on("data", lambda x: print(f"Logged: {x}"))
emitter.emit("data", 42)
# Received: 42
# Logged: 42`,
    explanation:
      "Using callables as subscribers avoids requiring observer objects to implement a specific interface; any function, lambda, or bound method can subscribe — ideal for loosely coupled event handling.",
  },
  {
    id: "py-strategy-pattern",
    language: "python",
    title: "Strategy — swap algorithms at runtime",
    tag: "classes",
    code: `from typing import Protocol

class SortStrategy(Protocol):
    def sort(self, data: list) -> list: ...

class BubbleSort:
    def sort(self, data: list) -> list:
        d = list(data)
        for i in range(len(d)):
            for j in range(len(d)-i-1):
                if d[j] > d[j+1]: d[j], d[j+1] = d[j+1], d[j]
        return d

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy

    def sort(self, data: list) -> list:
        return self._strategy.sort(data)

s = Sorter(BubbleSort())
print(s.sort([3, 1, 4, 1, 5]))  # [1, 1, 3, 4, 5]`,
    explanation:
      "Strategy encapsulates interchangeable algorithms behind a common interface; using Protocol for the strategy type enables structural typing — any object with a matching sort method qualifies.",
  },
  {
    id: "py-command-pattern",
    language: "python",
    title: "Command — encapsulate actions as objects",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...
    @abstractmethod
    def undo(self) -> None: ...

class AppendCommand(Command):
    def __init__(self, doc: list, text: str):
        self._doc = doc; self._text = text
    def execute(self): self._doc.append(self._text)
    def undo(self): self._doc.pop()

history: list[Command] = []
doc: list[str] = []

cmd = AppendCommand(doc, "Hello")
cmd.execute(); history.append(cmd)
print(doc)   # ['Hello']

history.pop().undo()
print(doc)   # []`,
    explanation:
      "Command objects capture an action and its parameters, enabling queuing, logging, and undo/redo; the history stack stores executed commands and calling undo in reverse order reverses the operations.",
  },
  {
    id: "py-chain-of-resp",
    language: "python",
    title: "Chain of Responsibility — pass request along handlers",
    tag: "classes",
    code: `from __future__ import annotations
from abc import ABC, abstractmethod

class Handler(ABC):
    _next: Handler | None = None

    def set_next(self, h: Handler) -> Handler:
        self._next = h; return h

    def handle(self, req: int) -> str | None:
        if self._next:
            return self._next.handle(req)
        return None

class LowHandler(Handler):
    def handle(self, req):
        return f"Low handled {req}" if req < 10 else super().handle(req)

class HighHandler(Handler):
    def handle(self, req):
        return f"High handled {req}" if req >= 10 else super().handle(req)

low = LowHandler()
low.set_next(HighHandler())
print(low.handle(5))   # Low handled 5
print(low.handle(20))  # High handled 20`,
    explanation:
      "Each handler decides whether to process the request or pass it to the next; the chain is assembled at runtime, making it easy to reorder, add, or remove handlers without changing handler code.",
  },
  {
    id: "py-composite-pattern",
    language: "python",
    title: "Composite — uniform interface for leaf and container",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class Component(ABC):
    @abstractmethod
    def size(self) -> int: ...

class File(Component):
    def __init__(self, name: str, size: int):
        self.name = name; self._size = size
    def size(self) -> int: return self._size

class Directory(Component):
    def __init__(self, name: str):
        self.name = name; self._children: list[Component] = []
    def add(self, c: Component): self._children.append(c)
    def size(self) -> int: return sum(c.size() for c in self._children)

root = Directory("root")
root.add(File("a.txt", 100))
sub = Directory("sub"); sub.add(File("b.txt", 200))
root.add(sub)
print(root.size())  # 300`,
    explanation:
      "Composite treats individual objects and compositions uniformly through the Component interface; calling size() on a Directory recursively sums its children without the caller knowing the tree structure.",
  },
  {
    id: "py-proxy-pattern",
    language: "python",
    title: "Proxy — delegate with pre/post logic",
    tag: "classes",
    code: `class Database:
    def query(self, sql: str) -> list:
        print(f"Executing: {sql}")
        return [{"id": 1}]

class LoggingProxy:
    def __init__(self, db: Database):
        self._db = db

    def query(self, sql: str) -> list:
        print(f"[LOG] query called: {sql}")
        result = self._db.query(sql)
        print(f"[LOG] returned {len(result)} rows")
        return result

db = LoggingProxy(Database())
rows = db.query("SELECT * FROM users")`,
    explanation:
      "The Proxy wraps the real subject with the same interface, adding cross-cutting concerns (logging, caching, auth) without modifying the original class — a lightweight alternative to decorators for objects.",
  },
  {
    id: "py-flyweight-pattern",
    language: "python",
    title: "Flyweight — share instances via factory cache",
    tag: "classes",
    code: `import sys

class Color:
    _cache: dict[str, "Color"] = {}

    def __new__(cls, name: str):
        if name not in cls._cache:
            instance = super().__new__(cls)
            instance.name = name
            cls._cache[name] = instance
        return cls._cache[name]

red1 = Color("red")
red2 = Color("red")
blue = Color("blue")

print(red1 is red2)   # True  — same object
print(red1 is blue)   # False
print(sys.getrefcount(Color._cache))  # small number`,
    explanation:
      "Flyweight reduces memory by sharing identical objects; the __new__ factory ensures only one instance per colour name is ever created — useful for large numbers of fine-grained objects like characters or colours.",
  },
  {
    id: "py-state-pattern",
    language: "python",
    title: "State — object behavior changes with state",
    tag: "classes",
    code: `from abc import ABC, abstractmethod

class State(ABC):
    @abstractmethod
    def handle(self, ctx: "TrafficLight"): ...

class Green(State):
    def handle(self, ctx):
        print("Green — go"); ctx.state = Yellow()

class Yellow(State):
    def handle(self, ctx):
        print("Yellow — slow"); ctx.state = Red()

class Red(State):
    def handle(self, ctx):
        print("Red — stop"); ctx.state = Green()

class TrafficLight:
    def __init__(self): self.state: State = Red()
    def tick(self): self.state.handle(self)

light = TrafficLight()
for _ in range(4):
    light.tick()
# Red — stop / Green — go / Yellow — slow / Red — stop`,
    explanation:
      "State externalises behaviour into state objects; the context delegates to the current state and transitions are handled by the state objects themselves, eliminating large if/elif chains based on status flags.",
  },
  {
    id: "py-builder-pattern",
    language: "python",
    title: "Builder — construct complex object step by step",
    tag: "classes",
    code: `class QueryBuilder:
    def __init__(self):
        self._table = ""
        self._conditions: list[str] = []
        self._limit: int | None = None

    def from_table(self, t: str) -> "QueryBuilder":
        self._table = t; return self

    def where(self, cond: str) -> "QueryBuilder":
        self._conditions.append(cond); return self

    def limit(self, n: int) -> "QueryBuilder":
        self._limit = n; return self

    def build(self) -> str:
        q = f"SELECT * FROM {self._table}"
        if self._conditions:
            q += " WHERE " + " AND ".join(self._conditions)
        if self._limit:
            q += f" LIMIT {self._limit}"
        return q

sql = QueryBuilder().from_table("users").where("age > 18").limit(10).build()
print(sql)  # SELECT * FROM users WHERE age > 18 LIMIT 10`,
    explanation:
      "Builder separates construction from representation using a fluent interface; each method returns self enabling chaining, and build() produces the final immutable product.",
  },
  {
    id: "py-prototype-copy",
    language: "python",
    title: "Prototype — copy.deepcopy() as cloning mechanism",
    tag: "classes",
    code: `import copy

class DocumentTemplate:
    def __init__(self, title: str, sections: list[str]):
        self.title = title
        self.sections = sections

    def clone(self) -> "DocumentTemplate":
        return copy.deepcopy(self)

template = DocumentTemplate("Report", ["Introduction", "Findings"])
doc1 = template.clone()
doc1.title = "Q1 Report"
doc1.sections.append("Conclusion")

print(template.sections)  # ['Introduction', 'Findings']  — unchanged
print(doc1.sections)      # ['Introduction', 'Findings', 'Conclusion']`,
    explanation:
      "copy.deepcopy recursively copies all nested objects, so mutations to the clone do not affect the original; this is the simplest Python implementation of the Prototype pattern.",
  },
  {
    id: "py-template-class",
    language: "python",
    title: "Template class — generic placeholders via class attributes",
    tag: "classes",
    code: `from typing import Generic, TypeVar

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("stack is empty")
        return self._items.pop()

    def __len__(self) -> int:
        return len(self._items)

s: Stack[int] = Stack()
s.push(1); s.push(2)
print(s.pop())   # 2`,
    explanation:
      "Generic[T] parameterises the class with a type variable; at runtime T is erased (Python uses erasure like Java), but type checkers use it to enforce that push and pop operate on the same type.",
  },
  {
    id: "py-singleton-metaclass",
    language: "python",
    title: "Singleton via metaclass __call__",
    tag: "classes",
    code: `class SingletonMeta(type):
    _instances: dict[type, object] = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class AppConfig(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False

a = AppConfig()
b = AppConfig()
print(a is b)      # True
a.debug = True
print(b.debug)     # True — same object`,
    explanation:
      "Overriding __call__ on the metaclass intercepts instantiation before __new__/__init__ run; storing instances by class type makes the metaclass reusable across multiple singleton classes.",
  },
  {
    id: "py-registry-metaclass",
    language: "python",
    title: "Registry via metaclass — auto-register subclasses",
    tag: "classes",
    code: `class PluginMeta(type):
    registry: dict[str, type] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

class Plugin(metaclass=PluginMeta):
    def __init_subclass__(cls, name: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if name:
            PluginMeta.registry[name] = cls

class JsonPlugin(Plugin, name="json"):
    def run(self): return "json output"

class CsvPlugin(Plugin, name="csv"):
    def run(self): return "csv output"

print(PluginMeta.registry)  # {'json': <class 'JsonPlugin'>, 'csv': ...}
plugin = PluginMeta.registry["json"]()
print(plugin.run())          # json output`,
    explanation:
      "__init_subclass__ is called automatically whenever a subclass is defined; it receives keyword arguments from the class definition line, providing a clean self-registering plugin mechanism without explicit decorator calls.",
  },
  {
    id: "py-class-doc",
    language: "python",
    title: "__doc__ and help() for class documentation",
    tag: "classes",
    code: `class Vector:
    """A 2D vector with basic arithmetic operations.

    Args:
        x: Horizontal component.
        y: Vertical component.
    """
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def magnitude(self) -> float:
        """Return the Euclidean length of the vector."""
        return (self.x**2 + self.y**2) ** 0.5

print(Vector.__doc__[:40])         # A 2D vector with basic arithmetic...
print(Vector.magnitude.__doc__)    # Return the Euclidean length...
# help(Vector)  — formatted output in terminal`,
    explanation:
      "__doc__ stores the first string literal in a class or function body; help() formats all docstrings in the class hierarchy into a readable reference — essential for library code consumed via REPL.",
  },
];

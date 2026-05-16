import type { Snippet } from "./types";

export const csharpSnippets20260516B3: Snippet[] = [
  {
    id: "cs-b16-b3-async-await-task-t",
    language: "csharp",
    title: "async/await with Task<T> return",
    tag: "snippet",
    code: `using System.Net.Http;
using System.Threading.Tasks;

async Task<string> FetchPageAsync(string url)
{
    using var client = new HttpClient();
    // await suspends the method; thread is returned to pool
    string content = await client.GetStringAsync(url);
    return content[..200];   // first 200 chars
}

string result = await FetchPageAsync("https://example.com");
Console.WriteLine(result);`,
    explanation: "An async method returning Task<T> can be awaited by callers; the compiler transforms it into a state machine that suspends at each await without blocking a thread.",
  },
  {
    id: "cs-b16-b3-task-when-all-parallel",
    language: "csharp",
    title: "Task.WhenAll – run tasks in parallel",
    tag: "snippet",
    code: `using System.Net.Http;

var client = new HttpClient();

// All three requests fire simultaneously
var tasks = new[]
{
    client.GetStringAsync("https://example.com"),
    client.GetStringAsync("https://httpbin.org/get"),
    client.GetStringAsync("https://example.org"),
};

string[] results = await Task.WhenAll(tasks);
// Task.WhenAll waits for ALL to complete (or any to fault)
foreach (var r in results)
    Console.WriteLine(r.Length);`,
    explanation: "Task.WhenAll schedules all tasks concurrently and returns when every task finishes, collecting results in the same order as the input array regardless of completion order.",
  },
  {
    id: "cs-b16-b3-task-when-any-first",
    language: "csharp",
    title: "Task.WhenAny – first-to-finish wins",
    tag: "snippet",
    code: `using System.Threading.Tasks;

async Task<int> SlowWork(int n)
{
    await Task.Delay(n * 100);
    return n;
}

var tasks = new[] { SlowWork(3), SlowWork(1), SlowWork(2) };

// Returns as soon as any one task completes
Task<int> winner = await Task.WhenAny(tasks);
Console.WriteLine(\$"First result: {await winner}");  // 1

// Cancel or ignore the remaining tasks as needed
// await Task.WhenAll(tasks);  // optionally drain the rest`,
    explanation: "Task.WhenAny is useful for timeout racing or redundant requests where you only need the fastest response — it returns the winning Task, not the result directly, so you must await it again.",
  },
  {
    id: "cs-b16-b3-cancellation-token-cancel-after",
    language: "csharp",
    title: "CancellationTokenSource.CancelAfter – timeout",
    tag: "snippet",
    code: `using System.Net.Http;
using System.Threading;

using var cts = new CancellationTokenSource();
cts.CancelAfter(TimeSpan.FromSeconds(5));   // auto-cancel after 5s

var client = new HttpClient();
try
{
    string body = await client.GetStringAsync(
        "https://httpbin.org/delay/2",
        cts.Token);
    Console.WriteLine("received " + body.Length + " bytes");
}
catch (OperationCanceledException)
{
    Console.WriteLine("request timed out or was cancelled");
}`,
    explanation: "CancellationTokenSource.CancelAfter is a concise way to implement a hard timeout; pass the token into every async API and handle OperationCanceledException to distinguish timeout from success.",
  },
  {
    id: "cs-b16-b3-iasyncenumerable-yield",
    language: "csharp",
    title: "IAsyncEnumerable<T> with yield",
    tag: "snippet",
    code: `using System.Collections.Generic;
using System.Threading;

async IAsyncEnumerable<int> GenerateAsync(
    int count,
    [System.Runtime.CompilerServices.EnumeratorCancellation]
    CancellationToken ct = default)
{
    for (int i = 0; i < count; i++)
    {
        await Task.Delay(10, ct);   // simulate async work
        yield return i;
    }
}

await foreach (int value in GenerateAsync(5))
    Console.Write(value + " ");  // 0 1 2 3 4`,
    explanation: "Async iterators use yield return inside an async method that returns IAsyncEnumerable<T>; [EnumeratorCancellation] wires a CancellationToken into the generated enumerator automatically.",
  },
  {
    id: "cs-b16-b3-await-foreach-loop",
    language: "csharp",
    title: "await foreach – consume async streams",
    tag: "snippet",
    code: `using System.Collections.Generic;

async IAsyncEnumerable<string> ReadLines(string path)
{
    using var reader = new System.IO.StreamReader(path);
    while (!reader.EndOfStream)
    {
        string? line = await reader.ReadLineAsync();
        if (line is not null) yield return line;
    }
}

// await foreach pulls one item at a time without buffering the whole file
await foreach (string line in ReadLines("/etc/hostname"))
    Console.WriteLine(line);`,
    explanation: "await foreach consumes an IAsyncEnumerable<T> one element at a time, awaiting each MoveNextAsync() call; it enables memory-efficient streaming of large data sets from I/O sources.",
  },
  {
    id: "cs-b16-b3-httpclient-get-string-async",
    language: "csharp",
    title: "HttpClient.GetStringAsync – simple GET",
    tag: "snippet",
    code: `using System.Net.Http;

// IHttpClientFactory is preferred in ASP.NET; direct use is fine in scripts
using var client = new HttpClient
{
    Timeout = TimeSpan.FromSeconds(10),
    DefaultRequestHeaders = { { "User-Agent", "MyApp/1.0" } },
};

string json = await client.GetStringAsync("https://httpbin.org/uuid");
Console.WriteLine(json);
// {"uuid": "..."}`,
    explanation: "HttpClient is designed to be long-lived and reused; disposing it prematurely causes socket exhaustion — use IHttpClientFactory in hosted apps or a single static instance in scripts.",
  },
  {
    id: "cs-b16-b3-httpclient-post-as-json",
    language: "csharp",
    title: "HttpClient.PostAsJsonAsync – send JSON body",
    tag: "snippet",
    code: `using System.Net.Http;
using System.Net.Http.Json;

var client = new HttpClient();

var payload = new { name = "Alice", age = 30 };

// PostAsJsonAsync serialises the object and sets Content-Type: application/json
var response = await client.PostAsJsonAsync("https://httpbin.org/post", payload);
response.EnsureSuccessStatusCode();

var result = await response.Content.ReadFromJsonAsync<dynamic>();
Console.WriteLine(result);`,
    explanation: "PostAsJsonAsync (System.Net.Http.Json) serialises the object with System.Text.Json and sets the correct content type header in one step, replacing the manual StringContent boilerplate.",
  },
  {
    id: "cs-b16-b3-json-custom-converter",
    language: "csharp",
    title: "JsonSerializer with custom converter",
    tag: "snippet",
    code: `using System.Text.Json;
using System.Text.Json.Serialization;

class DateOnlyConverter : JsonConverter<DateOnly>
{
    public override DateOnly Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
        => DateOnly.Parse(r.GetString()!);

    public override void Write(Utf8JsonWriter w, DateOnly v, JsonSerializerOptions o)
        => w.WriteStringValue(v.ToString("yyyy-MM-dd"));
}

var opts = new JsonSerializerOptions();
opts.Converters.Add(new DateOnlyConverter());

string json = JsonSerializer.Serialize(new { Date = new DateOnly(2026, 5, 16) }, opts);
Console.WriteLine(json);  // {"Date":"2026-05-16"}`,
    explanation: "Custom JsonConverter<T> handles types that System.Text.Json can't serialise natively; register converters in JsonSerializerOptions.Converters so they apply globally without per-call attributes.",
  },
  {
    id: "cs-b16-b3-xdocument-linq-to-xml",
    language: "csharp",
    title: "XDocument – LINQ to XML",
    tag: "snippet",
    code: `using System.Xml.Linq;

var xml = XDocument.Parse("""
    <catalog>
      <book id="1"><title>Clean Code</title><year>2008</year></book>
      <book id="2"><title>SICP</title><year>1996</year></book>
    </catalog>
    """);

var books = xml.Descendants("book")
    .Select(b => new
    {
        Id    = (int)b.Attribute("id")!,
        Title = (string)b.Element("title")!,
        Year  = (int)b.Element("year")!,
    })
    .OrderBy(b => b.Year);

foreach (var b in books)
    Console.WriteLine(\$"[{b.Id}] {b.Title} ({b.Year})");`,
    explanation: "XDocument + LINQ lets you query XML with strongly-typed projections using standard LINQ operators; explicit cast operators on XAttribute/XElement convert the text to int, DateTime, etc.",
  },
  {
    id: "cs-b16-b3-regex-compiled-pattern",
    language: "csharp",
    title: "Regex compiled pattern – reuse for performance",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

// Compiled regex is slower to create but faster per match — cache it statically
// [GeneratedRegex] source-gen (C# 11+) is the fastest option
[System.Text.RegularExpressions.GeneratedRegex(
    @"\b\d{4}-\d{2}-\d{2}\b",
    RegexOptions.Compiled)]
static partial Regex DatePattern();

string text = "Order placed on 2026-05-16, delivered 2026-05-20.";

foreach (Match m in DatePattern().Matches(text))
    Console.WriteLine(m.Value);
// 2026-05-16
// 2026-05-20`,
    explanation: "Source-generated regexes (C# 11 [GeneratedRegex]) compile the pattern at build time to a static partial method, giving maximum throughput with zero startup cost and no reflection.",
  },
  {
    id: "cs-b16-b3-regex-is-match",
    language: "csharp",
    title: "Regex.IsMatch – validate input",
    tag: "snippet",
    code: `using System.Text.RegularExpressions;

// Cache compiled regex as a static field
private static readonly Regex EmailRegex = new(
    @"^[^@\s]+@[^@\s]+\.[^@\s]+\$",
    RegexOptions.Compiled | RegexOptions.IgnoreCase
);

bool IsValidEmail(string input) => EmailRegex.IsMatch(input);

Console.WriteLine(IsValidEmail("user@example.com"));  // True
Console.WriteLine(IsValidEmail("not-an-email"));       // False
Console.WriteLine(IsValidEmail("missing@dot"));        // False`,
    explanation: "Regex.IsMatch returns a boolean with no allocation for the match result — use it for validation where you only need to know whether a pattern was found, not where or what it captured.",
  },
  {
    id: "cs-b16-b3-string-normalize-unicode",
    language: "csharp",
    title: "string.Normalize – Unicode normalisation",
    tag: "snippet",
    code: `using System.Text;

// Café as two forms: precomposed vs decomposed
string precomposed  = "café";     // é as single code point U+00E9
string decomposed   = "café";    // e + combining accent U+0301

Console.WriteLine(precomposed == decomposed);  // False — different bytes!

string nfc1 = precomposed.Normalize(NormalizationForm.FormC);
string nfc2 = decomposed.Normalize(NormalizationForm.FormC);

Console.WriteLine(nfc1 == nfc2);  // True — same NFC form
Console.WriteLine(nfc1);          // café`,
    explanation: "Unicode allows the same visible character to be encoded in multiple ways; normalise strings to NFC before comparison or storage so that visually identical text always compares as equal.",
  },
  {
    id: "cs-b16-b3-encoding-convert",
    language: "csharp",
    title: "Encoding.Convert – transcode between encodings",
    tag: "snippet",
    code: `using System.Text;

string original = "Hello, wörld!";

// Encode as ISO-8859-1 (Latin-1)
Encoding latin1 = Encoding.GetEncoding("iso-8859-1");
byte[] latin1Bytes = latin1.GetBytes(original);

// Transcode from ISO-8859-1 to UTF-8
byte[] utf8Bytes = Encoding.Convert(latin1, Encoding.UTF8, latin1Bytes);

string result = Encoding.UTF8.GetString(utf8Bytes);
Console.WriteLine(result);         // Hello, wörld!
Console.WriteLine(utf8Bytes.Length);  // more bytes than latin1Bytes`,
    explanation: "Encoding.Convert transcodes a byte array from one encoding to another in one call; it's the correct way to handle legacy text data arriving in non-UTF-8 encodings before processing it as Unicode strings.",
  },
  {
    id: "cs-b16-b3-memory-stream-to-byte-array",
    language: "csharp",
    title: "MemoryStream to byte array",
    tag: "snippet",
    code: `using System.IO;
using System.Text;

await using var ms = new MemoryStream();

// Write text as UTF-8 bytes into the stream
await using (var writer = new StreamWriter(ms, Encoding.UTF8, leaveOpen: true))
{
    await writer.WriteAsync("Hello, MemoryStream!");
    await writer.FlushAsync();
}

// Reset position before reading
ms.Position = 0;
byte[] allBytes = ms.ToArray();   // copies entire buffer

Console.WriteLine(allBytes.Length);
Console.WriteLine(Encoding.UTF8.GetString(allBytes));`,
    explanation: "MemoryStream.ToArray() returns a copy of the written bytes regardless of the current position; set leaveOpen: true on the StreamWriter so the underlying MemoryStream isn't disposed prematurely.",
  },
  {
    id: "cs-b16-b3-streamreader-read-to-end-async",
    language: "csharp",
    title: "StreamReader.ReadToEndAsync – async file read",
    tag: "snippet",
    code: `using System.IO;

// Read entire file asynchronously without blocking a thread
async Task<string> ReadFileAsync(string path)
{
    await using var fs = new FileStream(
        path,
        FileMode.Open, FileAccess.Read,
        FileShare.Read, 4096,
        useAsync: true);        // enables OS async I/O

    using var reader = new StreamReader(fs);
    return await reader.ReadToEndAsync();
}

string content = await ReadFileAsync("/etc/hostname");
Console.WriteLine(content.Trim());`,
    explanation: "Passing useAsync: true to FileStream uses OS-level async I/O (IOCP on Windows, io_uring on Linux) so the await genuinely frees the thread rather than blocking it in the thread pool.",
  },
  {
    id: "cs-b16-b3-file-write-all-text-async",
    language: "csharp",
    title: "File.WriteAllTextAsync – one-liner async write",
    tag: "snippet",
    code: `using System.IO;
using System.Text;

string path = Path.GetTempFileName();

// Writes entire string to file, creates/overwrites, closes on completion
await File.WriteAllTextAsync(path, "Hello, async file!", Encoding.UTF8);

// Read it back
string content = await File.ReadAllTextAsync(path, Encoding.UTF8);
Console.WriteLine(content);   // Hello, async file!

File.Delete(path);`,
    explanation: "File.WriteAllTextAsync is a convenient one-liner that opens, writes, and closes the file asynchronously; always specify the encoding explicitly to avoid platform-dependent defaults.",
  },
  {
    id: "cs-b16-b3-directory-get-files-pattern",
    language: "csharp",
    title: "Directory.GetFiles – wildcard pattern search",
    tag: "snippet",
    code: `using System.IO;

string tmpDir = Path.GetTempPath();

// Non-recursive: files matching *.tmp in one directory
string[] tmpFiles = Directory.GetFiles(tmpDir, "*.tmp");
Console.WriteLine(\$"Found {tmpFiles.Length} .tmp files");

// Recursive: all .log files in the whole tree
string[] allLogs = Directory.GetFiles(
    tmpDir, "*.log",
    SearchOption.AllDirectories);   // or TopDirectoryOnly

foreach (string f in allLogs)
    Console.WriteLine(Path.GetFileName(f));`,
    explanation: "Directory.GetFiles accepts a search pattern with * and ? wildcards and a SearchOption enum to control recursion; use Directory.EnumerateFiles for lazy iteration over large trees.",
  },
  {
    id: "cs-b16-b3-path-get-extension",
    language: "csharp",
    title: "Path.GetExtension and related helpers",
    tag: "snippet",
    code: `using System.IO;

string path = "/home/user/report-2026-05-16.final.pdf";

Console.WriteLine(Path.GetExtension(path));        // .pdf
Console.WriteLine(Path.GetFileNameWithoutExtension(path)); // report-2026-05-16.final
Console.WriteLine(Path.GetFileName(path));         // report-2026-05-16.final.pdf
Console.WriteLine(Path.GetDirectoryName(path));    // /home/user
Console.WriteLine(Path.GetFullPath("./foo/../bar")); // resolved absolute path
Console.WriteLine(Path.ChangeExtension(path, ".csv")); // ...final.csv`,
    explanation: "System.IO.Path provides pure string manipulation helpers for path components; they don't touch the filesystem, so they work even for paths that don't exist yet.",
  },
  {
    id: "cs-b16-b3-environment-process-id",
    language: "csharp",
    title: "Environment.ProcessId and process info",
    tag: "snippet",
    code: `using System;
using System.Diagnostics;

// Environment.ProcessId (NET 5+) — fast, no Process allocation
Console.WriteLine(\$"PID: {Environment.ProcessId}");
Console.WriteLine(\$"Machine: {Environment.MachineName}");
Console.WriteLine(\$"User:    {Environment.UserName}");
Console.WriteLine(\$"OS:      {Environment.OSVersion}");
Console.WriteLine(\$"Runtime: {Environment.Version}");

// For full process details, use System.Diagnostics.Process
using var self = Process.GetCurrentProcess();
Console.WriteLine(\$"Memory:  {self.WorkingSet64 / 1024 / 1024} MB");`,
    explanation: "Environment.ProcessId (NET 5+) retrieves the current process ID with no allocation; it replaces the common Process.GetCurrentProcess().Id pattern that creates a disposable Process object just for the PID.",
  },
  {
    id: "cs-b16-b3-async-state-machine-internals",
    language: "csharp",
    title: "Async state machine internals – how it works",
    tag: "understanding",
    code: `// The compiler transforms this async method...
async Task<int> ComputeAsync()
{
    int a = await Task.FromResult(1);   // state 0 -> 1
    int b = await Task.FromResult(2);   // state 1 -> 2
    return a + b;                       // state 2 -> done
}

// ...into a struct IAsyncStateMachine with:
//   - An int _state field tracking position
//   - An AsyncTaskMethodBuilder for the result Task
//   - MoveNext() that resumes from the correct state
//   - Captured locals stored as struct fields

// Key insight: no thread is blocked between awaits —
// MoveNext() is called as a continuation when each Task completes.
Console.WriteLine(await ComputeAsync());  // 3`,
    explanation: "The C# compiler rewrites every async method into a struct state machine; MoveNext() is scheduled as a continuation on each awaited Task's completion, meaning zero threads are blocked during suspension.",
  },
  {
    id: "cs-b16-b3-configure-await-false",
    language: "csharp",
    title: "ConfigureAwait(false) vs true – when it matters",
    tag: "understanding",
    code: `using System.Net.Http;

// In a library: ConfigureAwait(false) avoids capturing SynchronizationContext
// so continuations don't marshal back to the UI/ASP.NET thread unnecessarily
async Task<int> LibraryMethodAsync()
{
    var client = new HttpClient();
    string data = await client.GetStringAsync("https://example.com")
                              .ConfigureAwait(false);  // don't restore context
    return data.Length;   // runs on any thread pool thread
}

// In an app (UI / ASP.NET controller): omit ConfigureAwait(false)
// so continuations run on the right thread/context
async Task AppMethodAsync()
{
    int len = await LibraryMethodAsync();
    // Can safely access UI controls here because context was restored
    Console.WriteLine(len);
}`,
    explanation: "ConfigureAwait(false) tells the runtime not to restore the current SynchronizationContext after the await, reducing overhead in library code; omit it in application code where you need context (e.g., updating UI elements).",
  },
  {
    id: "cs-b16-b3-async-void-fire-forget",
    language: "csharp",
    title: "async void – fire-and-forget and its dangers",
    tag: "understanding",
    code: `using System;

// async void: unhandled exceptions crash the process (no caller to receive them)
async void FireAndForget()
{
    await Task.Delay(100);
    throw new InvalidOperationException("nobody catches this!");
    // This exception propagates to SynchronizationContext.UnhandledException
}

// PREFERRED: return Task and let callers handle exceptions
async Task SafeFireAndForget()
{
    try
    {
        await Task.Delay(100);
        // work here
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine(\$"background error: {ex.Message}");
    }
}

// async void is acceptable ONLY for event handlers
// button.Click += async (s, e) => { await DoWorkAsync(); };`,
    explanation: "async void methods cannot be awaited, so their exceptions bypass normal try/catch and go directly to the unhandled exception handler, often crashing the process; only use async void for event handlers.",
  },
  {
    id: "cs-b16-b3-iasyncenumerable-cancellation",
    language: "csharp",
    title: "IAsyncEnumerable cancellation – EnumeratorCancellation",
    tag: "understanding",
    code: `using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;

async IAsyncEnumerable<int> StreamAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < 100; i++)
    {
        ct.ThrowIfCancellationRequested();   // check before each item
        await Task.Delay(50, ct);
        yield return i;
    }
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(160));

try
{
    await foreach (int n in StreamAsync().WithCancellation(cts.Token))
        Console.Write(n + " ");   // 0 1 2  (then cancelled)
}
catch (OperationCanceledException) { Console.WriteLine("\ncancelled"); }`,
    explanation: "[EnumeratorCancellation] wires the token passed to WithCancellation() into the generator's parameter automatically; always check the token before awaiting so cancellation is responsive.",
  },
  {
    id: "cs-b16-b3-await-in-catch-finally",
    language: "csharp",
    title: "await inside catch and finally blocks",
    tag: "understanding",
    code: `using System.IO;

async Task ProcessFileAsync(string path)
{
    StreamReader? reader = null;
    try
    {
        reader = new StreamReader(path);
        string content = await reader.ReadToEndAsync();
        Console.WriteLine(content.Length);
    }
    catch (IOException ex)
    {
        // await IS allowed in catch blocks (C# 6+)
        await File.AppendAllTextAsync("errors.log", ex.Message + "\n");
        Console.Error.WriteLine(ex.Message);
    }
    finally
    {
        // await IS allowed in finally blocks too
        reader?.Dispose();
        await Task.Delay(0);   // example; real cleanup might flush a buffer
    }
}`,
    explanation: "Since C# 6, await is legal inside catch and finally blocks, enabling async logging, cleanup, and error reporting without resorting to synchronous blocking calls that could deadlock.",
  },
  {
    id: "cs-b16-b3-task-continuation-with",
    language: "csharp",
    title: "Task.ContinueWith – explicit continuation",
    tag: "understanding",
    code: `using System.Threading.Tasks;

Task<int> workTask = Task.Run(() =>
{
    System.Threading.Thread.Sleep(100);
    return 42;
});

// ContinueWith schedules a callback when workTask completes
Task printTask = workTask.ContinueWith(t =>
{
    if (t.IsCompletedSuccessfully)
        Console.WriteLine(\$"result: {t.Result}");
    else
        Console.WriteLine(\$"failed: {t.Exception?.Message}");
}, TaskContinuationOptions.ExecuteSynchronously);

await printTask;
// Prefer await over ContinueWith in modern code — it's cleaner and handles
// exceptions, context capture, and cancellation more intuitively.`,
    explanation: "ContinueWith is the explicit, lower-level predecessor to await; it's occasionally useful in library code for fine-grained scheduling options, but await should be preferred in application code for clarity.",
  },
  {
    id: "cs-b16-b3-task-completion-source",
    language: "csharp",
    title: "TaskCompletionSource – wrap callback APIs",
    tag: "understanding",
    code: `using System.Threading.Tasks;
using System.Timers;

Task<string> WaitForTimerAsync(double intervalMs)
{
    var tcs = new TaskCompletionSource<string>();
    var timer = new Timer(intervalMs) { AutoReset = false };

    timer.Elapsed += (s, e) =>
    {
        timer.Dispose();
        tcs.SetResult(\$"timer fired at {e.SignalTime:T}");
    };

    timer.Start();
    return tcs.Task;   // caller awaits this
}

string msg = await WaitForTimerAsync(200);
Console.WriteLine(msg);`,
    explanation: "TaskCompletionSource bridges event-based or callback APIs into the async/await world; you return tcs.Task to the caller and call SetResult/SetException/SetCanceled from the callback.",
  },
  {
    id: "cs-b16-b3-value-task-one-shot",
    language: "csharp",
    title: "ValueTask – zero-alloc for frequent sync completions",
    tag: "understanding",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

class Cache
{
    private readonly Dictionary<int, string> _store = new();

    // ValueTask avoids heap allocation when the value is already cached
    public ValueTask<string> GetAsync(int id)
    {
        if (_store.TryGetValue(id, out string? cached))
            return ValueTask.FromResult(cached);  // synchronous, no alloc

        return new ValueTask<string>(FetchFromDbAsync(id));  // async path
    }

    private async Task<string> FetchFromDbAsync(int id)
    {
        await Task.Delay(10);               // simulate DB call
        string v = \$"item-{id}";
        _store[id] = v;
        return v;
    }
}

var cache = new Cache();
Console.WriteLine(await cache.GetAsync(1));  // fetched
Console.WriteLine(await cache.GetAsync(1));  // cached, no alloc`,
    explanation: "ValueTask<T> avoids the Task heap allocation when the result is often available synchronously; only await a ValueTask once and never store it for later reuse, as it's a one-shot value type.",
  },
  {
    id: "cs-b16-b3-deadlock-with-result-wait",
    language: "csharp",
    title: "Caveat: deadlock with .Result/.Wait() on sync context",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// DANGER: calling .Result or .Wait() inside a context with a single-thread
// SynchronizationContext (classic ASP.NET, WinForms, WPF) DEADLOCKS:
//
// async Task<int> GetAsync() { await SomeAwaitable(); return 1; }
// int x = GetAsync().Result;   // blocks thread; continuation needs same thread -> deadlock

// SAFE ALTERNATIVES:
// 1. Make the calling code async all the way up
// 2. Use ConfigureAwait(false) in the library so continuation doesn't need the context
// 3. Offload to thread pool first:
int result = await Task.Run(async () =>
{
    await Task.Delay(10);   // context-free thread pool thread
    return 42;
});
Console.WriteLine(result);  // 42`,
    explanation: "Blocking on .Result or .Wait() from a single-threaded SynchronizationContext causes a deadlock because the continuation that produces the result needs the same thread that is currently blocked waiting for it.",
  },
  {
    id: "cs-b16-b3-async-void-event-handlers",
    language: "csharp",
    title: "Caveat: async void only for event handlers",
    tag: "caveats",
    code: `using System;

// BAD: async void in non-event-handler code
async void BadFire()
{
    await Task.Delay(10);
    throw new Exception("lost!");   // crashes process
}

// OK: async void IS acceptable for event handlers
// because event delegate signatures are void-returning
class Button
{
    public event EventHandler? Clicked;
    public void SimulateClick() => Clicked?.Invoke(this, EventArgs.Empty);
}

var btn = new Button();
// This is the one legitimate async void use case:
btn.Clicked += async (sender, e) =>
{
    await Task.Delay(10);
    Console.WriteLine("button handled");
};

btn.SimulateClick();
await Task.Delay(50);`,
    explanation: "async void event handlers are the only accepted use of async void; exceptions from them go to AppDomain.UnhandledException, so keep them minimal and wrap the body in try/catch.",
  },
  {
    id: "cs-b16-b3-cancellation-not-checked",
    language: "csharp",
    title: "Caveat: CancellationToken not checked in hot loop",
    tag: "caveats",
    code: `using System.Threading;

// BAD: token is only checked at the start — cancellation is slow to respond
async Task BadLoopAsync(CancellationToken ct)
{
    ct.ThrowIfCancellationRequested();   // checked once
    for (int i = 0; i < 1_000_000; i++)
    {
        // heavy CPU work — ignores cancellation for a long time
        _ = Math.Sqrt(i);
    }
}

// GOOD: check the token periodically inside the loop
async Task GoodLoopAsync(CancellationToken ct)
{
    for (int i = 0; i < 1_000_000; i++)
    {
        if (i % 10_000 == 0)
            ct.ThrowIfCancellationRequested();  // responsive
        _ = Math.Sqrt(i);
    }
    await Task.CompletedTask;
}`,
    explanation: "A CancellationToken only triggers when you actively check it; in CPU-intensive loops, poll ct.ThrowIfCancellationRequested() or ct.IsCancellationRequested at regular intervals to stay responsive.",
  },
  {
    id: "cs-b16-b3-iasync-disposable-not-called",
    language: "csharp",
    title: "Caveat: IAsyncDisposable requires await using",
    tag: "caveats",
    code: `using System;
using System.IO;

class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(10);   // async cleanup
        Console.WriteLine("disposed");
    }
}

// WRONG: using calls Dispose(), not DisposeAsync()
// using var bad = new AsyncResource();   // sync Dispose may not exist!

// CORRECT: await using calls DisposeAsync()
await using var good = new AsyncResource();
Console.WriteLine("working...");
// "disposed" is printed here, after await using block exits`,
    explanation: "await using is mandatory for IAsyncDisposable; a plain using statement calls the synchronous Dispose() which either doesn't exist or skips async cleanup, leaving resources in a bad state.",
  },
  {
    id: "cs-b16-b3-channel-complete-drain",
    language: "csharp",
    title: "Caveat: Channel – complete then drain",
    tag: "caveats",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

var ch = Channel.CreateUnbounded<int>();

// Producer
var producer = Task.Run(async () =>
{
    for (int i = 0; i < 5; i++)
        await ch.Writer.WriteAsync(i);
    ch.Writer.Complete();   // MUST signal completion
});

// Consumer — ReadAllAsync drains until Complete() is called
var consumer = Task.Run(async () =>
{
    await foreach (int item in ch.Reader.ReadAllAsync())
        Console.Write(item + " ");   // 0 1 2 3 4
    Console.WriteLine();
});

await Task.WhenAll(producer, consumer);`,
    explanation: "Channel.Writer.Complete() is required to signal to the reader that no more items will arrive; without it, ReadAllAsync() loops forever waiting for items that will never come.",
  },
  {
    id: "cs-b16-b3-parallel-foreach-shared-state",
    language: "csharp",
    title: "Caveat: Parallel.ForEach with shared mutable state",
    tag: "caveats",
    code: `using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

// BAD: shared list is not thread-safe
var unsafeList = new List<int>();
Parallel.ForEach(Enumerable.Range(0, 1000), n =>
{
    unsafeList.Add(n);   // races! lost updates, exceptions possible
});

// GOOD: use a concurrent collection
var safeQueue = new System.Collections.Concurrent.ConcurrentBag<int>();
Parallel.ForEach(Enumerable.Range(0, 1000), n =>
{
    safeQueue.Add(n);    // thread-safe
});

Console.WriteLine(safeQueue.Count);  // 1000`,
    explanation: "Parallel.ForEach runs iterations on thread pool threads simultaneously; List<T> is not thread-safe and will corrupt under concurrent Add calls — always use ConcurrentBag<T>, ConcurrentQueue<T>, or Interlocked operations.",
  },
  {
    id: "cs-b16-b3-task-run-in-aspnet",
    language: "csharp",
    title: "Caveat: Task.Run in ASP.NET can hide errors",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// BAD: fire-and-forget in ASP.NET — exceptions are swallowed,
// and the background work may be killed when the request ends
async Task<string> BadControllerAction()
{
    Task.Run(() => DoImportantWorkAsync());  // not awaited!
    return "accepted";
}

// GOOD: await the work, or use a proper background service (IHostedService)
async Task<string> GoodControllerAction()
{
    await DoImportantWorkAsync();  // exceptions propagate correctly
    return "done";
}

async Task DoImportantWorkAsync()
{
    await Task.Delay(100);
    Console.WriteLine("important work done");
}`,
    explanation: "Unawaited Task.Run in ASP.NET fires work that may outlive the request and whose exceptions vanish silently; use await for in-request work and IHostedService/BackgroundService for genuinely background tasks.",
  },
  {
    id: "cs-b16-b3-iasyncenumerable-vs-task-enumerable",
    language: "csharp",
    title: "IAsyncEnumerable<T> vs IEnumerable<Task<T>>",
    tag: "types",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

// IEnumerable<Task<T>>: all tasks start immediately (fan-out), no back-pressure
IEnumerable<Task<int>> StartAll(int n)
    => Enumerable.Range(0, n).Select(i => Task.FromResult(i * 2));

// IAsyncEnumerable<T>: items produced one at a time with back-pressure
async IAsyncEnumerable<int> StreamOne(int n)
{
    for (int i = 0; i < n; i++)
    {
        await Task.Delay(10);   // producer waits for consumer
        yield return i * 2;
    }
}

// IEnumerable<Task<T>> fan-out
foreach (var t in StartAll(3))
    Console.Write(await t + " ");  // 0 2 4

// IAsyncEnumerable<T> streaming
await foreach (var v in StreamOne(3))
    Console.Write(v + " ");  // 0 2 4`,
    explanation: "IEnumerable<Task<T>> launches all tasks eagerly before any are consumed, which can overwhelm downstream resources; IAsyncEnumerable<T> produces one item at a time with natural back-pressure.",
  },
  {
    id: "cs-b16-b3-task-vs-valuetask-types",
    language: "csharp",
    title: "Task<T> vs ValueTask<T> vs Task – choosing the right return type",
    tag: "types",
    code: `using System.Threading.Tasks;

// Task: reference type, always allocates, can be awaited multiple times
async Task DoWork() { await Task.Delay(1); }
async Task<int> GetValue() { await Task.Delay(1); return 42; }

// ValueTask: value type, zero-alloc for sync paths, await only ONCE
async ValueTask<int> GetCachedOrFetch(bool cached)
{
    if (cached) return 1;                     // no alloc
    await Task.Delay(1); return 2;            // alloc only on async path
}

// Task (non-generic): for fire-and-await void-equivalent methods
// ValueTask (non-generic): same but for high-frequency sync completion

Task t = DoWork();              // awaitable, cacheable
ValueTask<int> vt = GetCachedOrFetch(true);  // single-use
Console.WriteLine(await vt);`,
    explanation: "Prefer Task<T> for general use; choose ValueTask<T> only in hot paths where the synchronous fast path is common, and never store or await a ValueTask more than once.",
  },
  {
    id: "cs-b16-b3-func-task-vs-func-valuetask",
    language: "csharp",
    title: "Func<Task> vs Func<ValueTask> – delegate types",
    tag: "types",
    code: `using System;
using System.Threading.Tasks;

// Func<Task>: stores a reference to an async method returning Task
Func<Task> taskFactory = async () => { await Task.Delay(10); };

// Func<ValueTask>: stores a reference to an async method returning ValueTask
Func<ValueTask> valueTaskFactory = async () => { await Task.Yield(); };

// Both are invocable and awaitable the same way
await taskFactory();
await valueTaskFactory();

// When designing a callback API, prefer Func<Task> for broad compatibility
// unless profiling shows the ValueTask variant removes a measurable alloc.
Console.WriteLine("done");`,
    explanation: "Func<Task> and Func<ValueTask> serve the same purpose for async callbacks; Func<Task> is the safer default because Task is well-understood and freely reusable, while ValueTask has single-await constraints.",
  },
  {
    id: "cs-b16-b3-task-status-enum",
    language: "csharp",
    title: "TaskStatus enum – inspect task lifecycle",
    tag: "types",
    code: `using System.Threading.Tasks;

var tcs = new TaskCompletionSource<int>();
Task<int> t = tcs.Task;

Console.WriteLine(t.Status);   // WaitingForActivation

tcs.SetResult(42);
Console.WriteLine(t.Status);   // RanToCompletion
Console.WriteLine(t.Result);   // 42

// All TaskStatus values:
// Created, WaitingForActivation, WaitingToRun, Running,
// WaitingForChildrenToComplete, RanToCompletion, Canceled, Faulted
var faulted = Task.FromException(new Exception("oops"));
Console.WriteLine(faulted.Status);  // Faulted`,
    explanation: "TaskStatus reflects a Task's lifecycle state; avoid polling it in a loop — instead await the task and inspect IsCompletedSuccessfully, IsCanceled, or IsFaulted on the completed task.",
  },
  {
    id: "cs-b16-b3-aggregate-exception-flattening",
    language: "csharp",
    title: "AggregateException flattening",
    tag: "types",
    code: `using System;
using System.Threading.Tasks;

var tasks = new[]
{
    Task.FromException(new InvalidOperationException("err1")),
    Task.FromException(new ArgumentException("err2")),
    Task.FromResult(1),
};

try
{
    await Task.WhenAll(tasks);
}
catch (Exception ex) when (ex is not AggregateException)
{
    // await unwraps the first inner exception automatically
    Console.WriteLine(\$"first error: {ex.Message}");
}

// To see ALL errors, inspect the Task directly
AggregateException? agg = tasks[0].Exception?.Flatten();
foreach (var inner in agg?.InnerExceptions ?? Array.Empty<Exception>())
    Console.WriteLine(inner.Message);`,
    explanation: "When you await Task.WhenAll, only the first exception is rethrown; to access all failures, inspect task.Exception.Flatten().InnerExceptions on the original Task objects after WhenAll completes.",
  },
  {
    id: "cs-b16-b3-exception-dispatch-info",
    language: "csharp",
    title: "ExceptionDispatchInfo – rethrow preserving stack trace",
    tag: "types",
    code: `using System.Runtime.ExceptionServices;

ExceptionDispatchInfo? captured = null;

try
{
    throw new InvalidOperationException("original error");
}
catch (Exception ex)
{
    // Capture preserves the original stack trace
    captured = ExceptionDispatchInfo.Capture(ex);
}

// ... do some work ...

// Rethrow: stack trace shows the original throw site, not this line
try
{
    captured?.Throw();
}
catch (InvalidOperationException ex)
{
    Console.WriteLine(ex.StackTrace);  // original location visible
}`,
    explanation: "ExceptionDispatchInfo.Capture and Throw() let you store an exception and rethrow it later with the original stack trace intact — the async infrastructure uses this internally to propagate exceptions across await points.",
  },
  {
    id: "cs-b16-b3-async-local-vs-thread-local",
    language: "csharp",
    title: "AsyncLocal<T> vs ThreadLocal<T>",
    tag: "types",
    code: `using System.Threading;
using System.Threading.Tasks;

// ThreadLocal<T>: per physical thread — does NOT flow across await points
var threadLocal = new ThreadLocal<int>(() => 0);
threadLocal.Value = 42;
await Task.Delay(1);   // may resume on a DIFFERENT thread
Console.WriteLine(threadLocal.Value);  // may be 0 on new thread!

// AsyncLocal<T>: flows with the logical async context across awaits
var asyncLocal = new AsyncLocal<int>();
asyncLocal.Value = 99;
await Task.Delay(1);   // resumes on any thread, but context is preserved
Console.WriteLine(asyncLocal.Value);  // 99 — always`,
    explanation: "AsyncLocal<T> values are captured in the ExecutionContext and flow with async continuations across thread-pool thread switches; ThreadLocal<T> is tied to the physical thread and is lost after an await.",
  },
  {
    id: "cs-b16-b3-task-when-all-vs-parallel-family",
    language: "csharp",
    title: "Task.WhenAll vs WhenAny vs Parallel.ForEachAsync",
    tag: "families",
    code: `using System.Threading.Tasks;

int[] data = Enumerable.Range(1, 10).ToArray();

// WhenAll: all tasks must complete; returns all results
int[] doubled = await Task.WhenAll(data.Select(n => Task.FromResult(n * 2)));
Console.WriteLine(string.Join(",", doubled));

// WhenAny: first task to complete wins; others continue
Task<int>[] racers = data.Select(async n => { await Task.Delay(n * 10); return n; }).ToArray();
int first = await await Task.WhenAny(racers);
Console.WriteLine("first: " + first);

// Parallel.ForEachAsync: bounded concurrency over async work (NET 6+)
await Parallel.ForEachAsync(data, new ParallelOptions { MaxDegreeOfParallelism = 4 },
    async (n, ct) =>
    {
        await Task.Delay(10, ct);
        Console.Write(n + " ");
    });`,
    explanation: "WhenAll waits for everything with no concurrency limit; WhenAny is for racing or timeouts; Parallel.ForEachAsync (NET 6+) provides bounded async concurrency — the right tool for rate-limited work queues.",
  },
  {
    id: "cs-b16-b3-channel-vs-blockingcollection-family",
    language: "csharp",
    title: "Channel vs BlockingCollection vs ConcurrentQueue",
    tag: "families",
    code: `using System.Collections.Concurrent;
using System.Threading.Channels;

// ConcurrentQueue: thread-safe FIFO, TryDequeue is non-blocking
var cq = new ConcurrentQueue<int>();
cq.Enqueue(1); cq.TryDequeue(out int v); Console.WriteLine(v); // 1

// BlockingCollection: wraps ConcurrentQueue with blocking Take/Add
var bc = new BlockingCollection<int>(boundedCapacity: 10);
bc.Add(2); Console.WriteLine(bc.Take()); // 2

// Channel<T>: async-native, back-pressure, readable as IAsyncEnumerable
var ch = Channel.CreateBounded<int>(10);
await ch.Writer.WriteAsync(3);
Console.WriteLine(await ch.Reader.ReadAsync()); // 3
ch.Writer.Complete();`,
    explanation: "ConcurrentQueue is the lightweight base; BlockingCollection adds bounded blocking for thread-based producers/consumers; Channel<T> is the async-native choice with back-pressure, IAsyncEnumerable support, and better integration with async code.",
  },
  {
    id: "cs-b16-b3-thread-vs-task-vs-threadpool-family",
    language: "csharp",
    title: "Thread vs Task vs ThreadPool – which to use",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

// Thread: explicit OS thread — high overhead, full control, for long-lived work
var t = new Thread(() => { Thread.Sleep(100); Console.WriteLine("Thread"); });
t.IsBackground = true;
t.Start(); t.Join();

// ThreadPool.QueueUserWorkItem: pool thread, fire-and-forget, no return value
ThreadPool.QueueUserWorkItem(_ => Console.WriteLine("ThreadPool"));

// Task.Run: pool thread, awaitable, propagates exceptions — PREFER this
int result = await Task.Run(() => { Thread.Sleep(10); return 42; });
Console.WriteLine(\$"Task: {result}");

await Task.Delay(200);  // let ThreadPool item complete`,
    explanation: "Thread is rarely the right choice — use Task.Run for CPU-bound work on the thread pool; only create raw Threads for work that must run for the lifetime of the app (e.g., dedicated message pumps).",
  },
  {
    id: "cs-b16-b3-semaphore-slim-family",
    language: "csharp",
    title: "ManualResetEvent vs AutoResetEvent vs SemaphoreSlim",
    tag: "families",
    code: `using System.Threading;
using System.Threading.Tasks;

// AutoResetEvent: signals one waiter, auto-resets to unsignaled
var are = new AutoResetEvent(false);
ThreadPool.QueueUserWorkItem(_ => { Thread.Sleep(50); are.Set(); });
are.WaitOne();  // blocks until Set(); only ONE thread is released
Console.WriteLine("AutoResetEvent fired");

// ManualResetEventSlim: stays signaled; releases ALL waiters until Reset()
var mres = new ManualResetEventSlim(false);
mres.Set();
mres.Wait(); mres.Wait();  // both return immediately — gate is open
Console.WriteLine("ManualResetEventSlim");

// SemaphoreSlim: async-capable, limits concurrent access count
var sem = new SemaphoreSlim(2);  // 2 slots
await sem.WaitAsync(); sem.Release();
Console.WriteLine("SemaphoreSlim");`,
    explanation: "AutoResetEvent releases exactly one waiter per Set; ManualResetEventSlim releases all waiters until Reset is called; SemaphoreSlim is the async-capable rate limiter — the most versatile for async code.",
  },
  {
    id: "cs-b16-b3-iprogress-vs-event-family",
    language: "csharp",
    title: "IProgress<T> vs EventHandler for progress reporting",
    tag: "families",
    code: `using System;
using System.Threading.Tasks;

// IProgress<T>: marshals callbacks to the context that created Progress<T>
// Great for reporting progress from background tasks to UI
async Task DoWorkAsync(IProgress<int>? progress = null)
{
    for (int i = 0; i <= 100; i += 10)
    {
        await Task.Delay(10);
        progress?.Report(i);   // null-safe; no event subscription needed
    }
}

// Progress<T> captures the current SynchronizationContext
var prog = new Progress<int>(pct => Console.Write(\$"{pct}% "));
await DoWorkAsync(prog);
Console.WriteLine();

// EventHandler: requires subscription management, no context capture
// Use IProgress<T> for background-to-UI progress; EventHandler for
// general-purpose notifications where callers manage subscriptions.`,
    explanation: "IProgress<T> with Progress<T> automatically marshals callbacks to the creation-time SynchronizationContext (e.g., UI thread), making it safer and simpler than EventHandler for progress reporting from async methods.",
  },
  {
    id: "cs-b16-b3-iasyncenumerable-custom",
    language: "csharp",
    title: "Custom IAsyncEnumerable<T> implementation",
    tag: "classes",
    code: `using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

class NumberStream : IAsyncEnumerable<int>
{
    private readonly int _count;
    public NumberStream(int count) => _count = count;

    public IAsyncEnumerator<int> GetAsyncEnumerator(CancellationToken ct = default)
        => new Enumerator(_count, ct);

    private class Enumerator : IAsyncEnumerator<int>
    {
        private int _remaining;
        private readonly CancellationToken _ct;
        public int Current { get; private set; }

        public Enumerator(int count, CancellationToken ct)
            => (_remaining, _ct) = (count, ct);

        public async ValueTask<bool> MoveNextAsync()
        {
            _ct.ThrowIfCancellationRequested();
            if (_remaining-- <= 0) return false;
            await Task.Delay(5, _ct);
            Current = _remaining;
            return true;
        }

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}

await foreach (int n in new NumberStream(5))
    Console.Write(n + " ");`,
    explanation: "A custom IAsyncEnumerable<T> requires implementing GetAsyncEnumerator() returning an IAsyncEnumerator<T> with MoveNextAsync() and DisposeAsync(); MoveNextAsync returns ValueTask<bool> to avoid allocation on fast paths.",
  },
  {
    id: "cs-b16-b3-iasync-disposable-pattern",
    language: "csharp",
    title: "IAsyncDisposable – async cleanup pattern",
    tag: "classes",
    code: `using System;
using System.IO;
using System.Threading.Tasks;

class AsyncFileWriter : IAsyncDisposable
{
    private StreamWriter? _writer;

    public static async Task<AsyncFileWriter> OpenAsync(string path)
    {
        var fw = new AsyncFileWriter();
        fw._writer = new StreamWriter(path, append: true);
        await fw._writer.WriteLineAsync("-- session start --");
        return fw;
    }

    public async Task WriteAsync(string line)
    {
        if (_writer is null) throw new ObjectDisposedException(nameof(AsyncFileWriter));
        await _writer.WriteLineAsync(line);
    }

    public async ValueTask DisposeAsync()
    {
        if (_writer is not null)
        {
            await _writer.FlushAsync();
            await _writer.DisposeAsync();   // async flush + close
            _writer = null;
        }
    }
}

await using var fw = await AsyncFileWriter.OpenAsync(Path.GetTempFileName());
await fw.WriteAsync("hello");`,
    explanation: "IAsyncDisposable.DisposeAsync() is the async counterpart to IDisposable.Dispose(); await using calls it automatically so async flushing and network teardown can complete without blocking.",
  },
  {
    id: "cs-b16-b3-async-abstract-template",
    language: "csharp",
    title: "Async abstract base with template method",
    tag: "classes",
    code: `using System.Threading.Tasks;

abstract class DataProcessor
{
    // Template method: orchestrates steps, some of which are async
    public async Task ProcessAsync(string input)
    {
        string validated = Validate(input);      // sync hook
        string transformed = await TransformAsync(validated);  // async hook
        await SaveAsync(transformed);            // async hook
    }

    protected virtual string Validate(string s) => s.Trim();

    protected abstract Task<string> TransformAsync(string input);
    protected abstract Task SaveAsync(string output);
}

class UpperCaseProcessor : DataProcessor
{
    protected override Task<string> TransformAsync(string input)
        => Task.FromResult(input.ToUpperInvariant());

    protected override async Task SaveAsync(string output)
    {
        await Task.Delay(5);   // simulate DB write
        System.Console.WriteLine("saved: " + output);
    }
}

await new UpperCaseProcessor().ProcessAsync("  hello  ");`,
    explanation: "The Template Method pattern works naturally with async by making the abstract hooks return Task; concrete subclasses implement the async steps while the base class orchestrates them with await.",
  },
  {
    id: "cs-b16-b3-middleware-request-delegate",
    language: "csharp",
    title: "Middleware pattern with RequestDelegate",
    tag: "classes",
    code: `using System;
using System.Threading.Tasks;

// ASP.NET Core-style RequestDelegate and middleware pipeline
using RequestDelegate = Func<System.Collections.Generic.Dictionary<string, object>, Task>;

class LoggingMiddleware
{
    private readonly RequestDelegate _next;
    public LoggingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(System.Collections.Generic.Dictionary<string, object> ctx)
    {
        Console.WriteLine("before: " + ctx["path"]);
        await _next(ctx);   // call next middleware in pipeline
        Console.WriteLine("after:  " + ctx["path"]);
    }
}

RequestDelegate final = ctx => { Console.WriteLine("handler!"); return Task.CompletedTask; };
var mw = new LoggingMiddleware(final);
await mw.InvokeAsync(new() { ["path"] = "/api/users" });`,
    explanation: "The middleware pattern chains RequestDelegate functions by passing _next as a constructor argument; each middleware can run logic before and after calling the next delegate, enabling composable request processing.",
  },
  {
    id: "cs-b16-b3-pipeline-func-task",
    language: "csharp",
    title: "Pipeline pattern with Func<Task>",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

class Pipeline<T>
{
    private readonly List<Func<T, Func<Task>, Task>> _stages = new();

    public Pipeline<T> Use(Func<T, Func<Task>, Task> stage)
    {
        _stages.Add(stage);
        return this;
    }

    public async Task RunAsync(T context)
    {
        int index = 0;
        async Task Next()
        {
            if (index < _stages.Count)
                await _stages[index++](context, Next);
        }
        await Next();
    }
}

var pipeline = new Pipeline<string>()
    .Use(async (ctx, next) => { Console.WriteLine("A: " + ctx); await next(); Console.WriteLine("A done"); })
    .Use(async (ctx, next) => { Console.WriteLine("B: " + ctx); await next(); });

await pipeline.RunAsync("request");`,
    explanation: "A generic async pipeline calls each stage with the context and a Next delegate; stages run before-and-after next(), creating the classic onion/middleware model without tying you to any specific framework.",
  },
  {
    id: "cs-b16-b3-async-lazy",
    language: "csharp",
    title: "AsyncLazy<T> – initialise once, await anywhere",
    tag: "classes",
    code: `using System;
using System.Threading;
using System.Threading.Tasks;

class AsyncLazy<T>
{
    private readonly Lazy<Task<T>> _lazy;

    public AsyncLazy(Func<Task<T>> factory)
    {
        // LazyThreadSafetyMode.ExecutionAndPublication ensures the factory
        // runs only once even if multiple threads race to the first await
        _lazy = new Lazy<Task<T>>(factory, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public Task<T> Value => _lazy.Value;
    public TaskAwaiter<T> GetAwaiter() => _lazy.Value.GetAwaiter();
}

// One instance shared by many callers — factory runs exactly once
var config = new AsyncLazy<string>(async () =>
{
    await Task.Delay(50);    // simulate loading from disk
    return "loaded-config";
});

string c1 = await config;
string c2 = await config;   // same Task, no second execution
Console.WriteLine(c1 == c2);  // True`,
    explanation: "AsyncLazy<T> wraps Lazy<Task<T>> so the async factory runs exactly once regardless of concurrent access; the resulting Task is cached and can be awaited repeatedly by any number of callers.",
  },
  {
    id: "cs-b16-b3-actor-model-channel",
    language: "csharp",
    title: "Actor model with Channel<T>",
    tag: "classes",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

class CounterActor
{
    private readonly Channel<Func<int, int>> _mailbox =
        Channel.CreateUnbounded<Func<int, int>>();
    private int _state = 0;

    public CounterActor() => Task.Run(ProcessAsync);

    private async Task ProcessAsync()
    {
        await foreach (var msg in _mailbox.Reader.ReadAllAsync())
            _state = msg(_state);   // single-threaded state mutation
    }

    // Fire-and-forget message send
    public void Send(Func<int, int> msg) => _mailbox.Writer.TryWrite(msg);

    public async Task<int> GetAsync()
    {
        var tcs = new TaskCompletionSource<int>();
        Send(s => { tcs.SetResult(s); return s; });
        return await tcs.Task;
    }
}

var actor = new CounterActor();
actor.Send(s => s + 1);
actor.Send(s => s + 10);
await Task.Delay(50);
Console.WriteLine(await actor.GetAsync());  // 11`,
    explanation: "An actor encapsulates mutable state and processes messages sequentially from a Channel mailbox; because only the ProcessAsync loop touches _state, no locks are needed despite concurrent senders.",
  },
  {
    id: "cs-b16-b3-background-service",
    language: "csharp",
    title: "BackgroundService – hosted long-running work",
    tag: "classes",
    code: `using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;

class HeartbeatService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Loop until the host requests shutdown
        while (!stoppingToken.IsCancellationRequested)
        {
            Console.WriteLine(\$"[heartbeat] {System.DateTime.UtcNow:HH:mm:ss}");
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }
}

// Registration in Program.cs:
// builder.Services.AddHostedService<HeartbeatService>();

// Standalone demo
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
var svc = new HeartbeatService();
try { await svc.StartAsync(cts.Token); await Task.Delay(Timeout.Infinite, cts.Token); }
catch (OperationCanceledException) { await svc.StopAsync(CancellationToken.None); }`,
    explanation: "BackgroundService is the standard base class for hosted background work in .NET; override ExecuteAsync and loop until stoppingToken is cancelled, letting the generic host manage lifetime.",
  },
  {
    id: "cs-b16-b3-async-streaming-vs-buffered-family",
    language: "csharp",
    title: "Async streaming vs buffered – design tradeoff",
    tag: "families",
    code: `using System.Collections.Generic;
using System.Threading.Tasks;

// BUFFERED: all data in memory at once — simple, but high peak memory
async Task<List<int>> BufferedAsync()
{
    await Task.Delay(10);              // simulate DB query
    return Enumerable.Range(0, 1000).ToList();
}

// STREAMING: items flow one at a time — lower memory, back-pressure
async IAsyncEnumerable<int> StreamingAsync()
{
    for (int i = 0; i < 1000; i++)
    {
        await Task.Delay(0);           // yield to event loop
        yield return i;
    }
}

// Buffered: all 1000 items allocated before first Console.Write
foreach (int n in await BufferedAsync()) { /* process */ }

// Streaming: one item at a time, consumer controls the pace
await foreach (int n in StreamingAsync()) { /* process */ }
Console.WriteLine("done");`,
    explanation: "Buffered responses are simpler and enable random access but spike memory for large results; streaming IAsyncEnumerable<T> keeps memory flat and lets the consumer apply back-pressure, which is critical for large datasets or slow consumers.",
  },
  {
    id: "cs-b16-b3-channel-bounded-unbounded",
    language: "csharp",
    title: "Channel<T> – bounded vs unbounded",
    tag: "structures",
    code: `using System.Threading.Channels;

// Unbounded: writer never blocks, memory grows with unread items
var unbounded = Channel.CreateUnbounded<int>();
unbounded.Writer.TryWrite(1);   // always succeeds

// Bounded: back-pressure — writer blocks/drops when full
var bounded = Channel.CreateBounded<int>(new BoundedChannelOptions(capacity: 10)
{
    FullMode = BoundedChannelFullMode.Wait,   // await WriteAsync blocks when full
    // or: DropOldest, DropNewest, DropWrite
    SingleWriter = false,
    SingleReader = false,
});

await bounded.Writer.WriteAsync(42);  // blocks if capacity reached
int val = await bounded.Reader.ReadAsync();
Console.WriteLine(val);  // 42`,
    explanation: "Unbounded channels grow without limit and suit low-volume or bursty producers; bounded channels enforce back-pressure via the FullMode policy, which is essential for memory-safe high-throughput pipelines.",
  },
  {
    id: "cs-b16-b3-channel-reader-writer-pattern",
    language: "csharp",
    title: "Channel Reader/Writer separation pattern",
    tag: "structures",
    code: `using System.Threading.Channels;
using System.Threading.Tasks;

// Expose only the Reader to consumers, only the Writer to producers
static ChannelReader<int> StartProducer()
{
    var ch = Channel.CreateUnbounded<int>();

    Task.Run(async () =>
    {
        for (int i = 0; i < 5; i++)
        {
            await Task.Delay(20);
            await ch.Writer.WriteAsync(i);
        }
        ch.Writer.Complete();
    });

    return ch.Reader;   // caller cannot write
}

await foreach (int item in StartProducer().ReadAllAsync())
    Console.Write(item + " ");   // 0 1 2 3 4`,
    explanation: "Returning only ChannelReader<T> from a producer method enforces the producer/consumer separation at the type level — callers cannot accidentally write to the channel and break the protocol.",
  },
  {
    id: "cs-b16-b3-pipe-reader-writer",
    language: "csharp",
    title: "System.IO.Pipelines – PipeReader/PipeWriter",
    tag: "structures",
    code: `using System.IO.Pipelines;
using System.Text;
using System.Threading.Tasks;

var pipe = new Pipe();

async Task WriteAsync()
{
    string msg = "Hello from Pipe!";
    byte[] bytes = Encoding.UTF8.GetBytes(msg);
    await pipe.Writer.WriteAsync(bytes);
    await pipe.Writer.CompleteAsync();
}

async Task ReadAsync()
{
    while (true)
    {
        ReadResult result = await pipe.Reader.ReadAsync();
        System.Buffers.ReadOnlySequence<byte> buffer = result.Buffer;
        Console.WriteLine(Encoding.UTF8.GetString(buffer));
        pipe.Reader.AdvanceTo(buffer.End);
        if (result.IsCompleted) break;
    }
}

await Task.WhenAll(WriteAsync(), ReadAsync());`,
    explanation: "System.IO.Pipelines provides zero-copy buffer management for high-throughput I/O; PipeWriter exposes buffer segments the writer fills directly, and PipeReader consumes them without extra copies.",
  },
  {
    id: "cs-b16-b3-array-pool-buffers",
    language: "csharp",
    title: "ArrayPool<byte> – rent and return buffers",
    tag: "structures",
    code: `using System.Buffers;
using System.Text;

ArrayPool<byte> pool = ArrayPool<byte>.Shared;

// Rent a buffer — may be larger than requested
byte[] buffer = pool.Rent(minimumLength: 1024);
try
{
    // Use only the first 1024 bytes; buffer.Length may be larger
    int written = Encoding.UTF8.GetBytes("Hello, ArrayPool!", buffer);
    Console.WriteLine(Encoding.UTF8.GetString(buffer, 0, written));
    Console.WriteLine(\$"buffer.Length={buffer.Length}, written={written}");
}
finally
{
    pool.Return(buffer, clearArray: false);  // return to pool
}`,
    explanation: "ArrayPool<T>.Shared rents pre-allocated arrays from a thread-safe pool, eliminating GC pressure for frequent buffer allocations in hot paths like network I/O; always return buffers in a finally block.",
  },
  {
    id: "cs-b16-b3-periodic-timer",
    language: "csharp",
    title: "PeriodicTimer – async-native timer (NET 6+)",
    tag: "structures",
    code: `using System.Threading;
using System.Threading.Tasks;

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(200));

try
{
    int tick = 0;
    // WaitForNextTickAsync returns false when timer is disposed or token cancelled
    while (await timer.WaitForNextTickAsync(cts.Token))
    {
        Console.WriteLine(\$"tick {++tick} at {DateTime.UtcNow:HH:mm:ss.fff}");
    }
}
catch (OperationCanceledException) { /* expected */ }

Console.WriteLine("timer stopped");`,
    explanation: "PeriodicTimer (NET 6+) is the async-native alternative to System.Timers.Timer; WaitForNextTickAsync suspends without blocking a thread and returns false cleanly when disposed or cancelled.",
  },
  {
    id: "cs-b16-b3-time-provider",
    language: "csharp",
    title: "TimeProvider – testable time abstraction (NET 8+)",
    tag: "structures",
    code: `using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Time.Testing; // FakeTimeProvider

class DeadlineChecker
{
    private readonly TimeProvider _clock;
    public DeadlineChecker(TimeProvider clock) => _clock = clock;

    public bool IsExpired(DateTimeOffset expiry)
        => _clock.GetUtcNow() >= expiry;
}

// In tests: inject FakeTimeProvider to control time
// var fake = new FakeTimeProvider();
// fake.SetUtcNow(DateTimeOffset.UtcNow.AddDays(1));
// var checker = new DeadlineChecker(fake);

// In production: inject TimeProvider.System
var checker = new DeadlineChecker(TimeProvider.System);
Console.WriteLine(checker.IsExpired(DateTimeOffset.UtcNow.AddDays(-1)));  // True`,
    explanation: "TimeProvider (NET 8+) abstracts DateTime.UtcNow and Task.Delay into an injectable service; swap in FakeTimeProvider (Microsoft.Extensions.Time.Testing) in tests to control time without Thread.Sleep.",
  },
  {
    id: "cs-b16-b3-socket-async-event-args",
    language: "csharp",
    title: "SocketAsyncEventArgs – high-performance async sockets",
    tag: "structures",
    code: `using System.Net.Sockets;

// SocketAsyncEventArgs avoids allocations per I/O operation
// by reusing the args object across multiple send/receive calls
var args = new SocketAsyncEventArgs();
args.SetBuffer(new byte[4096], 0, 4096);   // pin a fixed buffer

args.Completed += (sender, e) =>
{
    if (e.SocketError == SocketError.Success)
        Console.WriteLine(\$"received {e.BytesTransferred} bytes");
};

// Typical usage in a receive loop:
// if (!socket.ReceiveAsync(args))
//     HandleReceive(args);   // completed synchronously

Console.WriteLine(\$"buffer size: {args.Buffer!.Length}");
args.Dispose();`,
    explanation: "SocketAsyncEventArgs is the highest-performance async socket API; it avoids per-call heap allocations by reusing the event args object and its pinned buffer across many I/O operations.",
  },
  {
    id: "cs-b16-b3-iasyncenumerable-pagination",
    language: "csharp",
    title: "IAsyncEnumerable pagination – lazy page fetching",
    tag: "structures",
    code: `using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

async IAsyncEnumerable<string> FetchAllPagesAsync(
    [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct = default)
{
    int page = 1;
    while (true)
    {
        // Simulate fetching a page from an API
        await Task.Delay(10, ct);
        var items = Enumerable.Range((page - 1) * 3, 3)
                              .Select(i => \$"item-{i}")
                              .ToList();

        foreach (var item in items)
            yield return item;

        if (page++ >= 3) break;   // only 3 pages total
    }
}

await foreach (string item in FetchAllPagesAsync())
    Console.Write(item + " ");`,
    explanation: "Wrapping paginated APIs in an async iterator hides the paging logic from the caller; the consumer gets a flat async stream and back-pressure means the next page isn't fetched until the current one is consumed.",
  },
  {
    id: "cs-b16-b3-memory-span-zero-copy",
    language: "csharp",
    title: "Memory<T> and Span<T> – zero-copy slicing",
    tag: "structures",
    code: `using System;

byte[] buffer = new byte[64];
new Random(42).NextBytes(buffer);

// Span<T>: stack-only, synchronous; zero-copy slice of any contiguous memory
Span<byte> slice = buffer.AsSpan(16, 16);
slice.Fill(0xFF);
Console.WriteLine(buffer[20]);   // 255

// Memory<T>: heap-safe, can be stored in fields and used across awaits
Memory<byte> mem = buffer.AsMemory(0, 32);
// Pass to async API:
// await stream.WriteAsync(mem);

Console.WriteLine(\$"Span slice length: {slice.Length}");
Console.WriteLine(\$"Memory length: {mem.Length}");`,
    explanation: "Span<T> and Memory<T> represent contiguous memory slices without copying; Span is restricted to synchronous stack use while Memory<T> can survive await points, making them the zero-allocation tools for I/O buffers.",
  },
  {
    id: "cs-b16-b3-concurrent-dictionary",
    language: "csharp",
    title: "ConcurrentDictionary – thread-safe cache",
    tag: "structures",
    code: `using System.Collections.Concurrent;

var cache = new ConcurrentDictionary<string, int>(StringComparer.Ordinal);

// GetOrAdd: atomically get or compute-and-add
int v1 = cache.GetOrAdd("key", k => k.Length);   // computed
int v2 = cache.GetOrAdd("key", k => 99);          // existing value returned
Console.WriteLine(v1 == v2);   // True — factory called only once per key

// AddOrUpdate: thread-safe increment
cache.AddOrUpdate("counter", 1, (k, old) => old + 1);
cache.AddOrUpdate("counter", 1, (k, old) => old + 1);
Console.WriteLine(cache["counter"]);  // 2

// TryGetValue for lock-free read
if (cache.TryGetValue("key", out int val))
    Console.WriteLine(val);`,
    explanation: "ConcurrentDictionary provides atomic GetOrAdd and AddOrUpdate operations that are safe for concurrent access; the value factory in GetOrAdd may be called multiple times under high contention, so keep it side-effect-free.",
  },
  {
    id: "cs-b16-b3-immutable-list-collection",
    language: "csharp",
    title: "ImmutableList<T> – thread-safe persistent collection",
    tag: "structures",
    code: `using System.Collections.Immutable;

// ImmutableList is structurally shared — Add returns a new list
var original = ImmutableList.Create(1, 2, 3);
var added    = original.Add(4);        // new list; original unchanged
var removed  = added.Remove(2);        // new list

Console.WriteLine(string.Join(",", original));  // 1,2,3
Console.WriteLine(string.Join(",", added));     // 1,2,3,4
Console.WriteLine(string.Join(",", removed));   // 1,3,4

// Safe to share across threads without locking
// Use ImmutableList.Builder for batch mutations (O(n) instead of O(n^2))
var builder = original.ToBuilder();
builder.Add(5); builder.Add(6);
var bulk = builder.ToImmutable();
Console.WriteLine(string.Join(",", bulk));  // 1,2,3,5,6`,
    explanation: "Immutable collections use structural sharing so each Add/Remove creates a new version with minimal copying; because they never change, they're inherently thread-safe and suitable for shared read-heavy state.",
  },
  {
    id: "cs-b16-b3-lazy-t",
    language: "csharp",
    title: "Lazy<T> – thread-safe one-time initialisation",
    tag: "structures",
    code: `using System;
using System.Threading;

// LazyThreadSafetyMode.ExecutionAndPublication: factory runs once
var lazyConfig = new Lazy<string>(
    () =>
    {
        Console.WriteLine("computing...");
        Thread.Sleep(10);
        return "configuration-value";
    },
    LazyThreadSafetyMode.ExecutionAndPublication);

// Multiple threads all get the same initialised value
var t1 = new Thread(() => Console.WriteLine(lazyConfig.Value));
var t2 = new Thread(() => Console.WriteLine(lazyConfig.Value));
t1.Start(); t2.Start();
t1.Join();  t2.Join();
// "computing..." printed exactly once`,
    explanation: "Lazy<T> defers initialisation until first access and caches the result; ExecutionAndPublication mode ensures the factory runs exactly once even under concurrent access, making it ideal for expensive singletons.",
  },
  {
    id: "cs-b16-b3-object-pool",
    language: "csharp",
    title: "ObjectPool<T> – reuse expensive objects",
    tag: "structures",
    code: `using Microsoft.Extensions.ObjectPool;
using System.Text;

// DefaultObjectPoolProvider creates pools with sensible defaults
var provider = new DefaultObjectPoolProvider();
ObjectPool<StringBuilder> pool = provider.CreateStringBuilderPool();

// Rent a StringBuilder from the pool
StringBuilder sb = pool.Get();
try
{
    sb.Append("Hello, ");
    sb.Append("ObjectPool!");
    Console.WriteLine(sb.ToString());
}
finally
{
    pool.Return(sb);  // sb is cleared and returned to the pool
}`,
    explanation: "ObjectPool<T> (Microsoft.Extensions.ObjectPool) reduces GC pressure for objects that are expensive to create and safe to reset; the pool lends an instance, and Return clears and reclaims it for future use.",
  },
  {
    id: "cs-b16-b3-execution-context-flow",
    language: "csharp",
    title: "ExecutionContext flow across awaits",
    tag: "types",
    code: `using System.Threading;
using System.Threading.Tasks;

// AsyncLocal flows with the ExecutionContext across awaits
var requestId = new AsyncLocal<string>();
requestId.Value = "req-abc";

async Task Inner()
{
    // Even after awaiting (potentially on a different thread), value is preserved
    await Task.Delay(10);
    Console.WriteLine(\$"inner sees: {requestId.Value}");  // req-abc
}

async Task Outer()
{
    await Inner();
    Console.WriteLine(\$"outer sees: {requestId.Value}");  // req-abc
}

await Outer();`,
    explanation: "ExecutionContext is automatically captured and restored across every await point, which is why AsyncLocal<T> values survive thread-pool thread switches — the logical context flows even when the physical thread changes.",
  },
  {
    id: "cs-b16-b3-suppress-flow",
    language: "csharp",
    title: "ExecutionContext.SuppressFlow – opt out of context flow",
    tag: "types",
    code: `using System.Threading;
using System.Threading.Tasks;

var sensitive = new AsyncLocal<string>();
sensitive.Value = "secret";

// Without suppression — child task inherits context
var leaked = Task.Run(() => Console.WriteLine("leaked: " + sensitive.Value)); // "secret"
await leaked;

// With SuppressFlow — child task gets a blank context
using (ExecutionContext.SuppressFlow())
{
    var isolated = Task.Run(() =>
        Console.WriteLine("suppressed: " + (sensitive.Value ?? "null")));  // null
    await isolated;
}`,
    explanation: "ExecutionContext.SuppressFlow() prevents the current execution context (including AsyncLocal values) from flowing into spawned Tasks, which is useful for fire-and-forget work that should not inherit sensitive ambient state.",
  },
  {
    id: "cs-b16-b3-task-scheduler",
    language: "csharp",
    title: "TaskScheduler.Current vs TaskScheduler.Default",
    tag: "caveats",
    code: `using System.Threading.Tasks;

// TaskScheduler.Default: the thread pool scheduler (always safe)
// TaskScheduler.Current: scheduler of the currently running task
// In most cases they are the same, but ContinueWith can change Current

Task workTask = Task.Factory.StartNew(() =>
{
    Console.WriteLine(\$"Current == Default: {TaskScheduler.Current == TaskScheduler.Default}");
});
await workTask;  // True

// Danger: ContinueWith captures TaskScheduler.Current at the CALL site
// Inside a UI context, TaskScheduler.Current might be the UI scheduler
// ContinueWith would then marshal to the UI thread unexpectedly
var safe = Task.Delay(10).ContinueWith(
    _ => Console.WriteLine("explicit scheduler"),
    TaskScheduler.Default);   // always use Default for background work
await safe;`,
    explanation: "Relying on TaskScheduler.Current in library code is risky because it varies depending on where the code runs; always pass TaskScheduler.Default explicitly to ContinueWith to guarantee thread-pool scheduling.",
  },
  {
    id: "cs-b16-b3-sync-context-captured-ui",
    language: "csharp",
    title: "Caveat: SynchronizationContext captured in UI apps",
    tag: "caveats",
    code: `using System.Threading;
using System.Threading.Tasks;

// In WinForms/WPF: SynchronizationContext.Current is the UI dispatcher
// Every await without ConfigureAwait(false) marshals the continuation
// back to the UI thread — good for UI updates, bad for libraries

async Task GoodLibraryMethodAsync()
{
    // Library code: opt out of context capture to avoid unnecessary marshalling
    await Task.Delay(100).ConfigureAwait(false);
    // runs on thread pool thread — cannot touch UI here, but that's fine
}

async Task GoodUiMethodAsync()
{
    await GoodLibraryMethodAsync();   // no ConfigureAwait here
    // Continuation correctly returns to UI thread
    Console.WriteLine("back on UI thread: " + (SynchronizationContext.Current != null));
}

// Standalone console app has null SynchronizationContext so this is a no-op
await GoodUiMethodAsync();`,
    explanation: "In UI frameworks, the SynchronizationContext marshals async continuations back to the UI thread; library code should always use ConfigureAwait(false) to avoid unnecessary context switches and potential deadlocks.",
  },
  {
    id: "cs-b16-b3-async-lambda-inference",
    language: "csharp",
    title: "Caveat: async lambda type inference ambiguity",
    tag: "caveats",
    code: `using System;
using System.Threading.Tasks;

// The compiler infers async () => {} as Func<Task>, not Action
// This is usually correct but can surprise when overloads exist
void Accept(Action a) => Console.WriteLine("Action");
void Accept(Func<Task> f) => Console.WriteLine("Func<Task>");

// async lambda — inferred as Func<Task>
Accept(async () => await Task.Delay(0));   // "Func<Task>"

// Non-async lambda — inferred as Action (no return value)
Accept(() => { });   // "Action"

// Explicitly annotate when needed to avoid ambiguity
Func<Task> asyncFunc = async () => await Task.Delay(0);
Action syncAction   = () => { };`,
    explanation: "An async lambda without a return type is inferred as Func<Task>, not Action; this matters when both overloads exist because the compiler picks Func<Task>, and exceptions surface through the Task, not synchronously.",
  },
  {
    id: "cs-b16-b3-forgetting-await-returns-task",
    language: "csharp",
    title: "Caveat: forgetting await returns Task not result",
    tag: "caveats",
    code: `using System.Threading.Tasks;

async Task<int> ComputeAsync() { await Task.Delay(1); return 42; }

// WRONG: type is Task<int>, not int — no compilation error!
Task<int> missingAwait = ComputeAsync();   // not awaited
// missingAwait.Result would block and could deadlock

// CORRECT
int result = await ComputeAsync();
Console.WriteLine(result);   // 42

// A common mistake in LINQ:
// var results = items.Select(i => ComputeAsync(i)).ToList();
// results is List<Task<int>>, not List<int>!
// Fix: use Task.WhenAll
// var results = await Task.WhenAll(items.Select(i => ComputeAsync(i)));`,
    explanation: "Calling an async method without await compiles fine but gives you a Task<T>, not T; this silent mistake is especially common inside LINQ where the compiler infers List<Task<T>> instead of the expected List<T>.",
  },
  {
    id: "cs-b16-b3-http-client-vs-webclient-family",
    language: "csharp",
    title: "HttpClient vs WebClient – migration guide",
    tag: "families",
    code: `using System.Net;
using System.Net.Http;

// WebClient: synchronous, deprecated in NET 6+ — avoid in new code
#pragma warning disable SYSLIB0014
using var wc = new WebClient();
// string html = wc.DownloadString("https://example.com");  // blocks thread
#pragma warning restore SYSLIB0014

// HttpClient: async, reusable, supports cancellation, modern API
using var client = new HttpClient();

// Equivalent async operation
string html = await client.GetStringAsync("https://example.com");
Console.WriteLine(html.Length);

// Key differences:
// WebClient: one-shot, creates/closes connections per call, no pooling
// HttpClient: connection pooling, cookie containers, handler pipeline`,
    explanation: "WebClient is decorated with [Obsolete] in NET 6+ and lacks async support, connection pooling, and handler middleware; migrate to HttpClient or IHttpClientFactory for all HTTP work.",
  },
  {
    id: "cs-b16-b3-iasync-disposable-resource-management",
    language: "csharp",
    title: "IAsyncDisposable with both sync and async disposal",
    tag: "classes",
    code: `using System;
using System.Threading.Tasks;

// Implement both IDisposable and IAsyncDisposable for maximum compatibility
sealed class DualDispose : IDisposable, IAsyncDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (_disposed) return;
        // Synchronous cleanup path (blocks if needed)
        CleanupAsync().GetAwaiter().GetResult();
        _disposed = true;
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        await CleanupAsync();
        _disposed = true;
        GC.SuppressFinalize(this);
    }

    private async Task CleanupAsync()
    {
        await Task.Delay(5);   // simulate async flush
        Console.WriteLine("cleaned up");
    }
}

await using var d = new DualDispose();
Console.WriteLine("working");`,
    explanation: "Implementing both IDisposable and IAsyncDisposable lets consumers choose the right disposal path; prefer await using in async code and fall back to using in synchronous contexts that can't await.",
  },
  {
    id: "cs-b16-b3-middleware-pipeline-builder",
    language: "csharp",
    title: "Composable async middleware pipeline builder",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

class PipelineBuilder
{
    private readonly List<Func<Func<Task>, Func<Task>>> _middleware = new();

    public PipelineBuilder Use(Func<Func<Task>, Func<Task>> mw)
    {
        _middleware.Add(mw);
        return this;
    }

    public Func<Task> Build(Func<Task> terminal)
    {
        Func<Task> next = terminal;
        for (int i = _middleware.Count - 1; i >= 0; i--)
            next = _middleware[i](next);
        return next;
    }
}

var pipeline = new PipelineBuilder()
    .Use(next => async () => { Console.WriteLine("A before"); await next(); Console.WriteLine("A after"); })
    .Use(next => async () => { Console.WriteLine("B before"); await next(); Console.WriteLine("B after"); })
    .Build(async () => { Console.WriteLine("handler"); await Task.CompletedTask; });

await pipeline();`,
    explanation: "Building the pipeline by wrapping middleware from last to first ensures each layer correctly wraps the next; this pattern is exactly how ASP.NET Core's IApplicationBuilder.Use() and Build() work internally.",
  },
  {
    id: "cs-b16-b3-observable-async-subject",
    language: "csharp",
    title: "AsyncLazy with exception caching",
    tag: "classes",
    code: `using System;
using System.Threading;
using System.Threading.Tasks;

// AsyncLazy that caches exceptions so faulted values don't retry
class AsyncLazy<T>
{
    private readonly Lazy<Task<T>> _lazy;

    public AsyncLazy(Func<Task<T>> factory)
        => _lazy = new Lazy<Task<T>>(factory, LazyThreadSafetyMode.ExecutionAndPublication);

    public Task<T> Value => _lazy.Value;

    // Returns a new lazy if the previous attempt faulted
    public AsyncLazy<T> Reset() => new AsyncLazy<T>(() => _lazy.Value.IsCompletedSuccessfully
        ? _lazy.Value
        : throw new InvalidOperationException("reset only when faulted"));
}

var lazy = new AsyncLazy<string>(async () =>
{
    await Task.Delay(20);
    return "initialised";
});

Console.WriteLine(await lazy.Value);
Console.WriteLine(await lazy.Value);  // returns cached Task`,
    explanation: "Wrapping Lazy<Task<T>> caches both successful results and exceptions — a faulted Task is returned on every subsequent call, which prevents silently retrying a failed initialisation that may have left state inconsistent.",
  },
  {
    id: "cs-b16-b3-suppressed-flow-background",
    language: "csharp",
    title: "SuppressFlow for fire-and-forget background work",
    tag: "caveats",
    code: `using System.Threading;
using System.Threading.Tasks;

var requestId = new AsyncLocal<string>();
requestId.Value = "req-123";

// BAD: background task inherits the full execution context
Task.Run(async () =>
{
    await Task.Delay(10);
    // requestId.Value is "req-123" here — potentially unsafe leak
});

// GOOD: suppress context flow for truly independent background work
using (ExecutionContext.SuppressFlow())
{
    // Task.Run inside SuppressFlow does NOT inherit AsyncLocal values
    Task.Run(async () =>
    {
        await Task.Delay(10);
        Console.WriteLine(requestId.Value ?? "isolated");  // "isolated"
    });
}

await Task.Delay(50);`,
    explanation: "ExecutionContext.SuppressFlow prevents AsyncLocal values (like correlation IDs and tenant context) from leaking into fire-and-forget tasks that should not inherit the caller's logical context.",
  },
  {
    id: "cs-b16-b3-value-task-pooling",
    language: "csharp",
    title: "ValueTask and ManualResetValueTaskSourceCore – advanced pooling",
    tag: "types",
    code: `using System.Threading.Tasks;
using System.Threading.Tasks.Sources;

// IValueTaskSource enables reusable ValueTask machinery without Task allocation
// This is advanced infrastructure used by high-perf library authors
class PooledSource : IValueTaskSource<int>
{
    private ManualResetValueTaskSourceCore<int> _core;

    public ValueTask<int> AsTask() => new ValueTask<int>(this, _core.Version);

    public void SetResult(int result) => _core.SetResult(result);
    public void Reset() => _core.Reset();

    int IValueTaskSource<int>.GetResult(short token) => _core.GetResult(token);
    ValueTaskSourceStatus IValueTaskSource<int>.GetStatus(short token) => _core.GetStatus(token);
    void IValueTaskSource<int>.OnCompleted(Action<object?> c, object? s, short t, ValueTaskSourceOnCompletedFlags f)
        => _core.OnCompleted(c, s, t, f);
}

var src = new PooledSource();
var vt = src.AsTask();
src.SetResult(42);
Console.WriteLine(await vt);   // 42`,
    explanation: "IValueTaskSource with ManualResetValueTaskSourceCore lets library authors create pooled, reusable ValueTask sources with zero allocation per operation — the technique used internally by channels and sockets.",
  },
  {
    id: "cs-b16-b3-cancellation-linked-tokens",
    language: "csharp",
    title: "CancellationTokenSource.CreateLinkedTokenSource",
    tag: "structures",
    code: `using System.Threading;
using System.Threading.Tasks;

// Combine multiple tokens: cancel when ANY of them fires
var userCts = new CancellationTokenSource();         // user cancels
var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));  // timeout

using var linked = CancellationTokenSource.CreateLinkedTokenSource(
    userCts.Token, timeoutCts.Token);

try
{
    await Task.Delay(Timeout.Infinite, linked.Token);
}
catch (OperationCanceledException)
{
    bool byUser    = userCts.IsCancellationRequested;
    bool byTimeout = timeoutCts.IsCancellationRequested;
    Console.WriteLine(\$"user={byUser} timeout={byTimeout}");
}

// Simulate user cancel after 1 second
userCts.CancelAfter(TimeSpan.FromMilliseconds(100));
await Task.Delay(200);`,
    explanation: "CreateLinkedTokenSource creates a token that fires when any of its parent tokens are cancelled, enabling you to combine a user-cancellation token with a per-operation timeout without changing the method signature.",
  },
  {
    id: "cs-b16-b3-string-builder-reuse",
    language: "csharp",
    title: "StringBuilder pooling with ObjectPool in hot paths",
    tag: "structures",
    code: `using Microsoft.Extensions.ObjectPool;
using System.Text;
using System.Threading.Tasks;

var pool = new DefaultObjectPoolProvider().CreateStringBuilderPool(
    initialCapacity: 256, maximumRetainedCapacity: 4096);

async Task<string> BuildMessageAsync(int id)
{
    StringBuilder sb = pool.Get();
    try
    {
        sb.Append("Message #").Append(id).Append(": ");
        await Task.Delay(1);   // simulated async work
        sb.Append("processed at ").Append(DateTime.UtcNow.ToString("HH:mm:ss"));
        return sb.ToString();
    }
    finally
    {
        pool.Return(sb);   // clears and returns to pool
    }
}

string[] msgs = await Task.WhenAll(
    Enumerable.Range(1, 5).Select(BuildMessageAsync));
foreach (var m in msgs) Console.WriteLine(m);`,
    explanation: "Pooling StringBuilders eliminates frequent large-object heap allocations in hot async paths; the finally block guarantees the builder is returned even if an exception occurs inside the try.",
  },
  {
    id: "cs-b16-b3-progress-t-report",
    language: "csharp",
    title: "IProgress<T> – report structured progress",
    tag: "snippet",
    code: `using System;
using System.Threading.Tasks;

record ProgressReport(int Percent, string Stage);

async Task ProcessAsync(IProgress<ProgressReport>? progress = null)
{
    for (int i = 0; i <= 100; i += 25)
    {
        await Task.Delay(20);
        progress?.Report(new ProgressReport(i, i < 100 ? "working" : "done"));
    }
}

var prog = new Progress<ProgressReport>(r =>
    Console.WriteLine(\$"{r.Percent,3}% — {r.Stage}"));

await ProcessAsync(prog);`,
    explanation: "Using a record type as the progress payload lets you report rich structured progress without multiple events; Progress<T> captures the current SynchronizationContext so the callback runs on the correct thread.",
  },
  {
    id: "cs-b16-b3-span-string-operations",
    language: "csharp",
    title: "Span<char> – zero-alloc string slicing",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<char> ParseField(ReadOnlySpan<char> line, char delimiter, int fieldIndex)
{
    int start = 0, count = 0;
    for (int i = 0; i <= line.Length; i++)
    {
        bool end = i == line.Length || line[i] == delimiter;
        if (end)
        {
            if (count == fieldIndex)
                return line.Slice(start, i - start);
            start = i + 1;
            count++;
        }
    }
    return ReadOnlySpan<char>.Empty;
}

ReadOnlySpan<char> csv = "Alice,30,NYC".AsSpan();
Console.WriteLine(ParseField(csv, ',', 0).ToString());  // Alice
Console.WriteLine(ParseField(csv, ',', 2).ToString());  // NYC`,
    explanation: "ReadOnlySpan<char> lets you slice and parse strings without allocating substring objects; AsSpan() wraps the original string's memory, and Slice() creates a window into it — zero bytes copied.",
  },
  {
    id: "cs-b16-b3-configuration-options-pattern",
    language: "csharp",
    title: "IOptions<T> – strongly typed configuration",
    tag: "snippet",
    code: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

record AppSettings(string ApiUrl, int TimeoutSeconds);

// In DI setup:
var services = new ServiceCollection();
services.Configure<AppSettings>(opts =>
{
    opts.ApiUrl = "https://api.example.com";
    opts.TimeoutSeconds = 30;
});

var provider = services.BuildServiceProvider();

// Inject IOptions<AppSettings> into any service
var options = provider.GetRequiredService<IOptions<AppSettings>>();
AppSettings settings = options.Value;
Console.WriteLine(\$"URL: {settings.ApiUrl}, Timeout: {settings.TimeoutSeconds}s");`,
    explanation: "IOptions<T> injects strongly-typed configuration sections; prefer IOptionsSnapshot<T> in scoped services for per-request config changes, or IOptionsMonitor<T> for hot-reload support.",
  },
  {
    id: "cs-b16-b3-interop-p-invoke",
    language: "csharp",
    title: "P/Invoke – call native OS functions",
    tag: "snippet",
    code: `using System.Runtime.InteropServices;

// Declare the native function signature
[DllImport("libc", EntryPoint = "getpid")]
static extern int GetPid();

// On Windows use kernel32.dll instead:
// [DllImport("kernel32.dll")] static extern uint GetCurrentProcessId();

int pid = GetPid();
Console.WriteLine(\$"PID via P/Invoke: {pid}");
Console.WriteLine(\$"PID via Environment: {Environment.ProcessId}");  // same`,
    explanation: "P/Invoke (Platform Invoke) calls native C functions by declaring them with [DllImport]; the runtime handles marshalling between managed and unmanaged calling conventions.",
  },
  {
    id: "cs-b16-b3-record-positional",
    language: "csharp",
    title: "Positional records – immutable value objects",
    tag: "snippet",
    code: `// Positional record: compiler generates constructor, Deconstruct,
// equality, GetHashCode, and ToString automatically
record Point(double X, double Y)
{
    // Derived property
    public double DistanceTo(Point other) =>
        Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));
}

var p1 = new Point(0, 0);
var p2 = new Point(3, 4);

Console.WriteLine(p1.DistanceTo(p2));   // 5

// Non-destructive mutation via 'with'
var p3 = p2 with { Y = 0 };
Console.WriteLine(p3);   // Point { X = 3, Y = 0 }

// Value equality (not reference equality)
Console.WriteLine(new Point(3, 4) == p2);  // True`,
    explanation: "Positional records are concise immutable value types; the with expression creates a modified copy without mutation, and structural equality compares all properties by value automatically.",
  },
  {
    id: "cs-b16-b3-switch-expression",
    language: "csharp",
    title: "switch expression with pattern matching",
    tag: "snippet",
    code: `object[] values = { 1, "hello", 3.14, null!, true };

foreach (var val in values)
{
    string description = val switch
    {
        int n when n > 0  => \$"positive int: {n}",
        int n             => \$"non-positive int: {n}",
        string { Length: > 3 } s => \$"long string: {s}",
        string s          => \$"short string: {s}",
        double d          => \$"double: {d:F2}",
        null              => "null value",
        _                 => \$"other: {val.GetType().Name}",
    };
    Console.WriteLine(description);
}`,
    explanation: "Switch expressions with pattern matching classify values by type, shape, and guards in a single expression; the _ discard arm acts as the default, and when guards add additional conditions to patterns.",
  },
  {
    id: "cs-b16-b3-linq-groupby-aggregate",
    language: "csharp",
    title: "LINQ GroupBy and aggregate operations",
    tag: "snippet",
    code: `var orders = new[]
{
    new { Product = "Apple",  Region = "North", Amount = 100 },
    new { Product = "Banana", Region = "South", Amount = 200 },
    new { Product = "Apple",  Region = "North", Amount = 150 },
    new { Product = "Banana", Region = "North", Amount = 120 },
};

var summary = orders
    .GroupBy(o => o.Region)
    .Select(g => new
    {
        Region  = g.Key,
        Total   = g.Sum(o => o.Amount),
        Count   = g.Count(),
        Average = g.Average(o => o.Amount),
    })
    .OrderByDescending(x => x.Total);

foreach (var row in summary)
    Console.WriteLine(\$"{row.Region}: total={row.Total} avg={row.Average:F0}");`,
    explanation: "LINQ GroupBy returns IGrouping<TKey, TElement> collections; chaining Select with aggregate methods (Sum, Count, Average) produces summary rows without needing SQL or manual loops.",
  },
  {
    id: "cs-b16-b3-generic-constraints",
    language: "csharp",
    title: "Generic constraints – where clauses",
    tag: "snippet",
    code: `using System;
using System.Collections.Generic;

// Multiple constraints on a type parameter
T Max<T>(IEnumerable<T> source) where T : IComparable<T>
{
    T? result = default;
    bool first = true;
    foreach (var item in source)
    {
        if (first || item.CompareTo(result!) > 0)
        { result = item; first = false; }
    }
    return result!;
}

// new() constraint — must have a parameterless constructor
T Create<T>() where T : new() => new T();

Console.WriteLine(Max(new[] { 3, 1, 4, 1, 5, 9, 2, 6 }));  // 9
Console.WriteLine(Max(new[] { "banana", "apple", "cherry" }));  // cherry`,
    explanation: "Generic constraints (where T : IComparable<T>, new(), class, struct) restrict what types can be substituted, enabling you to call methods on T or use features like new() without boxing or reflection.",
  },
  {
    id: "cs-b16-b3-nullable-reference-annotations",
    language: "csharp",
    title: "Nullable reference types – annotation and flow",
    tag: "snippet",
    code: `#nullable enable
using System;
using System.Collections.Generic;

string? FindFirst(IEnumerable<string?> items, Func<string, bool> predicate)
{
    foreach (var item in items)
    {
        if (item is not null && predicate(item))
            return item;   // non-null path
    }
    return null;   // explicitly nullable return
}

string? result = FindFirst(new[] { null, "alpha", "beta" }, s => s.StartsWith("a"));

// Null-conditional and null-coalescing
Console.WriteLine(result?.ToUpper() ?? "not found");  // ALPHA

// Null-forgiving operator (!) — only when you know better than the compiler
string guaranteed = result!;   // asserts non-null; throws if wrong`,
    explanation: "Nullable reference type annotations (string? vs string) let the compiler track nullability flow, issuing warnings at potential NullReferenceException sites without runtime overhead.",
  },
  {
    id: "cs-b16-b3-async-lock-semaphore",
    language: "csharp",
    title: "Caveat: no await inside lock — use SemaphoreSlim",
    tag: "caveats",
    code: `using System.Threading;
using System.Threading.Tasks;

// WRONG: await inside lock{} is a compile error in C#
// lock (obj) { await DoWorkAsync(); }  // CS1996

// CORRECT: use SemaphoreSlim as an async-compatible mutex
var sem = new SemaphoreSlim(1, 1);   // initial=1, max=1 (binary semaphore)

async Task SafeWorkAsync(int id)
{
    await sem.WaitAsync();           // async acquire
    try
    {
        Console.WriteLine(\$"worker {id} has lock");
        await Task.Delay(50);        // await is safe here — no lock held
    }
    finally
    {
        sem.Release();               // always release
    }
}

await Task.WhenAll(SafeWorkAsync(1), SafeWorkAsync(2));`,
    explanation: "The C# compiler forbids await inside a lock block because locks are thread-affine and an await might resume on a different thread; SemaphoreSlim(1,1) provides the same mutual exclusion in an await-safe way.",
  },
  {
    id: "cs-b16-b3-continuation-task-scheduler",
    language: "csharp",
    title: "Understanding Task continuation scheduling",
    tag: "understanding",
    code: `using System.Threading;
using System.Threading.Tasks;

// Each await captures the current SynchronizationContext (or TaskScheduler)
// and posts the continuation back to it when the awaited task completes.

// In a console app (null SynchronizationContext):
// continuation runs on any thread-pool thread.

// In WinForms/WPF (DispatcherSynchronizationContext):
// continuation runs on the UI thread.

// You can observe this:
Console.WriteLine(\$"before await: thread {Thread.CurrentThread.ManagedThreadId}");
await Task.Delay(10);
Console.WriteLine(\$"after await:  thread {Thread.CurrentThread.ManagedThreadId}");
// In a console app these are usually DIFFERENT thread IDs
// In WPF they would be the SAME (UI thread) thread ID`,
    explanation: "The thread that resumes after an await depends on the captured SynchronizationContext; console apps have no context so continuations run on arbitrary thread-pool threads, while UI frameworks marshal them back to the UI thread.",
  },
  {
    id: "cs-b16-b3-async-method-builder",
    language: "csharp",
    title: "Understanding AsyncTaskMethodBuilder internals",
    tag: "understanding",
    code: `using System.Runtime.CompilerServices;
using System.Threading.Tasks;

// Every async Task method is paired with an AsyncTaskMethodBuilder<T>
// The builder:
//   1. Creates the Task that the caller awaits
//   2. Calls MoveNext() on the state machine when each awaited task completes
//   3. Calls SetResult / SetException on the Task when the method completes

// You can inspect this by looking at the generated IL, but here's the mental model:
async Task<int> ExampleAsync()
{
    // State 0 → await → State 1 → return
    await Task.Delay(1);   // AwaitUnsafeOnCompleted registers MoveNext as continuation
    return 42;             // builder.SetResult(42)
}

// The caller holds the Task, not the state machine
Task<int> t = ExampleAsync();
Console.WriteLine(await t);  // 42`,
    explanation: "AsyncTaskMethodBuilder orchestrates the state machine generated by the compiler: it creates the Task returned to callers and hooks MoveNext as a continuation on each awaited step, finalising the Task with SetResult or SetException.",
  },
  {
    id: "cs-b16-b3-iasyncenumerable-vs-observable",
    language: "csharp",
    title: "IAsyncEnumerable vs IObservable – pull vs push",
    tag: "understanding",
    code: `// IAsyncEnumerable<T>: PULL model — consumer controls the pace
// IObservable<T>:      PUSH model — producer controls the pace (Rx.NET)

// IAsyncEnumerable: consumer asks for next item with MoveNextAsync
async IAsyncEnumerable<int> PullStream()
{
    for (int i = 0; i < 5; i++)
    {
        await Task.Delay(20);   // producer waits for consumer's demand
        yield return i;
    }
}

await foreach (int n in PullStream())
    Console.Write(n + " ");   // consumer drives timing
Console.WriteLine();

// IObservable: producer pushes items at its own rate;
// consumer subscribes and handles OnNext/OnError/OnCompleted callbacks.
// Choose IAsyncEnumerable when you control the source;
// choose IObservable for event streams or reactive pipelines.`,
    explanation: "IAsyncEnumerable is pull-based (consumer calls MoveNextAsync), providing natural back-pressure; IObservable is push-based (producer calls OnNext), better for event streams where the source fires independently of consumer readiness.",
  },
  {
    id: "cs-b16-b3-hot-vs-cold-task",
    language: "csharp",
    title: "Understanding hot vs cold Tasks",
    tag: "understanding",
    code: `using System.Threading.Tasks;

// COLD Task (from TaskCompletionSource): doesn't start automatically
var tcs = new TaskCompletionSource<int>();
Task<int> coldTask = tcs.Task;  // not running yet
// Caller must call tcs.SetResult() to complete it

// HOT Task (from Task.Run / async method call): starts immediately
Task<int> hotTask = Task.Run(async () =>
{
    await Task.Delay(10);
    return 42;
});  // already running

// Awaiting a hot task multiple times returns the same cached result
int r1 = await hotTask;
int r2 = await hotTask;   // same Task, same result — no re-execution
Console.WriteLine(r1 == r2);  // True

tcs.SetResult(99);
Console.WriteLine(await coldTask);  // 99`,
    explanation: "Hot tasks begin executing the moment they're created (Task.Run, async method calls); cold tasks represent a future result that only completes when explicitly resolved via TaskCompletionSource, making them useful for wrapping callback-based APIs.",
  },
  {
    id: "cs-b16-b3-aggregate-exception-vs-operation-cancelled",
    language: "csharp",
    title: "AggregateException vs OperationCanceledException unwrapping",
    tag: "understanding",
    code: `using System;
using System.Threading;
using System.Threading.Tasks;

var cts = new CancellationTokenSource();
cts.Cancel();

// await unwraps AggregateException and re-throws the inner exception
try
{
    await Task.Run(() => throw new InvalidOperationException("test"), cts.Token);
}
catch (InvalidOperationException ex)
{
    Console.WriteLine("got: " + ex.Message);  // test
}

// Cancellation always surfaces as OperationCanceledException, not AggregateException
try
{
    await Task.Delay(1000, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("cancelled cleanly");
}`,
    explanation: "The await keyword automatically unwraps AggregateException to rethrow its first inner exception; cancellation is a special case that always arrives as OperationCanceledException (or TaskCanceledException, its subclass) regardless of how it was thrown internally.",
  },
  {
    id: "cs-b16-b3-parallel-for-each-async",
    language: "csharp",
    title: "Parallel.ForEachAsync – bounded async concurrency",
    tag: "snippet",
    code: `using System.Threading;
using System.Threading.Tasks;

var urls = Enumerable.Range(1, 10).Select(i => \$"https://httpbin.org/delay/{i % 3}");

// Process up to 4 URLs concurrently; each item is an async operation
await Parallel.ForEachAsync(
    urls,
    new ParallelOptions
    {
        MaxDegreeOfParallelism = 4,
        CancellationToken = CancellationToken.None,
    },
    async (url, ct) =>
    {
        await Task.Delay(50, ct);   // simulate HTTP call
        Console.WriteLine(\$"processed: {url}");
    });

Console.WriteLine("all done");`,
    explanation: "Parallel.ForEachAsync (NET 6+) processes an async workload with bounded concurrency; unlike Task.WhenAll with unlimited tasks, it ensures at most MaxDegreeOfParallelism async operations run simultaneously.",
  },
  {
    id: "cs-b16-b3-understanding-value-task-constraints",
    language: "csharp",
    title: "Understanding ValueTask single-await constraint",
    tag: "understanding",
    code: `using System.Threading.Tasks;

async ValueTask<int> OneShotAsync()
{
    await Task.Delay(1);
    return 42;
}

// CORRECT: await a ValueTask exactly once
int result = await OneShotAsync();
Console.WriteLine(result);  // 42

// WRONG: store and await multiple times — undefined behaviour!
// ValueTask<int> vt = OneShotAsync();
// int r1 = await vt;
// int r2 = await vt;   // may return garbage or throw

// CORRECT if you must await twice: convert to Task first
ValueTask<int> vt2 = OneShotAsync();
Task<int> task = vt2.AsTask();   // safe to await multiple times now
Console.WriteLine(await task);
Console.WriteLine(await task);   // OK — Task caches the result`,
    explanation: "ValueTask is a one-shot value type: awaiting it twice or storing it for later is undefined behaviour; call AsTask() to convert it to a reusable Task if you need to await or observe the result more than once.",
  },
];



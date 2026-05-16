import type { Snippet } from "./types";

export const csharpSnippets20260516B5: Snippet[] = [
  {
    id: "cs-b16-b5-span-stackalloc",
    language: "csharp",
    title: "Span<T> with stackalloc",
    tag: "snippet",
    code: `using System;

// Allocate a small buffer on the stack — zero heap pressure
Span<int> buffer = stackalloc int[8];
for (int i = 0; i < buffer.Length; i++)
    buffer[i] = i * i;

// Use it like any slice — no copying
ReadOnlySpan<int> view = buffer.Slice(2, 4);
foreach (int v in view)
    Console.Write(v + " ");   // 4 9 16 25`,
    explanation: "`stackalloc` places the buffer on the stack and wraps it in a `Span<T>` so it's bounds-checked; for small, short-lived arrays (≤ ~1 KB) this completely avoids GC pressure.",
  },
  {
    id: "cs-b16-b5-ref-struct-definition",
    language: "csharp",
    title: "ref struct definition",
    tag: "types",
    code: `using System;

// ref struct lives only on the stack — cannot be boxed or stored in a class field
ref struct SliceReader
{
    private ReadOnlySpan<byte> _data;
    private int _pos;

    public SliceReader(ReadOnlySpan<byte> data) { _data = data; _pos = 0; }

    public byte ReadByte() => _data[_pos++];
    public bool HasData => _pos < _data.Length;
}

ReadOnlySpan<byte> bytes = [10, 20, 30, 40];
var reader = new SliceReader(bytes);
while (reader.HasData)
    Console.Write(reader.ReadByte() + " ");   // 10 20 30 40`,
    explanation: "Marking a struct as `ref struct` lets it hold `Span<T>` fields and guarantees stack-only lifetime; the compiler enforces this by preventing boxing, async usage, and storage in heap objects.",
  },
  {
    id: "cs-b16-b5-arraypool-rent",
    language: "csharp",
    title: "System.Buffers.ArrayPool<T> rent and return",
    tag: "snippet",
    code: `using System;
using System.Buffers;

// Rent a buffer at least 1024 bytes — may be larger
byte[] buffer = ArrayPool<byte>.Shared.Rent(1024);
int actualLength = 0;
try
{
    // Simulate reading into the buffer
    actualLength = 512;
    var span = buffer.AsSpan(0, actualLength);
    span.Fill(0xAB);
    Console.WriteLine(\`Rented \${buffer.Length}, used \${actualLength}\`);
}
finally
{
    // Always return — clearArray:true wipes sensitive data
    ArrayPool<byte>.Shared.Return(buffer, clearArray: false);
}`,
    explanation: "`ArrayPool<byte>.Shared` maintains a thread-local cache of reusable arrays; renting avoids a GC allocation and returning lets other callers reuse the same memory without going back to the allocator.",
  },
  {
    id: "cs-b16-b5-stackalloc-vs-arraypool",
    language: "csharp",
    title: "stackalloc vs ArrayPool vs new T[] allocation strategy",
    tag: "families",
    code: `using System;
using System.Buffers;

int size = 256;

// stackalloc: best for small, short-lived, synchronous buffers
Span<byte> stack = stackalloc byte[size];

// ArrayPool: best for medium buffers (1 KB – 1 MB), avoids LOH
byte[] pooled = ArrayPool<byte>.Shared.Rent(size);
try { /* use pooled */ }
finally { ArrayPool<byte>.Shared.Return(pooled); }

// new T[]: simplest, fine when allocation rate is low
byte[] heap = new byte[size];

Console.WriteLine(\`stack=\${stack.Length} pooled=\${pooled.Length} heap=\${heap.Length}\`);`,
    explanation: "Choose `stackalloc` for buffers under ~1 KB in synchronous methods, `ArrayPool` for temporary buffers in hot paths, and plain `new T[]` when you need the array to outlive the method or be stored.",
  },
  {
    id: "cs-b16-b5-memory-t-async",
    language: "csharp",
    title: "Memory<T> for async Span",
    tag: "snippet",
    code: `using System;
using System.Threading.Tasks;

// Span<T> cannot cross an await boundary — use Memory<T> instead
async Task ProcessAsync(Memory<byte> buffer)
{
    // Simulate async work
    await Task.Delay(1);

    // Get a Span only in synchronous sections
    Span<byte> span = buffer.Span;
    span.Fill(0xFF);
    Console.WriteLine(\`Filled \${span.Length} bytes\`);
}

byte[] data = new byte[64];
await ProcessAsync(data.AsMemory());`,
    explanation: "`Memory<T>` is the async-safe counterpart of `Span<T>`; you store and pass it across `await` points then call `.Span` only in synchronous sections where the stack frame is guaranteed to be alive.",
  },
  {
    id: "cs-b16-b5-ref-struct-stackonly",
    language: "csharp",
    title: "Span<T> stack-only constraint",
    tag: "understanding",
    code: `using System;

class Container
{
    // ERROR: Span<T> fields are not allowed in regular classes
    // private Span<byte> _span;  // CS8345 compile error

    // Use Memory<T> or byte[] for heap storage instead
    private Memory<byte> _memory;

    public Container(int size) => _memory = new byte[size];

    public void Process()
    {
        // Span is fine as a local — stack-only within this method
        Span<byte> local = _memory.Span;
        local.Fill(42);
        Console.WriteLine(local[0]);    // 42
    }
}

new Container(8).Process();`,
    explanation: "`Span<T>` is a `ref struct` and the compiler enforces that it can only live on the stack; storing it as a class field, returning it from a method that crosses an `await`, or boxing it are all compile errors.",
  },
  {
    id: "cs-b16-b5-unsafe-fixed-pointer",
    language: "csharp",
    title: "unsafe fixed pointer to managed array",
    tag: "snippet",
    code: `using System;

unsafe
{
    int[] arr = [10, 20, 30, 40, 50];

    // Pin the array so GC doesn't move it during pointer arithmetic
    fixed (int* p = arr)
    {
        for (int i = 0; i < arr.Length; i++)
            Console.Write(*(p + i) + " ");   // 10 20 30 40 50
    }
    // After fixed block, array can be moved again
}`,
    explanation: "The `fixed` statement pins a managed array in place so the GC cannot relocate it, then gives you a raw pointer for C-style arithmetic; the pin is released automatically when the block exits.",
  },
  {
    id: "cs-b16-b5-unmanaged-constraint",
    language: "csharp",
    title: "unmanaged type constraint in generics",
    tag: "understanding",
    code: `using System;
using System.Runtime.InteropServices;

// T must be an unmanaged value type (no managed references)
unsafe T[] ReadStructArray<T>(ReadOnlySpan<byte> raw) where T : unmanaged
{
    int stride = sizeof(T);
    int count  = raw.Length / stride;
    T[] result = new T[count];
    for (int i = 0; i < count; i++)
        result[i] = MemoryMarshal.Read<T>(raw.Slice(i * stride, stride));
    return result;
}

ReadOnlySpan<byte> bytes = [1, 0, 2, 0, 3, 0];   // three little-endian short
short[] shorts = ReadStructArray<short>(bytes);
Console.WriteLine(string.Join(", ", shorts));      // 1, 2, 3`,
    explanation: "The `unmanaged` constraint allows `sizeof(T)` and pointer operations inside `unsafe` blocks; it accepts any value type whose fields are all themselves unmanaged (no `string`, `object`, etc.).",
  },
  {
    id: "cs-b16-b5-unsafe-struct-fixed-array",
    language: "csharp",
    title: "unsafe struct with inline fixed array",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
unsafe struct Packet
{
    public ushort Type;
    public ushort Length;
    public fixed byte Payload[16];   // inline 16-byte array
}

unsafe
{
    Packet pkt = default;
    pkt.Type = 0x0800;
    pkt.Length = 16;
    for (int i = 0; i < 16; i++)
        pkt.Payload[i] = (byte)i;

    Console.WriteLine(\`Type=\${pkt.Type:X4} Len=\${pkt.Length}\`);
    Console.WriteLine(pkt.Payload[0]);   // 0
}`,
    explanation: "A `fixed` array inside an `unsafe struct` embeds the bytes inline rather than storing a pointer, making the struct layout identical to a C struct and safe to pass directly to native code.",
  },
  {
    id: "cs-b16-b5-readonly-ref-struct",
    language: "csharp",
    title: "readonly ref struct immutability",
    tag: "types",
    code: `using System;

// readonly ref struct: stack-only AND all fields are readonly
readonly ref struct RoSlice
{
    private readonly ReadOnlySpan<int> _data;
    private readonly int _offset;

    public RoSlice(ReadOnlySpan<int> data, int offset)
    {
        _data   = data;
        _offset = offset;
    }

    public int this[int i] => _data[_offset + i];
    public int Length      => _data.Length - _offset;
}

int[] arr = [10, 20, 30, 40, 50];
var slice = new RoSlice(arr, 2);
Console.WriteLine(slice[0]);    // 30
Console.WriteLine(slice.Length); // 3`,
    explanation: "`readonly ref struct` combines the stack-only guarantee of `ref struct` with immutability of all fields; the compiler prevents any method from mutating the struct, which also eliminates defensive copies for `in` parameters.",
  },
  {
    id: "cs-b16-b5-sizeof-value-types",
    language: "csharp",
    title: "sizeof operator on value types",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct Header
{
    public uint Magic;     // 4 bytes
    public ushort Version; // 2 bytes
    public ushort Flags;   // 2 bytes
}

unsafe
{
    Console.WriteLine(sizeof(byte));    // 1
    Console.WriteLine(sizeof(int));     // 4
    Console.WriteLine(sizeof(double));  // 8
    Console.WriteLine(sizeof(Header));  // 8  (Pack=1, no padding)
}`,
    explanation: "`sizeof` works on any unmanaged type inside an `unsafe` block and gives the exact in-memory size including compiler padding; use `StructLayout(Pack=1)` to suppress padding and get the packed C-style size.",
  },
  {
    id: "cs-b16-b5-ref-struct-cannot-box",
    language: "csharp",
    title: "ref struct cannot be boxed",
    tag: "caveats",
    code: `using System;

ref struct MySpan
{
    public int Length;
}

// The following would all cause compile errors (CS0306, CS0029):
// object o = new MySpan();      // cannot box ref struct
// IDisposable d = new MySpan(); // cannot implement interfaces (except special)
// dynamic dyn = new MySpan();   // cannot use as dynamic

// Only valid as stack-local or field in another ref struct
MySpan s = new MySpan { Length = 10 };
Console.WriteLine(s.Length);   // 10`,
    explanation: "Boxing requires copying a value onto the heap, which is forbidden for `ref struct` because it may contain `Span<T>` fields that themselves point to stack memory — the compiler enforces this at compile time.",
  },
  {
    id: "cs-b16-b5-nativeint-nuint",
    language: "csharp",
    title: "nint and nuint — platform-dependent size",
    tag: "types",
    code: `using System;

// nint/nuint are pointer-sized integers: 4 bytes on x86, 8 bytes on x64
nint  signed   = -1;
nuint unsigned = 0xDEADBEEF;

Console.WriteLine(sizeof(nint));        // 8 on 64-bit
Console.WriteLine(sizeof(nuint));       // 8 on 64-bit
Console.WriteLine((long)signed);        // -1
Console.WriteLine((ulong)unsigned);     // 3735928559

// Useful for manual pointer arithmetic without unsafe
nuint addr = (nuint)0x1000;
addr += (nuint)64;
Console.WriteLine(addr.ToString("X")); // 1040`,
    explanation: "`nint` and `nuint` are C# 9 primitives that map to `IntPtr`/`UIntPtr` but with full arithmetic operator support; they're the safe way to do pointer-offset math without the `unsafe` keyword.",
  },
  {
    id: "cs-b16-b5-memorymarshal-cast",
    language: "csharp",
    title: "MemoryMarshal.Cast — reinterpret span element type",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

// Start with raw bytes (e.g., from a file or network)
byte[] raw = [0x01, 0x00, 0x00, 0x00,
              0x02, 0x00, 0x00, 0x00,
              0x03, 0x00, 0x00, 0x00];

// Reinterpret as int span — zero copy, same memory
ReadOnlySpan<int> ints = MemoryMarshal.Cast<byte, int>(raw);
Console.WriteLine(ints.Length);         // 3
Console.WriteLine(ints[0]);             // 1 (little-endian)
Console.WriteLine(ints[1]);             // 2
Console.WriteLine(ints[2]);             // 3`,
    explanation: "`MemoryMarshal.Cast<TFrom, TTo>` reinterprets the bytes of a span without copying; the new span's Length is adjusted so `Length * sizeof(TTo) == original.Length * sizeof(TFrom)`.",
  },
  {
    id: "cs-b16-b5-ref-struct-async",
    language: "csharp",
    title: "ref struct cannot be used in async methods",
    tag: "caveats",
    code: `using System;
using System.Threading.Tasks;

async Task DoWorkAsync()
{
    // ERROR: cannot use Span<T> (a ref struct) across an await
    // Span<byte> span = stackalloc byte[16]; // CS4012 if before await
    // await Task.Delay(1);
    // span[0] = 1; // span may be gone

    // Correct: use Span only in a synchronous helper, or use Memory<T>
    SyncHelper();
    await Task.Delay(1);
    Console.WriteLine("async done");
}

static void SyncHelper()
{
    Span<byte> span = stackalloc byte[16];
    span.Fill(0xFF);
    Console.WriteLine(span[0]);   // 255
}

await DoWorkAsync();`,
    explanation: "The C# compiler rejects `Span<T>` (and any `ref struct`) that straddles an `await` because the async state machine stores locals on the heap; use `Memory<T>` to pass buffers across `await` boundaries.",
  },
  {
    id: "cs-b16-b5-unsafe-vs-span-vs-memorymarshal",
    language: "csharp",
    title: "unsafe vs Span<T> vs MemoryMarshal — zero-copy approach",
    tag: "families",
    code: `using System;
using System.Runtime.InteropServices;

byte[] data = [1, 0, 2, 0, 3, 0, 4, 0];

// 1. unsafe pointer: most control, no bounds check, requires unsafe block
unsafe
{
    fixed (byte* p = data)
        Console.WriteLine(*(short*)p);   // 1  (little-endian)
}

// 2. MemoryMarshal: safe, zero-copy, bounds-checked
ReadOnlySpan<short> shorts = MemoryMarshal.Cast<byte, short>(data);
Console.WriteLine(shorts[0]);           // 1

// 3. BinaryPrimitives: endian-aware, most readable
Console.WriteLine(
    System.Buffers.Binary.BinaryPrimitives.ReadInt16LittleEndian(data));  // 1`,
    explanation: "For zero-copy type reinterpretation prefer `MemoryMarshal.Cast` (bounds-checked, no unsafe) over raw pointers; reach for `BinaryPrimitives` when endianness matters and for the clearest intent.",
  },
  {
    id: "cs-b16-b5-binaryprimitives",
    language: "csharp",
    title: "System.Buffers.Binary.BinaryPrimitives",
    tag: "structures",
    code: `using System;
using System.Buffers.Binary;

// Read/write integers with explicit endianness — no unsafe needed
byte[] buf = new byte[4];

BinaryPrimitives.WriteInt32LittleEndian(buf, 0x0102_0304);
Console.WriteLine(BitConverter.ToString(buf)); // 04-03-02-01

int val = BinaryPrimitives.ReadInt32LittleEndian(buf);
Console.WriteLine(val.ToString("X8"));         // 01020304

// Big-endian variant
BinaryPrimitives.WriteInt32BigEndian(buf, 0x0102_0304);
Console.WriteLine(BitConverter.ToString(buf)); // 01-02-03-04`,
    explanation: "`BinaryPrimitives` offers safe, allocation-free reading and writing of primitive integers with explicit byte order, replacing manual bit-shifting while remaining span-friendly for network and file protocols.",
  },
  {
    id: "cs-b16-b5-ispan-formattable",
    language: "csharp",
    title: "ISpanFormattable implementation",
    tag: "classes",
    code: `using System;

readonly struct Rgb : ISpanFormattable
{
    public byte R, G, B;
    public Rgb(byte r, byte g, byte b) => (R, G, B) = (r, g, b);

    // Called by string interpolation and string.Create for zero-alloc formatting
    public bool TryFormat(Span<char> dest, out int written, ReadOnlySpan<char> format, IFormatProvider? provider)
    {
        return dest.TryWrite(\$"#{R:X2}{G:X2}{B:X2}", out written);
    }

    public string ToString(string? format, IFormatProvider? provider)
        => \`#\${R:X2}\${G:X2}\${B:X2}\`;

    public override string ToString() => ToString(null, null);
}

var red = new Rgb(255, 0, 0);
Console.WriteLine(red);                   // #FF0000
Console.WriteLine(\$"Color: {red}");       // Color: #FF0000`,
    explanation: "`ISpanFormattable.TryFormat` lets the runtime write your type directly into a char destination buffer without intermediate string allocation; `string.Create` and interpolated string handlers call it automatically.",
  },
  {
    id: "cs-b16-b5-gchandle-pinning",
    language: "csharp",
    title: "GCHandle pinning prevents collection",
    tag: "caveats",
    code: `using System;
using System.Runtime.InteropServices;

byte[] data = [10, 20, 30, 40];

// Pin the array so the GC cannot move it
GCHandle handle = GCHandle.Alloc(data, GCHandleType.Pinned);
try
{
    IntPtr ptr = handle.AddrOfPinnedObject();
    Console.WriteLine(ptr != IntPtr.Zero);  // True
    // Safe to pass ptr to native code here
    Console.WriteLine(Marshal.ReadByte(ptr, 2)); // 30
}
finally
{
    handle.Free();   // MUST free — pinning fragments the heap
}`,
    explanation: "A `GCHandle.Pinned` handle prevents the GC from relocating the object while a native caller holds a raw pointer to it; always free it in a `finally` block because long-lived pins fragment the managed heap.",
  },
  {
    id: "cs-b16-b5-unsafe-as-reinterpret",
    language: "csharp",
    title: "Unsafe.As<TFrom,TTo> reinterpret cast",
    tag: "snippet",
    code: `using System;
using System.Runtime.CompilerServices;

// Reinterpret a float's bits as an int without unsafe pointers
float f = -1.5f;
int bits = Unsafe.As<float, int>(ref f);
Console.WriteLine(bits.ToString("X8"));   // BFC00000

// Round-trip
float back = Unsafe.As<int, float>(ref bits);
Console.WriteLine(back);                  // -1.5

// Also useful to avoid array covariance check overhead
object[] arr = ["hello", "world"];
string[] typed = Unsafe.As<string[]>(arr);
Console.WriteLine(typed[0]);              // hello`,
    explanation: "`Unsafe.As<TFrom,TTo>` reinterprets the bit pattern of a reference without copying; it replaces `BitConverter` round-trips for bit-casting and bypasses array type-check overhead — with no bounds or type safety guarantees.",
  },
  {
    id: "cs-b16-b5-marshal-allochglobal",
    language: "csharp",
    title: "Marshal.AllocHGlobal and FreeHGlobal",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

// Allocate 64 bytes of unmanaged (COM / GlobalAlloc) heap memory
IntPtr ptr = Marshal.AllocHGlobal(64);
try
{
    // Zero the memory manually (AllocHGlobal does NOT zero)
    unsafe { new Span<byte>((void*)ptr, 64).Clear(); }

    Marshal.WriteByte(ptr, 0, 0xAB);
    Console.WriteLine(Marshal.ReadByte(ptr, 0));   // 171
}
finally
{
    Marshal.FreeHGlobal(ptr);  // always free to avoid native leak
}`,
    explanation: "`Marshal.AllocHGlobal` allocates from the native Win32/glibc heap and returns an `IntPtr`; unlike `NativeMemory.Alloc` it goes through `GlobalAlloc` on Windows, which is required for some COM and interop scenarios.",
  },
  {
    id: "cs-b16-b5-span-in-param",
    language: "csharp",
    title: "in parameter defensive copy for non-readonly struct",
    tag: "understanding",
    code: `using System;

struct Mutable { public int X; public void Inc() => X++; }

readonly struct ReadOnly { public readonly int X; public ReadOnly(int x) => X = x; }

// in prevents copying at the call site BUT methods may still cause a copy
void PrintMutable(in Mutable m)
{
    // m.Inc() would make a hidden copy and increment THAT — not m
    Console.WriteLine(m.X);
}

void PrintReadOnly(in ReadOnly r)
{
    // No hidden copy: compiler knows readonly struct has no mutating methods
    Console.WriteLine(r.X);
}

var m = new Mutable { X = 5 };
PrintMutable(in m);    // 5 — no copy at call site, but method calls could copy

var r = new ReadOnly(5);
PrintReadOnly(in r);   // 5 — definitely no copy anywhere`,
    explanation: "Passing a non-`readonly` struct via `in` avoids copying at the call site, but the JIT may still emit a defensive copy inside the method before calling any instance method, negating the benefit — use `readonly struct` to eliminate all copies.",
  },
  {
    id: "cs-b16-b5-nativememory-alloc",
    language: "csharp",
    title: "NativeMemory.Alloc and Free",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

// NativeMemory.Alloc is the .NET 6+ wrapper around malloc
nuint size = 256;
unsafe
{
    void* ptr = NativeMemory.Alloc(size);
    try
    {
        // Zero-initialize (AlignedAlloc/Alloc do NOT zero)
        NativeMemory.Clear(ptr, size);

        byte* bytes = (byte*)ptr;
        bytes[0] = 42;
        Console.WriteLine(bytes[0]);   // 42
    }
    finally
    {
        NativeMemory.Free(ptr);
    }
}`,
    explanation: "`NativeMemory.Alloc` is the modern, cross-platform alternative to `Marshal.AllocHGlobal`; it maps to `malloc` everywhere and works well with `NativeMemory.AlignedAlloc` for SIMD alignment requirements.",
  },
  {
    id: "cs-b16-b5-stackalloc-in-loop",
    language: "csharp",
    title: "stackalloc in loop can overflow the stack",
    tag: "caveats",
    code: `using System;
using System.Buffers;

// DANGEROUS: stackalloc inside a loop grows the stack each iteration
// Uncomment to crash with StackOverflowException:
// for (int i = 0; i < 100_000; i++)
// {
//     Span<byte> buf = stackalloc byte[1024];  // never reclaimed in loop
//     buf[0] = 1;
// }

// SAFE: allocate once outside the loop
Span<byte> buffer = stackalloc byte[1024];
for (int i = 0; i < 100_000; i++)
{
    buffer.Clear();
    buffer[0] = (byte)(i & 0xFF);
}
Console.WriteLine(buffer[0]);`,
    explanation: "Each loop iteration with `stackalloc` inside the body grows the stack frame by that amount; because the stack frame isn't freed mid-loop, this quickly overflows the ~1 MB default stack — allocate once outside the loop instead.",
  },
  {
    id: "cs-b16-b5-vector-t-simd",
    language: "csharp",
    title: "System.Numerics.Vector<T> SIMD",
    tag: "structures",
    code: `using System;
using System.Numerics;

// Vector<T> width is determined at runtime (hardware SIMD width)
Console.WriteLine(Vector<float>.Count);    // e.g. 8 on AVX2

float[] a = [1, 2, 3, 4, 5, 6, 7, 8];
float[] b = [8, 7, 6, 5, 4, 3, 2, 1];
float[] c = new float[8];

int step = Vector<float>.Count;
for (int i = 0; i <= a.Length - step; i += step)
{
    var va = new Vector<float>(a, i);
    var vb = new Vector<float>(b, i);
    (va + vb).CopyTo(c, i);
}
Console.WriteLine(string.Join(", ", c));   // 9, 9, 9, 9, 9, 9, 9, 9`,
    explanation: "`Vector<T>` automatically uses the widest SIMD register the CPU supports (SSE2, AVX2, etc.); the JIT emits vectorized instructions transparently, making it the easiest entry point for portable SIMD code.",
  },
  {
    id: "cs-b16-b5-bitvector32",
    language: "csharp",
    title: "System.Numerics.BitVector32 — flags in a single int",
    tag: "structures",
    code: `using System;
using System.Collections.Specialized;

// Pack multiple boolean flags into one 32-bit integer
var bv = new BitVector32(0);

// Create masks for individual bits
int bit0 = BitVector32.CreateMask();
int bit1 = BitVector32.CreateMask(bit0);
int bit2 = BitVector32.CreateMask(bit1);

bv[bit0] = true;
bv[bit2] = true;

Console.WriteLine(bv[bit0]);   // True
Console.WriteLine(bv[bit1]);   // False
Console.WriteLine(bv[bit2]);   // True
Console.WriteLine(bv.Data);    // 5  (binary 101)`,
    explanation: "`BitVector32` wraps a single `int` and provides named-mask access to individual bits; `CreateMask` generates sequential single-bit masks, making it cleaner than raw bit arithmetic for flag-heavy state.",
  },
  {
    id: "cs-b16-b5-ref-return",
    language: "csharp",
    title: "ref return from a method",
    tag: "understanding",
    code: `using System;

int[] _data = [10, 20, 30, 40, 50];

// Return a reference to an element — no copy
ref int FindFirst(int[] arr, int target)
{
    for (int i = 0; i < arr.Length; i++)
        if (arr[i] == target)
            return ref arr[i];
    throw new ArgumentException("not found");
}

ref int slot = ref FindFirst(_data, 30);
Console.WriteLine(slot);   // 30
slot = 999;                // modifies the array directly
Console.WriteLine(_data[2]);  // 999`,
    explanation: "A `ref` return yields an alias to the original storage rather than a copy; assigning to the `ref` local propagates the change back to the source array without any boxing or extra allocation.",
  },
  {
    id: "cs-b16-b5-ispan-parsable",
    language: "csharp",
    title: "ISpanParsable<T> implementation",
    tag: "classes",
    code: `using System;

readonly struct HexByte : ISpanParsable<HexByte>
{
    public byte Value { get; }
    public HexByte(byte v) => Value = v;

    public static HexByte Parse(ReadOnlySpan<char> s, IFormatProvider? provider)
    {
        if (!TryParse(s, provider, out var result))
            throw new FormatException(\`Invalid hex byte: '\${s}'\`);
        return result;
    }

    public static bool TryParse(ReadOnlySpan<char> s, IFormatProvider? provider, out HexByte result)
    {
        if (byte.TryParse(s.TrimStart('#'), System.Globalization.NumberStyles.HexNumber, provider, out byte b))
        { result = new HexByte(b); return true; }
        result = default; return false;
    }

    public override string ToString() => \`0x\${Value:X2}\`;
}

var hb = HexByte.Parse("#FF", null);
Console.WriteLine(hb);   // 0xFF`,
    explanation: "`ISpanParsable<T>` extends `IParsable<T>` with a `ReadOnlySpan<char>` overload so parsing can avoid allocating a `string` copy when the input is already in a span — important for high-throughput text processing.",
  },
  {
    id: "cs-b16-b5-bitoperations-popcount",
    language: "csharp",
    title: "BitOperations.PopCount",
    tag: "snippet",
    code: `using System;
using System.Numerics;

uint value = 0b_1011_0111_1101_0011u;

// Count set bits (popcount / Hamming weight)
int setBits = BitOperations.PopCount(value);
Console.WriteLine(setBits);                     // 11

// Leading zeros (floor(log2(x)) = 31 - LeadingZeroCount for uint)
int leading = BitOperations.LeadingZeroCount(value);
Console.WriteLine(leading);                     // 16

// Trailing zeros
int trailing = BitOperations.TrailingZeroCount(value);
Console.WriteLine(trailing);                    // 0`,
    explanation: "`BitOperations.PopCount` emits a hardware `POPCNT` instruction on x64 (via JIT intrinsics) when the CPU supports it, making it far faster than a software bit-counting loop.",
  },
  {
    id: "cs-b16-b5-marshal-ptrtostructure",
    language: "csharp",
    title: "Marshal.PtrToStructure requires blittable types",
    tag: "caveats",
    code: `using System;
using System.Runtime.InteropServices;

// BLITTABLE struct: works with PtrToStructure
[StructLayout(LayoutKind.Sequential)]
struct BlittablePoint { public int X; public int Y; }

// NON-BLITTABLE: string causes PtrToStructure to do marshaling copies
[StructLayout(LayoutKind.Sequential)]
struct NonBlittable { public int Id; public string? Name; }

byte[] raw = [1, 0, 0, 0, 2, 0, 0, 0];
GCHandle h = GCHandle.Alloc(raw, GCHandleType.Pinned);
try
{
    var pt = Marshal.PtrToStructure<BlittablePoint>(h.AddrOfPinnedObject());
    Console.WriteLine(\`X=\${pt.X} Y=\${pt.Y}\`);  // X=1 Y=2
}
finally { h.Free(); }`,
    explanation: "`Marshal.PtrToStructure` works with blittable types (those with identical managed and native layouts) without copying; non-blittable types trigger field-by-field marshaling that allocates managed strings and arrays.",
  },
  {
    id: "cs-b16-b5-big-integer",
    language: "csharp",
    title: "System.Numerics.BigInteger",
    tag: "structures",
    code: `using System;
using System.Numerics;

// BigInteger handles arbitrary-precision integers
BigInteger factorial = 1;
for (int i = 2; i <= 50; i++)
    factorial *= i;

Console.WriteLine(factorial);
// 30414093201713378043612608166979581188299763898377856...

// Parsing and converting
BigInteger big = BigInteger.Parse("999999999999999999999999999999");
Console.WriteLine(big + 1);

// Works with all arithmetic operators
Console.WriteLine(BigInteger.Pow(2, 100));`,
    explanation: "`BigInteger` stores an arbitrary number of limbs on the heap and supports all arithmetic operators; it's the right choice when values might exceed `long` (2⁶³−1) or when exact large-integer computation is required.",
  },
  {
    id: "cs-b16-b5-scoped-keyword",
    language: "csharp",
    title: "scoped keyword (C# 11)",
    tag: "understanding",
    code: `using System;

// scoped restricts a ref or Span parameter from escaping the method
void Fill(scoped Span<byte> buffer, byte value)
{
    // Cannot return buffer, store it in a field, or let it escape
    buffer.Fill(value);
}

// Without scoped, the compiler must conservatively assume the span
// could outlive the method — which limits what callers can pass
Span<byte> local = stackalloc byte[8];
Fill(local, 0xFF);
Console.WriteLine(local[0]);   // 255`,
    explanation: "The `scoped` modifier (C# 11) tells the compiler that a `ref` or `Span` parameter will not escape the method body; this allows callers to safely pass stack-allocated spans that the compiler would otherwise reject.",
  },
  {
    id: "cs-b16-b5-span-field-in-ref-struct",
    language: "csharp",
    title: "ref struct with Span<T> fields",
    tag: "classes",
    code: `using System;

ref struct JsonTokenizer
{
    private ReadOnlySpan<char> _source;
    private int _pos;

    public JsonTokenizer(ReadOnlySpan<char> source)
    {
        _source = source;
        _pos = 0;
    }

    public bool TryReadString(out ReadOnlySpan<char> token)
    {
        while (_pos < _source.Length && _source[_pos] != '"') _pos++;
        if (_pos >= _source.Length) { token = default; return false; }
        int start = ++_pos;
        while (_pos < _source.Length && _source[_pos] != '"') _pos++;
        token = _source.Slice(start, _pos++ - start);
        return true;
    }
}

var tokenizer = new JsonTokenizer("\"hello\" \"world\"");
while (tokenizer.TryReadString(out var tok))
    Console.WriteLine(tok.ToString());`,
    explanation: "Only a `ref struct` can store `Span<T>` or `ReadOnlySpan<T>` as fields; this pattern lets you build zero-allocation parsers that slice into the original source without any string or array allocations.",
  },
  {
    id: "cs-b16-b5-vector128",
    language: "csharp",
    title: "System.Runtime.Intrinsics.Vector128<T>",
    tag: "structures",
    code: `using System;
using System.Runtime.Intrinsics;

// Create a 128-bit vector of four floats
var a = Vector128.Create(1.0f, 2.0f, 3.0f, 4.0f);
var b = Vector128.Create(4.0f, 3.0f, 2.0f, 1.0f);

// Add, multiply — JIT emits SSE/NEON instructions
var sum = a + b;
var product = a * b;

Console.WriteLine(sum[0]);      // 5
Console.WriteLine(sum[3]);      // 5
Console.WriteLine(product[0]);  // 4
Console.WriteLine(product[1]);  // 6`,
    explanation: "`Vector128<T>` targets a specific 128-bit register width (SSE on x64, NEON on ARM); unlike `Vector<T>` its width is fixed, giving predictable code generation for algorithms that require exactly 128-bit SIMD.",
  },
  {
    id: "cs-b16-b5-blittable-types",
    language: "csharp",
    title: "Blittable type definition",
    tag: "types",
    code: `using System;
using System.Runtime.InteropServices;

// Blittable: identical memory layout in managed and native heaps
[StructLayout(LayoutKind.Sequential)]
struct Vec3 { public float X, Y, Z; }

// Non-blittable: bool is marshaled (native bool may differ in size)
[StructLayout(LayoutKind.Sequential)]
struct Flags { public bool Active; public int Value; }

// Test blittability at runtime
bool IsBlittable<T>() where T : struct
{
    try { GCHandle.Alloc(new T[1], GCHandleType.Pinned).Free(); return true; }
    catch { return false; }
}

Console.WriteLine(IsBlittable<Vec3>());   // True
Console.WriteLine(IsBlittable<Flags>());  // False`,
    explanation: "A blittable type has the same memory representation in both managed and unmanaged memory; primitive integers and floats are blittable, but `bool`, `char`, and reference types require marshaling and are not.",
  },
  {
    id: "cs-b16-b5-pipinvoke-vs-cppcli",
    language: "csharp",
    title: "P/Invoke vs C++/CLI vs COM interop",
    tag: "families",
    code: `using System;
using System.Runtime.InteropServices;

// 1. P/Invoke: simplest, works with cdecl/stdcall C functions
[DllImport("libc", EntryPoint = "abs")]
static extern int CAbsoluteValue(int x);
Console.WriteLine(CAbsoluteValue(-42));    // 42

// 2. C++/CLI: full C++ access, Windows-only, requires mixed-mode DLL
// ref class ManagedWrapper { ... }  (separate .dll project)

// 3. COM: register-based, GUID-driven, Windows-centric
// dynamic excel = Activator.CreateInstance(Type.GetTypeFromProgID("Excel.Application"));

Console.WriteLine("P/Invoke done");`,
    explanation: "P/Invoke is the cross-platform choice for calling C-compatible functions via exported names; C++/CLI allows calling arbitrary C++ with managed wrappers (Windows only); COM interop integrates with the COM runtime for OLE/ActiveX.",
  },
  {
    id: "cs-b16-b5-biginteger-vs-long",
    language: "csharp",
    title: "BigInteger vs long vs Int128",
    tag: "families",
    code: `using System;
using System.Numerics;

// long: 64-bit, hardware arithmetic, max 9.2 × 10^18
long l = long.MaxValue;
Console.WriteLine(l);                          // 9223372036854775807

// Int128: 128-bit, software arithmetic on most CPUs (no overflow for reasonable inputs)
Int128 i128 = Int128.MaxValue;
Console.WriteLine(i128);                       // 170141183460469231731687303715884105727

// BigInteger: arbitrary size, heap allocation per operation, slower
BigInteger big = BigInteger.Pow(10, 50);
Console.WriteLine(big.ToString().Length);      // 51 digits`,
    explanation: "`long` is fastest (single CPU register), `Int128` (.NET 7+) handles values up to ~1.7×10³⁸ with software emulation on non-native CPUs, and `BigInteger` handles unlimited size at the cost of heap allocation per operation.",
  },
  {
    id: "cs-b16-b5-iutf8-span-formattable",
    language: "csharp",
    title: "IUtf8SpanFormattable implementation",
    tag: "classes",
    code: `using System;
using System.Text;

readonly struct Version : IUtf8SpanFormattable
{
    public int Major, Minor, Patch;
    public Version(int major, int minor, int patch)
        => (Major, Minor, Patch) = (major, minor, patch);

    public bool TryFormat(Span<byte> utf8Dest, out int bytesWritten,
        ReadOnlySpan<char> format, IFormatProvider? provider)
    {
        return Utf8.TryWrite(utf8Dest, \$"{Major}.{Minor}.{Patch}", out bytesWritten);
    }

    public override string ToString() => \`\${Major}.\${Minor}.\${Patch}\`;
}

var v = new Version(2, 1, 0);
byte[] buf = new byte[32];
if (((IUtf8SpanFormattable)v).TryFormat(buf, out int written, default, null))
    Console.WriteLine(Encoding.UTF8.GetString(buf, 0, written));  // 2.1.0`,
    explanation: "`IUtf8SpanFormattable` (.NET 8) allows types to format directly into a UTF-8 byte span, eliminating the UTF-16-to-UTF-8 transcoding step that would otherwise occur when writing to HTTP/gRPC response buffers.",
  },
  {
    id: "cs-b16-b5-unsafe-pointer-no-bounds",
    language: "csharp",
    title: "Unsafe pointer arithmetic has no bounds check",
    tag: "caveats",
    code: `using System;

unsafe
{
    int[] arr = [10, 20, 30];
    fixed (int* p = arr)
    {
        // In-bounds: fine
        Console.WriteLine(*(p + 2));   // 30

        // Out-of-bounds: UNDEFINED BEHAVIOUR — no exception!
        // *(p + 10) could read garbage, cause access violation, or silently corrupt memory
        // Console.WriteLine(*(p + 10));

        // Always validate indices before pointer arithmetic
        int idx = 2;
        if ((uint)idx < (uint)arr.Length)
            Console.WriteLine(*(p + idx));   // 30
    }
}`,
    explanation: "Raw pointer arithmetic in `unsafe` blocks bypasses all bounds checking; reading or writing outside the allocated buffer is undefined behaviour that can corrupt memory silently — always validate indices explicitly.",
  },
  {
    id: "cs-b16-b5-ibinary-integer",
    language: "csharp",
    title: "IBinaryInteger<T> implementation",
    tag: "classes",
    code: `using System;
using System.Numerics;

// IBinaryInteger<T> is part of the generic math interfaces (.NET 7+)
// Here we use it as a constraint to write generic bit-counting code

static int CountSetBits<T>(T value) where T : IBinaryInteger<T>
{
    int count = 0;
    while (value != T.Zero)
    {
        // Clear the lowest set bit
        value &= value - T.One;
        count++;
    }
    return count;
}

Console.WriteLine(CountSetBits(0b_1011u));   // 3  (uint)
Console.WriteLine(CountSetBits(0xFF_00L));   // 8  (long)
Console.WriteLine(CountSetBits((byte)255));  // 8`,
    explanation: "`IBinaryInteger<T>` is a .NET 7 generic math interface that abstracts bit-level operations over any integer width; using it as a constraint lets you write a single algorithm that works for `byte`, `int`, `long`, `UInt128`, etc.",
  },
  {
    id: "cs-b16-b5-matrix4x4",
    language: "csharp",
    title: "System.Numerics.Matrix4x4",
    tag: "structures",
    code: `using System;
using System.Numerics;

// Construct common transforms
var translate = Matrix4x4.CreateTranslation(1.0f, 2.0f, 3.0f);
var scale     = Matrix4x4.CreateScale(2.0f);
var combined  = Matrix4x4.Multiply(scale, translate);

// Transform a point (w=1 for position)
var point = new Vector4(1, 0, 0, 1);
var result = Vector4.Transform(point, combined);
Console.WriteLine(\`\${result.X:F2}, \${result.Y:F2}, \${result.Z:F2}\`);
// 3.00, 4.00, 6.00  (scaled first, then translated)`,
    explanation: "`Matrix4x4` is hardware-accelerated through SIMD when available; use `Multiply(A, B)` to compose transforms (scale then translate vs translate then scale produces different results — order matters).",
  },
  {
    id: "cs-b16-b5-void-ptr-vs-intptr",
    language: "csharp",
    title: "void* vs IntPtr usage",
    tag: "types",
    code: `using System;
using System.Runtime.InteropServices;

// IntPtr: managed, safe to store in fields, no unsafe block needed
IntPtr safePtr = Marshal.AllocHGlobal(16);
Marshal.WriteByte(safePtr, 0, 42);
Console.WriteLine(Marshal.ReadByte(safePtr, 0));  // 42
Marshal.FreeHGlobal(safePtr);

// void*: requires unsafe, supports arithmetic, cannot be stored in managed fields
unsafe
{
    int* p = stackalloc int[4];
    *(p + 2) = 99;
    Console.WriteLine(*(p + 2));    // 99
    void* vp = p;                   // void* loses type info
    Console.WriteLine(*(int*)vp);   // 99  (cast back to use)
}`,
    explanation: "`IntPtr` stores a pointer as a managed value — safe in class fields, no `unsafe` keyword needed, but only Marshal methods can dereference it; `void*` requires `unsafe`, supports pointer arithmetic, but cannot cross the managed/unmanaged boundary safely.",
  },
  {
    id: "cs-b16-b5-fixed-statement-scope",
    language: "csharp",
    title: "fixed statement scope",
    tag: "caveats",
    code: `using System;

unsafe
{
    byte[] arr = [1, 2, 3, 4];
    byte* p;

    fixed (byte* tmp = arr)
    {
        p = tmp;
        Console.WriteLine(*p);   // 1  (valid — GC can't move arr here)
    }

    // DANGEROUS: p is now a dangling pointer — arr may have moved
    // Console.WriteLine(*p);   // undefined behaviour

    // Safe: re-enter fixed for every access block
    fixed (byte* tmp2 = arr)
        Console.WriteLine(*(tmp2 + 3));  // 4
}`,
    explanation: "A `fixed` pointer is only valid within the `fixed` block; storing it in a variable and using it outside is undefined behaviour because the GC is free to relocate the object once the block exits.",
  },
  {
    id: "cs-b16-b5-iparsable-static-interface",
    language: "csharp",
    title: "IParsable<T> with static interface member",
    tag: "classes",
    code: `using System;

readonly struct Celsius : IParsable<Celsius>
{
    public double Degrees { get; }
    public Celsius(double d) => Degrees = d;

    // Static abstract interface member — called without an instance
    public static Celsius Parse(string s, IFormatProvider? provider)
    {
        if (!TryParse(s, provider, out var result))
            throw new FormatException(\`Cannot parse '\${s}' as Celsius\`);
        return result;
    }

    public static bool TryParse(string? s, IFormatProvider? provider, out Celsius result)
    {
        s = s?.TrimEnd('C', '°', ' ');
        if (double.TryParse(s, out double d)) { result = new Celsius(d); return true; }
        result = default; return false;
    }

    public override string ToString() => \`\${Degrees}°C\`;
}

Console.WriteLine(Celsius.Parse("100°C", null));   // 100°C
Console.WriteLine(Celsius.Parse("37.5", null));    // 37.5°C`,
    explanation: "`IParsable<T>` uses C# 11 static abstract interface members so generic code can call `T.Parse(str, provider)` without an instance; this enables generic parsers that work with any parsable type.",
  },
  {
    id: "cs-b16-b5-interop-string-marshal",
    language: "csharp",
    title: "Interop string marshaling copies",
    tag: "caveats",
    code: `using System;
using System.Runtime.InteropServices;

// P/Invoke always copies strings — both in and out
// Managed string → native: Marshal encodes to UTF-8/UTF-16/ANSI (copies)
// Native string → managed: Marshal allocates a new managed string (copies)

[DllImport("libc", EntryPoint = "strlen", CharSet = CharSet.Ansi)]
static extern int strlen(string s);

string managed = "Hello, world!";
Console.WriteLine(strlen(managed));   // 13

// For zero-copy: use Span<byte> + fixed or MemoryMarshal for byte buffers
ReadOnlySpan<byte> utf8 = "Hello"u8;
Console.WriteLine(utf8.Length);       // 5  (no copy, literal in binary)`,
    explanation: "Every P/Invoke string crossing the managed/native boundary involves a copy and possibly encoding conversion; for hot paths use `Span<byte>` with `u8` string literals or `MemoryMarshal` to avoid the allocation.",
  },
  {
    id: "cs-b16-b5-nativeaot-compat",
    language: "csharp",
    title: "NativeAOT compatibility rules",
    tag: "types",
    code: `using System;
using System.Text.Json;
using System.Text.Json.Serialization;

// NativeAOT trims code aggressively — reflection-based serialization breaks

// BAD for NativeAOT:
// JsonSerializer.Serialize(new Point(1, 2));  // reflection, may be trimmed

// GOOD: source-generated JSON context, no reflection at runtime
[JsonSerializable(typeof(Point))]
partial class MyJsonCtx : JsonSerializerContext { }

record Point(int X, int Y);

var json = JsonSerializer.Serialize(new Point(3, 4), MyJsonCtx.Default.Point);
Console.WriteLine(json);   // {"X":3,"Y":4}`,
    explanation: "NativeAOT ahead-of-time compilation removes unused code; reflection-based APIs like `JsonSerializer` (default) are incompatible because they discover types at runtime — use source-generated contexts instead.",
  },
  {
    id: "cs-b16-b5-vector-vs-vector128-vs-vector256",
    language: "csharp",
    title: "Vector<T> vs Vector128<T> vs Vector256<T>",
    tag: "families",
    code: `using System;
using System.Numerics;
using System.Runtime.Intrinsics;

// Vector<T>: adaptive width (matches hardware SIMD width)
Console.WriteLine(\`Vector<float>.Count = \${Vector<float>.Count}\`);  // 4 or 8

// Vector128<T>: always 128 bits (4 floats) — SSE2 / NEON baseline
var v128 = Vector128.Create(1.0f, 2.0f, 3.0f, 4.0f);
Console.WriteLine(v128[0]);   // 1

// Vector256<T>: always 256 bits (8 floats) — requires AVX2
if (System.Runtime.Intrinsics.X86.Avx2.IsSupported)
{
    var v256 = Vector256.Create(1.0f);
    Console.WriteLine(v256[0]);  // 1
}`,
    explanation: "Use `Vector<T>` for portable SIMD code that adapts to the widest available register, `Vector128<T>` when you need a guaranteed 128-bit baseline (runs everywhere), and `Vector256<T>` for AVX2-specific paths guarded by a capability check.",
  },
  {
    id: "cs-b16-b5-source-generated-json",
    language: "csharp",
    title: "Source-generated JSON context",
    tag: "classes",
    code: `using System;
using System.Text.Json;
using System.Text.Json.Serialization;

// Declare types to serialize — the source generator emits fast metadata
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(Product[]))]
partial class AppJsonContext : JsonSerializerContext { }

record Product(int Id, string Name, decimal Price);

var p = new Product(1, "Widget", 9.99m);

// Serialize using generated (reflection-free) metadata
string json  = JsonSerializer.Serialize(p, AppJsonContext.Default.Product);
var    back  = JsonSerializer.Deserialize(json, AppJsonContext.Default.Product);

Console.WriteLine(json);          // {"Id":1,"Name":"Widget","Price":9.99}
Console.WriteLine(back!.Name);    // Widget`,
    explanation: "Adding `[JsonSerializable]` to a `partial class : JsonSerializerContext` triggers the Roslyn source generator to emit type metadata at compile time, eliminating startup reflection costs and enabling NativeAOT / trimming.",
  },
  {
    id: "cs-b16-b5-readonly-ref-struct-field",
    language: "csharp",
    title: "readonly ref struct immutability detail",
    tag: "understanding",
    code: `using System;

readonly ref struct ReadOnlyWindow
{
    private readonly ReadOnlySpan<int> _data;

    public ReadOnlyWindow(ReadOnlySpan<int> data) => _data = data;

    public int Sum()
    {
        int total = 0;
        foreach (int x in _data) total += x;
        return total;
    }

    // readonly means: no method can be called on a defensive copy
    // The compiler trusts ALL instance methods are non-mutating
}

ReadOnlySpan<int> nums = [1, 2, 3, 4, 5];
var window = new ReadOnlyWindow(nums);
Console.WriteLine(window.Sum());   // 15`,
    explanation: "A `readonly ref struct` signals to the compiler that no instance method mutates the struct, so it never emits a defensive copy when the struct is accessed via an `in` parameter — a concrete performance win for frequently called methods.",
  },
  {
    id: "cs-b16-b5-marshal-vs-memorymarshal",
    language: "csharp",
    title: "Marshal vs MemoryMarshal vs BinaryPrimitives",
    tag: "families",
    code: `using System;
using System.Buffers.Binary;
using System.Runtime.InteropServices;

byte[] buf = [0x04, 0x03, 0x02, 0x01];

// Marshal: works with IntPtr / unmanaged memory, often copies
GCHandle h = GCHandle.Alloc(buf, GCHandleType.Pinned);
Console.WriteLine(Marshal.ReadInt32(h.AddrOfPinnedObject()));  // 16909060
h.Free();

// MemoryMarshal: zero-copy span reinterpretation
int fromSpan = MemoryMarshal.Read<int>(buf);
Console.WriteLine(fromSpan);    // 16909060  (little-endian)

// BinaryPrimitives: endian-explicit, clearest intent
int leVal = BinaryPrimitives.ReadInt32LittleEndian(buf);
Console.WriteLine(leVal);       // 16909060`,
    explanation: "Use `BinaryPrimitives` for endian-aware decoding of network/file data (clearest), `MemoryMarshal` for zero-copy type reinterpretation within managed spans, and `Marshal` only when dealing with `IntPtr` from native code.",
  },
  {
    id: "cs-b16-b5-bitoperations-leading-zero",
    language: "csharp",
    title: "BitOperations.LeadingZeroCount",
    tag: "snippet",
    code: `using System;
using System.Numerics;

uint value = 0b_0000_0001_0000_0000u;   // 256

int lz = BitOperations.LeadingZeroCount(value);
Console.WriteLine(lz);                         // 23

// Compute floor(log2(n)) from leading zeros
int log2 = 31 - lz;
Console.WriteLine(log2);                       // 8  (2^8 = 256)

// Equivalent: BitOperations.Log2 (rounds down)
Console.WriteLine(BitOperations.Log2(value));  // 8

// Next power of two
Console.WriteLine(BitOperations.RoundUpToPowerOf2(300u));  // 512`,
    explanation: "`BitOperations.LeadingZeroCount` maps to the hardware `LZCNT`/`CLZ` instruction; combined with 31 (or 63 for `ulong`) it gives an efficient floor-log₂ without any floating-point conversion.",
  },
  {
    id: "cs-b16-b5-isequence-reader",
    language: "csharp",
    title: "SequenceReader<T> position-aware parsing",
    tag: "snippet",
    code: `using System;
using System.Buffers;

// Build a multi-segment ReadOnlySequence<byte> to simulate pipe data
byte[] seg1 = "Hello, "u8.ToArray();
byte[] seg2 = "World!"u8.ToArray();
var first = new ReadOnlySequenceSegment<byte>(seg1, null);
var last  = new ReadOnlySequenceSegment<byte>(seg2, first);

// ReadOnlySequence<byte> wraps multiple segments transparently
// For demo use a single-segment sequence:
ReadOnlySequence<byte> seq = new(seg1);
var reader = new SequenceReader<byte>(seq);

while (reader.TryRead(out byte b))
    Console.Write((char)b);
Console.WriteLine();   // Hello,`,
    explanation: "`SequenceReader<T>` provides cursor-based forward reading over a `ReadOnlySequence<T>` (which may span multiple memory segments from a pipe); it tracks position, supports TryAdvanceTo, and avoids copying between segments.",
  },
  {
    id: "cs-b16-b5-custom-value-converter-ef",
    language: "csharp",
    title: "Custom ValueConverter for EF Core",
    tag: "classes",
    code: `using System;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

// Store a record type as a JSON string column
readonly record struct Money(decimal Amount, string Currency);

class MoneyConverter : ValueConverter<Money, string>
{
    public MoneyConverter() : base(
        money  => \`\${money.Amount}:\${money.Currency}\`,
        stored =>
        {
            var parts = stored.Split(':');
            return new Money(decimal.Parse(parts[0]), parts[1]);
        })
    { }
}

// In DbContext.OnModelCreating:
// builder.Entity<Order>().Property(o => o.Price)
//        .HasConversion(new MoneyConverter());

// Demo without EF:
var conv = new MoneyConverter();
var toProvider = conv.ConvertToProviderExpression.Compile();
Console.WriteLine(toProvider(new Money(9.99m, "USD")));  // 9.99:USD`,
    explanation: "`ValueConverter<TModel, TProvider>` tells EF Core how to serialize a custom type to the database column type; the two lambda expressions define the round-trip conversion and are compiled once at startup.",
  },
  {
    id: "cs-b16-b5-callingconvention-mismatch",
    language: "csharp",
    title: "DllImport CallingConvention mismatch crash",
    tag: "caveats",
    code: `using System;
using System.Runtime.InteropServices;

// CORRECT: Most C library functions use Cdecl (caller cleans stack)
[DllImport("libc", EntryPoint = "abs", CallingConvention = CallingConvention.Cdecl)]
static extern int AbsCdecl(int x);

// WRONG: Stdcall expects callee to clean stack — mismatches corrupt the stack
// [DllImport("libc", EntryPoint = "abs", CallingConvention = CallingConvention.StdCall)]
// static extern int AbsStdcall(int x);  // undefined behaviour / crash

Console.WriteLine(AbsCdecl(-5));   // 5

// On x64 Windows/Linux, both conventions use the same ABI (register-based),
// so mismatches only visibly crash on 32-bit. Still: always declare correctly.`,
    explanation: "Specifying the wrong `CallingConvention` causes stack corruption on 32-bit processes because the caller and callee disagree on who pops the arguments; on x64 the effect is usually silent but the ABI contract is still violated.",
  },
  {
    id: "cs-b16-b5-ref-local",
    language: "csharp",
    title: "ref local variable",
    tag: "understanding",
    code: `using System;

int[] data = [10, 20, 30, 40, 50];

// ref local is an alias — modifying it modifies the original
ref int third = ref data[2];
Console.WriteLine(third);   // 30

third = 999;
Console.WriteLine(data[2]); // 999 — same storage

// Useful to avoid repeated indexing in hot loops
ref int last = ref data[data.Length - 1];
last *= 2;
Console.WriteLine(data[4]); // 100`,
    explanation: "A `ref` local creates a named alias to a variable or array slot; writing to it directly updates the original location, and on value types it avoids copying a potentially large struct for repeated field access.",
  },
  {
    id: "cs-b16-b5-memory-owner",
    language: "csharp",
    title: "IMemoryOwner<T> pattern",
    tag: "snippet",
    code: `using System;
using System.Buffers;

// IMemoryOwner<T> ties buffer lifetime to an IDisposable scope
IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(256);
try
{
    Memory<byte> mem = owner.Memory;
    mem.Span.Fill(0xCD);

    // Pass Memory<T> to async code without worrying about lifetime
    Console.WriteLine(\`Rented \${mem.Length} bytes\`);
    Console.WriteLine(mem.Span[0].ToString("X2"));  // CD
}
finally
{
    owner.Dispose();   // returns buffer to pool
}`,
    explanation: "`IMemoryOwner<T>` wraps a pooled `Memory<T>` in an `IDisposable` so callers can use a `using` block to guarantee the buffer is returned to the pool even if an exception is thrown.",
  },
  {
    id: "cs-b16-b5-quaternion",
    language: "csharp",
    title: "System.Numerics.Quaternion",
    tag: "structures",
    code: `using System;
using System.Numerics;

// Create a rotation of 90° around the Y axis
float angle = MathF.PI / 2f;   // 90 degrees in radians
var q = Quaternion.CreateFromAxisAngle(Vector3.UnitY, angle);

Console.WriteLine(\`W=\${q.W:F4} X=\${q.X:F4} Y=\${q.Y:F4} Z=\${q.Z:F4}\`);
// W=0.7071  X=0.0000  Y=0.7071  Z=0.0000

// Compose rotations by multiplication
var q2 = Quaternion.CreateFromAxisAngle(Vector3.UnitX, MathF.PI / 2f);
var combined = Quaternion.Multiply(q, q2);

Console.WriteLine(Quaternion.IsUnit(q));  // True (normalized)`,
    explanation: "`Quaternion` avoids gimbal lock and is more efficient to compose than Euler angles or 4×4 matrices; multiply two quaternions to chain rotations, then convert to a matrix for actual vertex transforms.",
  },
  {
    id: "cs-b16-b5-incremental-source-gen",
    language: "csharp",
    title: "Incremental source generator pattern",
    tag: "classes",
    code: `// This is the generator project (separate from the app)
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System.Collections.Immutable;

[Generator]
public class ToStringGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // 1. Identify all structs marked with [AutoToString]
        var structs = context.SyntaxProvider
            .ForAttributeWithMetadataName(
                "AutoToStringAttribute",
                predicate: (node, _) => node is StructDeclarationSyntax,
                transform: (ctx, _) => (INamedTypeSymbol)ctx.TargetSymbol)
            .Collect();

        // 2. Register output
        context.RegisterSourceOutput(structs,
            (spc, symbols) =>
            {
                foreach (var sym in symbols)
                {
                    string src = \`// generated
public partial struct \${sym.Name}
{
    public override string ToString() => nameof(\${sym.Name});
}\`;
                    spc.AddSource(\`\${sym.Name}.g.cs\`, src);
                }
            });
    }
}`,
    explanation: "An incremental source generator implements `IIncrementalGenerator` and uses `SyntaxProvider` pipelines that cache results between compilations; only nodes whose syntax or symbols actually changed trigger regeneration, keeping IDE performance fast.",
  },
  {
    id: "cs-b16-b5-complex-numerics",
    language: "csharp",
    title: "System.Numerics.Complex",
    tag: "structures",
    code: `using System;
using System.Numerics;

var z1 = new Complex(3, 4);    // 3 + 4i
var z2 = new Complex(1, -2);   // 1 - 2i

Console.WriteLine(z1 + z2);           // (4, 2)
Console.WriteLine(z1 * z2);           // (11, -2)
Console.WriteLine(Complex.Abs(z1));   // 5  (|z1| = sqrt(9+16))
Console.WriteLine(z1.Conjugate());    // (3, -4)

// Polar form
Console.WriteLine(z1.Magnitude);      // 5
Console.WriteLine(z1.Phase * 180 / Math.PI);  // 53.13 degrees`,
    explanation: "`System.Numerics.Complex` supports all arithmetic operators and complex-specific operations like `Conjugate`, `Abs` (magnitude), and `Phase`; it's fully compatible with generic math interfaces in .NET 7+.",
  },
  {
    id: "cs-b16-b5-readonly-ref-return",
    language: "csharp",
    title: "ref readonly return from method",
    tag: "types",
    code: `using System;

class DataStore
{
    private readonly int[] _values = [10, 20, 30, 40, 50];

    // ref readonly: caller gets an alias but cannot modify through it
    public ref readonly int GetMax()
    {
        int maxIdx = 0;
        for (int i = 1; i < _values.Length; i++)
            if (_values[i] > _values[maxIdx]) maxIdx = i;
        return ref _values[maxIdx];
    }
}

var store = new DataStore();
ref readonly int max = ref store.GetMax();
Console.WriteLine(max);   // 50

// max = 99;  // CS8331 compile error — cannot assign through ref readonly`,
    explanation: "`ref readonly` return passes an alias to internal storage without allowing mutation; callers get the performance benefit of avoiding a copy (useful for large structs) with compile-time write protection.",
  },
  {
    id: "cs-b16-b5-nativeaot-vs-reflection",
    language: "csharp",
    title: "NativeMemory vs Marshal.AllocHGlobal vs stackalloc",
    tag: "families",
    code: `using System;
using System.Runtime.InteropServices;

// stackalloc: stack memory, fastest, limited to ~1MB, sync only
unsafe { Span<byte> s = stackalloc byte[64]; s[0] = 1; Console.WriteLine(s[0]); }

// Marshal.AllocHGlobal: Win32 GlobalAlloc, needed for COM/legacy interop
IntPtr h = Marshal.AllocHGlobal(64);
try { Marshal.WriteByte(h, 0, 2); Console.WriteLine(Marshal.ReadByte(h, 0)); }
finally { Marshal.FreeHGlobal(h); }

// NativeMemory.Alloc: cross-platform malloc, preferred for modern code
unsafe
{
    void* p = NativeMemory.Alloc(64);
    try { *(byte*)p = 3; Console.WriteLine(*(byte*)p); }
    finally { NativeMemory.Free(p); }
}`,
    explanation: "`stackalloc` is fastest but limited to the stack; `NativeMemory.Alloc` (wrapping `malloc`) is the modern cross-platform choice for native heap allocation; `Marshal.AllocHGlobal` is legacy Win32 `GlobalAlloc`, still required for COM/shell interop.",
  },
  {
    id: "cs-b16-b5-unsafe-complex",
    language: "csharp",
    title: "System.Numerics.Complex arithmetic",
    tag: "snippet",
    code: `using System;
using System.Numerics;

// Euler's formula: e^(i*π) + 1 ≈ 0
var eipi = Complex.Exp(new Complex(0, Math.PI));
Console.WriteLine(\`\${eipi.Real:F10}, \${eipi.Imaginary:F10}\`);
// -1.0000000000, 0.0000000001  (floating-point epsilon)

// Square root of -1
var i = Complex.Sqrt(new Complex(-1, 0));
Console.WriteLine(i);   // (0, 1)

// Log of a negative real number
var logNeg = Complex.Log(new Complex(-Math.E, 0));
Console.WriteLine(logNeg);  // (1, 3.14159...)`,
    explanation: "`Complex.Exp`, `Complex.Sqrt`, and `Complex.Log` compute principal values using IEEE-754 double precision; Euler's formula demonstrates that floating-point results are always approximate — the imaginary part is ε rather than exactly 0.",
  },
  {
    id: "cs-b16-b5-readonly-ref-struct-class",
    language: "csharp",
    title: "Span<T> cannot be a field in a class",
    tag: "caveats",
    code: `using System;

// ERROR: Span<T> is a ref struct — cannot be stored on the heap
// class MyClass { Span<byte> _span; }  // CS8345

// Use Memory<T> instead for heap-based storage
class MyClass
{
    private Memory<byte> _memory;

    public MyClass(int size) => _memory = new byte[size];

    public void Write(int index, byte value)
        => _memory.Span[index] = value;

    public byte Read(int index)
        => _memory.Span[index];
}

var obj = new MyClass(4);
obj.Write(0, 99);
Console.WriteLine(obj.Read(0));   // 99`,
    explanation: "Because `Span<T>` is a `ref struct`, the compiler forbids it as a class field, async variable, or generic type argument — wherever the value might end up on the heap; `Memory<T>` is the heap-compatible alternative.",
  },
  {
    id: "cs-b16-b5-bit-count-generic",
    language: "csharp",
    title: "Generic bit manipulation with INumber<T>",
    tag: "snippet",
    code: `using System;
using System.Numerics;

// .NET 7+ generic math: write one method that works for any numeric type
static T Clamp<T>(T value, T min, T max) where T : INumber<T>
    => T.Max(min, T.Min(max, value));

Console.WriteLine(Clamp(150, 0, 100));         // 100  (int)
Console.WriteLine(Clamp(0.3f, 0.0f, 1.0f));   // 0.3  (float)
Console.WriteLine(Clamp(-5.0, 0.0, 10.0));    // 0    (double)

// INumber<T> also provides T.Zero, T.One, T.Parse, operators +, *, etc.`,
    explanation: "`INumber<T>` is a .NET 7 generic math interface that provides arithmetic operators, `T.Zero`, `T.One`, and `T.Max`/`Min` as static members, enabling truly generic numeric algorithms without runtime dispatch.",
  },
  {
    id: "cs-b16-b5-memorymarshal-read",
    language: "csharp",
    title: "MemoryMarshal.Read<T> — zero-copy struct read",
    tag: "structures",
    code: `using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct IpHeader
{
    public byte  VersionIhl;
    public byte  Dscp;
    public ushort TotalLength;
}

// Raw bytes as they arrive from the network (big-endian):
ReadOnlySpan<byte> packet = [0x45, 0x00, 0x00, 0x3C];

// Zero-copy struct overlay — no allocation, no loop
IpHeader hdr = MemoryMarshal.Read<IpHeader>(packet);
Console.WriteLine(\`Version/IHL=\${hdr.VersionIhl:X2}\`);   // 45
Console.WriteLine(\`TotalLen=\${hdr.TotalLength}\`);         // native-endian value`,
    explanation: "`MemoryMarshal.Read<T>` overlays a blittable struct onto the first bytes of a span without any allocation; the struct is interpreted in native byte order, so use `BinaryPrimitives` if you need endian-aware reading.",
  },
  {
    id: "cs-b16-b5-unsafe-complex-numerics",
    language: "csharp",
    title: "Complex numerics — division by zero in C#",
    tag: "snippet",
    code: `using System;
using System.Numerics;

// Unlike Python, C# Complex division by zero produces NaN/Infinity
var z = new Complex(1, 2);
var zero = new Complex(0, 0);

var result = z / zero;
Console.WriteLine(result);              // (NaN, NaN)
Console.WriteLine(double.IsNaN(result.Real));   // True

// Divide by a tiny number — produces large magnitude
var tiny = new Complex(1e-300, 0);
Console.WriteLine((z / tiny).Real);    // ~1e300`,
    explanation: "C# follows IEEE-754 semantics for `Complex` division: dividing by complex zero yields `(NaN, NaN)` rather than throwing an exception — always guard with a magnitude check before dividing.",
  },
  {
    id: "cs-b16-b5-iutf8-span-parsable",
    language: "csharp",
    title: "ISpanParsable vs IParsable — span vs string input",
    tag: "understanding",
    code: `using System;

// IParsable<T>: parses from string — allocates if source is a span
// ISpanParsable<T>: parses from ReadOnlySpan<char> — zero allocation

static T ParseAny<T>(ReadOnlySpan<char> input) where T : ISpanParsable<T>
    => T.Parse(input, null);

int n = ParseAny<int>("42");
double d = ParseAny<double>("3.14");

Console.WriteLine(n);   // 42
Console.WriteLine(d);   // 3.14

// Generic constraint means we get span-based parsing for any built-in type
// without knowing which type it is at compile time`,
    explanation: "`ISpanParsable<T>` extends `IParsable<T>` with a `ReadOnlySpan<char>` overload; constraining a generic method to `ISpanParsable<T>` gives you zero-allocation parsing for all built-in numeric types and any custom type that opts in.",
  },
  {
    id: "cs-b16-b5-complex-numerics-struct",
    language: "csharp",
    title: "System.Numerics.Complex and IBinaryNumber",
    tag: "snippet",
    code: `using System;
using System.Numerics;

// .NET 7+: Complex implements INumberBase<Complex>
static Complex ScaleUp<T>(T value) where T : INumber<T>
{
    // Convert any INumber to Complex via double
    double d = double.CreateChecked(value);
    return new Complex(d * 2.0, 0);
}

Console.WriteLine(ScaleUp(5));      // (10, 0)
Console.WriteLine(ScaleUp(3.14));   // (6.28, 0)

// Complex-specific operations
var z = Complex.FromPolarCoordinates(5, Math.PI / 4);
Console.WriteLine(\`|z|=\${Complex.Abs(z):F2}\`);  // |z|=5.00`,
    explanation: "`Complex` in .NET 7+ implements `INumberBase<Complex>`, making it compatible with generic math constraints; `Complex.FromPolarCoordinates` constructs from magnitude and angle, matching `cmath.rect` from Python.",
  },
  {
    id: "cs-b16-b5-pinvoke-callingconvention",
    language: "csharp",
    title: "P/Invoke CallingConvention best practice",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

// Modern: use LibraryImport (source-generated, NativeAOT-compatible)
// [LibraryImport("libc", EntryPoint = "abs")]
// static partial int AbsNative(int x);

// Classic: DllImport with explicit calling convention
[DllImport("libc", EntryPoint = "abs",
    CallingConvention = CallingConvention.Cdecl,
    ExactSpelling = true)]
static extern int AbsNative(int x);

Console.WriteLine(AbsNative(-7));   // 7

// ExactSpelling=true avoids the runtime trying "absA" / "absW" variants
// on Windows for Unicode/ANSI suffix guessing`,
    explanation: "Always specify `CallingConvention` and set `ExactSpelling = true` in `DllImport` to prevent the runtime from appending A/W suffixes and to guarantee the correct stack discipline — use `LibraryImport` for NativeAOT-safe code.",
  },
  {
    id: "cs-b16-b5-span-fill-clear",
    language: "csharp",
    title: "Span<T>.Fill and Clear",
    tag: "snippet",
    code: `using System;

Span<int> buf = stackalloc int[8];

// Fill every element with a value
buf.Fill(42);
Console.WriteLine(buf[3]);      // 42

// Clear sets all bytes to zero (equivalent to Fill(default(T)))
buf.Clear();
Console.WriteLine(buf[3]);      // 0

// Copy between spans
Span<int> src = [1, 2, 3, 4, 5, 6, 7, 8];
src.CopyTo(buf);
Console.WriteLine(buf[7]);      // 8`,
    explanation: "`Span<T>.Fill` and `Clear` are JIT-intrinsified to emit `memset`-equivalent instructions; they're the correct idiomatic way to initialise or zero a span and are significantly faster than a manual loop.",
  },
  {
    id: "cs-b16-b5-system-unsafe-methods",
    language: "csharp",
    title: "System.Runtime.CompilerServices.Unsafe methods",
    tag: "structures",
    code: `using System;
using System.Runtime.CompilerServices;

int[] arr = [10, 20, 30, 40, 50];

// Unsafe.Add: pointer-style offset without unsafe block
ref int third = ref Unsafe.Add(ref arr[0], 2);
Console.WriteLine(third);          // 30

// Unsafe.SizeOf: size of a type without unsafe block
Console.WriteLine(Unsafe.SizeOf<double>());   // 8

// Unsafe.IsNullRef: check for null reference
ref int nullRef = ref Unsafe.NullRef<int>();
Console.WriteLine(Unsafe.IsNullRef(ref nullRef));  // True`,
    explanation: "`System.Runtime.CompilerServices.Unsafe` provides unsafe-pointer-style operations in safe code; the JIT removes all overhead — `Unsafe.Add` compiles identically to `*(p + n)` but doesn't require an `unsafe` block.",
  },
  {
    id: "cs-b16-b5-generic-math-zero-one",
    language: "csharp",
    title: "T.Zero and T.One in generic math",
    tag: "understanding",
    code: `using System;
using System.Numerics;

// Generic sum using IAdditionOperators and IAdditiveIdentity
static T Sum<T>(ReadOnlySpan<T> values) where T : INumber<T>
{
    T total = T.Zero;   // additive identity for any T
    foreach (T v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum<int>([1, 2, 3, 4, 5]));         // 15
Console.WriteLine(Sum<double>([1.1, 2.2, 3.3]));      // 6.6
Console.WriteLine(Sum<decimal>([0.1m, 0.2m, 0.3m]));  // 0.6`,
    explanation: "`T.Zero` and `T.One` are static abstract members on `INumberBase<T>` that provide the additive and multiplicative identities for any numeric type, enabling generic algorithms that work correctly across all numeric types.",
  },
  {
    id: "cs-b16-b5-ref-struct-dispose",
    language: "csharp",
    title: "ref struct with Dispose pattern",
    tag: "classes",
    code: `using System;
using System.Buffers;

ref struct PooledWriter
{
    private byte[] _rented;
    private Span<byte> _span;
    private int _pos;

    public PooledWriter(int capacity)
    {
        _rented = ArrayPool<byte>.Shared.Rent(capacity);
        _span   = _rented;
        _pos    = 0;
    }

    public void Write(byte b) => _span[_pos++] = b;

    public ReadOnlySpan<byte> Written => _span[.._pos];

    public void Dispose()
    {
        if (_rented is not null)
        {
            ArrayPool<byte>.Shared.Return(_rented);
            _rented = null!;
        }
    }
}

var writer = new PooledWriter(256);
try
{
    writer.Write(65); writer.Write(66); writer.Write(67);
    Console.WriteLine(System.Text.Encoding.ASCII.GetString(writer.Written));  // ABC
}
finally { writer.Dispose(); }`,
    explanation: "A `ref struct` can implement `Dispose` (the compiler recognises it for `using` statements), allowing a stack-allocated RAII pattern that returns pooled arrays without boxing or heap allocation.",
  },
  {
    id: "cs-b16-b5-nativeint-arithmetic",
    language: "csharp",
    title: "nint arithmetic and pointer offsets",
    tag: "snippet",
    code: `using System;

// nint behaves like a pointer-sized signed integer
nint baseAddr = 0x1000;
nint stride   = 16;

for (int i = 0; i < 4; i++)
{
    nint addr = baseAddr + stride * i;
    Console.WriteLine(addr.ToString("X"));
}
// 1000  1010  1020  1030

// Convert to/from IntPtr safely
IntPtr ptr = (IntPtr)baseAddr;
nint back  = (nint)ptr;
Console.WriteLine(back == baseAddr);   // True`,
    explanation: "`nint` supports all arithmetic operators natively (unlike `IntPtr` which required `.ToInt64()` gymnastics in older C#), making pointer-offset calculations readable without an `unsafe` block.",
  },
  {
    id: "cs-b16-b5-blittable-pinning",
    language: "csharp",
    title: "Blittable types and GCHandle pinning performance",
    tag: "understanding",
    code: `using System;
using System.Runtime.InteropServices;

// Blittable arrays can be pinned cheaply — GC just remembers the address
float[] positions = new float[1024];
positions[0] = 1.5f;

GCHandle pin = GCHandle.Alloc(positions, GCHandleType.Pinned);
try
{
    IntPtr ptr = pin.AddrOfPinnedObject();
    // Pass ptr to OpenGL, Vulkan, or a C physics library
    Console.WriteLine(Marshal.PtrToStructure<float>(ptr));   // 1.5
}
finally { pin.Free(); }

// Non-blittable types cannot be pinned at all
// GCHandle.Alloc(new string[]{"x"}, GCHandleType.Pinned);  // InvalidOperationException`,
    explanation: "Pinning a blittable array is cheap — the GC just adds it to a pinned list and can still collect other objects; pinning for long periods or in large numbers fragments the heap, so prefer `fixed` for short critical sections.",
  },
  {
    id: "cs-b16-b5-generic-sum-int128",
    language: "csharp",
    title: "Int128 arithmetic",
    tag: "snippet",
    code: `using System;

// Int128 is a 128-bit signed integer — no heap allocation
Int128 big = Int128.MaxValue;
Console.WriteLine(big);   // 170141183460469231731687303715884105727

Int128 a = 100_000_000_000_000_000L;  // 10^17
Int128 b = a * a;                      // 10^34 — overflows long but not Int128
Console.WriteLine(b);

// Parse from string (no BigInteger overhead)
Int128 parsed = Int128.Parse("99999999999999999999999999999999999999");
Console.WriteLine(parsed + Int128.One);`,
    explanation: "`Int128` (.NET 7+) is a value type stored in two 64-bit registers; it has zero heap allocation overhead versus `BigInteger` and is the right choice for values in the 2⁶⁴–2¹²⁷ range.",
  },
  {
    id: "cs-b16-b5-unsafe-class",
    language: "csharp",
    title: "unsafe class-level modifier",
    tag: "snippet",
    code: `using System;

// Marking the whole class unsafe avoids per-method unsafe keyword
unsafe class BitConverter2
{
    public static uint SingleToUInt32Bits(float f)
    {
        return *(uint*)&f;   // reinterpret float bits as uint
    }

    public static float UInt32BitsToSingle(uint bits)
    {
        return *(float*)&bits;
    }
}

float pi = MathF.PI;
uint bits = BitConverter2.SingleToUInt32Bits(pi);
Console.WriteLine(bits.ToString("X8"));   // 40490FDB
Console.WriteLine(BitConverter2.UInt32BitsToSingle(bits));  // 3.1415927`,
    explanation: "Applying `unsafe` to an entire class is convenient when most members need pointer operations; it's equivalent to marking each method individually but reduces verbosity — the code still requires the `/unsafe` compiler switch.",
  },
  {
    id: "cs-b16-b5-readonly-struct-in-param",
    language: "csharp",
    title: "readonly struct with in parameter — no defensive copy",
    tag: "understanding",
    code: `using System;

readonly struct HeavyValue
{
    public readonly double A, B, C, D, E, F, G, H;  // 64 bytes

    public HeavyValue(double val)
    {
        A = B = C = D = E = F = G = H = val;
    }

    // readonly struct: compiler guarantees no mutation → no defensive copy
    public double Sum() => A + B + C + D + E + F + G + H;
}

static double Process(in HeavyValue v)
    => v.Sum();   // no copy: readonly struct + in parameter

var hv = new HeavyValue(1.0);
Console.WriteLine(Process(in hv));   // 8`,
    explanation: "Combining `readonly struct` with an `in` parameter eliminates both the call-site copy (done by `in`) and the per-method-call defensive copies (guaranteed unnecessary by `readonly`) — the struct is passed as a pointer with full compiler-enforced immutability.",
  },
  {
    id: "cs-b16-b5-span-tokenize",
    language: "csharp",
    title: "Zero-allocation string tokenization with Span",
    tag: "snippet",
    code: `using System;

static void Tokenize(ReadOnlySpan<char> input, char delimiter)
{
    while (true)
    {
        int idx = input.IndexOf(delimiter);
        if (idx < 0)
        {
            Console.WriteLine(input.ToString());
            break;
        }
        Console.WriteLine(input[..idx].ToString());
        input = input[(idx + 1)..];
    }
}

Tokenize("apple,banana,cherry,date", ',');`,
    explanation: "Slicing `ReadOnlySpan<char>` advances the view without allocating a new string; splitting a comma-delimited line this way creates zero intermediate `string` objects — only the final `ToString()` calls allocate.",
  },
  {
    id: "cs-b16-b5-nuint-arithmetic",
    language: "csharp",
    title: "nuint — unsigned platform-sized integer",
    tag: "types",
    code: `using System;

// nuint is the unsigned counterpart of nint — matches UIntPtr size
nuint addr   = 0xDEAD_BEEF_u;
nuint offset = 4;

Console.WriteLine((addr + offset).ToString("X"));   // DEADBEF3

// Safe conversion from UIntPtr
UIntPtr uptr = new UIntPtr(0x1000);
nuint   n    = (nuint)uptr;
Console.WriteLine(n.ToString("X"));   // 1000

// sizeof reflects platform word size
unsafe { Console.WriteLine(sizeof(nuint)); }  // 8 on 64-bit`,
    explanation: "`nuint` is an alias for `UIntPtr` with arithmetic operators; it's the right type for unsigned memory offsets, sizes, and hash values where the value must scale with the pointer width of the process.",
  },
  {
    id: "cs-b16-b5-generic-math-parse",
    language: "csharp",
    title: "Generic parser using ISpanParsable<T>",
    tag: "snippet",
    code: `using System;
using System.Buffers;

// Parse a CSV row into any ISpanParsable type — zero intermediate strings
static T[] ParseRow<T>(ReadOnlySpan<char> row) where T : ISpanParsable<T>
{
    // Count commas first to size the array
    int count = row.Count(',') + 1;
    T[] result = new T[count];
    int i = 0;
    while (true)
    {
        int comma = row.IndexOf(',');
        ReadOnlySpan<char> token = comma < 0 ? row : row[..comma];
        result[i++] = T.Parse(token.Trim(), null);
        if (comma < 0) break;
        row = row[(comma + 1)..];
    }
    return result;
}

int[] ints = ParseRow<int>("1, 2, 3, 4, 5");
Console.WriteLine(string.Join(", ", ints));   // 1, 2, 3, 4, 5`,
    explanation: "Constraining to `ISpanParsable<T>` lets a single generic method parse any supported numeric or custom type from span slices without ever creating intermediate `string` allocations for the tokens.",
  },
  {
    id: "cs-b16-b5-pinned-array-simd",
    language: "csharp",
    title: "Pinned array for SIMD processing",
    tag: "snippet",
    code: `using System;
using System.Numerics;
using System.Runtime.InteropServices;

float[] data = new float[8];
for (int i = 0; i < 8; i++) data[i] = i + 1;

// Use MemoryMarshal to process without pinning
Span<float> span = data;
int width = Vector<float>.Count;  // e.g. 8
for (int i = 0; i <= span.Length - width; i += width)
{
    var v = new Vector<float>(span.Slice(i, width));
    var squared = v * v;
    squared.CopyTo(span.Slice(i, width));
}

Console.WriteLine(string.Join(", ", data));
// 1, 4, 9, 16, 25, 36, 49, 64`,
    explanation: "Constructing `Vector<float>` from a `Span<float>` slice avoids pinning entirely; the JIT can optimise the loop into SIMD instructions while the GC retains full freedom to relocate the backing array between iterations.",
  },
  {
    id: "cs-b16-b5-unmanaged-type-sizeof",
    language: "csharp",
    title: "Generic sizeof with unmanaged constraint",
    tag: "understanding",
    code: `using System;

// sizeof(T) is only available inside unsafe blocks for generic T
// unmanaged constraint ensures T has a fixed, known size
unsafe int SizeOf<T>() where T : unmanaged => sizeof(T);

Console.WriteLine(SizeOf<byte>());    // 1
Console.WriteLine(SizeOf<int>());     // 4
Console.WriteLine(SizeOf<double>());  // 8
Console.WriteLine(SizeOf<Guid>());    // 16

// Alternative without unsafe: Unsafe.SizeOf<T>() works for any struct
Console.WriteLine(System.Runtime.CompilerServices.Unsafe.SizeOf<Guid>());  // 16`,
    explanation: "The `unmanaged` constraint is required for `sizeof(T)` in a generic method because only unmanaged types have a compile-time-determined size; use `Unsafe.SizeOf<T>()` when you want the same result without an `unsafe` block.",
  },
  {
    id: "cs-b16-b5-span-lastindexof",
    language: "csharp",
    title: "Span<T> search methods — IndexOf, LastIndexOf, Contains",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<int> data = [3, 1, 4, 1, 5, 9, 2, 6, 1, 8];

Console.WriteLine(data.IndexOf(1));          // 1  (first occurrence)
Console.WriteLine(data.LastIndexOf(1));      // 8  (last occurrence)
Console.WriteLine(data.Contains(9));         // True
Console.WriteLine(data.IndexOf(42));         // -1 (not found)

// Slice then search
ReadOnlySpan<int> tail = data[5..];
Console.WriteLine(tail.IndexOf(1));          // 3  (index within tail)`,
    explanation: "`ReadOnlySpan<T>` exposes `IndexOf`, `LastIndexOf`, and `Contains` — all bounds-checked, allocation-free searches that work exactly like their `Array` equivalents but without needing a LINQ expression or temporary array.",
  },
  {
    id: "cs-b16-b5-memory-marshal-write",
    language: "csharp",
    title: "MemoryMarshal.Write<T> — zero-copy struct write",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct PacketHeader { public byte Version; public byte Flags; public ushort Length; }

byte[] buf = new byte[32];
var hdr = new PacketHeader { Version = 2, Flags = 0x01, Length = 28 };

// Write struct directly into the byte buffer — no Marshal.StructureToPtr needed
MemoryMarshal.Write(buf.AsSpan(), in hdr);

Console.WriteLine(buf[0]);   // 2   (Version)
Console.WriteLine(buf[1]);   // 1   (Flags)
Console.WriteLine(buf[2]);   // 28  (Length low byte, little-endian)`,
    explanation: "`MemoryMarshal.Write<T>` copies a blittable struct's bytes into a destination span at zero extra allocation cost, replacing the older pattern of pinning + `Marshal.StructureToPtr` for in-process binary serialisation.",
  },
  {
    id: "cs-b16-b5-span-reverse-sort",
    language: "csharp",
    title: "Span<T> in-place sort and reverse",
    tag: "snippet",
    code: `using System;

Span<int> nums = [5, 3, 8, 1, 9, 2, 7, 4, 6];

// In-place quicksort — no allocation
nums.Sort();
Console.WriteLine(string.Join(", ", nums.ToArray()));
// 1, 2, 3, 4, 5, 6, 7, 8, 9

// In-place reverse
nums.Reverse();
Console.WriteLine(string.Join(", ", nums.ToArray()));
// 9, 8, 7, 6, 5, 4, 3, 2, 1`,
    explanation: "`Span<T>.Sort()` and `Span<T>.Reverse()` operate in-place without allocating a temporary array; the sort uses an introspective algorithm (introsort) that is as fast as `Array.Sort` but scoped to the span slice.",
  },
  {
    id: "cs-b16-b5-stackalloc-inline-array",
    language: "csharp",
    title: "Inline arrays (C# 12) vs stackalloc",
    tag: "snippet",
    code: `using System;
using System.Runtime.CompilerServices;

// Inline array: fixed-length buffer embeddable in any struct (C# 12)
[InlineArray(8)]
struct FloatBuffer8
{
    private float _element0;   // anchor field — the rest are implicit
}

FloatBuffer8 buf = default;
for (int i = 0; i < 8; i++)
    buf[i] = i * 1.5f;

Console.WriteLine(buf[3]);    // 4.5

// Unlike stackalloc, inline arrays can be stored in structs/classes
// and their lifetime is tied to the containing object, not the stack frame`,
    explanation: "C# 12 inline arrays embed a fixed-length buffer directly inside a struct without the `unsafe` keyword; unlike `stackalloc` the buffer's lifetime matches the containing struct, making it usable in ref-struct fields or as a class field.",
  },
  {
    id: "cs-b16-b5-binaryprimitives-float",
    language: "csharp",
    title: "BinaryPrimitives — reading float/double bytes",
    tag: "snippet",
    code: `using System;
using System.Buffers.Binary;

// Encode a double in little-endian byte order
byte[] buf = new byte[8];
BinaryPrimitives.WriteDoubleLittleEndian(buf, Math.PI);

Console.WriteLine(BitConverter.ToString(buf));
// 18-2D-44-54-FB-21-09-40  (IEEE-754 LE representation of π)

// Round-trip
double back = BinaryPrimitives.ReadDoubleLittleEndian(buf);
Console.WriteLine(back);   // 3.141592653589793

// Span overloads work too
ReadOnlySpan<byte> span = buf;
Console.WriteLine(BinaryPrimitives.ReadDoubleLittleEndian(span));`,
    explanation: "`BinaryPrimitives` supports `float`, `double`, `Half`, and all integer widths in both endiannesses; it's the correct tool for binary file formats and network protocols that specify IEEE-754 floating-point byte order.",
  },
  {
    id: "cs-b16-b5-marshal-sizeof-struct",
    language: "csharp",
    title: "Marshal.SizeOf vs sizeof — managed vs unmanaged layout",
    tag: "caveats",
    code: `using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct Packed { public byte A; public int B; }   // 5 bytes packed

// sizeof: compile-time managed layout (may add padding for alignment)
unsafe { Console.WriteLine(sizeof(Packed)); }  // 8 (compiler aligns B to 4)

// Marshal.SizeOf: unmanaged size after StructLayout rules apply
Console.WriteLine(Marshal.SizeOf<Packed>());   // 5  (Pack=1 removes padding)

// The two can differ — always use Marshal.SizeOf when calculating
// native struct sizes for P/Invoke buffer sizing`,
    explanation: "`sizeof` reports the managed in-memory size (which may include padding for CPU alignment), while `Marshal.SizeOf` applies `StructLayout` attributes to compute the actual native struct size — they can differ significantly with `Pack` settings.",
  },
  {
    id: "cs-b16-b5-span-overlaps",
    language: "csharp",
    title: "Span.Overlaps — detect aliasing",
    tag: "caveats",
    code: `using System;

byte[] arr = new byte[16];
Span<byte> a = arr.AsSpan(0, 8);
Span<byte> b = arr.AsSpan(4, 8);   // overlaps a by 4 bytes
Span<byte> c = arr.AsSpan(8, 8);   // adjacent, no overlap

Console.WriteLine(a.Overlaps(b));        // True
Console.WriteLine(a.Overlaps(c));        // False

// Overlaps with offset output
bool ov = a.Overlaps(b, out int offset);
Console.WriteLine(\`overlaps=\${ov} offset=\${offset}\`);  // overlaps=True offset=4`,
    explanation: "`Span<T>.Overlaps` detects aliasing between two spans backed by the same memory region — critical before calling `CopyTo` (which is undefined for overlapping spans) or running vectorised algorithms that assume independent buffers.",
  },
  {
    id: "cs-b16-b5-unsafe-initblock",
    language: "csharp",
    title: "Unsafe.InitBlock — fast memory zeroing",
    tag: "snippet",
    code: `using System;
using System.Runtime.CompilerServices;

unsafe
{
    byte[] arr = new byte[256];
    fixed (byte* p = arr)
    {
        // Equivalent to memset(p, 0xAB, 256)
        Unsafe.InitBlock(p, 0xAB, 256);
        Console.WriteLine(arr[0].ToString("X2"));    // AB
        Console.WriteLine(arr[255].ToString("X2"));  // AB

        // Zero a block — faster than a loop on large buffers
        Unsafe.InitBlock(p, 0x00, 256);
        Console.WriteLine(arr[128]);                 // 0
    }
}`,
    explanation: "`Unsafe.InitBlock` maps directly to the JIT's `initblk` IL opcode which the runtime implements as a `memset`-equivalent; for large buffers this is faster than a manual loop and clearer than pinning + `Marshal.Set`.",
  },
  {
    id: "cs-b16-b5-span-startswith-endswith",
    language: "csharp",
    title: "ReadOnlySpan<char> StartsWith, EndsWith, TrimStart",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<char> line = "   Hello, World!   ".AsSpan();

// Trim without allocating a new string
ReadOnlySpan<char> trimmed = line.Trim();
Console.WriteLine(trimmed.ToString());              // "Hello, World!"

Console.WriteLine(trimmed.StartsWith("Hello"));     // True
Console.WriteLine(trimmed.EndsWith("World!"));      // True

// Case-insensitive comparison
Console.WriteLine(trimmed.StartsWith("hello",
    StringComparison.OrdinalIgnoreCase));            // True`,
    explanation: "`ReadOnlySpan<char>` exposes `Trim`, `StartsWith`, `EndsWith`, and `Contains` that operate on the span slice without allocating intermediate strings — a significant win when scanning lines in large text-processing loops.",
  },
  {
    id: "cs-b16-b5-native-memory-aligned",
    language: "csharp",
    title: "NativeMemory.AlignedAlloc for SIMD alignment",
    tag: "snippet",
    code: `using System;
using System.Runtime.InteropServices;

unsafe
{
    // Allocate 256 bytes aligned to a 32-byte boundary (AVX2 requirement)
    nuint size = 256;
    nuint align = 32;
    void* ptr = NativeMemory.AlignedAlloc(size, align);
    try
    {
        // Verify alignment
        Console.WriteLine((nuint)ptr % align == 0);  // True

        float* floats = (float*)ptr;
        for (int i = 0; i < 8; i++) floats[i] = i;
        Console.WriteLine(floats[7]);   // 7
    }
    finally
    {
        NativeMemory.AlignedFree(ptr);   // must use AlignedFree, not Free
    }
}`,
    explanation: "`NativeMemory.AlignedAlloc` allocates memory at a specific power-of-two alignment required for SIMD intrinsics that demand 16-, 32-, or 64-byte aligned addresses; always pair with `NativeMemory.AlignedFree`.",
  },
  {
    id: "cs-b16-b5-gchandle-weak",
    language: "csharp",
    title: "GCHandle.Weak — weak references to managed objects",
    tag: "types",
    code: `using System;
using System.Runtime.InteropServices;

class Cache { public string Data = "expensive result"; }

var obj = new Cache();

// Weak handle: GC can collect obj even while handle is alive
GCHandle handle = GCHandle.Alloc(obj, GCHandleType.Weak);

Console.WriteLine(handle.IsAllocated);                // True
Console.WriteLine(((Cache?)handle.Target)?.Data);     // expensive result

// After GC collects obj:
obj = null!;
GC.Collect(GC.MaxGeneration, GCCollectionMode.Forced);

Console.WriteLine(handle.Target is null);             // True (probably)
handle.Free();`,
    explanation: "`GCHandle.Weak` lets you hold a non-rooting reference to a managed object; `handle.Target` returns `null` once the GC has collected the object, making it suitable for caches where eviction is acceptable.",
  },
  {
    id: "cs-b16-b5-unsafe-copymemory",
    language: "csharp",
    title: "Unsafe.CopyBlock — fast memory copy",
    tag: "snippet",
    code: `using System;
using System.Runtime.CompilerServices;

unsafe
{
    byte[] src = [10, 20, 30, 40, 50, 60, 70, 80];
    byte[] dst = new byte[8];

    fixed (byte* s = src, d = dst)
    {
        // Copy 8 bytes — maps to memcpy / movs instruction
        Unsafe.CopyBlock(d, s, (uint)src.Length);
    }

    Console.WriteLine(dst[0]);   // 10
    Console.WriteLine(dst[7]);   // 80

    // Non-pinning variant using refs (no unsafe block needed if refs are local):
    // Unsafe.CopyBlock(ref dst[0], ref src[0], (uint)src.Length);
}`,
    explanation: "`Unsafe.CopyBlock` emits the `cpblk` IL opcode, which the JIT lowers to `rep movs` or a vectorised copy; it's the fastest safe way to copy raw memory between pinned managed buffers.",
  },
  {
    id: "cs-b16-b5-span-sequence-equal",
    language: "csharp",
    title: "Span<T>.SequenceCompareTo — lexicographic comparison",
    tag: "snippet",
    code: `using System;

ReadOnlySpan<int> a = [1, 2, 3];
ReadOnlySpan<int> b = [1, 2, 4];
ReadOnlySpan<int> c = [1, 2, 3];

// Returns negative/zero/positive like string.Compare
Console.WriteLine(a.SequenceCompareTo(b));   // -1  (a < b)
Console.WriteLine(b.SequenceCompareTo(a));   // 1   (b > a)
Console.WriteLine(a.SequenceCompareTo(c));   // 0   (equal)

// SequenceEqual is faster when you only need equality
Console.WriteLine(a.SequenceEqual(c));       // True`,
    explanation: "`SequenceCompareTo` performs element-wise lexicographic comparison — the same semantics as `memcmp` — and is useful for sorting spans or implementing a `CompareTo` on types backed by span data.",
  },
  {
    id: "cs-b16-b5-memorymarshal-getreference",
    language: "csharp",
    title: "MemoryMarshal.GetReference — pinning-free pointer",
    tag: "types",
    code: `using System;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

byte[] arr = [10, 20, 30, 40, 50];
Span<byte> span = arr;

// GetReference returns a ref to the first element — no pinning needed
ref byte first = ref MemoryMarshal.GetReference(span);
Console.WriteLine(first);   // 10

// Advance via Unsafe.Add without fixed statement
ref byte third = ref Unsafe.Add(ref first, 2);
Console.WriteLine(third);   // 30

// Modifying through the ref updates the original array
third = 99;
Console.WriteLine(arr[2]);  // 99`,
    explanation: "`MemoryMarshal.GetReference` returns a managed reference to the first element of a span, enabling pointer-style offset arithmetic via `Unsafe.Add` without a `fixed` statement — the GC still tracks the object through the managed ref.",
  },
  {
    id: "cs-b16-b5-vector128-create",
    language: "csharp",
    title: "Vector128 arithmetic operations",
    tag: "snippet",
    code: `using System;
using System.Runtime.Intrinsics;

// Broadcast a single value across all lanes
var zeros = Vector128<float>.Zero;
var ones  = Vector128.Create(1.0f);
var data  = Vector128.Create(1.0f, 4.0f, 9.0f, 16.0f);

// Element-wise square root
var roots = Vector128.Sqrt(data);
Console.WriteLine(roots[0]);   // 1
Console.WriteLine(roots[1]);   // 2
Console.WriteLine(roots[2]);   // 3
Console.WriteLine(roots[3]);   // 4

// Dot product (manual: multiply then horizontal sum)
var products = ones * data;
float dot = Vector128.Dot(ones, data);
Console.WriteLine(dot);        // 30`,
    explanation: "`Vector128<T>` supports element-wise arithmetic operators and utility methods like `Sqrt` and `Dot` that compile to SSE/NEON instructions; the 128-bit width is guaranteed to be supported on all x64 and ARM64 targets.",
  },
  {
    id: "cs-b16-b5-iparsable-generic",
    language: "csharp",
    title: "Generic configuration reader with IParsable<T>",
    tag: "classes",
    code: `using System;
using System.Collections.Generic;

// Read typed config values generically — works with any IParsable<T>
static T GetConfig<T>(Dictionary<string, string> cfg, string key)
    where T : IParsable<T>
{
    if (!cfg.TryGetValue(key, out string? raw))
        throw new KeyNotFoundException(key);
    return T.Parse(raw, null);
}

var config = new Dictionary<string, string>
{
    ["Port"]    = "8080",
    ["Timeout"] = "30.5",
    ["Debug"]   = "True",
};

int    port    = GetConfig<int>(config, "Port");
double timeout = GetConfig<double>(config, "Timeout");
bool   debug   = GetConfig<bool>(config, "Debug");

Console.WriteLine(\`port=\${port} timeout=\${timeout} debug=\${debug}\`);`,
    explanation: "Constraining to `IParsable<T>` with a static abstract `Parse` member lets a single generic helper parse configuration strings into any primitive or custom type without reflection or a lookup table of converters.",
  },
  {
    id: "cs-b16-b5-bitoperations-rotate",
    language: "csharp",
    title: "BitOperations.RotateLeft and RotateRight",
    tag: "snippet",
    code: `using System;
using System.Numerics;

uint value = 0b_1000_0000_0000_0000_0000_0000_0000_0001u;  // MSB and LSB set

// Rotate left by 1 — MSB wraps to LSB position
uint rotL = BitOperations.RotateLeft(value, 1);
Console.WriteLine(rotL.ToString("B32"));
// 00000000000000000000000000000011  (both bits moved left)

// Rotate right by 1
uint rotR = BitOperations.RotateRight(value, 1);
Console.WriteLine(rotR.ToString("B32"));
// 11000000000000000000000000000000`,
    explanation: "`BitOperations.RotateLeft/Right` emit the `rol`/`ror` hardware instruction on x64 via JIT intrinsics, making them far faster than the classic two-shift workaround `(v << n) | (v >> (32 - n))` which also has undefined behaviour for n=0.",
  },
];


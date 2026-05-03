import type { Snippet } from "./types";

export const reactSnippets: Snippet[] = [
  {
    id: "react-usestate",
    language: "react",
    title: "useState — the basic hook",
    tag: "hooks",
    code: `function Counter() {
    // useState returns [value, setter]. Initial value is 0.
    const [count, setCount] = useState(0);

    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
}`,
    explanation:
      "Simplest hook. setCount triggers a re-render with the new value. State is per-instance — each <Counter /> has its own count.",
  },
  {
    id: "react-updater-fn",
    language: "react",
    title: "Updater function form",
    tag: "hooks",
    code: `function DoubleClick() {
    const [n, setN] = useState(0);

    function bump() {
        // WRONG — both reads of n see the same stale value (0).
        // setN(n + 1);
        // setN(n + 1);

        // RIGHT — updater form. Each call sees the latest committed state.
        setN(c => c + 1);
        setN(c => c + 1);   // total: +2 per click
    }

    return <button onClick={bump}>{n}</button>;
}`,
    explanation:
      "When new state depends on the old, use the updater. Plain setN(n + 1) closes over the value at render time — back-to-back calls collapse.",
  },
  {
    id: "react-useeffect-cleanup",
    language: "react",
    title: "useEffect with cleanup",
    tag: "hooks",
    code: `function WindowWidth() {
    const [w, setW] = useState(window.innerWidth);

    useEffect(() => {
        // Subscribe.
        const onResize = () => setW(window.innerWidth);
        window.addEventListener("resize", onResize);

        // Cleanup runs before next effect AND on unmount.
        // Without it: leaked listener; potentially calls setW after unmount.
        return () => window.removeEventListener("resize", onResize);
    }, []); // empty deps — once on mount, cleanup once on unmount

    return <p>{w}px</p>;
}`,
    explanation:
      "Always return cleanup for subscriptions, intervals, observers. Empty dep array = run once. Listing deps = re-run when those change.",
  },
  {
    id: "react-deps-array",
    language: "react",
    title: "useEffect dependency array",
    tag: "hooks",
    code: `function Title({ text }: { text: string }) {
    useEffect(() => {
        document.title = text;
    }, [text]);   // re-run only when 'text' changes

    return null;
}

// Common mistakes:
//   []          — runs once, ignores 'text' updates (stale)
//   no deps     — runs after EVERY render (often unintended)
//   [text, x]   — re-runs when EITHER changes`,
    explanation:
      "Dependency array tells React when to re-run. List every variable from outside the effect that you read inside — the compiler / lint catches drift.",
  },
  {
    id: "react-conditional",
    language: "react",
    title: "Conditional rendering",
    tag: "JSX",
    code: `function Greet({ user }: { user?: { name: string } }) {
    // Early return for top-level branching
    if (!user) return <p>Sign in</p>;

    return (
        <>
            {/* Ternary for inline branching */}
            <p>Hi, {user.name ? user.name : "stranger"}</p>

            {/* && for "render or nothing" */}
            {user.name && <span>welcome back</span>}

            {/* CAUTION: 0 && <X/> renders 0 — use Boolean() or > 0 */}
            {/* {count && <Items/>}    renders 0 if count===0 ! */}
            {/* {count > 0 && <Items/>}  safe */}
        </>
    );
}`,
    explanation:
      "Three idioms: early return, ternary, &&. Watch the 0 && pitfall — JSX renders 0 as text, not nothing. Use > 0 or Boolean().",
  },
  {
    id: "react-list-keys",
    language: "react",
    title: "List rendering with keys",
    tag: "JSX",
    code: `function UserList({ users }: { users: { id: number; name: string }[] }) {
    return (
        <ul>
            {users.map(u => (
                // 'key' tells React how to track this item across renders.
                // Use a STABLE id — never the array index for reorderable lists.
                <li key={u.id}>{u.name}</li>
            ))}
        </ul>
    );
}`,
    explanation:
      "Stable keys let React diff efficiently. Index-as-key is OK only for static, never-reordered lists. DB id, slug, hash, etc. are better.",
  },
  {
    id: "react-controlled-input",
    language: "react",
    title: "Controlled input",
    tag: "forms",
    code: `function NameForm() {
    // React holds the source of truth via state.
    const [name, setName] = useState("");

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();    // stop the default page reload
        console.log("submitted", name);
    }

    return (
        <form onSubmit={onSubmit}>
            {/* value + onChange = controlled. The DOM mirrors React's state. */}
            <input
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <button type="submit">Go</button>
        </form>
    );
}`,
    explanation:
      "Controlled inputs make state the single source of truth — easy to validate, reset, and snapshot. For perf-sensitive uncontrolled forms, refs work too.",
  },
  {
    id: "react-children-prop",
    language: "react",
    title: "children prop",
    tag: "JSX",
    code: `// 'children' is a special prop containing whatever is between the tags.
function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="card">
            {children}
        </div>
    );
}

// Usage:
<Card>
    <h2>Title</h2>
    <p>Anything goes here.</p>
</Card>

// React.ReactNode covers strings, numbers, JSX, null, arrays of those.`,
    explanation:
      "Wrapper components like Card, Modal, Layout use children. Simpler than passing markup as a prop; reads exactly like HTML.",
  },
  {
    id: "react-useref-dom",
    language: "react",
    title: "useRef for DOM access",
    tag: "hooks",
    code: `function Search() {
    // useRef returns { current: null }. After mount, ref.current points
    // to the DOM node.
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus the input on mount.
        inputRef.current?.focus();
    }, []);

    return <input ref={inputRef} />;
}`,
    explanation:
      "useRef + ref={} is how you reach a DOM node imperatively. Mutating ref.current does NOT trigger a re-render — that's its whole point.",
  },
  {
    id: "react-usememo",
    language: "react",
    title: "useMemo for expensive computation",
    tag: "perf",
    code: `function Filtered({ items, q }: { items: Item[]; q: string }) {
    // useMemo caches the result. Recomputed only when [items, q] change.
    const filtered = useMemo(() => {
        return items.filter(i => i.name.includes(q));
    }, [items, q]);

    return (
        <ul>
            {filtered.map(i => <li key={i.id}>{i.name}</li>)}
        </ul>
    );
}`,
    explanation:
      "Use useMemo only when you've measured a real cost — otherwise it's overhead. Most computations don't need it.",
  },
  {
    id: "react-usecallback",
    language: "react",
    title: "useCallback for stable refs",
    tag: "perf",
    code: `function Parent() {
    const [count, setCount] = useState(0);

    // Without useCallback, onClick is a NEW function each render —
    // breaks memo-optimized children.
    const onClick = useCallback(() => {
        console.log("clicked");
    }, []);

    return (
        <>
            <p>{count}</p>
            <button onClick={() => setCount(c => c + 1)}>++</button>
            <Child onClick={onClick} />
        </>
    );
}

const Child = memo(({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>tap</button>
));
// Child only re-renders when onClick reference actually changes.`,
    explanation:
      "useCallback is useMemo for functions. Most useful when passing callbacks to memo-wrapped children. Without memo on the receiver, useCallback alone does nothing.",
  },
  {
    id: "react-context",
    language: "react",
    title: "useContext basics",
    tag: "hooks",
    code: `// 1. Create the context with a default
const ThemeContext = createContext<"light" | "dark">("light");

// 2. Provider wraps the subtree
function App() {
    return (
        <ThemeContext.Provider value="dark">
            <Toolbar />
        </ThemeContext.Provider>
    );
}

// 3. Any descendant reads with useContext
function Toolbar() {
    const theme = useContext(ThemeContext);
    return <div className={theme}>tools</div>;
}`,
    explanation:
      "Avoids 'prop drilling' for values used widely (theme, current user, locale). Don't use it for high-frequency state — every consumer re-renders on change.",
  },
  {
    id: "react-fragment",
    language: "react",
    title: "Fragments — no extra DOM node",
    tag: "JSX",
    code: `// You can't return TWO siblings from a component without a wrapper.
// Fragment (<></>) wraps without adding to the DOM.
function NameAndAge() {
    return (
        <>
            <h2>Ada Lovelace</h2>
            <p>36 years old</p>
        </>
    );
}

// When you need a key (e.g., in a map), use the long form:
// <React.Fragment key={item.id}>...</React.Fragment>`,
    explanation:
      "Renders no wrapper element — siblings as if you returned them naked. Keeps your DOM clean from gratuitous <div>s.",
  },
  {
    id: "react-event-handlers",
    language: "react",
    title: "Event handlers + types",
    tag: "events",
    code: `function Button() {
    // Event arg is a SyntheticEvent — typed by the bound element.
    function onClick(e: React.MouseEvent<HTMLButtonElement>) {
        console.log("clicked", e.currentTarget.textContent);
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        console.log("typed", e.target.value);
    }

    return (
        <>
            <button onClick={onClick}>Save</button>
            <input onChange={onChange} />
        </>
    );
}`,
    explanation:
      "Synthetic events are React's cross-browser wrapper. Always type the event by element — autocomplete and type safety win.",
  },
  {
    id: "react-lazy-suspense",
    language: "react",
    title: "lazy + Suspense",
    tag: "perf",
    code: `// Code-split a heavy component — loads only when rendered.
const HeavyChart = lazy(() => import("./HeavyChart"));

function Dashboard() {
    return (
        <div>
            <h1>Dashboard</h1>

            {/* Suspense shows the fallback while HeavyChart loads. */}
            <Suspense fallback={<p>Loading chart…</p>}>
                <HeavyChart />
            </Suspense>
        </div>
    );
}`,
    explanation:
      "lazy() + dynamic import = automatic code splitting. Suspense boundary handles the loading state. Combined, you ship less JS up front.",
  },
  {
    id: "react-custom-hook",
    language: "react",
    title: "Custom hook — useToggle",
    tag: "hooks",
    code: `// Custom hooks are functions that call other hooks. Names start with "use".
function useToggle(initial = false): [boolean, () => void] {
    const [on, setOn] = useState(initial);
    const toggle = useCallback(() => setOn(o => !o), []);
    return [on, toggle];
}

// Use it like any built-in hook:
function ThemeButton() {
    const [dark, toggle] = useToggle();
    return (
        <button onClick={toggle}>
            {dark ? "🌙" : "☀️"}
        </button>
    );
}`,
    explanation:
      "Extract repeated stateful logic into a hook. Each call gets its own state — they share logic, not values.",
  },
  {
    id: "react-server-component",
    language: "react",
    title: "Server Component (Next.js)",
    tag: "next",
    code: `// app/posts/page.tsx — Server Component by default
// Runs on the server, no JS shipped to the browser.
async function getPosts() {
    const r = await fetch("https://api.example.com/posts");
    return r.json();
}

// Components can be async — await directly.
export default async function Posts() {
    const posts = await getPosts();
    return (
        <ul>
            {posts.map((p: { id: number; title: string }) => (
                <li key={p.id}>{p.title}</li>
            ))}
        </ul>
    );
}`,
    explanation:
      "Server Components run only on the server. Full Node API access (DB, fs, secrets), no client JS for the markup. Add 'use client' to opt into client behavior.",
  },
  {
    id: "react-use-client",
    language: "react",
    title: "'use client' directive",
    tag: "next",
    code: `"use client";   // <- top of the file makes this a Client Component

import { useState } from "react";

export function Counter() {
    const [n, setN] = useState(0);
    return (
        <button onClick={() => setN(n + 1)}>
            {n}
        </button>
    );
}

// Client Components can use hooks, browser APIs, event handlers.
// Server Components can render Client Components (passes them as JSX);
// Client Components CANNOT render Server Components.`,
    explanation:
      "'use client' opts the file into the client runtime. Server can render client; client can't render server. Plan the boundary to keep client bundles small.",
  },
  {
    id: "react-memo",
    language: "react",
    title: "memo — skip re-render on equal props",
    tag: "perf",
    code: `// memo wraps a component to skip re-rendering when props are shallow-equal.
const ExpensiveItem = memo(function ExpensiveItem({ name }: { name: string }) {
    console.log("rendering", name);
    return <div>{name}</div>;
});

function List({ items }: { items: { id: number; name: string }[] }) {
    return (
        <>
            {items.map(i => (
                // ExpensiveItem only re-renders when 'name' actually changes.
                <ExpensiveItem key={i.id} name={i.name} />
            ))}
        </>
    );
}`,
    explanation:
      "memo + stable props = fewer re-renders. Add useCallback / useMemo to keep callback and object props stable, or memo does nothing.",
  },
  {
    id: "react-portal",
    language: "react",
    title: "Portal — render outside the tree",
    tag: "JSX",
    code: `function Modal({ children }: { children: React.ReactNode }) {
    // createPortal renders children into a different DOM node
    // (here, document.body). React event handling still works.
    return createPortal(
        <div className="modal-backdrop">
            <div className="modal-content">{children}</div>
        </div>,
        document.body
    );
}`,
    explanation:
      "Use portals to escape parent overflow / z-index / stacking-context. Common for modals, tooltips, dropdowns. Events still bubble through the React tree.",
  },
];

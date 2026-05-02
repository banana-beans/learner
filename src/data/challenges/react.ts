// ============================================================
// React + Next.js — Challenges (manual mode: read solution + I got it)
// ============================================================
// JSX/Next can't run in our simple JS sandbox without a JSX
// transformer + react-dom. Challenges here use lang: "manual"
// — show solution, click "I got it" to claim XP.
// ============================================================

import type { Challenge } from "@/lib/types";

const manualChallenge = (
  partial: Omit<Challenge, "lang" | "type" | "isBoss" | "starterCode" | "tags"> & Partial<Pick<Challenge, "tags" | "isBoss" | "starterCode">>
): Challenge => ({
  type: "write_from_scratch",
  isBoss: false,
  starterCode: "",
  tags: ["react"],
  lang: "manual",
  ...partial,
});

export const reactChallenges: Challenge[] = [
  // T1
  manualChallenge({
    id: "react-t1-jsx-1",
    nodeId: "react:t1:jsx",
    title: "Render a name with JSX",
    description: "Write a component that prints `Hello, {name}!` for a given name prop.",
    difficulty: 1,
    hints: [
      { tier: "nudge", text: "Curly braces inject JS into JSX.", xpPenalty: 0.9 },
      { tier: "guide", text: "function Hello({ name }) { return <h1>Hello, {name}!</h1>; }", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 80,
  }),
  manualChallenge({
    id: "react-t1-comp-1",
    nodeId: "react:t1:components",
    title: "Composing two components",
    description: "Write Greeting that takes a name and returns <p>Hi, {name}!</p>. Then a App that renders Greeting twice with two different names.",
    difficulty: 1,
    hints: [
      { tier: "nudge", text: "Function components are just functions returning JSX.", xpPenalty: 0.9 },
      { tier: "guide", text: "Greeting receives { name }. App returns <><Greeting name='Ada' /><Greeting name='Linus'/></>.", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Greeting({ name }: { name: string }) {
  return <p>Hi, {name}!</p>;
}
function App() {
  return (<><Greeting name="Ada" /><Greeting name="Linus" /></>);
}`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
  }),
  manualChallenge({
    id: "react-t1-props-1",
    nodeId: "react:t1:props",
    title: "Optional prop with default",
    description: "Btn props: label (required), primary (optional bool, default false). Apply 'btn-primary' or 'btn'.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "Default value comes from destructuring.", xpPenalty: 0.9 },
      { tier: "guide", text: "{ label, primary = false }: BtnProps", xpPenalty: 0.75 },
      { tier: "reveal", text: `interface BtnProps { label: string; primary?: boolean }
function Btn({ label, primary = false }: BtnProps) {
  return <button className={primary ? "btn-primary" : "btn"}>{label}</button>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 130,
  }),
  manualChallenge({
    id: "react-t1-children-1",
    nodeId: "react:t1:children",
    title: "Card wrapper",
    description: "A Card component that wraps its children in <div className='card'>...</div>.",
    difficulty: 1,
    hints: [
      { tier: "nudge", text: "children is a special prop typed as ReactNode.", xpPenalty: 0.9 },
      { tier: "guide", text: "{ children }: { children: React.ReactNode }", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 100,
  }),
  manualChallenge({
    id: "react-t1-comp-2",
    nodeId: "react:t1:composition",
    title: "Stack of items",
    description: "Stack component: vertical flex container with gap. List four <Card>s in it.",
    difficulty: 2,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "flex column with gap.", xpPenalty: 0.9 },
      { tier: "guide", text: "Inline style: { display: 'flex', flexDirection: 'column', gap: 8 }", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Stack({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
  }),

  // T2
  manualChallenge({
    id: "react-t2-state-1",
    nodeId: "react:t2:useState",
    title: "Counter component",
    description: "Counter with a button. Click increments. Use updater form.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "useState(0).", xpPenalty: 0.9 },
      { tier: "guide", text: "setCount(c => c + 1)", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 130,
  }),
  manualChallenge({
    id: "react-t2-effect-1",
    nodeId: "react:t2:useEffect",
    title: "Document title syncer",
    description: "Title({text}): set document.title = text whenever text changes. Cleanup not required.",
    difficulty: 2,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "useEffect with [text] dependency.", xpPenalty: 0.9 },
      { tier: "guide", text: "useEffect(() => { document.title = text }, [text])", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Title({ text }: { text: string }) {
  useEffect(() => { document.title = text; }, [text]);
  return null;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),
  manualChallenge({
    id: "react-t2-ref-1",
    nodeId: "react:t2:useRef",
    title: "Focus on mount",
    description: "Search component: an input that focuses automatically when mounted.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "useRef + useEffect on mount.", xpPenalty: 0.9 },
      { tier: "guide", text: "ref.current?.focus() inside a [] effect.", xpPenalty: 0.75 },
      { tier: "reveal", text: `function Search() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <input ref={ref} />;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
  }),
  manualChallenge({
    id: "react-t2-form-1",
    nodeId: "react:t2:events-forms",
    title: "Controlled input",
    description: "Form with one input bound to state. On submit, log the value and prevent default.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "value + onChange = controlled.", xpPenalty: 0.9 },
      { tier: "guide", text: "e.preventDefault() in onSubmit.", xpPenalty: 0.75 },
      { tier: "reveal", text: `function NameForm() {
  const [name, setName] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); console.log(name); }}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit">Go</button>
    </form>
  );
}`, xpPenalty: 0.5 },
    ],
    baseXP: 150,
  }),
  manualChallenge({
    id: "react-t2-list-1",
    nodeId: "react:t2:conditional-lists",
    title: "Empty + list state",
    description: "ItemList(items: string[]). Show 'No items' if empty; else render <li>s with stable keys.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "Branch on items.length === 0.", xpPenalty: 0.9 },
      { tier: "guide", text: "Use the value as key only if values are unique.", xpPenalty: 0.75 },
      { tier: "reveal", text: `function ItemList({ items }: { items: string[] }) {
  if (items.length === 0) return <p>No items</p>;
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 130,
  }),

  // T3
  manualChallenge({
    id: "react-t3-ctx-1",
    nodeId: "react:t3:useContext",
    title: "Theme context",
    description: "Theme context with values 'light' | 'dark'. App provides 'dark'. Toolbar reads via useContext and renders the value.",
    difficulty: 3,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "createContext + Provider + useContext.", xpPenalty: 0.9 },
      { tier: "guide", text: "Wrap Toolbar in <ThemeContext.Provider value='dark'>.", xpPenalty: 0.75 },
      { tier: "reveal", text: `type Theme = "light" | "dark";
const ThemeContext = createContext<Theme>("light");

function Toolbar() {
  const t = useContext(ThemeContext);
  return <div className={t}>tools</div>;
}
function App() {
  return <ThemeContext.Provider value="dark"><Toolbar /></ThemeContext.Provider>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 200,
  }),
  manualChallenge({
    id: "react-t3-red-1",
    nodeId: "react:t3:useReducer",
    title: "Counter reducer",
    description: "useReducer with actions inc/dec/reset. Render +/- buttons and a reset.",
    difficulty: 3,
    hints: [
      { tier: "nudge", text: "Action is a discriminated union by 'type'.", xpPenalty: 0.9 },
      { tier: "guide", text: "switch (a.type) { case 'inc': ... }", xpPenalty: 0.75 },
      { tier: "reveal", text: `type Action = { type: "inc" } | { type: "dec" } | { type: "reset" };
function reducer(s: { count: number }, a: Action) {
  switch (a.type) {
    case "inc": return { count: s.count + 1 };
    case "dec": return { count: s.count - 1 };
    case "reset": return { count: 0 };
  }
}
function Counter() {
  const [s, d] = useReducer(reducer, { count: 0 });
  return <><button onClick={() => d({ type: "dec" })}>-</button>{s.count}<button onClick={() => d({ type: "inc" })}>+</button></>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 200,
  }),
  manualChallenge({
    id: "react-t3-hook-1",
    nodeId: "react:t3:custom-hooks",
    title: "useToggle",
    description: "Custom hook returning [on, toggle].",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "Wrap setOn(o => !o) in useCallback for stability.", xpPenalty: 0.9 },
      { tier: "guide", text: "Return [on, toggle] as const for tuple typing.", xpPenalty: 0.75 },
      { tier: "reveal", text: `function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(o => !o), []);
  return [on, toggle] as const;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),
  manualChallenge({
    id: "react-t3-memo-1",
    nodeId: "react:t3:memo-perf",
    title: "memo + useCallback combo",
    description: "Parent has a count. Child receives onClick — wrap onClick in useCallback so memo'd Child doesn't re-render when count changes.",
    difficulty: 3,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "Without useCallback, onClick is a new function each render.", xpPenalty: 0.9 },
      { tier: "guide", text: "memo + useCallback together — neither alone is enough.", xpPenalty: 0.75 },
      { tier: "reveal", text: `const Child = memo(({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}>tap</button>
));
function Parent() {
  const [c, setC] = useState(0);
  const onClick = useCallback(() => console.log("click"), []);
  return <>{c}<button onClick={() => setC(x => x+1)}>++</button><Child onClick={onClick} /></>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 220,
  }),
  manualChallenge({
    id: "react-t3-suspense-1",
    nodeId: "react:t3:portals-suspense",
    title: "Lazy + Suspense",
    description: "Lazy-load HeavyChart and wrap in Suspense with a 'Loading…' fallback.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "lazy(() => import(...)).", xpPenalty: 0.9 },
      { tier: "guide", text: "<Suspense fallback={<p>Loading…</p>}>", xpPenalty: 0.75 },
      { tier: "reveal", text: `const HeavyChart = lazy(() => import("./HeavyChart"));
function Dashboard() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <HeavyChart />
    </Suspense>
  );
}`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),

  // T4 — Next.js
  manualChallenge({
    id: "react-t4-route-1",
    nodeId: "react:t4:app-router",
    title: "Dynamic route page",
    description: "app/posts/[slug]/page.tsx that awaits params and renders the slug.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "params is a Promise in Next 16.", xpPenalty: 0.9 },
      { tier: "guide", text: "async function Page({ params }: { params: Promise<{ slug: string }> })", xpPenalty: 0.75 },
      { tier: "reveal", text: `export default async function Post({
  params
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <article>Post: {slug}</article>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),
  manualChallenge({
    id: "react-t4-rsc-1",
    nodeId: "react:t4:rsc",
    title: "Async server component",
    description: "Server component that fetches /api/posts and renders titles. No 'use client'.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "Server components can be async functions.", xpPenalty: 0.9 },
      { tier: "guide", text: "await fetch(...) — no useEffect needed.", xpPenalty: 0.75 },
      { tier: "reveal", text: `export default async function Posts() {
  const r = await fetch("https://api.example.com/posts");
  const posts = await r.json() as { id: number; title: string }[];
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 200,
  }),
  manualChallenge({
    id: "react-t4-action-1",
    nodeId: "react:t4:server-actions",
    title: "Server action create",
    description: "Server action createPost(formData) that reads 'title' and revalidates /posts.",
    difficulty: 3,
    isBoss: true,
    hints: [
      { tier: "nudge", text: "'use server' at top of the file.", xpPenalty: 0.9 },
      { tier: "guide", text: "revalidatePath('/posts') after mutation.", xpPenalty: 0.75 },
      { tier: "reveal", text: `// app/actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  await db.post.create({ data: { title } });
  revalidatePath("/posts");
}`, xpPenalty: 0.5 },
    ],
    baseXP: 250,
  }),
  manualChallenge({
    id: "react-t4-layout-1",
    nodeId: "react:t4:layouts",
    title: "Nested layout",
    description: "app/dashboard/layout.tsx wrapping children in <div className='dash'><Sidebar/>{children}</div>.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "layout.tsx receives children prop.", xpPenalty: 0.9 },
      { tier: "guide", text: "Default export an async or sync function.", xpPenalty: 0.75 },
      { tier: "reveal", text: `export default function DashLayout({ children }: { children: React.ReactNode }) {
  return <div className="dash"><Sidebar />{children}</div>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),
  manualChallenge({
    id: "react-t4-render-1",
    nodeId: "react:t4:rendering-strategies",
    title: "ISR via revalidate",
    description: "Page that revalidates every 60 seconds. Fetch posts and list titles.",
    difficulty: 2,
    hints: [
      { tier: "nudge", text: "export const revalidate = 60.", xpPenalty: 0.9 },
      { tier: "guide", text: "Page can still be a server component.", xpPenalty: 0.75 },
      { tier: "reveal", text: `export const revalidate = 60;

export default async function Posts() {
  const r = await fetch("https://api.example.com/posts");
  const posts = await r.json() as { id: number; title: string }[];
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}`, xpPenalty: 0.5 },
    ],
    baseXP: 180,
  }),
];

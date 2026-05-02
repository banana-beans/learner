// ============================================================
// React + Next.js — All Tiers (T1–T4)
// ============================================================

import type { LessonContent } from "./python-basics";

export const reactLessons: Record<string, LessonContent> = {
  // ── T1: JSX & Components ────────────────────────────────
  "react:t1:jsx": {
    nodeId: "react:t1:jsx",
    title: "JSX Basics",
    sections: [
      { heading: "JSX Is Sugar For Function Calls", body: "<div>hi</div> compiles to React.createElement('div', null, 'hi'). JSX lets you write HTML-shaped expressions inside JS. Curly braces escape into JS expressions." },
      { heading: "Differences From HTML", body: "className instead of class. htmlFor instead of for. camelCase events: onClick, onChange. All attributes are JS expressions, so style takes an object: style={{ color: 'red' }}." },
      { heading: "Fragments And Lists", body: "Return multiple siblings without an extra DOM node using <>...</>. List items need a stable key prop — usually a unique ID, never the array index unless the list never reorders." },
    ],
    codeExamples: [
      { title: "JSX expression", code: `const name = "Ada";
const el = <h1>Hello, {name}!</h1>;
// equivalent to: React.createElement("h1", null, "Hello, ", name, "!")`, explanation: "Curlies inject any JS expression. JSX is just sugar." },
      { title: "Attributes", code: `function Button() {
  return (
    <button
      className="btn primary"
      onClick={() => console.log("clicked")}
      style={{ padding: 8, color: "white" }}
    >
      Save
    </button>
  );
}`, explanation: "className, onClick, inline style as object." },
      { title: "Fragment + list", code: `function NameList({ names }: { names: string[] }) {
  return (
    <>
      <h2>Users</h2>
      <ul>
        {names.map(n => <li key={n}>{n}</li>)}
      </ul>
    </>
  );
}`, explanation: "<>...</> wraps without extra DOM. Each <li> needs a key prop." },
    ],
    keyTakeaways: ["JSX compiles to function calls (createElement / jsx())", "className not class; htmlFor not for", "{} escapes into a JS expression", "Use <>...</> for siblings without an extra DOM node", "Each list item needs a stable key (not array index)"],
  },
  "react:t1:components": {
    nodeId: "react:t1:components",
    title: "Components",
    sections: [
      { heading: "Function Components", body: "A component is just a function returning JSX. Name it PascalCase so JSX recognizes it as a component (not a DOM element). It accepts a single props argument." },
      { heading: "Reusability", body: "The same component renders many times with different props. Keep components small — under ~50 lines is a good target. Big components are nearly always doing too much." },
      { heading: "Pure Render", body: "A component should be a pure function of its props (and state). Same inputs → same output. Don't read or mutate things outside your control during render. Side effects belong in useEffect." },
    ],
    codeExamples: [
      { title: "First component", code: `function Hello() {
  return <h1>Hello, World!</h1>;
}

// Use it
function App() {
  return <Hello />;
}`, explanation: "PascalCase makes JSX treat <Hello /> as a component, not a DOM tag." },
      { title: "Reuse with props", code: `function Greeting({ name }: { name: string }) {
  return <p>Hi, {name}!</p>;
}

function App() {
  return (
    <>
      <Greeting name="Ada" />
      <Greeting name="Linus" />
    </>
  );
}`, explanation: "Same component, different props — yields different output." },
      { title: "Components compose", code: `function Avatar({ url }: { url: string }) {
  return <img src={url} className="avatar" />;
}
function Card() {
  return (
    <div className="card">
      <Avatar url="/me.png" />
      <Greeting name="Ada" />
    </div>
  );
}`, explanation: "Build UIs from small composable pieces." },
    ],
    keyTakeaways: ["A component is a function returning JSX", "Name components PascalCase", "Keep components small — split when they grow", "Render must be pure — no side effects, same inputs → same output", "Compose UIs from small pieces"],
  },
  "react:t1:props": {
    nodeId: "react:t1:props",
    title: "Props",
    sections: [
      { heading: "Passing Data Down", body: "Props are inputs to a component. Pass them as JSX attributes; receive them as the function's first argument. Destructure for readability." },
      { heading: "TypeScript Props", body: "Define an interface (or type) for props and annotate the function. Boolean shorthand: <Btn primary /> equals primary={true}. Mark optional props with ?: in the type." },
      { heading: "Children", body: "children is a special prop containing nested JSX. Type it as ReactNode. Wrapping components like Card or Modal use children to receive arbitrary content." },
    ],
    codeExamples: [
      { title: "Simple props", code: `interface Props {
  title: string;
  count: number;
}
function Counter({ title, count }: Props) {
  return <p>{title}: {count}</p>;
}

<Counter title="Total" count={42} />`, explanation: "Interface + destructuring is the canonical pattern." },
      { title: "Default + optional", code: `interface BtnProps {
  label: string;
  primary?: boolean;
}
function Btn({ label, primary = false }: BtnProps) {
  return (
    <button className={primary ? "btn-primary" : "btn"}>
      {label}
    </button>
  );
}`, explanation: "Default values come from destructuring, not the interface." },
      { title: "Children", code: `interface CardProps { children: React.ReactNode }
function Card({ children }: CardProps) {
  return <div className="card">{children}</div>;
}

<Card>
  <h3>Title</h3>
  <p>body</p>
</Card>`, explanation: "Whatever you pass between <Card> tags lands in children." },
    ],
    keyTakeaways: ["Props are inputs; pass via JSX attributes", "Destructure props in the function signature", "Use an interface to type props", "?: marks optional props; default in destructuring", "children is a special prop typed as ReactNode"],
  },
  "react:t1:children": {
    nodeId: "react:t1:children",
    title: "Children & Composition",
    sections: [
      { heading: "Children As A Prop", body: "Whatever you place between a component's tags is passed as the children prop. ReactNode covers the typical types: strings, numbers, JSX, null, arrays of those." },
      { heading: "Slot Patterns", body: "When you need multiple slots, accept named props: header, footer, body. This avoids JSX gymnastics and keeps the parent's responsibility clear." },
      { heading: "Composition Over Configuration", body: "Prefer composing primitives over building one component with 20 boolean props. <Modal>{any content}</Modal> beats <Modal showHeader hasFooter buttonsOnSide />." },
    ],
    codeExamples: [
      { title: "Wrapping component", code: `function Box({ children }: { children: React.ReactNode }) {
  return <div className="box">{children}</div>;
}

<Box>
  <h3>Welcome</h3>
  <p>Anything goes here.</p>
</Box>`, explanation: "children is whatever's between the tags." },
      { title: "Multi-slot", code: `interface PanelProps {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}
function Panel({ header, body, footer }: PanelProps) {
  return (
    <section className="panel">
      <header>{header}</header>
      <main>{body}</main>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}`, explanation: "Named slots when children isn't enough." },
      { title: "Compound composition", code: `function List({ children }: { children: React.ReactNode }) {
  return <ul className="list">{children}</ul>;
}
function Item({ children }: { children: React.ReactNode }) {
  return <li className="item">{children}</li>;
}

<List>
  <Item>Apple</Item>
  <Item>Banana</Item>
</List>`, explanation: "Compose small components. The parent doesn't need to know item internals." },
    ],
    keyTakeaways: ["children is a special prop holding nested content", "Type it as React.ReactNode", "Use named-prop slots when children isn't enough", "Composition beats configuration via boolean flags", "Compound components let parents stay simple"],
  },
  "react:t1:composition": {
    nodeId: "react:t1:composition",
    title: "Component Composition",
    sections: [
      { heading: "Why Compose", body: "Small components recombine more flexibly than big configurable ones. They're easier to test, reason about, and reuse. Aim for components that have one job each." },
      { heading: "Lift Or Lower State", body: "When two components need to share state, move it up to their nearest common ancestor. When state is only used inside a component, keep it local. Don't make everything global." },
      { heading: "Render Props / Children Functions", body: "Sometimes a parent should give children data via a callback. <Toggle>{({on, toggle}) => ...}</Toggle> works when you can't easily expose state via props alone." },
    ],
    codeExamples: [
      { title: "Compose primitives", code: `function Stack({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

<Stack>
  <Card>One</Card>
  <Card>Two</Card>
</Stack>`, explanation: "Stack and Card know nothing about each other; they compose at the call site." },
      { title: "Lift state", code: `function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Display count={count} />
      <Btn onClick={() => setCount(c => c + 1)}>+</Btn>
    </>
  );
}`, explanation: "Both children read or write count via the parent." },
      { title: "Children as a function", code: `function Toggle({ children }: {
  children: (api: { on: boolean; toggle: () => void }) => React.ReactNode;
}) {
  const [on, setOn] = useState(false);
  return <>{children({ on, toggle: () => setOn(o => !o) })}</>;
}

<Toggle>
  {({ on, toggle }) => (
    <button onClick={toggle}>{on ? "ON" : "OFF"}</button>
  )}
</Toggle>`, explanation: "Pass state down through a render-prop API. Useful for headless components." },
    ],
    keyTakeaways: ["Small composable components beat big configurable ones", "Lift state to the lowest common ancestor that needs it", "Don't pass props 5 layers deep — restructure or use context", "Children-as-a-function exposes state without prescribing UI", "Each component has one job"],
  },

  // ── T2: Hooks Basics ────────────────────────────────────
  "react:t2:useState": {
    nodeId: "react:t2:useState",
    title: "useState",
    sections: [
      { heading: "Local State", body: "useState(initial) returns [value, setValue]. Calling setValue triggers a re-render with the new value. State is per component instance — each <Counter /> has its own count." },
      { heading: "Updater Form", body: "When new state depends on old, use the updater: setCount(c => c + 1). React batches updates, and the updater always sees the latest value. Plain setCount(count + 1) can stale-read inside async code." },
      { heading: "Lazy Initialization", body: "useState(expensive()) runs expensive on every render. Pass a function — useState(() => expensive()) — and it only runs once. Only use this when initialization is genuinely costly." },
    ],
    codeExamples: [
      { title: "Counter", code: `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`, explanation: "useState returns the current value and a setter. setCount triggers re-render." },
      { title: "Updater form", code: `function DoubleClick() {
  const [n, setN] = useState(0);
  function bump() {
    setN(c => c + 1);
    setN(c => c + 1);   // both updates see fresh values
  }
  return <button onClick={bump}>{n}</button>;
}`, explanation: "Updater functions are safe under batching and async. Plain setN(n+1) twice would only increment once." },
      { title: "Lazy init", code: `function Heavy() {
  const [data] = useState(() => parseHugeJSON());
  return <pre>{JSON.stringify(data)}</pre>;
}`, explanation: "Function form runs once. Without it, parseHugeJSON would run every render." },
    ],
    keyTakeaways: ["useState returns [value, setter]", "Setter triggers re-render", "Use updater form when new state depends on old", "Lazy init via () => ... avoids per-render work", "State is per instance — each component has its own"],
  },
  "react:t2:useEffect": {
    nodeId: "react:t2:useEffect",
    title: "useEffect",
    sections: [
      { heading: "Synchronizing With External Systems", body: "useEffect runs after render. It's for syncing with things outside React — DOM, timers, subscriptions, fetch. The dependency array tells React when to re-run: [] = once, [dep] = whenever dep changes, omitted = every render." },
      { heading: "Cleanup", body: "Return a cleanup function to undo what the effect set up: cancel timers, unsubscribe, abort fetches. React calls it before the next effect run and on unmount. Always clean up subscriptions." },
      { heading: "Don't Use For Derived Data", body: "If a value can be computed from props/state, just compute it in render. useEffect that calls setState in response to props is almost always wrong — it causes extra renders." },
    ],
    codeExamples: [
      { title: "Mount-only effect", code: `function Title({ text }: { text: string }) {
  useEffect(() => {
    document.title = text;
  }, [text]);  // re-run when text changes
  return null;
}`, explanation: "Dependency array of [text] re-runs only when text actually changes." },
      { title: "Subscription with cleanup", code: `function Window() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return <p>{w}px</p>;
}`, explanation: "Cleanup removes the listener on unmount or before re-running." },
      { title: "What NOT to do", code: `// WRONG — unnecessary effect
function Bad({ count }: { count: number }) {
  const [doubled, setDoubled] = useState(0);
  useEffect(() => { setDoubled(count * 2); }, [count]);
  return <p>{doubled}</p>;
}

// RIGHT — derive in render
function Good({ count }: { count: number }) {
  const doubled = count * 2;
  return <p>{doubled}</p>;
}`, explanation: "If a value derives from props, just compute it. Don't store + sync in an effect." },
    ],
    keyTakeaways: ["useEffect runs after render — for syncing external systems", "[] runs once on mount; [dep] runs when dep changes", "Return a cleanup function for subscriptions and timers", "Don't useEffect to derive state from props — compute in render", "Each render re-runs the effect if a dep changed"],
  },
  "react:t2:useRef": {
    nodeId: "react:t2:useRef",
    title: "useRef",
    sections: [
      { heading: "Mutable Values That Don't Trigger Renders", body: "useRef(initial) returns { current }. Mutating .current doesn't cause a re-render — handy for storing previous values, timer IDs, or DOM nodes." },
      { heading: "DOM Refs", body: "Pass a ref to a DOM element via the ref prop: <input ref={inputRef} />. After mount, ref.current points to the underlying DOM node — call .focus(), measure, etc." },
      { heading: "Don't Read Refs During Render", body: "Refs are for after-render side effects, not for rendering decisions. Reading or writing .current during render is a code smell — use state if you need that data to drive UI." },
    ],
    codeExamples: [
      { title: "DOM ref", code: `function Search() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>
        Focus input
      </button>
    </>
  );
}`, explanation: "After mount, inputRef.current is the DOM node." },
      { title: "Storing a timer", code: `function Timer() {
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    intervalRef.current = window.setInterval(() => console.log("tick"), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);
  return null;
}`, explanation: "Mutating .current doesn't re-render. Cleanup uses the stored ID." },
      { title: "Previous value", code: `function usePrevious<T>(v: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = v; }, [v]);
  return ref.current;
}`, explanation: "Common idiom for tracking the prior render's value." },
    ],
    keyTakeaways: ["useRef returns { current }; mutating doesn't re-render", "Use for DOM access, timer IDs, prior values", "Don't read or write .current during render", "useState if the value drives UI; useRef otherwise", "ref prop on a DOM element wires it automatically"],
  },
  "react:t2:events-forms": {
    nodeId: "react:t2:events-forms",
    title: "Events & Forms",
    sections: [
      { heading: "Event Handlers", body: "JSX event props are camelCase: onClick, onChange, onSubmit. The handler receives a synthetic event with a typed target. Call e.preventDefault() to stop default browser behavior (form submission, link nav)." },
      { heading: "Controlled Inputs", body: "Bind value + onChange to make React the source of truth. The input's displayed value always reflects state. This is the default pattern for forms — easier to validate, reset, and snapshot." },
      { heading: "Uncontrolled Inputs", body: "If you don't bind value, the DOM owns the state. Read it via a ref on submit. Use this when value-on-every-keystroke is wasteful or you're integrating with non-React code." },
    ],
    codeExamples: [
      { title: "Click handler", code: `function Btn() {
  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    console.log("clicked", e.currentTarget.textContent);
  }
  return <button onClick={onClick}>Save</button>;
}`, explanation: "Event arg is typed by element. currentTarget is the bound element." },
      { title: "Controlled form", code: `function Form() {
  const [name, setName] = useState("");
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("submitting", name);
  }
  return (
    <form onSubmit={onSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit">Go</button>
    </form>
  );
}`, explanation: "value + onChange = React owns the input state." },
      { title: "Uncontrolled with ref", code: `function FastForm() {
  const ref = useRef<HTMLInputElement>(null);
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(ref.current?.value);
  }
  return (
    <form onSubmit={onSubmit}>
      <input ref={ref} defaultValue="" />
      <button>Go</button>
    </form>
  );
}`, explanation: "DOM owns state; React reads on submit. defaultValue (not value) sets the initial value." },
    ],
    keyTakeaways: ["JSX event props are camelCase: onClick, onChange", "Controlled inputs: value + onChange — React is source of truth", "Uncontrolled: ref + defaultValue — DOM is source of truth", "preventDefault on form submit to stop the page reload", "Synthetic events are typed: React.MouseEvent, FormEvent, etc."],
  },
  "react:t2:conditional-lists": {
    nodeId: "react:t2:conditional-lists",
    title: "Conditional Rendering & Lists",
    sections: [
      { heading: "Conditional Patterns", body: "Three idioms: ternary {cond ? <A /> : <B />}, short-circuit {cond && <A />}, early return inside the component. Avoid && with numbers (0 renders as 0, not nothing!)." },
      { heading: "Lists And Keys", body: "Use .map to render arrays. Each item needs a key prop — a stable identifier (DB id, slug). Don't use the array index unless the list never reorders or grows." },
      { heading: "Empty And Loading States", body: "Real apps have at least four states: loading, error, empty, success. Render each explicitly. A list component should look at the data and pick the right state to show." },
    ],
    codeExamples: [
      { title: "Conditionals", code: `function Greet({ user }: { user?: { name: string } }) {
  if (!user) return <p>Sign in</p>;
  return <p>Hi, {user.name}!</p>;
}

function Tag({ active }: { active: boolean }) {
  return active ? <span className="on" /> : <span className="off" />;
}`, explanation: "Early return for top-level branching; ternary for inline." },
      { title: "List with keys", code: `function UserList({ users }: { users: { id: number; name: string }[] }) {
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}`, explanation: "key={u.id} — stable across renders. Index is OK only for static lists." },
      { title: "Empty / loading / error", code: `function Items({ data, loading, error }: {
  data?: string[]; loading: boolean; error?: string;
}) {
  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data || data.length === 0) return <p>No items</p>;
  return <ul>{data.map(d => <li key={d}>{d}</li>)}</ul>;
}`, explanation: "Branch on every meaningful state. Real apps need all four." },
    ],
    keyTakeaways: ["Conditionals: ternary, &&, or early return", "Watch out: 0 && <X/> renders 0 — use Boolean(n) or n > 0", "Every .map needs a stable key prop", "Don't use index as key if the list reorders or grows", "Render loading, error, and empty states explicitly"],
  },

  // ── T3: Advanced Hooks ─────────────────────────────────
  "react:t3:useContext": {
    nodeId: "react:t3:useContext",
    title: "useContext",
    sections: [
      { heading: "Avoiding Prop Drilling", body: "When the same prop threads through 5 components untouched, context is cleaner. createContext gives you a Provider and a useContext hook. The Provider value is read by any descendant." },
      { heading: "When Context Is Right", body: "Theme, current user, locale, feature flags — values that many distant components need. Avoid using context for state that changes often: every consumer re-renders on change." },
      { heading: "Default Values", body: "createContext(default) sets a default for consumers without a Provider above them. In TypeScript, type as | undefined and check; or provide a real default with all required methods." },
    ],
    codeExamples: [
      { title: "Theme context", code: `type Theme = "light" | "dark";
const ThemeContext = createContext<Theme>("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}
function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>tools</div>;
}`, explanation: "Provider supplies the value; descendants read it via useContext." },
      { title: "Auth context", code: `interface Auth { user?: { name: string }; signOut: () => void; }
const AuthContext = createContext<Auth | null>(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}`, explanation: "Custom hook that throws if no Provider — catches misuse early." },
      { title: "Don't put high-frequency state in context", code: `// AVOID: context whose value changes every keystroke
// causes every consumer to re-render
const SearchContext = createContext("");

// Better: keep search local, lift to nearest needed ancestor only
console.log("see comments");`, explanation: "Context propagation is broad and unmemoized — bad for high-frequency updates." },
    ],
    keyTakeaways: ["createContext + Provider + useContext = no prop drilling", "Best for low-frequency global-ish values: theme, user, locale", "Wrap useContext in a custom hook that asserts Provider", "Every consumer re-renders when value changes", "Don't use context as a substitute for prop passing"],
  },
  "react:t3:useReducer": {
    nodeId: "react:t3:useReducer",
    title: "useReducer",
    sections: [
      { heading: "When State Gets Complex", body: "useReducer is useState's bigger sibling. Instead of a setter, you dispatch actions; a reducer function turns (state, action) into the next state. Cleaner when state has multiple related fields or complex transitions." },
      { heading: "Action Shape", body: "Actions are typically { type: '...', ...payload }. Use a discriminated union for type safety. The reducer's switch handles each action type — exhaustive checks catch missed cases." },
      { heading: "Reducer + Context Pattern", body: "For app-wide state: put the dispatch into context. Components read state via useContext, dispatch actions to update. Smaller and more predictable than redux for many apps." },
    ],
    codeExamples: [
      { title: "Counter reducer", code: `type State = { count: number };
type Action = { type: "inc" } | { type: "dec" } | { type: "reset" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "inc": return { count: s.count + 1 };
    case "dec": return { count: s.count - 1 };
    case "reset": return { count: 0 };
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <button onClick={() => dispatch({ type: "dec" })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
    </>
  );
}`, explanation: "Reducer takes (state, action) and returns new state. Components dispatch actions." },
      { title: "Action with payload", code: `type Action =
  | { type: "add"; text: string }
  | { type: "remove"; id: number };

function todoReducer(state: { id: number; text: string }[], a: Action) {
  switch (a.type) {
    case "add": return [...state, { id: Date.now(), text: a.text }];
    case "remove": return state.filter(t => t.id !== a.id);
  }
}`, explanation: "Discriminated union keeps action shapes type-safe." },
      { title: "useReducer + context", code: `const StateCtx = createContext<State | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action> | null>(null);

function Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}`, explanation: "Splitting state and dispatch into two contexts avoids unnecessary re-renders." },
    ],
    keyTakeaways: ["useReducer for complex or related state transitions", "Reducer: (state, action) => newState (pure)", "Discriminated union for action types", "Pair with context for app-wide state", "Often replaces small Redux-style stores"],
  },
  "react:t3:custom-hooks": {
    nodeId: "react:t3:custom-hooks",
    title: "Custom Hooks",
    sections: [
      { heading: "Extract Reusable Logic", body: "Custom hooks are functions that call other hooks. Naming starts with use. They give you a way to bundle stateful logic and reuse it without duplicating code." },
      { heading: "Hooks Don't Share State", body: "Each call to a custom hook gets its own state. useTimer() in two components = two timers. They share logic, not values. To share values, use a state store, context, or lifted state." },
      { heading: "Composability", body: "Custom hooks compose like functions. A useUser hook might call useFetch, which might call useEffect. Build complex behaviors by stacking small hooks." },
    ],
    codeExamples: [
      { title: "useToggle", code: `function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(o => !o), []);
  return [on, toggle] as const;
}

function Btn() {
  const [on, toggle] = useToggle();
  return <button onClick={toggle}>{on ? "ON" : "OFF"}</button>;
}`, explanation: "Encapsulate the toggle pattern; reuse across components." },
      { title: "useFetch", code: `function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url).then(r => r.json()).then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    }).catch(e => {
      if (!cancelled) { setError(e); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}`, explanation: "Wraps the loading/error/data triple. Cleanup avoids setting state after unmount." },
      { title: "Composing hooks", code: `function useDebouncedSearch(query: string) {
  const debounced = useDebounce(query, 300);
  const { data } = useFetch<Result[]>(\`/search?q=\${debounced}\`);
  return data;
}`, explanation: "Stack hooks. Each consumer of useDebouncedSearch gets independent timing/data." },
    ],
    keyTakeaways: ["Custom hooks = functions that call other hooks", "Name them starting with use", "Each call gets its own state — they share logic, not values", "Hooks compose like functions — stack freely", "Extract whenever you find yourself copying useEffect+useState"],
  },
  "react:t3:memo-perf": {
    nodeId: "react:t3:memo-perf",
    title: "Memoization & Performance",
    sections: [
      { heading: "When To Memoize", body: "memo, useMemo, useCallback prevent unnecessary recomputation/re-render. Their cost is non-trivial. Only reach for them after profiling shows a real bottleneck — premature memoization is a common anti-pattern." },
      { heading: "memo Wraps Components", body: "React.memo(Component) skips re-rendering when props are shallow-equal. Useful for expensive children that often re-receive the same props. Pass a custom equality fn for non-shallow cases." },
      { heading: "useMemo vs useCallback", body: "useMemo memoizes a value. useCallback memoizes a function (it's useMemo for functions). Both take a deps array. Use to keep stable references when you pass them to memoized children." },
    ],
    codeExamples: [
      { title: "memo", code: `const ExpensiveChild = memo(function ExpensiveChild({ items }: { items: number[] }) {
  console.log("rendering child");
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const items = useMemo(() => [1, 2, 3], []);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveChild items={items} />
    </>
  );
}`, explanation: "memo + useMemo for items keeps the child's props stable across parent renders." },
      { title: "useCallback", code: `function Parent() {
  const [count, setCount] = useState(0);
  const onClick = useCallback(() => console.log("click"), []);
  return (
    <>
      {count}
      <Child onClick={onClick} />
    </>
  );
}
const Child = memo(({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}>tap</button>
));`, explanation: "Without useCallback, onClick is a new function each render — Child re-renders despite memo." },
      { title: "Don't over-memoize", code: `// Probably wasteful
const sum = useMemo(() => a + b, [a, b]);
// vs
const sum = a + b;`, explanation: "Trivial computations don't need memoization. Profile first." },
    ],
    keyTakeaways: ["Profile before memoizing — premature memoization is real", "memo = component-level shallow-equal skip", "useMemo memoizes a value; useCallback memoizes a function", "Memoization without memo'd children is mostly pointless", "Stable references matter when passing to memoized components"],
  },
  "react:t3:portals-suspense": {
    nodeId: "react:t3:portals-suspense",
    title: "Portals & Suspense",
    sections: [
      { heading: "Portals", body: "createPortal renders children into a different DOM node — outside the parent's DOM hierarchy. Common for modals, tooltips, and floating UI that should escape overflow:hidden parents. Events still bubble through the React tree." },
      { heading: "Suspense Boundaries", body: "<Suspense fallback={<Spinner />}> shows the fallback while children are loading. Works with React.lazy for code splitting and with data fetching libraries that integrate with Suspense (like Next.js's RSC or React Query)." },
      { heading: "Streaming SSR", body: "On the server, Suspense enables streaming: send fast parts immediately, hold the rest until ready. Next.js App Router uses this everywhere. The user sees first paint sooner." },
    ],
    codeExamples: [
      { title: "Portal modal", code: `function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal-backdrop">{children}</div>,
    document.body
  );
}`, explanation: "Renders to document.body even though it's used inside a deeply nested component." },
      { title: "Suspense + lazy", code: `const HeavyChart = lazy(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<p>Loading chart…</p>}>
      <HeavyChart />
    </Suspense>
  );
}`, explanation: "Code splitting: HeavyChart loads on demand. Suspense shows the fallback while loading." },
      { title: "Suspense in App Router", code: `// app/dashboard/page.tsx
export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowDataPanel />
      </Suspense>
    </>
  );
}`, explanation: "Next.js streams the heading immediately; SlowDataPanel arrives when ready." },
    ],
    keyTakeaways: ["createPortal renders into a different DOM node", "Use portals for modals, tooltips, floating UI", "Suspense fallback shows while children load", "lazy() + Suspense = code splitting", "Streaming SSR sends what's ready first"],
  },

  // ── T4: Next.js ─────────────────────────────────────────
  "react:t4:app-router": {
    nodeId: "react:t4:app-router",
    title: "Next.js App Router",
    sections: [
      { heading: "File-Based Routing", body: "Folders inside app/ become URL segments. page.tsx is the route's UI. layout.tsx wraps that segment and its children. Dynamic segments use [param] folder names." },
      { heading: "Layouts vs Pages", body: "A layout persists across navigations within its segment — its state survives. A page re-renders on each navigation. Nest layouts: app/layout.tsx wraps everything; app/dashboard/layout.tsx wraps just the dashboard subtree." },
      { heading: "Route Groups & Parallel Routes", body: "(group) folders organize without affecting URL. @slot folders create parallel routes — render multiple pages in parallel into the same layout. Useful for modals, sidebars, dashboards." },
    ],
    codeExamples: [
      { title: "Page + layout", code: `// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}

// app/page.tsx
export default function Home() {
  return <h1>Welcome</h1>;
}`, explanation: "Root layout wraps everything; page renders for /." },
      { title: "Dynamic route", code: `// app/posts/[slug]/page.tsx
export default async function Post({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <article>Post: {slug}</article>;
}`, explanation: "params is a Promise in Next 16+ — must be awaited." },
      { title: "Route group", code: `// app/(marketing)/page.tsx          → /
// app/(marketing)/about/page.tsx    → /about
// app/(app)/dashboard/page.tsx      → /dashboard
console.log("see comments");`, explanation: "(marketing) and (app) don't appear in URLs but let you separate layouts." },
    ],
    keyTakeaways: ["app/ folder → routes; page.tsx is the UI", "layout.tsx persists across child navigations", "[param] for dynamic segments", "(group) folders organize without affecting URLs", "params is a Promise in Next 16+ — await it"],
  },
  "react:t4:rsc": {
    nodeId: "react:t4:rsc",
    title: "Server Components (RSC)",
    sections: [
      { heading: "Server vs Client Components", body: "Server Components run only on the server — no JS shipped to the browser, full Node access (DB, fs, secrets). Client Components run on both. Mark a Client Component with 'use client' at the top." },
      { heading: "The Boundary", body: "Server Components can render Client Components, but not the other way around. A Client Component receiving server-rendered children stays a client tree. Plan the boundary deliberately to keep client bundles small." },
      { heading: "Data Fetching", body: "Server Components can be async functions — await directly inside them. No useEffect, no client-side fetch. Fetch close to where data is used; Next dedupes identical fetches across the tree." },
    ],
    codeExamples: [
      { title: "Async server component", code: `// app/posts/page.tsx (server component by default)
async function getPosts() {
  const r = await fetch("https://api.example.com/posts");
  return r.json();
}

export default async function Posts() {
  const posts = await getPosts();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}`, explanation: "Server component fetches and renders. No JS shipped for this part." },
      { title: "Client component", code: `// components/Counter.tsx
"use client";
import { useState } from "react";

export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}`, explanation: "'use client' opts in to the client runtime. State and handlers work as expected." },
      { title: "Server passes data to client", code: `// app/page.tsx (server)
import { Counter } from "@/components/Counter";

export default async function Page() {
  const initial = await fetchInitialCount();
  return <Counter initialCount={initial} />;
}`, explanation: "Server fetches; passes initial value as prop. Client owns interactivity." },
    ],
    keyTakeaways: ["Server Components: no JS shipped, can use Node APIs", "Client Components: 'use client' directive at top", "Server can render client; client can't render server", "Server components can be async — await fetch directly", "Plan the boundary to minimize client bundle size"],
  },
  "react:t4:server-actions": {
    nodeId: "react:t4:server-actions",
    title: "Server Actions",
    sections: [
      { heading: "Mutations Without API Routes", body: "A Server Action is an async function marked 'use server' that runs on the server when called from a client. Eliminates the need to write a separate /api endpoint for simple mutations." },
      { heading: "From Forms And Buttons", body: "Pass an action to a <form action={createPost}> — the form posts to the server, and Next handles serialization. From buttons, attach via onClick + startTransition for optimistic updates." },
      { heading: "Validation And Errors", body: "Validate on the server (zod, valibot). Errors bubble back as thrown exceptions or returned error shapes. Pair with revalidateTag / revalidatePath to invalidate cached data after a successful mutation." },
    ],
    codeExamples: [
      { title: "Action attached to a form", code: `// app/actions.ts
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  await db.post.create({ data: { title } });
  revalidatePath("/posts");
}

// app/new/page.tsx
import { createPost } from "@/app/actions";
export default function New() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button>Create</button>
    </form>
  );
}`, explanation: "Form posts to the server. Action mutates DB and revalidates the list page." },
      { title: "Server action from a client component", code: `"use client";
import { createPost } from "@/app/actions";
import { useTransition } from "react";

export function NewBtn() {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => createPost(new FormData()))}
    >
      {pending ? "…" : "Create"}
    </button>
  );
}`, explanation: "useTransition gives a pending flag; the action still runs on the server." },
      { title: "Validation", code: `"use server";
import { z } from "zod";

const Schema = z.object({ title: z.string().min(1).max(120) });

export async function createPost(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.format() };
  await db.post.create({ data: parsed.data });
}`, explanation: "Validate inputs on the server; return errors for the client to render." },
    ],
    keyTakeaways: ["'use server' marks server actions", "Pass to <form action={...}> for form mutations", "Pair with revalidatePath / revalidateTag to refresh data", "Validate on the server — never trust client input", "useTransition wraps optimistic UI around actions"],
  },
  "react:t4:layouts": {
    nodeId: "react:t4:layouts",
    title: "Layouts & Templates",
    sections: [
      { heading: "Nested Layouts", body: "Each level of app/ can have a layout.tsx. They wrap all descendant pages. State inside a layout persists across navigations within its segment — sidebar, navbar state survive." },
      { heading: "Templates vs Layouts", body: "template.tsx is like a layout but recreated on each navigation — fresh state, new mount. Use when you specifically want navigation to reset something." },
      { heading: "Parallel & Intercepting Routes", body: "@slot folders are parallel routes: a layout can render multiple pages side-by-side via children + named slots. Intercepting routes ((..)folder) let one route present another (e.g. /photo/123 as a modal over /feed)." },
    ],
    codeExamples: [
      { title: "Nested layout", code: `// app/layout.tsx
export default function Root({ children }: { children: React.ReactNode }) {
  return <html><body><Header />{children}</body></html>;
}

// app/dashboard/layout.tsx
export default function DashLayout({ children }: { children: React.ReactNode }) {
  return <div className="dash"><Sidebar />{children}</div>;
}`, explanation: "Two layouts compose: header is global; sidebar wraps dashboard pages only." },
      { title: "Parallel routes", code: `// app/dashboard/layout.tsx
export default function L({
  children, analytics, team
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <>
      {children}
      <aside>{analytics}</aside>
      <aside>{team}</aside>
    </>
  );
}
// Slot folders: app/dashboard/@analytics/page.tsx and @team/page.tsx`, explanation: "Layout receives multiple page slots in parallel." },
      { title: "Intercepting modal", code: `// app/feed/page.tsx                  → list of photos
// app/photo/[id]/page.tsx             → full-page photo view
// app/feed/(.)photo/[id]/page.tsx     → modal overlay over /feed
console.log("see comments");`, explanation: "Intercepting routes show one route as an overlay of another." },
    ],
    keyTakeaways: ["layout.tsx persists across navigations within its segment", "template.tsx remounts on each navigation", "@slot folders make parallel routes", "(..)folder = intercepting route (modal patterns)", "Layouts can be async server components"],
  },
  "react:t4:rendering-strategies": {
    nodeId: "react:t4:rendering-strategies",
    title: "Rendering Strategies",
    sections: [
      { heading: "SSR vs SSG vs ISR", body: "SSR (server-side rendering): every request is rendered fresh. SSG (static generation): rendered at build, served as files. ISR (incremental static regeneration): static, with periodic re-validation. Pick by data freshness needs." },
      { heading: "Streaming", body: "Suspense in the App Router enables streaming: send the fast parts of the page first, hold the slow parts behind a fallback, then stream them in. Time-to-first-byte stays fast even when one part is slow." },
      { heading: "Cache Components & Cache Lifetimes", body: "Next 16's Cache Components let you mark which parts cache and for how long. Use 'use cache' on a component or function plus cacheLife() to control freshness. updateTag invalidates by tag." },
    ],
    codeExamples: [
      { title: "Static page (SSG)", code: `// app/about/page.tsx
export default function About() {
  return <main>About us</main>;
}
// Renders at build, served from CDN forever.`, explanation: "No data fetching = static by default in App Router." },
      { title: "ISR via revalidate", code: `export const revalidate = 60; // seconds

export default async function Posts() {
  const r = await fetch("https://api.example.com/posts");
  const posts = await r.json();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}`, explanation: "Cached for 60 seconds, then re-fetched on next request and re-cached." },
      { title: "Streaming with Suspense", code: `export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowPanel />
      </Suspense>
    </>
  );
}`, explanation: "Header streams immediately; SlowPanel arrives when ready." },
    ],
    keyTakeaways: ["SSR fresh per request; SSG built once; ISR re-validates periodically", "Suspense + streaming shows fast parts first", "revalidate sets ISR lifetime", "Next 16 Cache Components: 'use cache' + cacheLife()", "Pick rendering by data-freshness needs"],
  },
};

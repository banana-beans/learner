import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillNode } from "../SkillNode";
import type { SkillNode as SkillNodeType } from "@/lib/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("framer-motion", () => {
  const MotionSpan = ({
    children,
    animate,
    initial,
    transition,
    whileHover,
    whileTap,
    ...rest
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any) => <span {...rest}>{children}</span>;

  const MotionDiv = ({
    children,
    animate,
    initial,
    transition,
    whileHover,
    whileTap,
    ...rest
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any) => <div {...rest}>{children}</div>;

  return {
    motion: { div: MotionDiv, span: MotionSpan },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const mockNode: SkillNodeType = {
  id: "python:t1:hello-world",
  branchId: "python",
  tier: 1,
  title: "Hello World & the REPL",
  description: "Introduction to Python and the interactive interpreter.",
  hardPrereqs: [],
  softPrereqs: [],
  estimatedMinutes: 10,
  xpReward: 50,
  concepts: ["print", "REPL"],
};

describe("SkillNode", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders locked state with padlock icon", () => {
    render(<SkillNode node={mockNode} state="locked" branchColor="#4f8ef7" />);
    expect(screen.getByTestId("state-locked")).toBeInTheDocument();
    expect(screen.queryByTestId("state-available")).not.toBeInTheDocument();
    expect(screen.queryByTestId("state-completed")).not.toBeInTheDocument();
  });

  it("renders available state with glow pulse", () => {
    render(<SkillNode node={mockNode} state="available" branchColor="#4f8ef7" />);
    expect(screen.getByTestId("state-available")).toBeInTheDocument();
    expect(screen.queryByTestId("state-locked")).not.toBeInTheDocument();
  });

  it("renders in_progress state with pulsing ring", () => {
    render(
      <SkillNode node={mockNode} state="in_progress" branchColor="#4f8ef7" />
    );
    expect(screen.getByTestId("state-in_progress")).toBeInTheDocument();
    expect(screen.queryByTestId("state-locked")).not.toBeInTheDocument();
  });

  it("renders completed state with checkmark", () => {
    render(
      <SkillNode node={mockNode} state="completed" branchColor="#4f8ef7" />
    );
    expect(screen.getByTestId("state-completed")).toBeInTheDocument();
    expect(screen.queryByTestId("state-locked")).not.toBeInTheDocument();
  });

  it("renders mastered state with gold star", () => {
    render(
      <SkillNode node={mockNode} state="mastered" branchColor="#4f8ef7" />
    );
    expect(screen.getByTestId("state-mastered")).toBeInTheDocument();
    expect(screen.queryByTestId("state-locked")).not.toBeInTheDocument();
  });

  it("displays node title", () => {
    render(<SkillNode node={mockNode} state="available" branchColor="#4f8ef7" />);
    expect(
      screen.getByText("Hello World & the REPL")
    ).toBeInTheDocument();
  });

  it("displays tier badge", () => {
    render(<SkillNode node={mockNode} state="available" branchColor="#4f8ef7" />);
    expect(screen.getByText("T1")).toBeInTheDocument();
  });

  it("displays XP reward", () => {
    render(<SkillNode node={mockNode} state="available" branchColor="#4f8ef7" />);
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
  });

  it("navigates to lesson when clicking unlocked node", async () => {
    const user = userEvent.setup();
    render(<SkillNode node={mockNode} state="available" branchColor="#4f8ef7" />);
    const node = screen.getByTestId("skill-node");
    await user.click(node);
    expect(mockPush).toHaveBeenCalledWith("/learn/python:t1:hello-world");
  });

  it("does not navigate when clicking locked node", async () => {
    const user = userEvent.setup();
    render(<SkillNode node={mockNode} state="locked" branchColor="#4f8ef7" />);
    const node = screen.getByTestId("skill-node");
    await user.click(node);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

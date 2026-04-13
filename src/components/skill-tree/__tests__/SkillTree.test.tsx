import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SkillTree } from "../SkillTree";
import curriculum from "@/data/curriculum";
import type { UserProgress } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

const emptyProgress: UserProgress = {
  completedNodes: [],
  masteredNodes: [],
  inProgressNodes: [],
  unlockedNodes: [],
  lessonResults: {},
  challengeResults: {},
  earnedAchievements: [],
};

describe("SkillTree", () => {
  it("renders correct node count for Python branch", () => {
    const pythonBranch = curriculum.branches.find((b) => b.id === "python")!;
    expect(pythonBranch).toBeDefined();

    render(
      <SkillTree
        branch={pythonBranch}
        progress={emptyProgress}
        curriculum={curriculum}
      />
    );

    const nodes = screen.getAllByTestId("skill-node");
    expect(nodes).toHaveLength(pythonBranch.nodes.length);
  });

  it("renders tier labels for each Python tier", () => {
    const pythonBranch = curriculum.branches.find((b) => b.id === "python")!;

    render(
      <SkillTree
        branch={pythonBranch}
        progress={emptyProgress}
        curriculum={curriculum}
      />
    );

    for (const tier of pythonBranch.tiers) {
      expect(screen.getByText(`Tier ${tier}`)).toBeInTheDocument();
    }
  });

  it("renders nodes for a single-node branch", () => {
    const tsBranch = curriculum.branches.find(
      (b) => b.id === "typescript"
    )!;
    render(
      <SkillTree
        branch={tsBranch}
        progress={emptyProgress}
        curriculum={curriculum}
      />
    );

    const nodes = screen.getAllByTestId("skill-node");
    expect(nodes).toHaveLength(tsBranch.nodes.length);
  });
});

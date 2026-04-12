import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestResults } from "./TestResults";

describe("TestResults", () => {
  it("renders nothing when results array is empty", () => {
    const { container } = render(<TestResults results={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows green checkmark for passing tests", () => {
    render(
      <TestResults
        results={[{ passed: true, description: "Basic case" }]}
      />
    );
    expect(screen.getByLabelText("pass")).toBeInTheDocument();
    expect(screen.getByText("Basic case")).toBeInTheDocument();
  });

  it("shows red X for failing tests", () => {
    render(
      <TestResults
        results={[{ passed: false, description: "Edge case" }]}
      />
    );
    expect(screen.getByLabelText("fail")).toBeInTheDocument();
    expect(screen.getByText("Edge case")).toBeInTheDocument();
  });

  it("shows expected and actual output on failure", () => {
    render(
      <TestResults
        results={[
          {
            passed: false,
            description: "Wrong output",
            expected: "Hello",
            actual: "hello",
          },
        ]}
      />
    );
    expect(screen.getByText("Expected:")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Actual:")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("does not show expected/actual on passing test", () => {
    render(
      <TestResults
        results={[
          {
            passed: true,
            description: "Passing",
            expected: "10",
            actual: "10",
          },
        ]}
      />
    );
    expect(screen.queryByText("Expected:")).not.toBeInTheDocument();
    expect(screen.queryByText("Actual:")).not.toBeInTheDocument();
  });

  it("shows correct pass count in summary", () => {
    render(
      <TestResults
        results={[
          { passed: true, description: "Test 1" },
          { passed: true, description: "Test 2" },
          { passed: false, description: "Test 3" },
        ]}
      />
    );
    expect(screen.getByText(/2 \/ 3 tests passed/i)).toBeInTheDocument();
  });

  it("shows 'All tests passed!' when all pass", () => {
    render(
      <TestResults
        results={[
          { passed: true, description: "A" },
          { passed: true, description: "B" },
        ]}
      />
    );
    expect(screen.getByText(/All tests passed!/i)).toBeInTheDocument();
  });

  it("renders a progress bar with correct aria attributes", () => {
    render(
      <TestResults
        results={[
          { passed: true },
          { passed: false },
        ]}
      />
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
});

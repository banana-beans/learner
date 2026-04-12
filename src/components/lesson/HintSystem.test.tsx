import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HintSystem } from "./HintSystem";

const hints = [
  "This is a nudge hint",
  "This is a guide hint",
  "This is the reveal hint",
];

describe("HintSystem", () => {
  let onHintRevealed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onHintRevealed = vi.fn();
  });

  it("renders the Use Hint button initially", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);
    expect(screen.getByText(/Use Hint/i)).toBeInTheDocument();
  });

  it("does not show any hint text initially", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);
    expect(screen.queryByText(hints[0])).not.toBeInTheDocument();
    expect(screen.queryByText(hints[1])).not.toBeInTheDocument();
  });

  it("reveals first hint and fires callback on first click", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);
    fireEvent.click(screen.getByText(/Use Hint/i));
    expect(screen.getByText(hints[0])).toBeInTheDocument();
    expect(onHintRevealed).toHaveBeenCalledWith(0, 10);
  });

  it("reveals hints in order — second hint appears after first", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);

    // Reveal first hint
    fireEvent.click(screen.getByText(/Use Hint/i));
    expect(screen.getByText(hints[0])).toBeInTheDocument();
    expect(screen.queryByText(hints[1])).not.toBeInTheDocument();

    // Reveal second hint
    fireEvent.click(screen.getByText(/Use Hint/i));
    expect(screen.getByText(hints[1])).toBeInTheDocument();
    expect(onHintRevealed).toHaveBeenCalledWith(1, 25);
  });

  it("third hint requires confirmation dialog", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);

    // Reveal first two hints
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));

    // Third hint click should show confirmation modal
    fireEvent.click(screen.getByText(/Use Hint/i));
    expect(screen.getByText(/Reveal Answer\?/i)).toBeInTheDocument();
    // Hint text NOT shown yet
    expect(screen.queryByText(hints[2])).not.toBeInTheDocument();
  });

  it("cancelling confirm dialog does not reveal third hint", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(hints[2])).not.toBeInTheDocument();
  });

  it("confirming reveals third hint and fires callback with 50 XP penalty", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));

    fireEvent.click(screen.getByTestId("confirm-reveal"));
    expect(screen.getByText(hints[2])).toBeInTheDocument();
    expect(onHintRevealed).toHaveBeenCalledWith(2, 50);
  });

  it("hides the hint button after all hints are revealed", () => {
    render(<HintSystem hints={hints} onHintRevealed={onHintRevealed} />);
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByText(/Use Hint/i));
    fireEvent.click(screen.getByTestId("confirm-reveal"));

    expect(screen.queryByText(/Use Hint/i)).not.toBeInTheDocument();
    expect(screen.getByText(/All hints revealed/i)).toBeInTheDocument();
  });

  it("works with fewer than 3 hints", () => {
    const shortHints = ["Only hint"];
    render(<HintSystem hints={shortHints} onHintRevealed={onHintRevealed} />);
    fireEvent.click(screen.getByText(/Use Hint/i));
    expect(screen.getByText("Only hint")).toBeInTheDocument();
    expect(screen.queryByText(/Use Hint/i)).not.toBeInTheDocument();
  });
});

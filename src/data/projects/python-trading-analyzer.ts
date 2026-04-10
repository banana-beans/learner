/**
 * Capstone Project: Trading Signal Analyzer
 *
 * An OOP-driven stock-data analysis tool that reads OHLCV data from CSV,
 * computes moving averages (SMA / EMA), detects golden and death crossovers,
 * and generates a human-readable report. Unlocked after the dataclasses node
 * in Tier 5.
 */

// ── Local type definitions (until CapstoneProject lands in @/lib/types) ──

export interface Milestone {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

export interface StarterFile {
  path: string;
  content: string;
}

export interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  branchId: "python";
  unlockNodeId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  baseXP: number;
  milestones: Milestone[];
  starterFiles: StarterFile[];
  tags: string[];
}

// ── Project Definition ───────────────────────────────────────────────────

export const tradingAnalyzer: CapstoneProject = {
  id: "capstone:python:trading-analyzer",
  title: "Trading Signal Analyzer",
  description:
    "Analyze historical stock data to spot trading signals. You will read " +
    "OHLCV data from CSV files, compute Simple and Exponential Moving " +
    "Averages for configurable periods, detect golden-cross and death-cross " +
    "events, and output a clear analysis report with buy/sell recommendations. " +
    "This project reinforces OOP, dataclasses, file I/O, and list " +
    "comprehensions in a realistic, data-centric scenario.",
  branchId: "python",
  unlockNodeId: "python:t5:dataclasses",
  difficulty: 4,
  estimatedHours: 5,
  baseXP: 1500,

  milestones: [
    {
      id: "capstone:python:trading-analyzer:m1",
      title: "Data Model",
      description:
        "Create Stock and Signal dataclasses in models.py. Stock holds a " +
        "symbol and a list of OHLCV records. Signal captures the date, type " +
        "(golden_cross / death_cross), short-period MA value, and long-period " +
        "MA value. Add __str__ methods for readable output.",
      xpReward: 200,
    },
    {
      id: "capstone:python:trading-analyzer:m2",
      title: "CSV Parser",
      description:
        "Implement read_csv() in analyzer.py to parse OHLCV data from a CSV " +
        "file into a list of dicts (or dataclass instances). Handle missing " +
        "values, validate column names, and raise clear errors for malformed " +
        "input.",
      xpReward: 250,
    },
    {
      id: "capstone:python:trading-analyzer:m3",
      title: "Moving Averages",
      description:
        "Implement compute_sma() and compute_ema() for configurable window " +
        "sizes. SMA is a simple arithmetic mean over the window. EMA applies " +
        "an exponential weighting factor. Return a list of (date, value) " +
        "tuples aligned with the original data.",
      xpReward: 300,
    },
    {
      id: "capstone:python:trading-analyzer:m4",
      title: "Signal Detection",
      description:
        "Implement detect_crossovers() to compare a short-period and " +
        "long-period moving average series. A golden cross occurs when the " +
        "short MA crosses above the long MA; a death cross is the opposite. " +
        "Return a list of Signal instances.",
      xpReward: 350,
    },
    {
      id: "capstone:python:trading-analyzer:m5",
      title: "Report Generation",
      description:
        "Implement generate_report() to produce a formatted summary. Include " +
        "the stock symbol, date range, number of crossovers, each signal with " +
        "its date and type, and a final buy/sell/hold recommendation based on " +
        "the most recent signal.",
      xpReward: 400,
    },
  ],

  starterFiles: [
    {
      path: "analyzer.py",
      content: `#!/usr/bin/env python3
"""Trading Signal Analyzer — a capstone project for Python Tier 5.

Usage:
    python analyzer.py sample_data.csv --short 10 --long 50
"""

import csv
import sys
from dataclasses import dataclass
from models import OHLCVRecord, Signal, Stock


# ── CSV Parsing ───────────────────────────────────────────────────────────

def read_csv(filepath: str) -> list[OHLCVRecord]:
    """Parse an OHLCV CSV file into a list of OHLCVRecord instances.

    Expected columns: date, open, high, low, close, volume

    TODO (Milestone 2): Open the file, validate headers, and convert each
    row into an OHLCVRecord. Skip rows with missing or non-numeric values
    and print a warning to stderr.
    """
    records: list[OHLCVRecord] = []
    return records


# ── Moving Averages ───────────────────────────────────────────────────────

def compute_sma(records: list[OHLCVRecord], window: int) -> list[tuple[str, float]]:
    """Compute the Simple Moving Average of closing prices.

    SMA for day *i* = mean of close prices from day (i - window + 1) to day i.
    Returns a list of (date, sma_value) tuples.  The first (window - 1) days
    have no value and should be omitted.

    TODO (Milestone 3): Implement using a sliding-window approach.
    Hint: sum(r.close for r in records[start:end]) / window
    """
    return []


def compute_ema(records: list[OHLCVRecord], window: int) -> list[tuple[str, float]]:
    """Compute the Exponential Moving Average of closing prices.

    EMA uses a smoothing factor: k = 2 / (window + 1).
    EMA_today = close_today * k + EMA_yesterday * (1 - k)
    Seed the first EMA value with the SMA of the first *window* records.

    TODO (Milestone 3): Implement EMA calculation.
    """
    return []


# ── Signal Detection ──────────────────────────────────────────────────────

def detect_crossovers(
    short_ma: list[tuple[str, float]],
    long_ma: list[tuple[str, float]],
) -> list[Signal]:
    """Detect golden-cross and death-cross events.

    A golden cross occurs when the short MA crosses *above* the long MA.
    A death cross occurs when the short MA crosses *below* the long MA.

    Both lists must be aligned by date. Compare consecutive pairs of
    (short, long) values to find crossover points.

    TODO (Milestone 4): Implement crossover detection logic.
    Hint: iterate with zip, track the previous relationship
    (short > long vs short < long), and emit a Signal when it flips.
    """
    signals: list[Signal] = []
    return signals


# ── Report ────────────────────────────────────────────────────────────────

def generate_report(stock: Stock, signals: list[Signal]) -> str:
    """Generate a human-readable analysis report.

    Include:
    - Stock symbol and date range
    - Total number of signals detected
    - Each signal with date, type, and MA values
    - A recommendation (buy / sell / hold) based on the most recent signal

    TODO (Milestone 5): Build and return a formatted multi-line string.
    """
    lines: list[str] = []
    lines.append(f"=== Analysis Report: {stock.symbol} ===")
    # TODO: Fill in the rest of the report.
    return "\\n".join(lines)


# ── CLI entry point ───────────────────────────────────────────────────────

def main() -> None:
    """Parse arguments, run analysis, and print the report."""
    import argparse

    parser = argparse.ArgumentParser(description="Trading Signal Analyzer")
    parser.add_argument("csv_file", help="Path to OHLCV CSV file")
    parser.add_argument(
        "--short", type=int, default=10, help="Short MA window (default: 10)"
    )
    parser.add_argument(
        "--long", type=int, default=50, help="Long MA window (default: 50)"
    )
    parser.add_argument(
        "--ma-type",
        choices=["sma", "ema"],
        default="sma",
        help="Moving average type (default: sma)",
    )
    args = parser.parse_args()

    # 1. Parse CSV
    records = read_csv(args.csv_file)
    if not records:
        print("Error: no valid records found.", file=sys.stderr)
        sys.exit(1)

    # 2. Build Stock object
    stock = Stock(
        symbol=args.csv_file.replace(".csv", "").upper(),
        records=records,
    )

    # 3. Compute moving averages
    ma_func = compute_sma if args.ma_type == "sma" else compute_ema
    short_ma = ma_func(records, args.short)
    long_ma = ma_func(records, args.long)

    # 4. Detect crossovers
    signals = detect_crossovers(short_ma, long_ma)

    # 5. Print report
    print(generate_report(stock, signals))


if __name__ == "__main__":
    main()
`,
    },
    {
      path: "models.py",
      content: `"""Data models for the Trading Signal Analyzer.

This module defines the core dataclasses used throughout the project.
All domain objects live here so that analyzer.py stays focused on logic.
"""

from dataclasses import dataclass, field


@dataclass
class OHLCVRecord:
    """A single day's OHLCV (Open, High, Low, Close, Volume) data.

    Attributes:
        date:   Trading date as a string in YYYY-MM-DD format.
        open:   Opening price for the day.
        high:   Highest price during the day.
        low:    Lowest price during the day.
        close:  Closing price for the day.
        volume: Number of shares traded.
    """

    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

    def __str__(self) -> str:
        return (
            f"{self.date}  O:{self.open:.2f}  H:{self.high:.2f}  "
            f"L:{self.low:.2f}  C:{self.close:.2f}  V:{self.volume:,}"
        )


@dataclass
class Signal:
    """A trading signal generated by a crossover event.

    Attributes:
        date:       The date the crossover was detected.
        signal_type: Either 'golden_cross' (buy) or 'death_cross' (sell).
        short_ma:   Value of the short-period moving average at crossover.
        long_ma:    Value of the long-period moving average at crossover.
    """

    date: str
    signal_type: str  # 'golden_cross' | 'death_cross'
    short_ma: float
    long_ma: float

    def __str__(self) -> str:
        label = "BUY  (Golden Cross)" if self.signal_type == "golden_cross" else "SELL (Death Cross)"
        return (
            f"[{self.date}] {label}  "
            f"Short MA: {self.short_ma:.2f} | Long MA: {self.long_ma:.2f}"
        )


@dataclass
class Stock:
    """Represents a stock with its historical OHLCV data.

    Attributes:
        symbol:  Ticker symbol, e.g. 'AAPL'.
        records: List of daily OHLCV records, sorted by date ascending.
    """

    symbol: str
    records: list[OHLCVRecord] = field(default_factory=list)

    @property
    def date_range(self) -> str:
        """Return a human-readable date range string."""
        if not self.records:
            return "no data"
        return f"{self.records[0].date} to {self.records[-1].date}"

    def __str__(self) -> str:
        return f"Stock({self.symbol}, {len(self.records)} records, {self.date_range})"
`,
    },
    {
      path: "sample_data.csv",
      content: `date,open,high,low,close,volume
2025-01-02,150.00,152.50,149.25,151.75,32000000
2025-01-03,151.80,153.00,150.50,152.30,28500000
2025-01-06,152.00,154.20,151.00,153.80,31000000
2025-01-07,153.50,155.00,152.80,154.60,29000000
2025-01-08,154.00,154.75,151.50,152.00,35000000
2025-01-09,151.50,153.00,150.00,152.80,33000000
2025-01-10,153.00,156.00,152.50,155.50,37000000
2025-01-13,155.20,157.00,154.80,156.30,30000000
2025-01-14,156.00,156.80,153.50,154.00,32000000
2025-01-15,153.50,155.50,153.00,155.20,28000000
2025-01-16,155.00,157.50,154.50,157.00,34000000
2025-01-17,157.20,158.00,155.00,155.80,31000000
2025-01-20,155.50,156.50,154.00,156.20,29000000
2025-01-21,156.00,158.50,155.80,158.00,36000000
2025-01-22,158.20,159.00,156.50,157.00,33000000
`,
    },
  ],

  tags: [
    "oop",
    "dataclasses",
    "csv",
    "file-io",
    "list-comprehensions",
    "data-analysis",
    "moving-averages",
  ],
};

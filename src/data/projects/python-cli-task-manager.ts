/**
 * Capstone Project: CLI Task Manager
 *
 * A command-line task manager that exercises core Python data structures
 * (lists, dicts), file I/O with JSON, and argparse-based CLI design.
 * Unlocked after completing the nested-structures node in Tier 3.
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

export const cliTaskManager: CapstoneProject = {
  id: "capstone:python:cli-task-manager",
  title: "CLI Task Manager",
  description:
    "Build a fully-featured command-line task manager. You will create an " +
    "interactive CLI that lets users add, remove, list, complete, and filter " +
    "tasks — all persisted to a local JSON file. This project ties together " +
    "lists, dictionaries, file I/O, and argument parsing into a polished tool " +
    "you can actually use day-to-day.",
  branchId: "python",
  unlockNodeId: "python:t3:nested-structures",
  difficulty: 3,
  estimatedHours: 3,
  baseXP: 1000,

  milestones: [
    {
      id: "capstone:python:cli-task-manager:m1",
      title: "Project Setup",
      description:
        "Create main.py with an argparse CLI skeleton. Define subcommands for " +
        "add, remove, list, complete, and filter. Verify that --help prints " +
        "usage information for every subcommand.",
      xpReward: 150,
    },
    {
      id: "capstone:python:cli-task-manager:m2",
      title: "Task CRUD",
      description:
        "Implement add, remove, and list operations. Each task is a dictionary " +
        "with an id, title, status, priority, and created_at timestamp. Store " +
        "tasks in a list and print them in a readable table format.",
      xpReward: 200,
    },
    {
      id: "capstone:python:cli-task-manager:m3",
      title: "Task Status",
      description:
        "Add the ability to mark tasks as complete or pending. Implement a " +
        "filter subcommand that shows only tasks matching a given status " +
        "(all, pending, complete).",
      xpReward: 200,
    },
    {
      id: "capstone:python:cli-task-manager:m4",
      title: "Persistence",
      description:
        "Save the task list to a JSON file after every mutation and load it on " +
        "startup. Handle the case where the file does not yet exist gracefully. " +
        "Validate the data when loading to guard against corruption.",
      xpReward: 200,
    },
    {
      id: "capstone:python:cli-task-manager:m5",
      title: "Polish",
      description:
        "Add priority-based sorting (high, medium, low), optional due dates " +
        "with overdue detection, and colored terminal output using ANSI codes " +
        "or the built-in library. Make the tool pleasant to use.",
      xpReward: 250,
    },
  ],

  starterFiles: [
    {
      path: "main.py",
      content: `#!/usr/bin/env python3
"""CLI Task Manager — a capstone project for Python Tier 3.

Usage examples:
    python main.py add "Buy groceries" --priority high
    python main.py list
    python main.py complete 1
    python main.py filter --status pending
    python main.py remove 2
"""

import argparse
import json
import os
import sys
from datetime import datetime


# ── Constants ─────────────────────────────────────────────────────────────

TASKS_FILE = "tasks.json"
PRIORITIES = ("high", "medium", "low")
STATUSES = ("pending", "complete")


# ── Persistence helpers ───────────────────────────────────────────────────

def load_tasks(filepath: str = TASKS_FILE) -> list[dict]:
    """Load tasks from a JSON file.

    Returns an empty list when the file does not exist yet.
    TODO (Milestone 4): Implement this function.
    """
    return []


def save_tasks(tasks: list[dict], filepath: str = TASKS_FILE) -> None:
    """Persist the full task list to a JSON file.

    TODO (Milestone 4): Implement this function.
    """
    pass


# ── Core operations ───────────────────────────────────────────────────────

def next_id(tasks: list[dict]) -> int:
    """Return the next available task ID."""
    if not tasks:
        return 1
    return max(t["id"] for t in tasks) + 1


def add_task(tasks: list[dict], title: str, priority: str = "medium") -> dict:
    """Create a new task dict and append it to the list.

    TODO (Milestone 2): Build the task dictionary with keys:
        id, title, status, priority, created_at
    Append it to *tasks* and return the new task.
    """
    pass


def remove_task(tasks: list[dict], task_id: int) -> dict | None:
    """Remove and return the task with the given ID, or None if not found.

    TODO (Milestone 2): Implement removal by ID.
    """
    pass


def complete_task(tasks: list[dict], task_id: int) -> dict | None:
    """Mark a task as complete.

    TODO (Milestone 3): Find the task by ID and set its status to 'complete'.
    Return the updated task, or None if the ID was not found.
    """
    pass


def filter_tasks(tasks: list[dict], status: str = "all") -> list[dict]:
    """Return tasks matching the given status.

    TODO (Milestone 3): Filter the list. If status is 'all', return everything.
    """
    return tasks


# ── Display helpers ───────────────────────────────────────────────────────

def print_tasks(tasks: list[dict]) -> None:
    """Print tasks in a readable table format.

    TODO (Milestone 2): Format output so it is easy to scan.
    Hint: f-strings with alignment, e.g. f'{"Title":<30}'

    TODO (Milestone 5): Add colored output for status and priority.
    """
    if not tasks:
        print("No tasks found.")
        return

    print(f"{'ID':<5} {'Title':<30} {'Status':<10} {'Priority':<10}")
    print("-" * 55)
    for t in tasks:
        print(f"{t['id']:<5} {t['title']:<30} {t['status']:<10} {t['priority']:<10}")


# ── CLI setup ─────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    """Build and return the argument parser with subcommands.

    TODO (Milestone 1): Add subparsers for add, remove, list, complete, filter.
    Each subparser should define the arguments it needs.  For example:
        add  -> positional 'title', optional '--priority'
        remove -> positional 'id' (int)
        list -> no extra args
        complete -> positional 'id' (int)
        filter -> optional '--status' with choices
    """
    parser = argparse.ArgumentParser(
        description="A simple CLI task manager.",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # -- add --
    add_parser = subparsers.add_parser("add", help="Add a new task")
    add_parser.add_argument("title", help="Task title")
    add_parser.add_argument(
        "--priority",
        choices=PRIORITIES,
        default="medium",
        help="Task priority (default: medium)",
    )

    # TODO: Add the remaining subparsers for remove, list, complete, filter.

    return parser


def main() -> None:
    """Entry point: parse args, load tasks, dispatch command, save tasks."""
    parser = build_parser()
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    tasks = load_tasks()

    # TODO: Dispatch to the correct function based on args.command.
    # After any mutation (add, remove, complete), call save_tasks(tasks).

    if args.command == "add":
        task = add_task(tasks, args.title, args.priority)
        if task:
            print(f"Added task {task['id']}: {task['title']}")
            save_tasks(tasks)

    elif args.command == "list":
        print_tasks(tasks)

    # TODO: Handle remove, complete, filter commands.


if __name__ == "__main__":
    main()
`,
    },
    {
      path: "tasks.json",
      content: `[
  {
    "id": 1,
    "title": "Learn Python basics",
    "status": "complete",
    "priority": "high",
    "created_at": "2026-01-15T09:00:00"
  },
  {
    "id": 2,
    "title": "Practice list comprehensions",
    "status": "pending",
    "priority": "medium",
    "created_at": "2026-01-16T14:30:00"
  },
  {
    "id": 3,
    "title": "Build CLI task manager",
    "status": "pending",
    "priority": "high",
    "created_at": "2026-01-17T10:00:00"
  }
]
`,
    },
  ],

  tags: [
    "cli",
    "argparse",
    "lists",
    "dictionaries",
    "json",
    "file-io",
    "data-structures",
  ],
};

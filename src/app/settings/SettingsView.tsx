"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { useUserStore } from "@/store/user-store";
import { useProgressStore } from "@/store/progress-store";
import { useReviewStore } from "@/store/review-store";
import type { SessionMode, UserSettings } from "@/lib/types";

const SESSION_MODES: { value: SessionMode; label: string; description: string }[] = [
  { value: "quick",    label: "Quick",    description: "10 min · 1 review + 1 lesson or challenge" },
  { value: "standard", label: "Standard", description: "20 min · review + lesson + challenge" },
  { value: "deep",     label: "Deep",     description: "45+ min · full lesson path + challenges + review" },
  { value: "review",   label: "Review",   description: "5 min · spaced repetition only" },
];

function fallbackSettings(): UserSettings {
  return {
    dailyNewCards: 10,
    sessionDurationMinutes: 15,
    soundEnabled: true,
    animationsEnabled: true,
    preferredMode: "standard",
    notifications: {
      dailyReminder: false,
      reminderTime: "09:00",
      streakWarning: true,
    },
  };
}

export function SettingsView() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const resetUser = useUserStore((s) => s.reset);
  const resetProgress = useProgressStore((s) => s.reset);
  const resetReview = useReviewStore((s) => s.reset);
  const [confirmReset, setConfirmReset] = useState(false);

  const settings = profile?.settings ?? fallbackSettings();
  const username = profile?.username ?? "Learner";

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    updateProfile({ settings: { ...settings, [key]: value } });
  }

  function performReset() {
    resetUser();
    resetProgress();
    resetReview();
    setConfirmReset(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" />
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => updateProfile({ username: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </label>
      </Card>

      {/* Session preferences */}
      <Card>
        <CardHeader title="Sessions" subtitle="Default session mode shown on the dashboard" />
        <div className="space-y-2">
          {SESSION_MODES.map((m) => {
            const active = settings.preferredMode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => update("preferredMode", m.value)}
                className={[
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  active
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                    : "border-[var(--border)] hover:bg-[var(--surface-2)]",
                ].join(" ")}
              >
                <p className="text-sm font-medium text-[var(--foreground)]">{m.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{m.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Review */}
      <Card>
        <CardHeader title="Review" subtitle="Spaced repetition tuning" />
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">
            New cards per day · {settings.dailyNewCards}
          </span>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={settings.dailyNewCards}
            onChange={(e) => update("dailyNewCards", Number(e.target.value))}
            className="w-full mt-2 accent-[var(--accent-cyan)]"
          />
        </label>
      </Card>

      {/* Toggles */}
      <Card>
        <CardHeader title="Preferences" />
        <div className="space-y-3">
          <Toggle
            label="Sound effects"
            value={settings.soundEnabled}
            onChange={(v) => update("soundEnabled", v)}
          />
          <Toggle
            label="Animations"
            value={settings.animationsEnabled}
            onChange={(v) => update("animationsEnabled", v)}
          />
          <Toggle
            label="Streak warning before midnight"
            value={settings.notifications.streakWarning}
            onChange={(v) =>
              update("notifications", { ...settings.notifications, streakWarning: v })
            }
          />
        </div>
      </Card>

      {/* Danger zone */}
      <Card accent="var(--accent-orange)">
        <CardHeader
          title="Reset progress"
          subtitle="Wipes XP, streak, completed nodes, and review cards. Cannot be undone."
        />
        {confirmReset ? (
          <div className="flex gap-2">
            <Button variant="danger" onClick={performReset}>
              Yes, wipe everything
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Reset all data
          </Button>
        )}
      </Card>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 px-1"
    >
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      <span
        className={[
          "relative w-10 h-6 rounded-full transition-colors",
          value ? "bg-[var(--accent-blue)]" : "bg-[var(--surface-3)]",
        ].join(" ")}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: value ? "translateX(18px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}

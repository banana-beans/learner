"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useUserStore } from "@/store/user-store";
import { useProgressStore } from "@/store/progress-store";
import type { SessionMode } from "@/lib/types";

// ────────────────────────────────────────────────────────────
// Avatar options
// ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { id: "blue", color: "#4f8ef7" },
  { id: "cyan", color: "#22d3ee" },
  { id: "green", color: "#22c55e" },
  { id: "orange", color: "#f97316" },
  { id: "purple", color: "#a855f7" },
  { id: "red", color: "#ef4444" },
  { id: "gold", color: "#f59e0b" },
  { id: "teal", color: "#14b8a6" },
  { id: "indigo", color: "#6366f1" },
  { id: "pink", color: "#ec4899" },
];

const SESSION_MODES: Array<{ mode: SessionMode; label: string; desc: string }> = [
  { mode: "quick", label: "Quick", desc: "5 min" },
  { mode: "standard", label: "Standard", desc: "15 min" },
  { mode: "deep", label: "Deep", desc: "30 min" },
  { mode: "review", label: "Review", desc: "10 min" },
];

// ────────────────────────────────────────────────────────────
// Toggle switch component
// ────────────────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          enabled ? "bg-[var(--accent-blue)]" : "bg-[var(--surface-3)]",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200",
            enabled ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Settings Page
// ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { profile, updateProfile, reset: resetUser } = useUserStore();
  const { reset: resetProgress } = useProgressStore();

  const settings = profile?.settings ?? {
    dailyNewCards: 10,
    sessionDurationMinutes: 15,
    soundEnabled: true,
    animationsEnabled: true,
    preferredMode: "standard" as SessionMode,
    notifications: {
      dailyReminder: false,
      reminderTime: "09:00",
      streakWarning: true,
    },
  };

  const username = profile?.username ?? "Learner";
  const avatarId = profile?.avatarId ?? "blue";

  // Local state for form fields
  const [localUsername, setLocalUsername] = useState(username);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showSavedToast, setShowSavedToast] = useState(false);

  const showToast = useCallback(() => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  }, []);

  // ── Update helpers ──
  const updateSettings = useCallback(
    (partial: Partial<typeof settings>) => {
      updateProfile({
        settings: { ...settings, ...partial },
      });
      showToast();
    },
    [settings, updateProfile, showToast],
  );

  const updateNotifications = useCallback(
    (partial: Partial<typeof settings.notifications>) => {
      updateProfile({
        settings: {
          ...settings,
          notifications: { ...settings.notifications, ...partial },
        },
      });
      showToast();
    },
    [settings, updateProfile, showToast],
  );

  const handleUsernameBlur = useCallback(() => {
    const trimmed = localUsername.trim();
    if (trimmed && trimmed !== username) {
      updateProfile({ username: trimmed });
      showToast();
    }
  }, [localUsername, username, updateProfile, showToast]);

  const handleAvatarSelect = useCallback(
    (id: string) => {
      updateProfile({ avatarId: id });
      showToast();
    },
    [updateProfile, showToast],
  );

  const handleExport = useCallback(() => {
    const data = {
      profile,
      totalXP: useUserStore.getState().totalXP,
      level: useUserStore.getState().level,
      streak: useUserStore.getState().streak,
      xpHistory: useUserStore.getState().xpHistory,
      progress: {
        completedNodes: useProgressStore.getState().completedNodes,
        masteredNodes: useProgressStore.getState().masteredNodes,
        earnedAchievements: useProgressStore.getState().earnedAchievements,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learner-progress-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profile]);

  const handleReset = useCallback(() => {
    if (resetConfirmText !== "RESET") return;
    resetUser();
    resetProgress();
    setShowResetModal(false);
    setResetConfirmText("");
  }, [resetConfirmText, resetUser, resetProgress]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Customize your learning experience
        </p>
      </div>

      {/* ── Profile ── */}
      <Card>
        <CardHeader title="Profile" subtitle="Your identity on the platform" />

        {/* Username */}
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            onBlur={handleUsernameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUsernameBlur();
            }}
            maxLength={24}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            placeholder="Your username"
          />
        </div>

        {/* Avatar selection */}
        <div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-2">Avatar Color</p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((av) => (
              <button
                key={av.id}
                onClick={() => handleAvatarSelect(av.id)}
                className={[
                  "w-10 h-10 rounded-full transition-all duration-150",
                  avatarId === av.id
                    ? "ring-2 ring-offset-2 ring-[var(--accent-blue)] ring-offset-[var(--surface)]"
                    : "hover:scale-110",
                ].join(" ")}
                style={{ background: av.color }}
                aria-label={`Select ${av.id} avatar`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* ── Session ── */}
      <Card>
        <CardHeader title="Session" subtitle="Default learning session preferences" />

        {/* Preferred mode */}
        <div className="mb-5">
          <p className="text-sm font-medium text-[var(--foreground)] mb-2">Preferred Mode</p>
          <div className="grid grid-cols-4 gap-2">
            {SESSION_MODES.map(({ mode, label, desc }) => (
              <button
                key={mode}
                onClick={() => updateSettings({ preferredMode: mode })}
                className={[
                  "flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-lg border text-center transition-all duration-150",
                  settings.preferredMode === mode
                    ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--accent-blue)]"
                    : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]/50",
                ].join(" ")}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Daily new cards slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[var(--foreground)]">Daily New Cards</p>
            <span className="text-sm font-bold text-[var(--accent-blue)] tabular-nums">
              {settings.dailyNewCards}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={settings.dailyNewCards}
            onChange={(e) =>
              updateSettings({ dailyNewCards: parseInt(e.target.value, 10) })
            }
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--surface-3)] accent-[var(--accent-blue)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
            <span>5</span>
            <span>30</span>
          </div>
        </div>
      </Card>

      {/* ── Notifications ── */}
      <Card>
        <CardHeader title="Notifications" subtitle="Reminders and alerts" />
        <div className="space-y-1">
          <Toggle
            label="Daily Reminder"
            description="Get a notification to practice each day"
            enabled={settings.notifications.dailyReminder}
            onChange={(v) => updateNotifications({ dailyReminder: v })}
          />

          {settings.notifications.dailyReminder && (
            <div className="pl-0 pb-2">
              <label
                htmlFor="reminder-time"
                className="block text-xs text-[var(--text-muted)] mb-1"
              >
                Reminder Time
              </label>
              <input
                id="reminder-time"
                type="time"
                value={settings.notifications.reminderTime}
                onChange={(e) =>
                  updateNotifications({ reminderTime: e.target.value })
                }
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          )}

          <Toggle
            label="Streak Warning"
            description="Alert when your streak is at risk"
            enabled={settings.notifications.streakWarning}
            onChange={(v) => updateNotifications({ streakWarning: v })}
          />
        </div>
      </Card>

      {/* ── Display ── */}
      <Card>
        <CardHeader title="Display" subtitle="Visual and audio preferences" />
        <div className="space-y-1">
          <Toggle
            label="Sound Effects"
            description="Play sounds for XP gains, level ups, and achievements"
            enabled={settings.soundEnabled}
            onChange={(v) => updateSettings({ soundEnabled: v })}
          />
          <Toggle
            label="Animations"
            description="Enable motion and particle effects"
            enabled={settings.animationsEnabled}
            onChange={(v) => updateSettings({ animationsEnabled: v })}
          />
        </div>
      </Card>

      {/* ── Data ── */}
      <Card>
        <CardHeader title="Data" subtitle="Export or reset your progress" />
        <div className="space-y-3">
          <Button variant="secondary" size="md" onClick={handleExport}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-1"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Progress
          </Button>

          <div className="border-t border-[var(--border)] pt-3">
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowResetModal(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mr-1"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Reset All Progress
            </Button>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Reset confirmation modal ── */}
      <Modal
        open={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetConfirmText("");
        }}
        title="Reset All Progress"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            This will permanently delete all your progress, XP, achievements, streaks,
            and review history. This action <strong className="text-red-400">cannot be undone</strong>.
          </p>
          <div>
            <label
              htmlFor="reset-confirm"
              className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
            >
              Type <span className="font-mono text-red-400">RESET</span> to confirm
            </label>
            <input
              id="reset-confirm"
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-red-500/30 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500 transition-colors"
              placeholder="RESET"
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowResetModal(false);
                setResetConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReset}
              disabled={resetConfirmText !== "RESET"}
            >
              Reset Everything
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Saved toast ── */}
      {showSavedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[var(--accent-green)]/20 border border-[var(--accent-green)]/30 text-sm font-medium text-green-400 shadow-lg">
          Settings saved
        </div>
      )}
    </div>
  );
}

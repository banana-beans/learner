// ============================================================
// Graveyard — viewed snippets persisted across sessions
// ============================================================
// "Seen it" → goes into the graveyard → never shown again until
// the user explicitly resets. Per-language counts so we can show
// "47/200 Python seen" style stats in the UI.
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface GraveyardState {
  /** Set of snippet IDs the user has seen. */
  viewed: Record<string, true>;

  // Actions
  markViewed: (id: string) => void;
  markManyViewed: (ids: string[]) => void;
  isViewed: (id: string) => boolean;
  reset: () => void;
  /** Reset only ids matching a predicate (e.g. one language). */
  resetMatching: (pred: (id: string) => boolean) => void;
}

export const useGraveyardStore = create<GraveyardState>()(
  persist(
    (set, get) => ({
      viewed: {},

      markViewed: (id) => {
        if (get().viewed[id]) return;
        set((s) => ({ viewed: { ...s.viewed, [id]: true } }));
      },

      markManyViewed: (ids) => {
        const cur = get().viewed;
        const next = { ...cur };
        let changed = false;
        for (const id of ids) {
          if (!next[id]) {
            next[id] = true;
            changed = true;
          }
        }
        if (changed) set({ viewed: next });
      },

      isViewed: (id) => !!get().viewed[id],

      reset: () => set({ viewed: {} }),

      resetMatching: (pred) => {
        const next: Record<string, true> = {};
        for (const id of Object.keys(get().viewed)) {
          if (!pred(id)) next[id] = true;
        }
        set({ viewed: next });
      },
    }),
    {
      name: "learner-graveyard",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);

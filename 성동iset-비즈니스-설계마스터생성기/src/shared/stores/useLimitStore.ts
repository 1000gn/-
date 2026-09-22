import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DAILY_GENERATION_LIMIT } from "../config/constants";

interface LimitState {
  count: number;
  lastReset: number; // Timestamp
  increment: () => void;
  getRemainingHours: () => number;
  isLimitReached: () => boolean;
}

export const useLimitStore = create<LimitState>()(
  persist(
    (set, get) => ({
      count: 0,
      lastReset: Date.now(),

      increment: () => {
        const { count, lastReset } = get();
        const now = Date.now();

        // Reset if it's a new day (UTC based)
        const lastResetDate = new Date(lastReset).getUTCDate();
        const nowDate = new Date(now).getUTCDate();

        if (lastResetDate !== nowDate) {
          set({ count: 1, lastReset: now });
        } else {
          set({ count: count + 1 });
        }
      },

      getRemainingHours: () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCHours(24, 0, 0, 0);
        return (tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60);
      },

      isLimitReached: () => {
        const { count, lastReset } = get();
        const now = Date.now();
        const lastResetDate = new Date(lastReset).getUTCDate();
        const nowDate = new Date(now).getUTCDate();

        if (lastResetDate !== nowDate) {
          return false;
        }
        return count >= DAILY_GENERATION_LIMIT;
      },
    }),
    {
      name: "daily-limit-storage",
    },
  ),
);

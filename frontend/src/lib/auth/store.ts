"use client";

import { create } from "zustand";

import type { User } from "@/types";
import { logoutAction } from "./actions";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => {
    set({ user });
    broadcastUserChange(user);
  },
  logout: () => {
    set({ user: null });
    broadcastUserChange(null);
    void logoutAction();
  },
}));

export function useAuth() {
  return useAuthStore((s) => s.user);
}

let channel: BroadcastChannel | null = null;

export function initAuthCrossTabSync() {
  if (typeof window === "undefined" || channel) return;
  channel = new BroadcastChannel("auth-sync");

  channel.onmessage = (
    event: MessageEvent<{ type: "user-changed"; user: User | null }>,
  ) => {
    if (event.data?.type === "user-changed") {
      useAuthStore.setState({ user: event.data.user });
    }
  };
}

function broadcastUserChange(user: User | null) {
  channel?.postMessage({ type: "user-changed", user });
}

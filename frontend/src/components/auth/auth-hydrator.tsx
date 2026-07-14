"use client";

import { useEffect } from "react";

import { refreshSessionAction } from "@/lib/auth/actions";
import { initAuthCrossTabSync, useAuthStore } from "@/lib/auth/store";
import type { User } from "@/types";

type AuthHydratorProps = {
  user: User;
  needsCookieSync?: boolean;
};

export default function AuthHydrator({
  user,
  needsCookieSync = false,
}: AuthHydratorProps) {
  useEffect(() => {
    useAuthStore.getState().setUser(user);
    initAuthCrossTabSync();

    if (!needsCookieSync) return;

    void refreshSessionAction().then((synced) => {
      if (synced) useAuthStore.getState().setUser(synced);
    });
  }, [user, needsCookieSync]);

  return null;
}

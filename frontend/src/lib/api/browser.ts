"use client";

import type { ZodType } from "zod";

import { refreshSessionAction } from "@/lib/auth/actions";
import { useAuthStore } from "@/lib/auth/store";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope = {
  success: boolean;
  message: string;
  data?: unknown;
  meta?: { nextCursor?: string | null; limit?: number };
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSessionAction()
      .then((user) => {
        if (!user) return false;
        useAuthStore.getState().setUser(user);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function forceLogout(): void {
  useAuthStore.getState().logout();
}

function reshapePayload(envelope: Envelope): unknown {
  if (Array.isArray(envelope.data) && envelope.meta !== undefined) {
    return {
      items: envelope.data,
      nextCursor: envelope.meta.nextCursor ?? null,
    };
  }
  return envelope.data;
}

async function parseResponse<T>(
  res: Response,
  schema: ZodType<T>,
): Promise<T> {
  if (res.status === 204) {
    return schema.parse(undefined);
  }

  let envelope: Envelope;
  try {
    envelope = (await res.json()) as Envelope;
  } catch {
    throw new ApiError(
      res.status,
      "Received an unexpected response from the server.",
    );
  }

  if (!res.ok || envelope.success === false) {
    throw new ApiError(
      res.status,
      typeof envelope.message === "string"
        ? envelope.message
        : "Your request could not be completed.",
    );
  }

  const parsed = schema.safeParse(reshapePayload(envelope));
  if (!parsed.success) {
    throw new ApiError(
      res.status,
      "Received an unexpected response from the server.",
    );
  }
  return parsed.data;
}

export async function apiFetch<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (
    init?.body !== undefined &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (res.status === 401 && !retried) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      forceLogout();
      throw new ApiError(401, "Authentication required.");
    }
    return apiFetch(path, schema, init, true);
  }

  if (res.status === 401) {
    forceLogout();
    throw new ApiError(401, "Authentication required.");
  }

  return parseResponse(res, schema);
}

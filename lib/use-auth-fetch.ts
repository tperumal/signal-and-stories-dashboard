"use client";

import { useAuth } from "./auth-context";
import { useCallback } from "react";

export function useAuthFetch() {
  const { getIdToken } = useAuth();

  const authFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      const token = await getIdToken();
      const headers = new Headers(init?.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(url, { ...init, headers });
    },
    [getIdToken]
  );

  return authFetch;
}

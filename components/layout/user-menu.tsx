"use client";

import { useAuth } from "@/lib/auth-context";

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="user-menu">
      <span className="user-email">{user.email}</span>
      <button className="sign-out-button" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}

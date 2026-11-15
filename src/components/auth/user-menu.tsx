"use client";

import { UserButton } from "@clerk/nextjs";

/** Clerk's avatar menu: account settings and sign out. Signing out returns to the landing page. */
export function UserMenu({ size = 36 }: { size?: number }) {
  return (
    <UserButton
      appearance={{ elements: { avatarBox: { width: size, height: size } } }}
    />
  );
}

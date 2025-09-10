"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton({
  className = "px-3 py-1 border rounded",
  label = "Logout",
  callbackUrl = "/signin",
}: {
  className?: string;
  label?: string;
  callbackUrl?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => signOut({ callbackUrl })}
    >
      {label}
    </button>
  );
}


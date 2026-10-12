"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/app/admin/actions";
import { btnPrimary, input, label } from "@/lib/ui";

export default function LoginForm({ next }: { next?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction(password, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <label className={label}>
        Admin password
        <input type="password" name="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      </label>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

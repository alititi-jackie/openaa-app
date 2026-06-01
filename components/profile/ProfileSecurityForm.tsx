"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileSecurityForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage("Password update failed. Please try again.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch {
      setMessage("Supabase is not configured. Password cannot be updated yet.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Account security</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set a new password for email login. This does not change your email address or linked OAuth providers.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-800">New password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <KeyRound size={18} aria-hidden="true" />
        {isSubmitting ? "Saving..." : "Update password"}
      </button>

      {message ? <p className="rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">{message}</p> : null}
    </form>
  );
}

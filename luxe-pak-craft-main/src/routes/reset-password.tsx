import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — LUXE" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/account" });
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Toaster richColors position="top-center" />
      <div className="px-6 lg:px-12 py-6 border-b border-border flex items-center">
        <Link to="/" className="font-display text-[24px] tracking-[0.25em] font-semibold">LUXE</Link>
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <h1 className="font-display text-[40px] font-light leading-none text-center">Set a new password</h1>
          <input
            required
            type="password"
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-8 w-full h-11 px-4 border border-border bg-white text-sm focus:outline-none focus:border-black"
          />
          <button disabled={busy} className="mt-4 w-full h-11 bg-black text-white eyebrow disabled:opacity-50">
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </main>
    </div>
  );
}

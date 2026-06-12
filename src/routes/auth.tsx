import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LUXE" },
      { name: "description", content: "Sign in or create your LUXE account." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/account" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created.");
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your inbox.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/account",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed.");
      setBusy(false);
      return;
    }
    if (!result.redirected) {
      navigate({ to: "/account" });
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Toaster richColors position="top-center" />
      <div className="px-6 lg:px-12 py-6 border-b border-border flex items-center">
        <Link to="/" className="font-display text-[24px] tracking-[0.25em] font-semibold">LUXE</Link>
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <h1 className="font-display text-[40px] font-light leading-none text-center">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground text-center">
            {mode === "signin"
              ? "Sign in to continue."
              : mode === "signup"
                ? "Join LUXE. It takes a moment."
                : "We'll email you a reset link."}
          </p>

          {mode !== "forgot" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="mt-8 w-full h-11 border border-border eyebrow flex items-center justify-center gap-3 hover:bg-surface transition-colors disabled:opacity-50"
              >
                <GoogleIcon /> Continue with Google
              </button>
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="eyebrow text-muted-foreground text-[10px]">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full h-11 px-4 border border-border bg-white text-sm focus:outline-none focus:border-black"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="w-full h-11 px-4 border border-border bg-white text-sm focus:outline-none focus:border-black"
            />
            {mode !== "forgot" && (
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full h-11 px-4 border border-border bg-white text-sm focus:outline-none focus:border-black"
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-black text-white eyebrow disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-sm text-center space-y-2">
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("forgot")} className="underline underline-offset-4 text-muted-foreground">
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  New to LUXE?{" "}
                  <button onClick={() => setMode("signup")} className="text-black underline underline-offset-4">
                    Create an account
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Already a member?{" "}
                <button onClick={() => setMode("signin")} className="text-black underline underline-offset-4">
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("signin")} className="underline underline-offset-4 text-muted-foreground">
                Back to sign in
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

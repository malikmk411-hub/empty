import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setError("Account created! Please check your email to verify.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white pt-[72px] min-h-screen">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-[32px] text-center mb-8">
          {isLogin ? "Sign In" : "Create Account"}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-[4px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-border rounded-[4px] px-4 py-3 focus:outline-none focus:border-black"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-[4px] px-4 py-3 focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-[4px] px-4 py-3 focus:outline-none focus:border-black"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-black text-white rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted-foreground hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}

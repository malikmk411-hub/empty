import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin-claim")({
  ssr: false,
  head: () => ({ meta: [{ title: "Claim Admin — LUXE" }] }),
  component: ClaimAdmin,
});

function ClaimAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alreadyAdmin, setAlreadyAdmin] = useState(false);

  useEffect(() => {
    supabase.rpc("is_admin").then(({ data }) => {
      if (data) setAlreadyAdmin(true);
    });
  }, []);

  async function claim() {
    setLoading(true);
    const { data, error } = await supabase.rpc("claim_admin_if_none");
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data) {
      toast.success("You are now admin.");
      navigate({ to: "/admin" });
    } else {
      toast.error("Admin already exists. Ask an existing admin to grant you access.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-6">
      <div className="max-w-md text-center space-y-6">
        <h1 className="font-display text-[40px] leading-none">Admin Access</h1>
        {alreadyAdmin ? (
          <>
            <p className="text-sm text-muted-foreground">You already have admin access.</p>
            <button onClick={() => navigate({ to: "/admin" })} className="h-11 px-8 bg-black text-white eyebrow">Open dashboard</button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">If no admin exists yet on this store, you can claim admin access here. Otherwise this will fail and an existing admin must grant you the role.</p>
            <button onClick={claim} disabled={loading} className="h-11 px-8 bg-black text-white eyebrow disabled:opacity-50">{loading ? "Claiming…" : "Claim admin"}</button>
          </>
        )}
      </div>
    </div>
  );
}

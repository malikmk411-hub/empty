import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  component: ReviewsModeration,
});

function ReviewsModeration() {
  const qc = useQueryClient();
  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, title, body, is_approved, is_verified_purchase, created_at, products(name, slug)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function approve(id: string, approved: boolean) {
    const { error } = await supabase.from("reviews").update({ is_approved: approved }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }
  async function del(id: string) {
    if (!confirm("Delete review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[40px] leading-none">Reviews</h1>
      <div className="space-y-3">
        {(reviews.data ?? []).map((r: any) => (
          <div key={r.id} className="border border-border p-4 flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "fill-black text-black" : "text-border"} />)}</div>
                <span>·</span>
                <span>{r.products?.name}</span>
                {r.is_verified_purchase && <span className="bg-secondary px-1.5 py-0.5 text-[10px] uppercase">Verified</span>}
                {!r.is_approved && <span className="bg-yellow-100 px-1.5 py-0.5 text-[10px] uppercase">Pending</span>}
              </div>
              {r.title && <div className="font-medium text-sm mt-2">{r.title}</div>}
              {r.body && <p className="text-sm mt-1 text-muted-foreground">{r.body}</p>}
            </div>
            <div className="flex flex-col gap-2">
              {!r.is_approved ? (
                <button onClick={() => approve(r.id, true)} className="text-xs eyebrow border border-border px-3 py-1.5 inline-flex items-center gap-1"><Check size={12} /> Approve</button>
              ) : (
                <button onClick={() => approve(r.id, false)} className="text-xs eyebrow border border-border px-3 py-1.5">Unapprove</button>
              )}
              <button onClick={() => del(r.id)} className="text-xs text-destructive inline-flex items-center gap-1 px-3 py-1.5"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        ))}
        {reviews.data?.length === 0 && <div className="text-sm text-muted-foreground">No reviews yet.</div>}
      </div>
    </div>
  );
}

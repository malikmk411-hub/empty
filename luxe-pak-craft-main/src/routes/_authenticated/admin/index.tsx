import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — LUXE" }] }),
  component: Overview,
});

function Overview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, reviews, revenue] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("orders").select("total").in("status", ["paid", "processing", "shipped", "delivered"]),
      ]);
      const totalRevenue = (revenue.data ?? []).reduce((s, o: any) => s + Number(o.total), 0);
      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        pendingReviews: reviews.count ?? 0,
        revenue: totalRevenue,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, currency, email, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[40px] leading-none">Overview</h1>
        <p className="text-sm text-muted-foreground mt-2">Daily snapshot of the storefront.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue" value={formatPKR(stats.data?.revenue ?? 0)} />
        <Stat label="Orders" value={String(stats.data?.orders ?? 0)} />
        <Stat label="Products" value={String(stats.data?.products ?? 0)} />
        <Stat label="Pending reviews" value={String(stats.data?.pendingReviews ?? 0)} />
      </div>
      <div>
        <h2 className="eyebrow mb-3">Recent orders</h2>
        <div className="border border-border">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr><th className="p-3">Order</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{o.order_number}</td>
                  <td className="p-3">{o.email}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-secondary text-[10px] uppercase tracking-wider">{o.status}</span></td>
                  <td className="p-3 text-right">{formatPKR(Number(o.total))}</td>
                </tr>
              ))}
              {recent.data?.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-5">
      <div className="eyebrow text-muted-foreground">{label}</div>
      <div className="font-display text-[28px] mt-2 leading-none">{value}</div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: OrdersList,
});

function OrdersList() {
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, email, status, total, currency, created_at, payment_method")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[40px] leading-none">Orders</h1>
        <p className="text-sm text-muted-foreground mt-2">{orders.data?.length ?? 0} total</p>
      </div>
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left eyebrow text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Customer</th>
              <th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            {(orders.data ?? []).map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="p-3 font-mono text-xs">{o.order_number}</td>
                <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-3">{o.email}</td>
                <td className="p-3 text-xs uppercase tracking-wider">{o.payment_method ?? "—"}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-secondary text-[10px] uppercase">{o.status}</span></td>
                <td className="p-3 text-right">{formatPKR(Number(o.total))}</td>
                <td className="p-3 text-right">
                  <Link to="/admin/orders/$id" params={{ id: o.id }} className="text-xs underline">Manage</Link>
                </td>
              </tr>
            ))}
            {orders.data?.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground text-sm">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

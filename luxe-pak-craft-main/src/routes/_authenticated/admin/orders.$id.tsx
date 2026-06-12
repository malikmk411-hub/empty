import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { toast } from "sonner";
import { useState } from "react";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Admin" }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const [{ data: order }, { data: items }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).single(),
        supabase.from("order_items").select("*").eq("order_id", id),
      ]);
      return { order, items: items ?? [] };
    },
  });
  const [tracking, setTracking] = useState("");

  if (!q.data?.order) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const o: any = q.data.order;
  const items = q.data.items;
  const addr: any = o.shipping_address;

  async function update(patch: any) {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated.");
    qc.invalidateQueries({ queryKey: ["admin-order", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <Link to="/admin/orders" className="text-xs text-muted-foreground underline">← All orders</Link>
          <h1 className="font-display text-[40px] leading-none mt-2">Order {o.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <div className="eyebrow text-muted-foreground">Total</div>
          <div className="font-display text-[28px]">{formatPKR(Number(o.total))}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4">
          {items.map((it: any) => (
            <div key={it.id} className="flex gap-4 border border-border p-3">
              {it.product_image && <img src={it.product_image} alt="" className="w-20 h-20 object-cover" />}
              <div className="flex-1">
                <div className="font-medium text-sm">{it.product_name}</div>
                <div className="text-xs text-muted-foreground">Size {it.size} · Qty {it.quantity}</div>
              </div>
              <div className="text-sm">{formatPKR(Number(it.line_total))}</div>
            </div>
          ))}
          <div className="border border-border p-4 text-sm space-y-1">
            <Row k="Subtotal" v={formatPKR(Number(o.subtotal))} />
            <Row k="Shipping" v={formatPKR(Number(o.shipping))} />
            <Row k="Tax" v={formatPKR(Number(o.tax))} />
            {Number(o.discount) > 0 && <Row k="Discount" v={`− ${formatPKR(Number(o.discount))}`} />}
            <div className="border-t border-border pt-2 mt-2"><Row k="Total" v={formatPKR(Number(o.total))} bold /></div>
          </div>
        </div>

        <aside className="space-y-6">
          <div>
            <div className="eyebrow mb-2">Status</div>
            <select className="input" value={o.status} onChange={(e) => update({ status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="eyebrow mb-2">Tracking number</div>
            <input className="input" defaultValue={o.tracking_number ?? ""} onChange={(e) => setTracking(e.target.value)} />
            <button className="mt-2 text-xs underline" onClick={() => update({ tracking_number: tracking })}>Save tracking</button>
          </div>
          <div className="border border-border p-4 text-sm">
            <div className="eyebrow text-muted-foreground mb-2">Customer</div>
            <div>{o.email}</div>
            <div className="mt-1 text-xs uppercase tracking-wider">{o.payment_method ?? "—"}</div>
          </div>
          <div className="border border-border p-4 text-sm">
            <div className="eyebrow text-muted-foreground mb-2">Shipping</div>
            <div>{addr?.full_name}</div>
            <div>{addr?.address_line1}</div>
            {addr?.address_line2 && <div>{addr.address_line2}</div>}
            <div>{addr?.city}, {addr?.province} {addr?.postal_code}</div>
            <div>{addr?.country}</div>
            <div className="mt-1 text-muted-foreground">{addr?.phone}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-medium" : ""}`}><span>{k}</span><span>{v}</span></div>;
}

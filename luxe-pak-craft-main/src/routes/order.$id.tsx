import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { formatPKR } from "@/lib/currency";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Order confirmed — LUXE" }] }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const [{ data: order }, { data: items }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id),
      ]);
      return { order, items: items ?? [] };
    },
  });

  return (
    <div className="bg-white text-black min-h-screen flex flex-col">
      <Header />
      <main className="pt-[88px] pb-20 mx-auto max-w-[760px] w-full px-6 flex-1">
        {!q.data?.order ? (
          <div className="py-20 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-10">
            <div className="text-center space-y-4 pt-10">
              <CheckCircle2 size={56} strokeWidth={1} className="mx-auto" />
              <h1 className="font-display text-[48px] leading-none">Thank you</h1>
              <p className="text-sm text-muted-foreground">Your order <span className="font-mono">{q.data.order.order_number}</span> has been placed.</p>
              <p className="text-sm text-muted-foreground">A confirmation will be sent to {q.data.order.email}.</p>
            </div>
            <div className="border border-border p-6 space-y-4">
              <div className="eyebrow">Items</div>
              {q.data.items.map((i: any) => (
                <div key={i.id} className="flex gap-3 items-center text-sm">
                  {i.product_image && <img src={i.product_image} alt="" className="w-14 h-16 object-cover" />}
                  <div className="flex-1">{i.product_name}<div className="text-xs text-muted-foreground">Size {i.size} · Qty {i.quantity}</div></div>
                  <div>{formatPKR(Number(i.line_total))}</div>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between font-medium">
                <span>Total</span><span>{formatPKR(Number(q.data.order.total))}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link to="/account" className="h-11 px-6 border border-border eyebrow inline-flex items-center">View orders</Link>
              <Link to="/shop" className="h-11 px-8 bg-black text-white eyebrow inline-flex items-center">Continue shopping</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

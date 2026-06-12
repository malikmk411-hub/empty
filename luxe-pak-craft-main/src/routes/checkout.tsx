import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useCart, selectCartSubtotal } from "@/lib/cart-store";
import { formatPKR } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/orders.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Lock, Truck } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({ meta: [{ title: "Checkout — LUXE" }, { name: "description", content: "Complete your order." }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectCartSubtotal);
  const clear = useCart((s) => s.clear);
  const place = useServerFn(placeOrder);

  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "",
    address_line1: "", address_line2: "",
    city: "", province: "Punjab", postal_code: "",
    country: "Pakistan",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: "/checkout" } as any });
        return;
      }
      setEmail(data.user.email ?? "");
      const { data: addr } = await supabase
        .from("addresses").select("*").eq("user_id", data.user.id)
        .order("is_default", { ascending: false }).limit(1).maybeSingle();
      if (addr) {
        setForm({
          full_name: addr.full_name, phone: addr.phone,
          address_line1: addr.address_line1, address_line2: addr.address_line2 ?? "",
          city: addr.city, province: addr.province, postal_code: addr.postal_code,
          country: addr.country,
        });
        setSaveAddress(false);
      }
      setAuthChecked(true);
    });
  }, []);

  const shipping = subtotal === 0 ? 0 : subtotal >= 10000 ? 0 : 350;
  const total = subtotal + shipping;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await place({
        data: {
          email,
          items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
          shipping_address: { ...form, address_line2: form.address_line2 || null },
          payment_method: paymentMethod,
          notes: notes || null,
          save_address: saveAddress,
        },
      });
      clear();
      navigate({ to: "/order/$id", params: { id: res.id } });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked) return <div className="min-h-screen bg-white" />;

  return (
    <div className="bg-white text-black min-h-screen flex flex-col">
      <Header />
      <Toaster />
      <main className="pt-[88px] pb-20 mx-auto max-w-[1240px] w-full px-6 lg:px-10 flex-1">
        <h1 className="font-display text-[40px] lg:text-[56px] leading-none mb-10">Checkout</h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Link to="/shop" className="h-11 px-8 inline-flex items-center bg-black text-white eyebrow">Continue shopping</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-12">
            <div className="space-y-10">
              <Section title="Contact">
                <Field label="Email"><input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              </Section>

              <Section title="Shipping address">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name"><input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
                  <Field label="Phone"><input required className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 0000000" /></Field>
                </div>
                <Field label="Address line 1"><input required className="input" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} /></Field>
                <Field label="Address line 2 (optional)"><input className="input" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} /></Field>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City"><input required className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
                  <Field label="Province">
                    <select className="input" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                      {["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Kashmir"].map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Postal code"><input required className="input" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address for next time
                </label>
              </Section>

              <Section title="Payment">
                <div className="space-y-2">
                  <PayOption checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} title="Cash on Delivery" desc="Pay in cash when your order arrives. Most popular across Pakistan." />
                  <PayOption checked={paymentMethod === "stripe"} onChange={() => setPaymentMethod("stripe")} title="Card payment (coming soon)" desc="Secure card payments will be enabled once Stripe is connected." disabled />
                </div>
              </Section>

              <Section title="Order notes (optional)">
                <textarea className="input min-h-[80px]" placeholder="Any special instructions" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Section>
            </div>

            <aside className="lg:sticky lg:top-[100px] h-fit border border-border p-6 space-y-6">
              <h2 className="eyebrow">Order summary</h2>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {items.map((i) => (
                  <div key={i.id} className="flex gap-3">
                    <img src={i.image} alt={i.name} className="w-16 h-20 object-cover" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium leading-tight">{i.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">Size {i.size} · Qty {i.quantity}</div>
                    </div>
                    <div className="text-sm">{formatPKR(i.price * i.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <Row k="Subtotal" v={formatPKR(subtotal)} />
                <Row k="Shipping" v={shipping === 0 ? "Free" : formatPKR(shipping)} />
                <div className="border-t border-border pt-2"><Row k="Total" v={formatPKR(total)} bold /></div>
              </div>
              <button type="submit" disabled={submitting} className="w-full h-12 bg-black text-white eyebrow disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <Lock size={14} /> {submitting ? "Placing order…" : "Place order"}
              </button>
              <div className="text-[11px] text-muted-foreground flex items-start gap-2"><Truck size={12} className="mt-0.5" /> Free shipping over PKR 10,000. Delivery in 3–5 business days across Pakistan.</div>
            </aside>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-[24px] leading-none">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}
function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-medium text-base" : ""}`}><span>{k}</span><span>{v}</span></div>;
}
function PayOption({ checked, onChange, title, desc, disabled }: { checked: boolean; onChange: () => void; title: string; desc: string; disabled?: boolean }) {
  return (
    <label className={`flex gap-3 border p-4 cursor-pointer ${checked ? "border-black" : "border-border"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input type="radio" checked={checked} onChange={onChange} disabled={disabled} className="mt-1" />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </div>
    </label>
  );
}

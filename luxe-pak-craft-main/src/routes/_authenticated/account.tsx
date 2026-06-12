import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LogOut, Package, MapPin, User as UserIcon, Heart } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — LUXE" }] }),
  component: AccountPage,
});

type Tab = "overview" | "orders" | "addresses" | "profile";

function AccountPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState<Tab>("overview");

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const orders = useQuery({
    queryKey: ["orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, currency, created_at, order_items(product_name, quantity)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addresses = useQuery({
    queryKey: ["addresses", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/" });
  }

  const displayName = profile.data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";

  return (
    <div className="bg-white text-black min-h-screen flex flex-col">
      <Toaster richColors position="top-center" />
      <Header />
      <main className="pt-[72px] flex-1">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="eyebrow text-muted-foreground">My Account</p>
            <h1 className="font-display text-[40px] lg:text-[56px] font-light mt-2">Hello, {displayName}.</h1>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
            <aside className="space-y-1">
              <NavBtn icon={<UserIcon size={16} />} label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
              <NavBtn icon={<Package size={16} />} label={`Orders (${orders.data?.length ?? 0})`} active={tab === "orders"} onClick={() => setTab("orders")} />
              <NavBtn icon={<MapPin size={16} />} label="Addresses" active={tab === "addresses"} onClick={() => setTab("addresses")} />
              <NavBtn icon={<UserIcon size={16} />} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
              <Link to="/wishlist" className="w-full text-left px-3 py-3 text-sm flex items-center gap-3 hover:bg-surface transition-colors">
                <Heart size={16} /> Wishlist
              </Link>
              <button onClick={signOut} className="mt-6 w-full text-left px-3 py-3 text-sm flex items-center gap-3 hover:bg-surface transition-colors text-muted-foreground">
                <LogOut size={16} /> Sign out
              </button>
            </aside>

            <section>
              {tab === "overview" && <Overview email={user.email!} orders={orders.data ?? []} />}
              {tab === "orders" && <Orders data={orders.data ?? []} loading={orders.isLoading} />}
              {tab === "addresses" && <Addresses data={addresses.data ?? []} userId={user.id} onChange={() => addresses.refetch()} />}
              {tab === "profile" && (
                <ProfileEditor
                  userId={user.id}
                  initial={{ full_name: profile.data?.full_name ?? "", phone: profile.data?.phone ?? "" }}
                  onSaved={() => profile.refetch()}
                />
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 text-sm flex items-center gap-3 transition-colors ${active ? "bg-black text-white" : "hover:bg-surface"}`}
    >
      {icon} {label}
    </button>
  );
}

function Overview({ email, orders }: { email: string; orders: any[] }) {
  const recent = orders.slice(0, 3);
  return (
    <div className="space-y-10">
      <div className="border border-border p-6">
        <p className="eyebrow text-muted-foreground">Account email</p>
        <p className="mt-2 text-base">{email}</p>
      </div>
      <div>
        <h2 className="font-display text-2xl mb-4">Recent orders</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet. <Link to="/shop" className="underline underline-offset-4 text-black">Start shopping</Link>.</p>
        ) : (
          <div className="space-y-3">
            {recent.map((o) => <OrderRow key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Orders({ data, loading }: { data: any[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (data.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <p className="font-display text-2xl">No orders yet.</p>
        <Link to="/shop" className="mt-4 inline-block eyebrow underline underline-offset-4">Browse the collection</Link>
      </div>
    );
  }
  return <div className="space-y-3">{data.map((o) => <OrderRow key={o.id} order={o} />)}</div>;
}

function OrderRow({ order }: { order: any }) {
  const items = order.order_items ?? [];
  return (
    <div className="border border-border p-5 flex items-center justify-between gap-4">
      <div>
        <p className="eyebrow text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
        <p className="font-medium mt-1">#{order.order_number}</p>
        <p className="text-xs text-muted-foreground mt-1">{items.length} item{items.length === 1 ? "" : "s"}</p>
      </div>
      <div className="text-right">
        <span className="eyebrow px-2 py-1 bg-surface">{order.status}</span>
        <p className="mt-2 font-medium">{formatPKR(Number(order.total))}</p>
      </div>
    </div>
  );
}

function Addresses({ data, userId, onChange }: { data: any[]; userId: string; onChange: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "",
    city: "", province: "", postal_code: "", country: "Pakistan", is_default: false,
  });
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("addresses").insert({ ...form, user_id: userId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Address saved.");
    setShowForm(false);
    setForm({ full_name: "", phone: "", address_line1: "", address_line2: "", city: "", province: "", postal_code: "", country: "Pakistan", is_default: false });
    onChange();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Address removed.");
    onChange();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Saved addresses</h2>
        <button onClick={() => setShowForm((s) => !s)} className="eyebrow underline underline-offset-4">
          {showForm ? "Cancel" : "+ Add address"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="border border-border p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Address line 1" value={form.address_line1} onChange={(v) => setForm({ ...form, address_line1: v })} className="md:col-span-2" />
          <Field label="Address line 2" value={form.address_line2} onChange={(v) => setForm({ ...form, address_line2: v })} required={false} className="md:col-span-2" />
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Province" value={form.province} onChange={(v) => setForm({ ...form, province: v })} />
          <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Set as default
          </label>
          <button disabled={busy} className="md:col-span-2 h-11 bg-black text-white eyebrow disabled:opacity-50">
            {busy ? "Saving…" : "Save address"}
          </button>
        </form>
      )}

      {data.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((a) => (
          <div key={a.id} className="border border-border p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">{a.full_name}</p>
              {a.is_default && <span className="eyebrow text-[10px] bg-black text-white px-2 py-0.5">DEFAULT</span>}
            </div>
            <p className="text-sm mt-2 text-muted-foreground">{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ""}</p>
            <p className="text-sm text-muted-foreground">{a.city}, {a.province} {a.postal_code}</p>
            <p className="text-sm text-muted-foreground">{a.country}</p>
            <p className="text-sm text-muted-foreground mt-2">{a.phone}</p>
            <button onClick={() => remove(a.id)} className="mt-4 eyebrow text-[10px] text-muted-foreground underline underline-offset-4">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required = true, className = "" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow text-[10px] text-muted-foreground">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 px-3 border border-border bg-white text-sm focus:outline-none focus:border-black"
      />
    </label>
  );
}

function ProfileEditor({ userId, initial, onSaved }: { userId: string; initial: { full_name: string; phone: string }; onSaved: () => void }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(initial), [initial.full_name, initial.phone]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", userId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated.");
    onSaved();
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-3">
      <h2 className="font-display text-2xl mb-2">Profile</h2>
      <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
      <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required={false} />
      <button disabled={busy} className="h-11 px-8 bg-black text-white eyebrow disabled:opacity-50">
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingBag, Star, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data, error } = await supabase.rpc("is_admin");
    if (error || !data) {
      throw redirect({ to: "/admin-claim" });
    }
    return { ...context };
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="border-b border-border bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-[22px] tracking-[0.25em] font-semibold">LUXE</Link>
            <span className="eyebrow text-muted-foreground">Admin</span>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-black flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to store
          </Link>
        </div>
      </header>
      <div className="flex-1 mx-auto max-w-[1440px] w-full px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <aside className="flex lg:flex-col gap-1 overflow-x-auto">
          <NavItem to="/admin" icon={<LayoutDashboard size={16} />} label="Overview" exact />
          <NavItem to="/admin/products" icon={<Package size={16} />} label="Products" />
          <NavItem to="/admin/orders" icon={<ShoppingBag size={16} />} label="Orders" />
          <NavItem to="/admin/reviews" icon={<Star size={16} />} label="Reviews" />
        </aside>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, exact }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to as any}
      activeOptions={{ exact }}
      className="px-3 py-2 text-sm flex items-center gap-2 border-l-2 border-transparent text-muted-foreground hover:text-black aria-[current=page]:text-black aria-[current=page]:border-black"
    >
      {icon} {label}
    </Link>
  );
}

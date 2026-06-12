import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, Search, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState as useReactState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useReactState<any>(null);
  const cartCount = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const navLinks = [
    { to: "/shop", label: "Shop" },
    { to: "/category/Women", label: "Women" },
    { to: "/category/Men", label: "Men" },
    { to: "/about", label: "About" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
      <nav className="mx-auto max-w-[1440px] h-[72px] px-6 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-[24px] font-medium tracking-tight">
          LUXE
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm hover:opacity-70 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 hover:opacity-70"
          >
            <Search size={20} />
          </button>
          <Link to={user ? "/account" : "/auth"} className="p-2 hover:opacity-70 hidden lg:block">
            <User size={20} />
          </Link>
          <Link to="/checkout" className="p-2 hover:opacity-70 relative">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 hover:opacity-70"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-base hover:opacity-70"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={user ? "/account" : "/auth"}
              className="text-base hover:opacity-70"
              onClick={() => setMobileOpen(false)}
            >
              {user ? "Account" : "Sign In"}
            </Link>
          </div>
        </div>
      )}

      {/* Search */}
      {searchOpen && (
        <div className="border-t border-border bg-white p-4">
          <form>
            <input
              type="search"
              placeholder="Search products..."
              className="w-full border border-border rounded-[4px] px-4 py-3 text-sm focus:outline-none focus:border-black"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}

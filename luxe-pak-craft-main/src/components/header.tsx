import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCart, selectCartCount } from "@/lib/cart-store";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { label: "SHOP", to: "/shop" },
  { label: "CLOTHING", to: "/category/clothing" },
  { label: "SHOES", to: "/category/shoes" },
  { label: "ACCESSORIES", to: "/category/accessories" },
];

export function Header({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCart(selectCartCount);
  const openCart = useCart((s) => s.open);
  const { user } = useAuth();
  const accountHref = (user ? "/account" : "/auth") as "/account" | "/auth";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !transparent || scrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          solid ? "bg-white text-black border-b border-border" : "bg-transparent text-white"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 h-[72px] grid grid-cols-3 items-center">
          {/* left nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="nav-link eyebrow">
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            className="lg:hidden justify-self-start"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* logo */}
          <Link to="/" className="justify-self-center font-display text-[28px] font-semibold tracking-[0.25em] leading-none">
            LUXE
          </Link>

          {/* right icons */}
          <div className="justify-self-end flex items-center gap-5">
            <Link to="/search" aria-label="Search"><Search size={20} strokeWidth={1.25} /></Link>
            <Link to={accountHref} aria-label="Account" className="hidden sm:inline"><User size={20} strokeWidth={1.25} /></Link>
            <Link to="/wishlist" aria-label="Wishlist" className="hidden sm:inline"><Heart size={20} strokeWidth={1.25} /></Link>
            <button onClick={openCart} aria-label="Cart" className="relative">
              <ShoppingBag size={20} strokeWidth={1.25} />
              {cartCount > 0 && (
                <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-medium rounded-full ${solid ? "bg-black text-white" : "bg-white text-black"}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black text-white flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-[72px]">
              <span className="font-display text-[28px] tracking-[0.25em] font-semibold">LUXE</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close"><X size={24} /></button>
            </div>
            <nav className="flex-1 flex flex-col items-center justify-center gap-8">
              {NAV.map((n, i) => (
                <motion.div
                  key={n.to}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.1, duration: 0.4 }}
                >
                  <Link to={n.to} onClick={() => setMobileOpen(false)} className="font-display text-[40px]">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="px-6 pb-8 flex items-center justify-center gap-8 eyebrow">
              <Link to={accountHref} onClick={() => setMobileOpen(false)}>{user ? "Account" : "Sign in"}</Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)}>Wishlist</Link>
              <Link to="/search" onClick={() => setMobileOpen(false)}>Search</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

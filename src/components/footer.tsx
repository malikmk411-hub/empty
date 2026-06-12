import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="font-display text-[24px] font-medium">
              LUXE
            </Link>
            <p className="text-sm text-white/60 mt-4 max-w-xs">
              Pakistani luxury fashion - handcrafted with passion, designed for elegance.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="eyebrow text-white/60 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:opacity-70">All Products</Link></li>
              <li><Link to="/category/Women" className="hover:opacity-70">Women</Link></li>
              <li><Link to="/category/Men" className="hover:opacity-70">Men</Link></li>
              <li><Link to="/shop?new=true" className="hover:opacity-70">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="eyebrow text-white/60 mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:opacity-70">About Us</Link></li>
              <li><span className="text-white/40">Contact</span></li>
              <li><span className="text-white/40">Shipping</span></li>
              <li><span className="text-white/40">Returns</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="eyebrow text-white/60 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-white/40">Privacy Policy</span></li>
              <li><span className="text-white/40">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-white/40">
          <p>© 2026 LUXE. All rights reserved. Made in Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 grid grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <div className="font-display text-[28px] tracking-[0.25em] font-semibold mb-4">LUXE</div>
          <p className="text-sm text-white/60 leading-relaxed max-w-[260px]">
            Pakistani heritage meets global luxury. Hand-crafted, considered, and built to last.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-6">Shop</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/category/$category" params={{ category: "clothing" }} className="hover:text-white">Clothing</Link></li>
            <li><Link to="/category/$category" params={{ category: "shoes" }} className="hover:text-white">Shoes</Link></li>
            <li><Link to="/category/$category" params={{ category: "accessories" }} className="hover:text-white">Accessories</Link></li>
            <li><Link to="/shop" className="hover:text-white">All</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-6">Account</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/account" className="hover:text-white">My Account</Link></li>
            <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
            <li><Link to="/about" className="hover:text-white">About</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-6">Contact</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li>care@luxe.pk</li>
            <li>+92 21 1234 5678</li>
            <li>Karachi · Lahore · Islamabad</li>
            <li className="flex gap-4 pt-2">
              <a className="hover:text-white" href="#">Instagram</a>
              <a className="hover:text-white" href="#">Facebook</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <span>© {new Date().getFullYear()} LUXE. All rights reserved.</span>
          <span>Made in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}

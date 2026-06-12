import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/products";
import { formatPKR } from "@/lib/currency";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const toggleWish = useWishlist((s) => s.toggle);
  const inWish = useWishlist((s) => s.ids.includes(product.id));
  const add = useCart((s) => s.add);

  const secondImg = product.images[1] ?? product.images[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: "easeOut" }}
      className="group"
    >
      <div className="relative img-zoom aspect-[3/4] bg-surface">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0" loading="lazy" />
          <img src={secondImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" loading="lazy" />
        </Link>

        <button
          onClick={(e) => { e.preventDefault(); toggleWish(product.id); }}
          aria-label="Wishlist"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <Heart size={16} strokeWidth={1.5} fill={inWish ? "#000" : "none"} color="#000" />
        </button>

        {product.isNew && (
          <span className="absolute top-3 left-3 eyebrow bg-black text-white px-2 py-1 z-10">NEW</span>
        )}

        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute top-10 left-3 eyebrow bg-red-600 text-white px-2 py-1 z-10">
            {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
          </span>
        )}

        {product.variants.every((v) => v.stock === 0) && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="eyebrow bg-white text-black px-4 py-2 border border-black tracking-widest font-bold">SOLD OUT</span>
          </div>
        )}

        <button
          onClick={(e) => { e.preventDefault(); add(product, product.variants[0].size); }}
          disabled={product.variants.every((v) => v.stock === 0)}
          className="absolute bottom-0 left-0 right-0 h-11 bg-black text-white eyebrow translate-y-full group-hover:translate-y-0 transition-transform duration-400 z-10 disabled:opacity-50"
        >
          {product.variants.every((v) => v.stock === 0) ? "Notify Me" : "Quick Add"}
        </button>
      </div>

      <Link to="/product/$slug" params={{ slug: product.slug }} className="block mt-4">
        <h3 className="font-display text-base leading-tight">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-medium">{formatPKR(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPKR(product.compareAtPrice)}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

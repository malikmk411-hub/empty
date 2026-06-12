import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Minus, Plus, Truck, RotateCcw, Shield } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { getProduct, getRelatedProducts } from "@/lib/products";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/product/$slug")({
  beforeLoad: ({ params }) => {
    if (!getProduct(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) return { meta: [{ title: "Product — LUXE" }] };
    return {
      meta: [
        { title: `${p.name} — LUXE` },
        { name: "description", content: p.description.slice(0, 155) },
        { property: "og:title", content: `${p.name} — LUXE` },
        { property: "og:description", content: p.description.slice(0, 155) },
        { property: "og:image", content: p.images[0] },
        { name: "twitter:image", content: p.images[0] },
      ],
    };
  },
  component: ProductPage,
  errorComponent: () => <div className="p-24 text-center">Something went wrong.</div>,
  notFoundComponent: () => <div className="p-24 text-center">Product not found.</div>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = getProduct(slug)!;
  const related = getRelatedProducts(slug);

  const [size, setSize] = useState(product.variants[0].size);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [open, setOpen] = useState<string | null>("details");

  const add = useCart((s) => s.add);
  const inWish = useWishlist((s) => s.ids.includes(product.id));
  const toggleWish = useWishlist((s) => s.toggle);

  return (
    <div className="bg-white text-black">
      <Header />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8 lg:py-12">
          <nav className="eyebrow text-muted-foreground mb-8">
            <Link to="/">Home</Link> / <Link to="/category/$category" params={{ category: product.category }}>{product.category}</Link> / <span>{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-16">
            {/* Gallery */}
            <div className="flex gap-3 min-w-0">
              <div className="hidden lg:flex flex-col gap-3 w-20 shrink-0">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-[3/4] bg-surface border ${i === activeImg ? "border-black" : "border-transparent"}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              <motion.div
                key={activeImg}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                className="flex-1 min-w-0 aspect-[3/4] bg-surface"
              >
                <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              </motion.div>
            </div>

            {/* Info */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <span className="eyebrow text-muted-foreground">{product.subcategory}</span>
              <h1 className="font-display text-[32px] lg:text-[40px] font-light leading-tight mt-2">{product.name}</h1>
              <div className="mt-4 text-xl font-medium">{formatPKR(product.price)}</div>

              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow">Size</span>
                  <button className="text-xs underline underline-offset-4">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.size}
                      onClick={() => setSize(v.size)}
                      disabled={v.stock === 0}
                      className={`h-11 min-w-[52px] px-3 border rounded-[4px] text-sm transition-colors ${
                        size === v.size ? "bg-black text-white border-black" : "bg-white border-border hover:border-black"
                      } ${v.stock === 0 ? "opacity-40 line-through" : ""}`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <span className="eyebrow block mb-3">Quantity</span>
                <div className="inline-flex items-center border">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center"><Minus size={14} /></button>
                  <span className="w-10 text-center">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 flex items-center justify-center"><Plus size={14} /></button>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => add(product, size, qty)}
                  className="w-full h-11 bg-black text-white eyebrow rounded-[4px] hover:opacity-90 transition-opacity"
                >
                  Add To Cart
                </button>
                <button className="w-full h-11 bg-white text-black border border-black eyebrow rounded-[4px] hover:bg-black hover:text-white transition-colors">
                  Buy Now
                </button>
                <button
                  onClick={() => toggleWish(product.id)}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 text-sm hover:underline underline-offset-4"
                >
                  <Heart size={16} fill={inWish ? "#000" : "none"} /> {inWish ? "In wishlist" : "Add to wishlist"}
                </button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><Truck size={18} /> Free over ₨10,000</div>
                <div className="flex flex-col items-center gap-2"><RotateCcw size={18} /> 14-day returns</div>
                <div className="flex flex-col items-center gap-2"><Shield size={18} /> Made in Pakistan</div>
              </div>

              <div className="mt-10 border-t">
                {[
                  { id: "details", label: "Product Details", body: product.fabricDetails },
                  { id: "size", label: "Size Guide", body: "Refer to our size chart. We recommend sizing up for a relaxed silhouette." },
                  { id: "ship", label: "Shipping & Returns", body: "Standard 3-5 days ₨250 · Express 1-2 days ₨500 · Free over ₨10,000. Returns within 14 days, unworn." },
                  { id: "care", label: "Care Instructions", body: product.careInstructions },
                ].map((acc) => (
                  <div key={acc.id} className="border-b">
                    <button
                      onClick={() => setOpen(open === acc.id ? null : acc.id)}
                      className="w-full flex items-center justify-between py-5 eyebrow"
                    >
                      {acc.label}
                      <span>{open === acc.id ? "−" : "+"}</span>
                    </button>
                    {open === acc.id && (
                      <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{acc.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-24 lg:mt-32">
              <h2 className="font-display text-[28px] lg:text-[36px] mb-10">You may also like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Minus, Plus, Truck, RotateCcw, Shield, ZoomIn, X } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { getProduct, getRelatedProducts } from "@/lib/products";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { motion, AnimatePresence } from "framer-motion";
import { ImageLightbox, ImageZoomLens } from "@/components/image-lightbox";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const add = useCart((s) => s.add);
  const inWish = useWishlist((s) => s.ids.includes(product.id));
  const toggleWish = useWishlist((s) => s.toggle);

  // Calculate discount percentage
  const discountPercentage = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Get selected variant stock
  const selectedVariant = product.variants.find((v) => v.size === size);
  const availableStock = selectedVariant?.stock ?? 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;
  const isSoldOut = availableStock === 0;
  const isAllSoldOut = product.variants.every((v) => v.stock === 0);

  return (
    <div className="bg-white text-black">
      <Header />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8 lg:py-12">
          <nav className="eyebrow text-muted-foreground mb-8">
            <Link to="/">Home</Link> /{" "}
            <Link to="/category/$category" params={{ category: product.category }}>
              {product.category}
            </Link>{" "}
            / <span>{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-16">
            {/* Gallery */}
            <div className="flex gap-3 min-w-0">
              <div className="hidden lg:flex flex-col gap-3 w-20 shrink-0">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-[3/4] bg-surface border transition-all ${
                      i === activeImg ? "border-black" : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              <motion.div
                key={activeImg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative flex-1 min-w-0 bg-surface"
              >
                <div
                  className="relative w-full h-full cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                >
                  {/* Fixed image container with proper aspect ratio */}
                  <div className="relative w-full aspect-[3/4] lg:aspect-[3/4] max-h-[calc(100vh-200px)] overflow-hidden">
                    <ImageZoomLens
                      src={product.images[activeImg]}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full"
                    />
                    {/* Zoom indicator */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 text-xs flex items-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
                      <ZoomIn size={14} />
                      Click to zoom
                    </div>
                  </div>
                </div>

                {/* New / Sale badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="eyebrow bg-black text-white px-3 py-1 text-[10px]">NEW</span>
                  )}
                  {discountPercentage > 0 && (
                    <span className="eyebrow bg-white text-black px-3 py-1 text-[10px] border border-black">
                      {discountPercentage}% OFF
                    </span>
                  )}
                  {isAllSoldOut && (
                    <span className="eyebrow bg-white text-black px-3 py-1 text-[10px] border border-black">
                      SOLD OUT
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Mobile thumbnails */}
              <div className="lg:hidden flex gap-2 mt-3 overflow-x-auto pb-2">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-20 bg-surface border ${
                      i === activeImg ? "border-black" : "border-transparent"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <span className="eyebrow text-muted-foreground">{product.subcategory}</span>
              <h1 className="font-display text-[32px] lg:text-[40px] font-light leading-tight mt-2">
                {product.name}
              </h1>

              {/* Price with sale */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-xl font-medium">{formatPKR(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPKR(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Stock status */}
              {isLowStock && !isSoldOut && (
                <p className="mt-3 text-xs text-orange-600 font-medium">
                  Only {availableStock} left in stock
                </p>
              )}
              {isSoldOut && !isAllSoldOut && (
                <p className="mt-3 text-xs text-muted-foreground">Size {size} is sold out</p>
              )}
              {isAllSoldOut && (
                <p className="mt-3 text-xs text-muted-foreground">This product is currently unavailable</p>
              )}

              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

              {/* Size selector */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow">Size</span>
                  <button className="text-xs underline underline-offset-4 text-muted-foreground hover:text-black">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.size}
                      onClick={() => setSize(v.size)}
                      disabled={v.stock === 0}
                      className={`h-11 min-w-[52px] px-3 border rounded-[4px] text-sm transition-colors ${
                        size === v.size
                          ? "bg-black text-white border-black"
                          : "bg-white border-border hover:border-black"
                      } ${v.stock === 0 ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="mt-6">
                <span className="eyebrow block mb-3">Quantity</span>
                <div className="inline-flex items-center border">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-surface transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(availableStock || 20, q + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-surface transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Add to cart buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => add(product, size, qty)}
                  disabled={isSoldOut}
                  className="w-full h-11 bg-black text-white eyebrow rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSoldOut ? "Out of Stock" : "Add To Cart"}
                </button>
                <button
                  disabled={isSoldOut}
                  className="w-full h-11 bg-white text-black border border-black eyebrow rounded-[4px] hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => toggleWish(product.id)}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 text-sm hover:underline underline-offset-4"
                >
                  <Heart size={16} fill={inWish ? "#000" : "none"} />
                  {inWish ? "In wishlist" : "Add to wishlist"}
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Truck size={18} />
                  <span>Free over Rs10,000</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <RotateCcw size={18} />
                  <span>14-day returns</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Shield size={18} />
                  <span>Made in Pakistan</span>
                </div>
              </div>

              {/* Accordion details */}
              <div className="mt-10 border-t">
                {[
                  {
                    id: "details",
                    label: "Product Details",
                    body: product.fabricDetails,
                  },
                  {
                    id: "size",
                    label: "Size Guide",
                    body:
                      "Refer to our size chart. We recommend sizing up for a relaxed silhouette. For specific measurements, please contact our customer service team.",
                  },
                  {
                    id: "ship",
                    label: "Shipping & Returns",
                    body:
                      "Standard 3-5 days Rs350 - Express 1-2 days Rs500 - Free shipping on orders over Rs10,000. Returns accepted within 14 days in original unworn condition.",
                  },
                  {
                    id: "care",
                    label: "Care Instructions",
                    body: product.careInstructions,
                  },
                ].map((acc) => (
                  <div key={acc.id} className="border-b">
                    <button
                      onClick={() => setOpen(open === acc.id ? null : acc.id)}
                      className="w-full flex items-center justify-between py-5 eyebrow"
                    >
                      {acc.label}
                      <span className="text-lg">{open === acc.id ? "−" : "+"}</span>
                    </button>
                    <AnimatePresence>
                      {open === acc.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 text-sm text-muted-foreground leading-relaxed">
                            {acc.body}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <section className="mt-24 lg:mt-32">
              <h2 className="font-display text-[28px] lg:text-[36px] mb-10">You may also like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {related.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      {/* Image lightbox */}
      <ImageLightbox
        images={product.images}
        initialIndex={activeImg}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        product_name={product.name}
      />
    </div>
  );
}

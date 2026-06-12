import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { ArrowRight, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  is_new: boolean;
  is_featured: boolean;
  category_id: string | null;
}

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, price, compare_at_price, images, is_new, is_featured, category_id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-b from-neutral-100 to-white">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 lg:py-32">
          <div className="max-w-2xl">
            <span className="eyebrow text-muted-foreground">Pakistani Luxury Craftsmanship</span>
            <h1 className="font-display text-[48px] lg:text-[72px] font-light leading-[1.1] mt-4">
              Timeless Elegance, Modern Silhouettes
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-lg">
              Discover our curated collection of handcrafted luxury fashion, made in Pakistan with the finest materials.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-8 bg-black text-white px-8 py-4 rounded-[4px] hover:opacity-90 transition-opacity"
            >
              <span className="eyebrow">Shop Collection</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-surface">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="eyebrow text-muted-foreground">New Arrivals</span>
              <h2 className="font-display text-[32px] lg:text-[40px] mt-2">Featured Collection</h2>
            </div>
            <Link to="/shop" className="text-sm underline underline-offset-4 hover:opacity-70">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-neutral-200 animate-pulse rounded" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground">No products available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  className="group"
                >
                  <div className="relative aspect-[3/4] bg-surface overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-200" />
                    )}
                    {product.is_new && (
                      <span className="absolute top-3 left-3 eyebrow bg-black text-white px-3 py-1 text-[10px]">
                        NEW
                      </span>
                    )}
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="absolute top-3 right-3 eyebrow bg-white text-black px-3 py-1 text-[10px] border border-black">
                        SALE
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium truncate">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm">{formatPKR(product.price)}</span>
                      {product.compare_at_price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPKR(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="aspect-square bg-neutral-100 rounded" />
            <div>
              <span className="eyebrow text-muted-foreground">About LUXE</span>
              <h2 className="font-display text-[32px] lg:text-[40px] mt-4">
                Crafted with Purpose
              </h2>
              <p className="text-muted-foreground leading-relaxed mt-6">
                LUXE represents the pinnacle of Pakistani luxury fashion. Each piece is meticulously crafted by skilled artisans, combining traditional techniques with contemporary design.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 mt-8 text-sm underline underline-offset-4 hover:opacity-70"
              >
                Learn More
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

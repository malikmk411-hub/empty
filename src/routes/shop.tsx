import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
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
  total_stock: number;
}

function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, price, compare_at_price, images, is_new, is_featured, total_stock")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white pt-[72px]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="font-display text-[32px] lg:text-[40px] mb-8">Shop All</h1>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-200 animate-pulse rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">No products available.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for new arrivals!
            </p>
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
                  {product.total_stock === 0 && (
                    <span className="absolute top-3 right-3 eyebrow bg-white text-black px-3 py-1 text-[10px] border border-black">
                      SOLD OUT
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
    </div>
  );
}

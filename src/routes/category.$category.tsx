import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/category/$category")({
  component: CategoryPage,
});

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  is_new: boolean;
  total_stock: number;
}

function CategoryPage() {
  const { category } = Route.useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [category]);

  async function loadProducts() {
    setLoading(true);
    try {
      // Get category ID
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();

      let query = supabase
        .from("products")
        .select("id, slug, name, price, compare_at_price, images, is_new, total_stock")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (categoryData?.id) {
        query = query.eq("category_id", categoryData.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="bg-white pt-[72px]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="font-display text-[32px] lg:text-[40px] mb-8">{categoryTitle}</h1>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-200 animate-pulse rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">No products in this category yet.</p>
            <Link to="/shop" className="text-sm underline mt-4 inline-block">
              View all products
            </Link>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-store";
import { Heart, Minus, Plus, Truck, RotateCcw, Shield } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  fabric_details: string | null;
  care_instructions: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  is_new: boolean;
  is_limited_edition: boolean;
  total_stock: number;
}

interface Variant {
  id: string;
  size: string;
  stock: number;
}

function ProductPage() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const addToCart = useCart((s) => s.add);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (productError || !productData) {
        setLoading(false);
        return;
      }

      const { data: variantData } = await supabase
        .from("product_variants")
        .select("id, size, stock")
        .eq("product_id", productData.id);

      setProduct(productData);
      setVariants(variantData || []);
      if (variantData?.length) {
        setSize(variantData[0].size);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-neutral-200 animate-pulse rounded" />
            <div className="space-y-4">
              <div className="h-8 bg-neutral-200 animate-pulse rounded w-3/4" />
              <div className="h-6 bg-neutral-200 animate-pulse rounded w-1/4" />
              <div className="h-24 bg-neutral-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 text-center">
          <h1 className="text-2xl font-medium">Product not found</h1>
          <Link to="/shop" className="text-sm underline mt-4 inline-block">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariant = variants.find((v) => v.size === size);
  const availableStock = selectedVariant?.stock ?? 0;
  const isSoldOut = variants.length > 0 && !variants.some((v) => v.stock > 0);

  const discountPercentage =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100
        )
      : 0;

  return (
    <div className="bg-white pt-[72px]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8 lg:py-12">
        <nav className="eyebrow text-muted-foreground mb-8">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> /{" "}
          <span>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="flex gap-3">
            <div className="hidden lg:flex flex-col gap-3 w-20 shrink-0">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-[3/4] bg-surface border transition-all ${
                    i === activeImg ? "border-black" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="relative flex-1 aspect-[3/4] bg-surface">
              {product.images?.[activeImg] ? (
                <img
                  src={product.images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.is_new && (
                  <span className="eyebrow bg-black text-white px-3 py-1 text-[10px]">NEW</span>
                )}
                {discountPercentage > 0 && (
                  <span className="eyebrow bg-white text-black px-3 py-1 text-[10px] border border-black">
                    {discountPercentage}% OFF
                  </span>
                )}
                {isSoldOut && (
                  <span className="eyebrow bg-white text-black px-3 py-1 text-[10px] border border-black">
                    SOLD OUT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {product.subtitle && (
              <span className="eyebrow text-muted-foreground">{product.subtitle}</span>
            )}
            <h1 className="font-display text-[32px] lg:text-[40px] font-light leading-tight mt-2">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-xl font-medium">{formatPKR(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPKR(product.compare_at_price)}
                </span>
              )}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Size selector */}
            {variants.length > 0 && (
              <div className="mt-8">
                <span className="eyebrow block mb-3">Size</span>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
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
            )}

            {/* Quantity */}
            <div className="mt-6">
              <span className="eyebrow block mb-3">Quantity</span>
              <div className="inline-flex items-center border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(availableStock || 20, q + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => addToCart(product, size, qty)}
                disabled={isSoldOut || (variants.length > 0 && availableStock === 0)}
                className="w-full h-11 bg-black text-white eyebrow rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSoldOut || (variants.length > 0 && availableStock === 0)
                  ? "Out of Stock"
                  : "Add To Cart"}
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

            {/* Details */}
            {(product.fabric_details || product.care_instructions) && (
              <div className="mt-10 border-t">
                {product.fabric_details && (
                  <div className="border-b py-5">
                    <span className="eyebrow">Fabric Details</span>
                    <p className="mt-2 text-sm text-muted-foreground">{product.fabric_details}</p>
                  </div>
                )}
                {product.care_instructions && (
                  <div className="py-5">
                    <span className="eyebrow">Care Instructions</span>
                    <p className="mt-2 text-sm text-muted-foreground">{product.care_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

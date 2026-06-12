import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import { z } from "zod";
import { useMemo, useState } from "react";

const searchSchema = z.object({
  sort: z.enum(["newest", "best", "low", "high"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop All — LUXE" },
      { name: "description", content: "Browse the full LUXE collection: clothing, footwear, and accessories." },
      { property: "og:title", content: "Shop All — LUXE" },
      { property: "og:description", content: "The full collection." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeSort, setActiveSort] = useState(sort ?? "newest");

  const list = useMemo(() => {
    const arr = [...products];
    if (activeSort === "low") arr.sort((a, b) => a.price - b.price);
    else if (activeSort === "high") arr.sort((a, b) => b.price - a.price);
    else if (activeSort === "best") arr.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    return arr;
  }, [activeSort]);

  return (
    <div className="bg-white text-black">
      <Header />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="eyebrow mb-3 text-muted-foreground">All</p>
              <h1 className="font-display text-[40px] lg:text-[56px] font-light leading-none">The Collection</h1>
            </div>
            <select
              value={activeSort}
              onChange={(e) => {
                const v = e.target.value as "newest" | "best" | "low" | "high";
                setActiveSort(v);
                navigate({ search: { sort: v } });
              }}
              className="h-11 px-4 border border-border bg-white text-sm rounded-[4px]"
            >
              <option value="newest">Newest</option>
              <option value="best">Best Selling</option>
              <option value="low">Price: Low — High</option>
              <option value="high">Price: High — Low</option>
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

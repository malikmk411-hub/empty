import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — LUXE" }, { name: "description", content: "Your saved pieces." }] }),
  component: Wishlist,
});

function Wishlist() {
  const ids = useWishlist((s) => s.ids);
  const list = products.filter((p) => ids.includes(p.id));

  return (
    <div className="bg-white text-black min-h-screen">
      <Header />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
          <h1 className="font-display text-[40px] lg:text-[56px] font-light mb-12">Wishlist</h1>
          {list.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl mb-3">Nothing saved yet.</p>
              <Link to="/shop" className="eyebrow underline underline-offset-4">Browse the collection</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

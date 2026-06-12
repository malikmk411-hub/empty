import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { products } from "@/lib/products";
import { formatPKR } from "@/lib/currency";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — LUXE" }, { name: "description", content: "Search the LUXE collection." }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const results = q.trim().length === 0 ? [] : products.filter((p) =>
    [p.name, p.subcategory, ...p.tags].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="bg-white text-black min-h-screen">
      <Header />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-[900px] px-6 py-16">
          <div className="flex items-center border-b border-black pb-3">
            <SearchIcon size={20} className="mr-3" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What are you looking for?"
              className="flex-1 bg-transparent font-display text-2xl lg:text-3xl focus:outline-none"
            />
          </div>

          {q && results.length === 0 && (
            <p className="mt-12 text-muted-foreground text-sm">No matches. Try “kameez”, “boot”, or “watch”.</p>
          )}

          <div className="mt-10 grid gap-2">
            {results.map((p) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="flex items-center gap-4 p-3 hover:bg-surface"
              >
                <img src={p.images[0]} className="w-16 h-20 object-cover" alt="" />
                <div className="flex-1">
                  <div className="font-display text-lg">{p.name}</div>
                  <div className="text-xs text-muted-foreground eyebrow">{p.subcategory}</div>
                </div>
                <div className="text-sm font-medium">{formatPKR(p.price)}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

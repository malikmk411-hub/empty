import { createFileRoute, notFound } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { getProductsByCategory, type Category } from "@/lib/products";

const VALID: Category[] = ["clothing", "shoes", "accessories"];

export const Route = createFileRoute("/category/$category")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.category as Category)) throw notFound();
  },
  head: ({ params }) => {
    const cat = params.category[0].toUpperCase() + params.category.slice(1);
    return {
      meta: [
        { title: `${cat} — LUXE` },
        { name: "description", content: `Shop ${cat.toLowerCase()} at LUXE — Pakistani luxury fashion.` },
        { property: "og:title", content: `${cat} — LUXE` },
        { property: "og:description", content: `Shop ${cat.toLowerCase()} at LUXE.` },
      ],
    };
  },
  component: CategoryPage,
  errorComponent: () => <div className="p-24 text-center">Something went wrong.</div>,
  notFoundComponent: () => <div className="p-24 text-center">Category not found.</div>,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const list = getProductsByCategory(category as Category);
  const title = category[0].toUpperCase() + category.slice(1);

  return (
    <div className="bg-white text-black">
      <Header />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-16">
          <div className="mb-12">
            <p className="eyebrow mb-3 text-muted-foreground">Category</p>
            <h1 className="font-display text-[40px] lg:text-[64px] font-light leading-none">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{list.length} pieces</p>
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

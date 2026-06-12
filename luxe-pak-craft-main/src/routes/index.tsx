import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { Marquee } from "@/components/marquee";
import { ProductCard } from "@/components/product-card";
import { products, categories, heroImages } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUXE — Pakistani Heritage. Global Luxury." },
      { name: "description", content: "Hand-embroidered shalwar kameez, tailored bandhgalas, leather footwear and accessories. Made in Pakistan." },
      { property: "og:title", content: "LUXE — Pakistani Heritage. Global Luxury." },
      { property: "og:description", content: "Where Pakistani heritage meets global luxury." },
    ],
  }),
  component: Home,
});

function Home() {
  const newArrivals = products.filter((p) => p.isNew || p.isFeatured).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  return (
    <div className="bg-white text-black">
      <Header transparent />
      <main>
        <HeroSlideshow />
        <Marquee />

        {/* Categories */}
        <section className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 lg:py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/category/$category"
                params={{ category: c.slug }}
                className="group relative aspect-[3/4] overflow-hidden block bg-surface"
              >
                <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <h3 className="font-display text-[40px] leading-none">{c.name}</h3>
                  <span className="eyebrow mt-3 border-b border-white pb-1">Explore</span>
                </div>
                <div className="absolute bottom-6 left-6 text-white group-hover:opacity-0 transition-opacity">
                  <h3 className="font-display text-[28px] leading-none">{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="mx-auto max-w-[1440px] px-6 lg:px-12 pb-24 lg:pb-32">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-display text-[36px] lg:text-[48px] font-light">New Arrivals</h2>
            <Link to="/shop" className="eyebrow nav-link">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {newArrivals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>

        {/* Brand statement */}
        <section className="py-32 lg:py-48 px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-display font-light text-[40px] lg:text-[72px] leading-[1.1] max-w-[18ch] mx-auto"
          >
            Where Pakistani Heritage Meets Global Luxury.
          </motion.h2>
        </section>

        {/* Best Sellers */}
        <section className="mx-auto max-w-[1440px] px-6 lg:px-12 pb-24 lg:pb-32">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-display text-[36px] lg:text-[48px] font-light">Best Sellers</h2>
            <Link to="/shop" className="eyebrow nav-link">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {bestSellers.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>

        {/* Editorial banner */}
        <section className="relative h-[80vh] min-h-[560px] overflow-hidden">
          <img src={heroImages.hero1} alt="The new collection" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-6">
            <span className="eyebrow mb-6 opacity-80">FW Collection</span>
            <h2 className="font-display font-light text-[48px] lg:text-[96px] leading-none max-w-[18ch]">The New Collection</h2>
            <Link to="/shop" className="mt-10 h-11 px-8 inline-flex items-center border border-white eyebrow rounded-[4px] hover:bg-white hover:text-black transition-colors">
              Discover
            </Link>
          </div>
        </section>

        {/* As Seen On */}
        <section className="mx-auto max-w-[1440px] px-6 lg:px-12 py-24 lg:py-32">
          <h2 className="font-display text-[36px] lg:text-[48px] font-light text-center mb-12">As Seen On</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {[heroImages.hero1, heroImages.hero2, heroImages.hero3, heroImages.hero1, heroImages.hero2, heroImages.hero3].map((src, i) => (
              <Link key={i} to="/shop" className="group relative aspect-square overflow-hidden bg-surface">
                <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="eyebrow text-white opacity-0 group-hover:opacity-100 transition-opacity">Shop Now</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-surface py-24 lg:py-32 px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display text-[40px] lg:text-[56px] font-light leading-tight">Join the Edit</h2>
            <p className="mt-3 text-sm text-muted-foreground">Be first to know. No noise.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-8 flex">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 h-11 px-4 bg-white border border-border rounded-l-[4px] focus:outline-none focus:border-black text-sm"
              />
              <button className="h-11 px-6 bg-black text-white eyebrow rounded-r-[4px]">Subscribe</button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


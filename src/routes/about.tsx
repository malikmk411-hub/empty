import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="bg-white pt-[72px]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl">
          <span className="eyebrow text-muted-foreground">Our Story</span>
          <h1 className="font-display text-[48px] lg:text-[64px] font-light leading-tight mt-4">
            Crafted with Purpose
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mt-8">
            LUXE was born from a passion for Pakistani craftsmanship and a vision to bring
            contemporary luxury fashion to discerning customers worldwide. Each piece in our
            collection tells a story - of skilled artisans, premium materials, and meticulous
            attention to detail.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed mt-6">
            Based in Karachi, we work with the finest fabrics and traditional techniques,
            reimagined for the modern wardrobe. Our commitment to quality means every stitch,
            every seam, and every detail is carefully considered.
          </p>

          <div className="grid lg:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-8 bg-surface rounded-[4px]">
              <h3 className="font-display text-[24px] mb-2">100%</h3>
              <p className="text-sm text-muted-foreground">Made in Pakistan</p>
            </div>
            <div className="text-center p-8 bg-surface rounded-[4px]">
              <h3 className="font-display text-[24px] mb-2">Premium</h3>
              <p className="text-sm text-muted-foreground">Quality Materials</p>
            </div>
            <div className="text-center p-8 bg-surface rounded-[4px]">
              <h3 className="font-display text-[24px] mb-2">Artisan</h3>
              <p className="text-sm text-muted-foreground">Crafted by Hand</p>
            </div>
          </div>

          <div className="mt-16">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-[4px] hover:opacity-90 transition-opacity"
            >
              <span className="eyebrow">Shop Collection</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

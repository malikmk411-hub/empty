import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { heroImages } from "@/lib/products";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About LUXE — Pakistani Craftsmanship" },
      { name: "description", content: "LUXE is built on a single conviction: that Pakistani craftsmanship belongs on the world stage." },
      { property: "og:title", content: "About LUXE" },
      { property: "og:description", content: "Pakistani craftsmanship meets global luxury standards." },
      { property: "og:image", content: heroImages.hero3 },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="bg-white text-black">
      <Header />
      <main className="pt-[72px]">
        <section className="relative h-[70vh] min-h-[480px]">
          <img src={heroImages.hero3} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative h-full flex items-center justify-center text-white text-center px-6">
            <h1 className="font-display font-light text-[48px] lg:text-[96px] leading-[1.05] max-w-[14ch]">
              Heritage, refined.
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-[680px] px-6 py-24 lg:py-32 space-y-8 text-[17px] leading-[1.7] text-muted-foreground">
          <p>
            LUXE was founded on a single conviction: that Pakistani craftsmanship — the chikankari of Lucknow's
            descendants in Karachi, the zari and gota of Lahore's old quarters, the leatherwork of Sialkot —
            belongs on the world stage, presented with the restraint and precision of the great European houses.
          </p>
          <p>
            Every piece begins with the hand of an artisan and ends with the rigour of a Saint Laurent or COS
            patternmaker. Nothing is decorative. Nothing is loud. The cloth is khaddar, lawn, banarsi silk; the
            silhouettes are clean; the embroidery is heritage held quietly in place.
          </p>
          <p>
            We make in Pakistan, by Pakistanis, for a customer who reads labels carefully.
          </p>
          <p className="font-display text-2xl text-black pt-8">— The LUXE Atelier</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

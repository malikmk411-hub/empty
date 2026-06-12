import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { heroImages } from "@/lib/products";

const SLIDES = [
  { img: heroImages.hero1, headline: "DISCOVER YOUR SIGNATURE STYLE", to: "/category/clothing" },
  { img: heroImages.hero2, headline: "CRAFTED FOR THE DISCERNING STEP", to: "/category/shoes" },
  { img: heroImages.hero3, headline: "WHERE HERITAGE MEETS LUXURY", to: "/category/accessories" },
];

export function HeroSlideshow() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative h-[88vh] min-h-[560px] max-h-[920px] w-full overflow-hidden bg-black text-white">
      <AnimatePresence>
        <motion.img
          key={idx}
          src={SLIDES[idx].img}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
          fetchPriority="high"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative h-full flex flex-col items-center justify-end pb-32 lg:pb-40 px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.h1
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display font-light text-white text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.05] max-w-[18ch]"
          >
            {SLIDES[idx].headline}
          </motion.h1>
        </AnimatePresence>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            to={SLIDES[idx].to}
            className="h-[44px] px-8 inline-flex items-center justify-center bg-black text-white eyebrow rounded-[4px] hover:bg-white hover:text-black transition-colors"
          >
            Shop Collection
          </Link>
          <Link
            to="/shop"
            className="h-[44px] px-8 inline-flex items-center justify-center border border-white text-white eyebrow rounded-[4px] hover:bg-white hover:text-black transition-colors"
          >
            New Arrivals
          </Link>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[6px] rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-white" : "w-[6px] bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

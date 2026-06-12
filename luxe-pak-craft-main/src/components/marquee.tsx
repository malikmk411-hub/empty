const ITEMS = [
  "FREE SHIPPING OVER ₨10,000",
  "NEW COLLECTION AVAILABLE",
  "PREMIUM CRAFTSMANSHIP",
  "MADE IN PAKISTAN",
];

export function Marquee() {
  const row = ITEMS.concat(ITEMS).concat(ITEMS);
  return (
    <div className="bg-black text-white overflow-hidden border-y border-white/10">
      <div className="flex whitespace-nowrap animate-marquee py-3">
        {row.concat(row).map((t, i) => (
          <span key={i} className="eyebrow mx-8 inline-flex items-center gap-8">
            {t}
            <span className="opacity-50">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

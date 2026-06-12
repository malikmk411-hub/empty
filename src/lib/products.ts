export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "38" | "39" | "40" | "41" | "42" | "43" | "44" | "OS";

export type Category = "clothing" | "shoes" | "accessories";

export interface ProductVariant {
  size: Size;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  subcategory: string;
  price: number; // PKR
  compareAtPrice?: number;
  images: string[];
  description: string;
  fabricDetails: string;
  careInstructions: string;
  sku: string;
  tags: string[];
  variants: ProductVariant[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
}

import hero1 from "@/assets/hero-1-clothing.jpg";
import hero2 from "@/assets/hero-2-footwear.jpg";
import hero3 from "@/assets/hero-3-accessories.jpg";

export const heroImages = { hero1, hero2, hero3 };

const clothingSizes: ProductVariant[] = [
  { size: "XS", stock: 5 }, { size: "S", stock: 8 }, { size: "M", stock: 10 },
  { size: "L", stock: 7 }, { size: "XL", stock: 4 }, { size: "XXL", stock: 2 },
];
const shoeSizes: ProductVariant[] = [
  { size: "38", stock: 3 }, { size: "39", stock: 5 }, { size: "40", stock: 6 },
  { size: "41", stock: 6 }, { size: "42", stock: 5 }, { size: "43", stock: 3 }, { size: "44", stock: 2 },
];
const oneSize: ProductVariant[] = [{ size: "OS", stock: 12 }];

export const products: Product[] = [
  {
    id: "p1", slug: "hand-embroidered-lawn-kameez", name: "Hand-Embroidered Lawn Kameez",
    category: "clothing", subcategory: "Shalwar Kameez", price: 8500,
    images: [hero1, hero3, hero1, hero3],
    description: "Crafted from the finest summer lawn, this kameez features intricate chikankari embroidery along the neckline, hem, and sleeves. A heritage silhouette refined for the modern wardrobe.",
    fabricDetails: "100% premium lawn cotton, hand chikankari embroidery, zari accents at hem.",
    careInstructions: "Dry clean only. Iron on low heat from the reverse side.",
    sku: "LUXE-CK-001", tags: ["lawn", "chikankari", "summer", "embroidered"],
    variants: clothingSizes, isFeatured: true, isNew: true,
  },
  {
    id: "p2", slug: "premium-oversized-kurta", name: "Premium Oversized Kurta",
    category: "clothing", subcategory: "Kurtas", price: 4200,
    images: [hero2, hero1, hero2, hero1],
    description: "An effortless oversized cut in soft khaddar. Mandarin collar, dropped shoulders, side slits — pared down to its essentials.",
    fabricDetails: "Pure khaddar cotton, hand-finished seams, horn buttons.",
    careInstructions: "Machine wash cold, gentle cycle. Tumble dry low.",
    sku: "LUXE-KT-002", tags: ["khaddar", "oversized", "minimal"],
    variants: clothingSizes, isBestSeller: true,
  },
  {
    id: "p3", slug: "tailored-black-bandhgala-jacket", name: "Tailored Black Bandhgala Jacket",
    category: "clothing", subcategory: "Formal Wear", price: 18000,
    images: [hero3, hero2, hero3, hero2],
    description: "A structured bandhgala in matte black wool. Five-button placket, welt pockets, fully lined. The cornerstone of any evening wardrobe.",
    fabricDetails: "Wool blend shell, viscose lining, mother of pearl buttons.",
    careInstructions: "Dry clean only.",
    sku: "LUXE-BG-003", tags: ["bandhgala", "formal", "wool"],
    variants: clothingSizes, isFeatured: true, isBestSeller: true,
  },
  {
    id: "p4", slug: "relaxed-linen-shalwar", name: "Relaxed Linen Shalwar",
    category: "clothing", subcategory: "Shalwar Kameez", price: 3800,
    images: [hero1, hero2, hero1, hero2],
    description: "Wide-cut shalwar in breathable Belgian linen. An elevated take on a daily essential.",
    fabricDetails: "100% Belgian linen, elasticated drawstring waist.",
    careInstructions: "Machine wash cold. Air dry.",
    sku: "LUXE-SH-004", tags: ["linen", "relaxed", "summer"],
    variants: clothingSizes,
  },
  {
    id: "p5", slug: "luxury-cotton-hoodie", name: "Luxury Cotton Hoodie",
    category: "clothing", subcategory: "Hoodies", price: 6500,
    images: [hero2, hero3, hero2, hero3],
    description: "Heavyweight loopback cotton, garment-dyed for a lived-in finish. A weekend staple done properly.",
    fabricDetails: "450gsm organic cotton loopback, ribbed cuffs.",
    careInstructions: "Machine wash cold, inside out.",
    sku: "LUXE-HD-005", tags: ["cotton", "loungewear"],
    variants: clothingSizes, isFeatured: true,
  },
  {
    id: "p6", slug: "structured-formal-sherwani", name: "Structured Formal Sherwani",
    category: "clothing", subcategory: "Formal Wear", price: 35000,
    images: [hero3, hero1, hero3, hero1],
    description: "A ceremonial sherwani with banarsi panelling and hand-applied zari. Cut close to the body with a flared skirt.",
    fabricDetails: "Silk-wool shell, banarsi panels, hand zari work, silk lining.",
    careInstructions: "Dry clean only. Store on a wide hanger.",
    sku: "LUXE-SW-006", tags: ["sherwani", "wedding", "banarsi", "zari"],
    variants: clothingSizes, isBestSeller: true,
  },
  {
    id: "p7", slug: "minimal-white-leather-sneaker", name: "Minimal White Leather Sneaker",
    category: "shoes", subcategory: "Sneakers", price: 12000,
    images: [hero2, hero2, hero2, hero2],
    description: "A clean court sneaker in full-grain Italian leather, hand-finished in Sialkot.",
    fabricDetails: "Full-grain leather upper, leather lining, rubber cup sole.",
    careInstructions: "Wipe with damp cloth. Condition leather monthly.",
    sku: "LUXE-SN-007", tags: ["leather", "minimal", "sneaker"],
    variants: shoeSizes, isFeatured: true, isNew: true,
  },
  {
    id: "p8", slug: "premium-chelsea-boot", name: "Premium Chelsea Boot",
    category: "shoes", subcategory: "Chelsea Boots", price: 22000,
    images: [hero2, hero2, hero2, hero2],
    description: "A clean-lined Chelsea in polished calfskin. Elastic side gussets, leather pull tab, Goodyear-welted sole.",
    fabricDetails: "Italian calfskin upper, leather lining, Goodyear-welted leather sole.",
    careInstructions: "Polish regularly. Use shoe trees.",
    sku: "LUXE-CB-008", tags: ["leather", "chelsea", "boot"],
    variants: shoeSizes, isBestSeller: true,
  },
  {
    id: "p9", slug: "handcrafted-khussa", name: "Handcrafted Khussa",
    category: "shoes", subcategory: "Khussas", price: 5500,
    images: [hero1, hero1, hero1, hero1],
    description: "Hand-stitched khussa in vegetable-tanned leather with restrained gota detailing.",
    fabricDetails: "Vegetable-tanned leather, hand stitching, gota lace trim.",
    careInstructions: "Keep dry. Condition occasionally.",
    sku: "LUXE-KH-009", tags: ["khussa", "leather", "gota"],
    variants: shoeSizes,
  },
  {
    id: "p10", slug: "classic-oxford", name: "Classic Oxford",
    category: "shoes", subcategory: "Oxfords", price: 19500,
    images: [hero2, hero2, hero2, hero2],
    description: "A traditional cap-toe oxford with closed lacing. Black box calf, Blake-stitched.",
    fabricDetails: "Box calf leather, leather sole, Blake construction.",
    careInstructions: "Polish weekly. Rotate pairs.",
    sku: "LUXE-OX-010", tags: ["oxford", "formal", "leather"],
    variants: shoeSizes,
  },
  {
    id: "p11", slug: "athletic-runner", name: "Athletic Runner",
    category: "shoes", subcategory: "Running", price: 9800,
    images: [hero2, hero2, hero2, hero2],
    description: "A pared-down runner with engineered mesh upper and responsive foam midsole.",
    fabricDetails: "Engineered mesh, EVA midsole, rubber outsole.",
    careInstructions: "Spot clean. Air dry.",
    sku: "LUXE-RN-011", tags: ["running", "athletic"],
    variants: shoeSizes, isNew: true,
  },
  {
    id: "p12", slug: "black-leather-wallet", name: "Black Leather Wallet",
    category: "accessories", subcategory: "Wallets", price: 4500,
    images: [hero3, hero3, hero3, hero3],
    description: "A bifold in saddle-tanned leather. Six card slots, two note compartments, blind-embossed mark.",
    fabricDetails: "Saddle-tanned leather, edge-painted, hand-stitched.",
    careInstructions: "Condition every six months.",
    sku: "LUXE-WL-012", tags: ["leather", "wallet"],
    variants: oneSize,
  },
  {
    id: "p13", slug: "stainless-steel-watch", name: "Stainless Steel Watch",
    category: "accessories", subcategory: "Watches", price: 28000,
    images: [hero3, hero3, hero3, hero3],
    description: "A 39mm dress watch with sunray dial, sapphire crystal, and integrated steel bracelet.",
    fabricDetails: "316L stainless steel, sapphire crystal, Japanese automatic movement.",
    careInstructions: "Service every 3-5 years.",
    sku: "LUXE-WT-013", tags: ["watch", "steel", "automatic"],
    variants: oneSize, isFeatured: true, isBestSeller: true,
  },
  {
    id: "p14", slug: "premium-sunglasses", name: "Premium Sunglasses",
    category: "accessories", subcategory: "Sunglasses", price: 7200,
    images: [hero3, hero3, hero3, hero3],
    description: "An acetate frame with hand-set polarised lenses. Italian-made.",
    fabricDetails: "Mazzucchelli acetate, CR-39 polarised lenses.",
    careInstructions: "Clean with provided microfiber.",
    sku: "LUXE-SG-014", tags: ["sunglasses", "acetate"],
    variants: oneSize, isNew: true,
  },
  {
    id: "p15", slug: "leather-messenger-bag", name: "Leather Messenger Bag",
    category: "accessories", subcategory: "Bags", price: 24000,
    images: [hero3, hero3, hero3, hero3],
    description: "A structured messenger in pull-up leather with brass hardware and a padded laptop sleeve.",
    fabricDetails: "Pull-up leather, brass hardware, cotton canvas lining.",
    careInstructions: "Wipe clean. Condition leather quarterly.",
    sku: "LUXE-MS-015", tags: ["bag", "leather", "messenger"],
    variants: oneSize, isFeatured: true,
  },
  {
    id: "p16", slug: "embroidered-silk-dupatta", name: "Embroidered Silk Dupatta",
    category: "accessories", subcategory: "Dupattas", price: 6800,
    images: [hero1, hero1, hero1, hero1],
    description: "A pure silk dupatta with hand-applied zari border. Drapes weightlessly.",
    fabricDetails: "100% pure silk, hand zari border, finished pallu.",
    careInstructions: "Dry clean only.",
    sku: "LUXE-DP-016", tags: ["dupatta", "silk", "zari"],
    variants: oneSize, isBestSeller: true,
  },
];

export const categories = [
  { slug: "clothing", name: "Clothing", image: hero1, count: products.filter(p => p.category === "clothing").length },
  { slug: "shoes", name: "Shoes", image: hero2, count: products.filter(p => p.category === "shoes").length },
  { slug: "accessories", name: "Accessories", image: hero3, count: products.filter(p => p.category === "accessories").length },
] as const;

export function getProduct(slug: string) {
  return products.find(p => p.slug === slug);
}
export function getProductsByCategory(category: Category) {
  return products.filter(p => p.category === category);
}
export function getRelatedProducts(slug: string, n = 4) {
  const current = getProduct(slug);
  if (!current) return [];
  return products.filter(p => p.category === current.category && p.slug !== slug).slice(0, n);
}

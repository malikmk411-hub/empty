import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit product — Admin" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const [{ data: p, error }, { data: variants }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("product_variants").select("size, stock, sku").eq("product_id", id).order("size"),
      ]);
      if (error) throw error;
      return { ...p, variants: variants ?? [] };
    },
  });

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-sm text-muted-foreground">Not found.</div>;
  const p: any = q.data;
  return (
    <div className="space-y-8">
      <h1 className="font-display text-[40px] leading-none">Edit product</h1>
      <ProductForm
        productId={id}
        initial={{
          name: p.name, slug: p.slug, subtitle: p.subtitle ?? "", description: p.description ?? "",
          category_id: p.category_id, subcategory: p.subcategory ?? "",
          price: Number(p.price), sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
          sku: p.sku ?? "", status: p.status,
          is_featured: p.is_featured, is_new: p.is_new,
          fabric_details: p.fabric_details ?? "", care_instructions: p.care_instructions ?? "",
          tags: p.tags ?? [], images: p.images ?? [],
          variants: (p.variants && p.variants.length) ? p.variants : [{ size: "M", stock: 0 }],
        }}
      />
    </div>
  );
}

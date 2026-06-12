import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/currency";
import { Plus, Edit3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: ProductsList,
});

function ProductsList() {
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, sale_price, status, total_stock, images, is_featured, is_new, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[40px] leading-none">Products</h1>
          <p className="text-sm text-muted-foreground mt-2">{products.data?.length ?? 0} items</p>
        </div>
        <Link to="/admin/products/new" className="h-10 px-5 bg-black text-white eyebrow inline-flex items-center gap-2">
          <Plus size={14} /> New product
        </Link>
      </div>
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left eyebrow text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3"></th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products.data ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-2 w-14">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-12 h-12 object-cover" /> : <div className="w-12 h-12 bg-secondary" />}
                </td>
                <td className="p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.slug}</div>
                </td>
                <td className="p-3">{p.categories?.name ?? "—"}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-secondary text-[10px] uppercase">{p.status}</span></td>
                <td className="p-3 text-right">{p.total_stock}</td>
                <td className="p-3 text-right">
                  {p.sale_price ? (
                    <><span className="line-through text-muted-foreground mr-1">{formatPKR(Number(p.price))}</span>{formatPKR(Number(p.sale_price))}</>
                  ) : formatPKR(Number(p.price))}
                </td>
                <td className="p-3 text-right">
                  <Link to="/admin/products/$id" params={{ id: p.id }} className="text-xs underline inline-flex items-center gap-1"><Edit3 size={12} /> Edit</Link>
                </td>
              </tr>
            ))}
            {products.data?.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground text-sm">No products. Create your first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Upload, Trash2 } from "lucide-react";

interface Variant { size: string; stock: number; sku?: string }
export interface ProductFormValues {
  id?: string;
  name: string; slug: string; subtitle: string; description: string;
  category_id: string | null; subcategory: string;
  price: number; sale_price: number | null;
  sku: string; status: "draft" | "active" | "archived";
  is_featured: boolean; is_new: boolean;
  fabric_details: string; care_instructions: string;
  tags: string[];
  images: string[];
  variants: Variant[];
}

const DEFAULT: ProductFormValues = {
  name: "", slug: "", subtitle: "", description: "",
  category_id: null, subcategory: "",
  price: 0, sale_price: null,
  sku: "", status: "draft",
  is_featured: false, is_new: true,
  fabric_details: "", care_instructions: "",
  tags: [], images: [],
  variants: [{ size: "M", stock: 0 }],
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductForm({ initial, productId }: { initial?: Partial<ProductFormValues>; productId?: string }) {
  const navigate = useNavigate();
  const [v, setV] = useState<ProductFormValues>({ ...DEFAULT, ...initial } as ProductFormValues);
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const cats = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("sort_order")).data ?? [],
  });

  useEffect(() => {
    if (!v.id && !productId) setV((p) => ({ ...p, slug: slugify(p.name) }));
  }, [v.name]);

  async function uploadImage(file: File) {
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000" });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setV((p) => ({ ...p, images: [...p.images, data.publicUrl] }));
    setUploading(false);
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) await uploadImage(f);
  }

  function removeImage(i: number) {
    setV((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  }

  function updateVariant(i: number, patch: Partial<Variant>) {
    setV((p) => ({ ...p, variants: p.variants.map((x, idx) => idx === i ? { ...x, ...patch } : x) }));
  }
  function addVariant() { setV((p) => ({ ...p, variants: [...p.variants, { size: "", stock: 0 }] })); }
  function removeVariant(i: number) { setV((p) => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) })); }

  async function save() {
    if (!v.name || !v.slug || v.price <= 0) { toast.error("Name, slug, price required."); return; }
    setSaving(true);
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const total_stock = v.variants.reduce((s, x) => s + Number(x.stock || 0), 0);
    const payload = {
      name: v.name, slug: v.slug, subtitle: v.subtitle || null, description: v.description,
      category_id: v.category_id, subcategory: v.subcategory || null,
      price: v.price, sale_price: v.sale_price, sku: v.sku || null,
      status: v.status, is_featured: v.is_featured, is_new: v.is_new,
      fabric_details: v.fabric_details || null, care_instructions: v.care_instructions || null,
      tags, images: v.images, total_stock,
    };

    let pid = productId;
    if (pid) {
      const { error } = await supabase.from("products").update(payload).eq("id", pid);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      pid = data.id;
    }

    // sync variants — wipe and reinsert
    await supabase.from("product_variants").delete().eq("product_id", pid);
    if (v.variants.length) {
      const rows = v.variants
        .filter((x) => x.size.trim())
        .map((x) => ({ product_id: pid!, size: x.size, stock: Number(x.stock || 0), sku: x.sku || null }));
      if (rows.length) {
        const { error } = await supabase.from("product_variants").insert(rows);
        if (error) toast.error(error.message);
      }
    }
    setSaving(false);
    toast.success("Product saved.");
    navigate({ to: "/admin/products" });
  }

  async function destroy() {
    if (!productId) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted.");
    navigate({ to: "/admin/products" });
  }

  const salePct = v.sale_price && v.price > 0 ? Math.round((1 - v.sale_price / v.price) * 100) : 0;

  return (
    <div className="space-y-8 max-w-3xl">
      <Section title="Basics">
        <Field label="Name"><input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="Slug"><input className="input" value={v.slug} onChange={(e) => setV({ ...v, slug: slugify(e.target.value) })} /></Field>
        <Field label="Subtitle"><input className="input" value={v.subtitle} onChange={(e) => setV({ ...v, subtitle: e.target.value })} /></Field>
        <Field label="Description"><textarea className="input min-h-[120px]" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={v.category_id ?? ""} onChange={(e) => setV({ ...v, category_id: e.target.value || null })}>
              <option value="">—</option>
              {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subcategory"><input className="input" value={v.subcategory} onChange={(e) => setV({ ...v, subcategory: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Pricing">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Price (PKR)"><input type="number" className="input" value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} /></Field>
          <Field label="Sale price (PKR)"><input type="number" className="input" value={v.sale_price ?? ""} onChange={(e) => setV({ ...v, sale_price: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Discount">
            <div className="input flex items-center bg-secondary text-muted-foreground">{salePct > 0 ? `${salePct}% off` : "—"}</div>
          </Field>
        </div>
        <Field label="SKU"><input className="input" value={v.sku} onChange={(e) => setV({ ...v, sku: e.target.value })} /></Field>
      </Section>

      <Section title="Images">
        <div className="grid grid-cols-4 gap-3">
          {v.images.map((src, i) => (
            <div key={src} className="relative aspect-[3/4] bg-secondary group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/80 text-white p-1 opacity-0 group-hover:opacity-100"><X size={12} /></button>
              {i === 0 && <span className="absolute bottom-1 left-1 bg-black text-white text-[10px] px-1.5 py-0.5">Cover</span>}
            </div>
          ))}
          <label className="aspect-[3/4] border border-dashed border-border flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-secondary">
            <Upload size={20} />
            <span className="mt-2">{uploading ? "Uploading…" : "Upload"}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
        </div>
      </Section>

      <Section title="Variants (sizes & stock)">
        <div className="space-y-2">
          {v.variants.map((x, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <input placeholder="Size (e.g. M, 42)" className="input" value={x.size} onChange={(e) => updateVariant(i, { size: e.target.value })} />
              <input type="number" placeholder="Stock" className="input" value={x.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} />
              <input placeholder="SKU (optional)" className="input" value={x.sku ?? ""} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
              <button onClick={() => removeVariant(i)} className="px-2 text-muted-foreground hover:text-black"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={addVariant} className="text-xs underline">+ Add variant</button>
        </div>
      </Section>

      <Section title="Details">
        <Field label="Fabric details"><textarea className="input min-h-[80px]" value={v.fabric_details} onChange={(e) => setV({ ...v, fabric_details: e.target.value })} /></Field>
        <Field label="Care instructions"><textarea className="input min-h-[80px]" value={v.care_instructions} onChange={(e) => setV({ ...v, care_instructions: e.target.value })} /></Field>
        <Field label="Tags (comma-separated)"><input className="input" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} /></Field>
      </Section>

      <Section title="Visibility">
        <Field label="Status">
          <select className="input" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as any })}>
            <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
          </select>
        </Field>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={v.is_featured} onChange={(e) => setV({ ...v, is_featured: e.target.checked })} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={v.is_new} onChange={(e) => setV({ ...v, is_new: e.target.checked })} /> New arrival</label>
        </div>
      </Section>

      <div className="flex items-center justify-between pt-6 border-t border-border">
        {productId ? <button onClick={destroy} className="text-xs text-destructive underline">Delete product</button> : <span />}
        <div className="flex gap-3">
          <button onClick={() => navigate({ to: "/admin/products" })} className="h-11 px-6 border border-border eyebrow">Cancel</button>
          <button onClick={save} disabled={saving} className="h-11 px-8 bg-black text-white eyebrow disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="eyebrow text-muted-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}

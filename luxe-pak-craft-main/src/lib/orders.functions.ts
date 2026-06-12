import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ItemSchema = z.object({
  productId: z.string().uuid(),
  size: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});
const AddressSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(6),
  address_line1: z.string().min(1),
  address_line2: z.string().optional().nullable(),
  city: z.string().min(1),
  province: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().default("Pakistan"),
});

const PlaceOrderSchema = z.object({
  email: z.string().email(),
  items: z.array(ItemSchema).min(1),
  shipping_address: AddressSchema,
  payment_method: z.enum(["cod", "stripe"]).default("cod"),
  notes: z.string().optional().nullable(),
  save_address: z.boolean().optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PlaceOrderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = data.items.map((i) => i.productId);

    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, sale_price, images, status")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);

    // Validate + compute server-side
    let subtotal = 0;
    const lineRows: Array<{
      product_id: string; product_name: string; product_slug: string; product_image: string | null;
      size: string; quantity: number; unit_price: number; line_total: number;
    }> = [];
    for (const item of data.items) {
      const p = products?.find((x) => x.id === item.productId);
      if (!p || p.status !== "active") throw new Error(`Product unavailable: ${item.productId}`);
      const unit = Number(p.sale_price ?? p.price);
      const line = unit * item.quantity;
      subtotal += line;
      lineRows.push({
        product_id: p.id, product_name: p.name, product_slug: p.slug,
        product_image: p.images?.[0] ?? null,
        size: item.size, quantity: item.quantity,
        unit_price: unit, line_total: line,
      });
    }

    const shipping = subtotal >= 10000 ? 0 : 350;
    const tax = 0;
    const total = subtotal + shipping + tax;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        email: data.email,
        status: "pending",
        subtotal, shipping, tax, total, discount: 0,
        currency: "PKR",
        shipping_address: data.shipping_address,
        payment_method: data.payment_method,
        notes: data.notes ?? null,
      })
      .select("id, order_number")
      .single();
    if (oErr) throw new Error(oErr.message);

    const itemsPayload = lineRows.map((r) => ({ ...r, order_id: order.id }));
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(itemsPayload);
    if (iErr) throw new Error(iErr.message);

    if (data.save_address) {
      await supabaseAdmin.from("addresses").insert({
        user_id: context.userId,
        ...data.shipping_address,
        is_default: false,
      });
    }

    return { id: order.id, order_number: order.order_number };
  });

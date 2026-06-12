import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Schemas
const ItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
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
  billing_address: AddressSchema.optional().nullable(),
  payment_method: z.enum(["cod", "stripe", "jazzcash", "easypaisa"]).default("cod"),
  coupon_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  save_address: z.boolean().optional(),
  session_id: z.string().optional(), // For stock reservation
});

export interface PlaceOrderResult {
  id: string;
  order_number: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  message?: string;
}

export interface OrderValidation {
  valid: boolean;
  errors: string[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: Array<{
    productId: string;
    variantId?: string;
    name: string;
    slug: string;
    image: string | null;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    available: boolean;
    stock: number;
  }>;
  coupon?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
}

// Validate order before placement (client can call this for real-time validation)
export const validateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PlaceOrderSchema.pick({ items: true, coupon_code: true }).parse(d))
  .handler(async ({ data, context }): Promise<OrderValidation> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const errors: string[] = [];
    const items: OrderValidation["items"] = [];
    let subtotal = 0;

    // Get product data
    const productIds = data.items.map((i) => i.productId);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, sale_price, compare_at_price, images, status, total_stock")
      .in("id", productIds);

    if (pErr) throw new Error(pErr.message);

    // Get variant data
    const { data: allVariants, error: vErr } = await supabaseAdmin
      .from("product_variants")
      .select("id, product_id, size, color, stock, reserved_stock, price_override")
      .in("product_id", productIds);

    if (vErr) throw new Error(vErr.message);

    // Validate each item
    for (const item of data.items) {
      const product = products?.find((p) => p.id === item.productId);

      if (!product) {
        errors.push(`Product not found: ${item.productId}`);
        continue;
      }

      if (product.status !== "active") {
        errors.push(`Product unavailable: ${product.name}`);
        continue;
      }

      // Find variant by size (and optionally variantId)
      let variant = item.variantId
        ? allVariants?.find((v) => v.id === item.variantId)
        : allVariants?.find((v) => v.product_id === item.productId && v.size === item.size);

      if (!variant) {
        // Create a pseudo-variant entry for display
        items.push({
          productId: item.productId,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] ?? null,
          size: item.size,
          quantity: item.quantity,
          unitPrice: Number(product.sale_price ?? product.price),
          lineTotal: Number(product.sale_price ?? product.price) * item.quantity,
          available: false,
          stock: 0,
        });
        errors.push(`Size ${item.size} not available for ${product.name}`);
        continue;
      }

      const availableStock = variant.stock - (variant.reserved_stock || 0);
      const isAvailable = availableStock >= item.quantity;

      if (!isAvailable) {
        errors.push(`Insufficient stock for ${product.name} (Size ${item.size}). Available: ${availableStock}`);
      }

      // Calculate price (variant override takes precedence)
      let unitPrice = variant.price_override
        ? Number(variant.price_override)
        : Number(product.sale_price ?? product.price);

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      items.push({
        productId: item.productId,
        variantId: variant.id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] ?? null,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        available: isAvailable,
        stock: availableStock,
      });
    }

    // Get settings for shipping
    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("key, value")
      .in("key", ["free_shipping_threshold", "flat_shipping_rate"]);

    const threshold = Number(settings?.find((s) => s.key === "free_shipping_threshold")?.value ?? 10000);
    const flatRate = Number(settings?.find((s) => s.key === "flat_shipping_rate")?.value ?? 350);

    const shipping = subtotal >= threshold ? 0 : flatRate;

    // Validate coupon if provided
    let coupon: OrderValidation["coupon"] = null;
    let discount = 0;

    if (data.coupon_code) {
      const { data: couponResult } = await supabaseAdmin.rpc("validate_coupon", {
        p_code: data.coupon_code,
        p_subtotal: subtotal,
        p_user_id: context.userId,
      });

      if (couponResult && couponResult.length > 0 && couponResult[0].valid) {
        coupon = {
          id: couponResult[0].coupon_id,
          code: data.coupon_code.toUpperCase(),
          discount_type: couponResult[0].discount_type,
          discount_value: Number(couponResult[0].discount_value),
        };

        const { data: discountResult } = await supabaseAdmin.rpc("calculate_coupon_discount", {
          p_coupon_id: couponResult[0].coupon_id,
          p_subtotal: subtotal,
        });

        discount = Number(discountResult ?? 0);
      } else if (couponResult && couponResult.length > 0) {
        errors.push(couponResult[0].message ?? "Invalid coupon");
      }
    }

    const total = subtotal + shipping - discount;

    return {
      valid: errors.length === 0 && items.every((i) => i.available),
      errors,
      subtotal,
      shipping,
      discount,
      total,
      items,
      coupon,
    };
  });

// Reserve stock for checkout session
export const reserveCartStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    items: z.array(z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })),
    session_id: z.string(),
    minutes: z.number().int().min(1).max(60).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get reservation time from settings
    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("key", "stock_reservation_minutes")
      .single();

    const minutes = data.minutes ?? Number(settings?.value ?? 15);

    const results: Array<{ variantId: string; success: boolean; available: number }> = [];

    for (const item of data.items) {
      const { data: result, error } = await supabaseAdmin.rpc("reserve_stock", {
        p_variant_id: item.variantId,
        p_quantity: item.quantity,
        p_session_id: data.session_id,
        p_minutes: minutes,
      });

      // Get current available stock
      const { data: variant } = await supabaseAdmin
        .from("product_variants")
        .select("stock, reserved_stock")
        .eq("id", item.variantId)
        .single();

      const available = variant ? variant.stock - variant.reserved_stock : 0;

      results.push({
        variantId: item.variantId,
        success: result === true,
        available,
      });
    }

    return {
      success: results.every((r) => r.success),
      results,
    };
  });

// Release reserved stock
export const releaseStockReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ session_id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get all reservations for this session
    const { data: reservations } = await supabaseAdmin
      .from("stock_reservations")
      .select("id, variant_id, quantity")
      .eq("session_id", data.session_id);

    if (!reservations || reservations.length === 0) {
      return { released: 0 };
    }

    // Release each reservation
    for (const r of reservations) {
      await supabaseAdmin
        .from("product_variants")
        .update({ reserved_stock: supabaseAdmin.raw("GREATEST(0, reserved_stock - ?)", [r.quantity]) })
        .eq("id", r.variant_id);

      await supabaseAdmin
        .from("stock_reservations")
        .delete()
        .eq("id", r.id);
    }

    return { released: reservations.length };
  });

// Place order with full validation
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PlaceOrderSchema.parse(d))
  .handler(async ({ data, context }): Promise<PlaceOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Step 1: Validate everything
    const validation = await validateOrder.handler({
      data: { items: data.items, coupon_code: data.coupon_code },
      context,
    } as any);

    if (!validation.valid) {
      throw new Error(`Order validation failed: ${validation.errors.join("; ")}`);
    }

    // Step 2: Handle stock reservations
    if (data.session_id) {
      // Convert reservations to sales (decrements stock)
      // If no reservations exist, decrement directly
      const { data: reservations } = await supabaseAdmin
        .from("stock_reservations")
        .select("id")
        .eq("session_id", data.session_id)
        .limit(1);

      if (reservations && reservations.length > 0) {
        // Will convert after order creation
      } else {
        // No reservations - directly decrement stock
        for (const item of data.items) {
          const itemData = validation.items.find(
            (i) => i.productId === item.productId && i.size === item.size
          );

          if (!itemData?.variantId) continue;

          const success = await supabaseAdmin.rpc("decrement_stock", {
            p_variant_id: itemData.variantId,
            p_quantity: item.quantity,
          });

          if (!success) {
            throw new Error(`Failed to decrement stock for ${itemData.name}`);
          }
        }
      }
    } else {
      // No session - directly decrement stock
      for (const item of data.items) {
        const itemData = validation.items.find(
          (i) => i.productId === item.productId && i.size === item.size
        );

        if (!itemData?.variantId) continue;

        const success = await supabaseAdmin.rpc("decrement_stock", {
          p_variant_id: itemData.variantId,
          p_quantity: item.quantity,
        });

        if (!success) {
          throw new Error(`Failed to decrement stock for ${itemData.name}`);
        }
      }
    }

    // Step 3: Create the order
    const orderData = {
      user_id: context.userId,
      email: data.email,
      status: data.payment_method === "cod" ? "pending" : "paid",
      payment_status: data.payment_method === "cod" ? "pending" : "paid",
      payment_method: data.payment_method,
      subtotal: validation.subtotal,
      shipping: validation.shipping,
      discount: validation.discount,
      total: validation.total,
      currency: "PKR",
      shipping_address: data.shipping_address,
      billing_address: data.billing_address ?? data.shipping_address,
      notes: data.notes ?? null,
      coupon_id: validation.coupon?.id ?? null,
    };

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert(orderData)
      .select("id, order_number")
      .single();

    if (oErr) {
      // Rollback stock
      for (const item of data.items) {
        const itemData = validation.items.find(
          (i) => i.productId === item.productId && i.size === item.size
        );
        if (!itemData?.variantId) continue;

        await supabaseAdmin.rpc("increment_stock", {
          p_variant_id: itemData.variantId,
          p_quantity: item.quantity,
          p_reason: "adjustment",
          p_notes: "Order creation failed - rollback",
        });
      }
      throw new Error(oErr.message);
    }

    // Step 4: Create order items
    const itemsPayload = validation.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      variant_id: i.variantId ?? null,
      product_name: i.name,
      product_slug: i.slug,
      product_image: i.image,
      size: i.size,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      line_total: i.lineTotal,
    }));

    const { error: iErr } = await supabaseAdmin.from("order_items").insert(itemsPayload);

    if (iErr) {
      console.error("Failed to create order items:", iErr);
      // Order is created, don't throw - just log
    }

    // Step 5: Convert reservations if applicable
    if (data.session_id) {
      await supabaseAdmin.rpc("convert_reservation_to_sale", {
        p_session_id: data.session_id,
        p_order_id: order.id,
      });
    }

    // Step 6: Increment coupon usage if applicable
    if (validation.coupon?.id) {
      await supabaseAdmin.rpc("increment_coupon_usage", {
        p_coupon_id: validation.coupon.id,
      });
    }

    // Step 7: Save address if requested
    if (data.save_address) {
      await supabaseAdmin.from("addresses").upsert({
        user_id: context.userId,
        ...data.shipping_address,
        is_default: false,
      }, { onConflict: "user_id,address_line1" });
    }

    // Step 8: Update product sales stats (best sellers tracking)
    // This could trigger email notifications via edge function

    return {
      id: order.id,
      order_number: order.order_number,
      subtotal: validation.subtotal,
      shipping: validation.shipping,
      discount: validation.discount,
      total: validation.total,
    };
  });

// Get order details
export const getOrderDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: order }, { data: items }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", data.orderId)
        .or(`user_id.eq.${context.userId},and(user_id.is.null)`)
        .single(),
      supabaseAdmin
        .from("order_items")
        .select("*")
        .eq("order_id", data.orderId),
    ]);

    if (!order) {
      throw new Error("Order not found");
    }

    return { order, items: items ?? [] };
  });

// Cancel order (admin or owner)
export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    orderId: z.string().uuid(),
    reason: z.string().optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get order
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, user_id")
      .eq("id", data.orderId)
      .single();

    if (error || !order) {
      throw new Error("Order not found");
    }

    // Check ownership or admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (order.user_id !== context.userId && !isAdmin) {
      throw new Error("Unauthorized");
    }

    // Check if cancellable
    if (!["pending", "paid", "processing"].includes(order.status)) {
      throw new Error("Order cannot be cancelled at this stage");
    }

    // Update status
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        notes: data.reason ? `Cancelled: ${data.reason}` : "Cancelled by user",
      })
      .eq("id", data.orderId);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // Restore stock
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("variant_id, quantity")
      .eq("order_id", data.orderId);

    if (items) {
      for (const item of items) {
        if (item.variant_id) {
          await supabaseAdmin.rpc("increment_stock", {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity,
            p_reason: "return",
            p_order_id: data.orderId,
            p_notes: data.reason ?? "Order cancelled",
          });
        }
      }
    }

    return { success: true };
  });

// Update order status (admin only)
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    orderId: z.string().uuid(),
    status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
    tracking_number: z.string().optional(),
    notes: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const updateData: Record<string, unknown> = { status: data.status };
    if (data.tracking_number) {
      updateData.tracking_number = data.tracking_number;
    }
    if (data.notes) {
      updateData.notes = data.notes;
    }
    if (data.status === "shipped") {
      // Could send shipping notification email
    }
    if (data.status === "delivered") {
      // For COD orders, mark as paid on delivery
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("payment_method")
        .eq("id", data.orderId)
        .single();

      if (order?.payment_method === "cod") {
        updateData.payment_status = "paid";
      }
    }

    if (data.status === "refunded" || data.status === "cancelled") {
      // Restore stock
      updateData.payment_status = "refunded";

      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("variant_id, quantity, product_name")
        .eq("order_id", data.orderId);

      if (items) {
        for (const item of items) {
          if (item.variant_id) {
            await supabaseAdmin.rpc("increment_stock", {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
              p_reason: data.status === "refunded" ? "return" : "adjustment",
              p_order_id: data.orderId,
              p_notes: `Order ${data.status}: ${item.product_name}`,
            });
          }
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", data.orderId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

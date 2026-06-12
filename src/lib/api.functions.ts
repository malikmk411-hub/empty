import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Dashboard statistics
export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { data: stats } = await supabaseAdmin.rpc("get_dashboard_stats", {
      p_start_date: data?.start_date ?? null,
      p_end_date: data?.end_date ?? null,
    });

    return stats?.[0] ?? {
      total_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      pending_orders: 0,
      low_stock_products: 0,
      pending_reviews: 0,
      total_customers: 0,
      new_customers_month: 0,
    };
  });

// Best selling products
export const getBestSellers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    limit: z.number().int().min(1).max(50).optional(),
    days: z.number().int().min(1).max(365).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { data: products } = await supabaseAdmin.rpc("get_best_selling_products", {
      p_limit: data?.limit ?? 10,
      p_days: data?.days ?? 30,
    });

    return products ?? [];
  });

// Revenue over time
export const getRevenueOverTime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    interval: z.enum(["day", "week", "month"]).optional(),
    days: z.number().int().min(1).max(365).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { data: revenue } = await supabaseAdmin.rpc("get_revenue_over_time", {
      p_interval: data?.interval ?? "day",
      p_days: data?.days ?? 30,
    });

    return revenue ?? [];
  });

// Order status breakdown
export const getOrderStatusBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { data: breakdown } = await supabaseAdmin.rpc("get_order_status_breakdown");

    return breakdown ?? [];
  });

// Low stock products
export const getLowStockProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    threshold: z.number().int().min(0).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Get threshold from settings if not provided
    let threshold = data?.threshold ?? 5;
    if (!data?.threshold) {
      const { data: settings } = await supabaseAdmin
        .from("store_settings")
        .select("value")
        .eq("key", "low_stock_threshold")
        .single();
      if (settings?.value) {
        threshold = Number(settings.value);
      }
    }

    const { data: products } = await supabaseAdmin.rpc("get_low_stock_products", {
      p_threshold: threshold,
    });

    return products ?? [];
  });

// Customer order history
export const getCustomerOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }).optional().parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin for viewing other users' orders
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    const targetUserId = data?.userId ?? context.userId;

    if (targetUserId !== context.userId && !isAdmin) {
      throw new Error("Unauthorized");
    }

    const { data: orders } = await supabaseAdmin.rpc("get_customer_orders", {
      p_user_id: targetUserId,
      p_limit: data?.limit ?? 20,
    });

    return orders ?? [];
  });

// Search products with filters
export const searchProducts = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    query: z.string().optional(),
    category_id: z.string().uuid().optional(),
    category_slug: z.string().optional(),
    min_price: z.number().min(0).optional(),
    max_price: z.number().min(0).optional(),
    sizes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    in_stock_only: z.boolean().optional(),
    on_sale_only: z.boolean().optional(),
    featured_only: z.boolean().optional(),
    new_arrivals_only: z.boolean().optional(),
    sort: z.enum(["relevance", "price_asc", "price_desc", "newest", "bestselling"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  }).optional().parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const params = data ?? {};

    // Resolve category_id from slug if needed
    let categoryId = params.category_id;
    if (params.category_slug && !categoryId) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", params.category_slug)
        .single();
      categoryId = cat?.id;
    }

    // Build query
    let query = supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        price,
        compare_at_price,
        sale_price,
        images,
        status,
        is_featured,
        is_new,
        is_limited_edition,
        total_stock,
        rating_avg,
        rating_count,
        tags,
        created_at,
        category:categories(id, name, slug),
        variants:product_variants(id, size, color, stock, reserved_stock)
      `, { count: "exact" })
      .eq("status", "active");

    // Filters
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (params.min_price !== undefined) {
      query = query.gte("price", params.min_price);
    }

    if (params.max_price !== undefined) {
      query = query.lte("price", params.max_price);
    }

    if (params.in_stock_only) {
      query = query.gt("total_stock", 0);
    }

    if (params.on_sale_only) {
      query = query.or("sale_price.not.is.null,compare_at_price.gt.price");
    }

    if (params.featured_only) {
      query = query.eq("is_featured", true);
    }

    if (params.new_arrivals_only) {
      const { data: settings } = await supabaseAdmin
        .from("store_settings")
        .select("value")
        .eq("key", "new_arrival_days")
        .single();

      const days = settings?.value ? Number(settings.value) : 14;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte("created_at", cutoff.toISOString());
    }

    if (params.query) {
      // Use full-text search
      const searchQuery = params.query
        .split(/\s+/)
        .map((term) => `${term}:*`)
        .join(" & ");

      query = query.textSearch("search_vector", searchQuery, {
        type: "websearch",
        config: "english",
      });
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains("tags", params.tags);
    }

    // Sorting
    const sort = params.sort ?? (params.query ? "relevance" : "newest");
    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "bestselling":
        // Would need a join with order_items for accurate ranking
        query = query.order("rating_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    // Pagination
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Filter variants by size if specified
    let filteredProducts = products ?? [];

    if (params.sizes && params.sizes.length > 0) {
      filteredProducts = filteredProducts.map((p: any) => ({
        ...p,
        variants: p.variants?.filter((v: any) => params.sizes!.includes(v.size)) ?? [],
      })).filter((p: any) => p.variants?.length > 0);
    }

    return {
      products: filteredProducts,
      total: count ?? 0,
      limit,
      offset,
      hasMore: (count ?? 0) > offset + limit,
    };
  });

// Get product by slug with full details
export const getProductBySlug = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        subtitle,
        description,
        fabric_details,
        care_instructions,
        material,
        price,
        compare_at_price,
        sale_price,
        images,
        tags,
        status,
        is_featured,
        is_new,
        is_limited_edition,
        rating_avg,
        rating_count,
        total_stock,
        sku,
        created_at,
        category:categories(id, name, slug),
        variants:product_variants(id, size, color, color_hex, stock, reserved_stock, sku),
        images_detailed:product_images(id, image_url, alt_text, display_order, is_primary),
        reviews(
          id,
          rating,
          title,
          body,
          is_verified_purchase,
          created_at,
          user:profiles(full_name, avatar_url)
        )
      `)
      .eq("slug", data.slug)
      .single();

    if (error || !product) {
      return null;
    }

    // Calculate discount percentage
    let discountPercentage = 0;
    if (product.compare_at_price && product.compare_at_price > product.price) {
      discountPercentage = Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100
      );
    } else if (product.sale_price && product.price > product.sale_price) {
      discountPercentage = Math.round(
        ((product.price - product.sale_price) / product.price) * 100
      );
    }

    // Check if sold out
    const isSoldOut = product.total_stock === 0;

    // Check new arrival
    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("key", "new_arrival_days")
      .single();

    const newArrivalDays = settings?.value ? Number(settings.value) : 14;
    const isNewArrival = product.is_new || (
      new Date(product.created_at) > new Date(Date.now() - newArrivalDays * 24 * 60 * 60 * 1000)
    );

    return {
      ...product,
      discountPercentage,
      isSoldOut,
      isNewArrival,
      availableStock: product.total_stock,
    };
  });

// Get related products
export const getRelatedProducts = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    productId: z.string().uuid(),
    limit: z.number().int().min(1).max(20).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get the product's category
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("category_id, tags")
      .eq("id", data.productId)
      .single();

    if (!product) {
      return [];
    }

    // Find related products by category and tags
    const { data: related } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        price,
        sale_price,
        images,
        total_stock,
        rating_avg,
        is_new,
        category:categories(name)
      `)
      .eq("status", "active")
      .eq("category_id", product.category_id)
      .neq("id", data.productId)
      .limit(data.limit ?? 8);

    return related ?? [];
  });

// Get categories with product counts
export const getCategoriesWithCounts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        parent_id,
        sort_order,
        parent:categories!parent_id(id, name, slug)
      `)
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      throw new Error(error.message);
    }

    // Get product counts for each category
    const { data: counts } = await supabaseAdmin
      .from("products")
      .select("category_id")
      .eq("status", "active");

    const countMap = (counts ?? []).reduce((acc: Record<string, number>, p: any) => {
      acc[p.category_id] = (acc[p.category_id] ?? 0) + 1;
      return acc;
    }, {});

    return (categories ?? []).map((c: any) => ({
      ...c,
      product_count: countMap[c.id] ?? 0,
    }));
  });

// Get site settings
export const getStoreSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: settings } = await supabaseAdmin
      .from("store_settings")
      .select("key, value, description");

    const settingsMap: Record<string, any> = {};
    for (const s of settings ?? []) {
      settingsMap[s.key] = s.value;
    }

    return settingsMap;
  });

// Update store setting (admin only)
export const updateStoreSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    key: z.string(),
    value: z.any(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { error } = await supabaseAdmin
      .from("store_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

-- Functions and triggers for LUXE ecommerce

-- Search vector update trigger
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.subcategory, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'), ' ')), 'C');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_products_search BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();

-- Rating refresh trigger
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid UUID;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products p SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE product_id = pid AND is_approved), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = pid AND is_approved)
  WHERE p.id = pid;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- Stock decrement function (atomic)
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_variant_id UUID,
  p_quantity INT,
  p_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_previous INT;
  v_new INT;
BEGIN
  SELECT stock INTO v_previous FROM public.product_variants WHERE id = p_variant_id FOR UPDATE;
  
  IF v_previous IS NULL THEN
    RETURN false;
  END IF;
  
  IF v_previous < p_quantity THEN
    RETURN false;
  END IF;
  
  v_new := v_previous - p_quantity;
  
  UPDATE public.product_variants SET stock = v_new WHERE id = p_variant_id;
  
  INSERT INTO public.inventory_logs (variant_id, change_amount, previous_stock, new_stock, reason, order_id, changed_by)
  VALUES (p_variant_id, -p_quantity, v_previous, v_new, 'sale', p_order_id, auth.uid());
  
  -- Update product total stock
  UPDATE public.products p SET total_stock = (
    SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = p.id
  ) WHERE id = (SELECT product_id FROM public.product_variants WHERE id = p_variant_id);
  
  RETURN true;
END $$;

-- Stock increment function
CREATE OR REPLACE FUNCTION public.increment_stock(
  p_variant_id UUID,
  p_quantity INT,
  p_reason public.inventory_change_reason,
  p_order_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_previous INT;
  v_new INT;
BEGIN
  SELECT stock INTO v_previous FROM public.product_variants WHERE id = p_variant_id FOR UPDATE;
  
  IF v_previous IS NULL THEN
    RETURN;
  END IF;
  
  v_new := v_previous + p_quantity;
  
  UPDATE public.product_variants SET stock = v_new WHERE id = p_variant_id;
  
  INSERT INTO public.inventory_logs (variant_id, change_amount, previous_stock, new_stock, reason, order_id, notes, changed_by)
  VALUES (p_variant_id, p_quantity, v_previous, v_new, p_reason, p_order_id, p_notes, auth.uid());
  
  -- Update product total stock
  UPDATE public.products p SET total_stock = (
    SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = p.id
  ) WHERE id = (SELECT product_id FROM public.product_variants WHERE id = p_variant_id);
END $$;

-- Stock reservation function
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_variant_id UUID,
  p_quantity INT,
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_minutes INT DEFAULT 15
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_available INT;
  v_reserved INT;
BEGIN
  -- Get current stock and reserved amount
  SELECT stock, reserved_stock INTO v_available, v_reserved 
  FROM public.product_variants WHERE id = p_variant_id FOR UPDATE;
  
  IF v_available IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if enough available stock
  IF (v_available - v_reserved) < p_quantity THEN
    RETURN false;
  END IF;
  
  -- Create reservation
  INSERT INTO public.stock_reservations (variant_id, quantity, session_id, user_id, expires_at)
  VALUES (p_variant_id, p_quantity, p_session_id, p_user_id, now() + (p_minutes || ' minutes')::interval);
  
  -- Update reserved stock on variant
  UPDATE public.product_variants 
  SET reserved_stock = reserved_stock + p_quantity 
  WHERE id = p_variant_id;
  
  RETURN true;
END $$;

-- Release expired reservations
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
BEGIN
  FOR r IN SELECT id, variant_id, quantity FROM public.stock_reservations WHERE expires_at < now()
  LOOP
    UPDATE public.product_variants 
    SET reserved_stock = GREATEST(0, reserved_stock - r.quantity) 
    WHERE id = r.variant_id;
    
    DELETE FROM public.stock_reservations WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END $$;

-- Convert reservation to sale
CREATE OR REPLACE FUNCTION public.convert_reservation_to_sale(
  p_session_id TEXT,
  p_order_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  v_previous INT;
BEGIN
  FOR r IN SELECT id, variant_id, quantity FROM public.stock_reservations WHERE session_id = p_session_id
  LOOP
    -- Get previous stock for log
    SELECT stock INTO v_previous FROM public.product_variants WHERE id = r.variant_id;
    
    -- Decrement stock (already reserved)
    UPDATE public.product_variants 
    SET stock = stock - r.quantity,
        reserved_stock = GREATEST(0, reserved_stock - r.quantity)
    WHERE id = r.variant_id;
    
    -- Log the change
    INSERT INTO public.inventory_logs (variant_id, change_amount, previous_stock, new_stock, reason, order_id)
    VALUES (r.variant_id, -r.quantity, v_previous, v_previous - r.quantity, 'sale', p_order_id);
    
    -- Delete reservation
    DELETE FROM public.stock_reservations WHERE id = r.id;
  END LOOP;
  
  -- Update product total stock
  UPDATE public.products p SET total_stock = (
    SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = p.id
  ) WHERE id IN (
    SELECT DISTINCT pv.product_id FROM public.product_variants pv
    JOIN public.order_items oi ON oi.variant_id = pv.id
    WHERE oi.order_id = p_order_id
  );
END $$;

-- Validate coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  valid BOOLEAN,
  coupon_id UUID,
  discount_type public.discount_type,
  discount_value NUMERIC,
  min_order_amount NUMERIC,
  message TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE
      WHEN c.id IS NULL THEN false
      WHEN NOT c.is_active THEN false
      WHEN c.expires_at IS NOT NULL AND c.expires_at < now() THEN false
      WHEN c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN false
      WHEN p_subtotal < c.min_order_amount THEN false
      ELSE true
    END,
    c.id,
    c.discount_type,
    c.discount_value,
    c.min_order_amount,
    CASE
      WHEN c.id IS NULL THEN 'Invalid coupon code'
      WHEN NOT c.is_active THEN 'This coupon is no longer active'
      WHEN c.expires_at IS NOT NULL AND c.expires_at < now() THEN 'This coupon has expired'
      WHEN c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN 'This coupon has reached its usage limit'
      WHEN p_subtotal < c.min_order_amount THEN 'Minimum order amount of Rs' || c.min_order_amount::text || ' not met'
      ELSE NULL
    END
  FROM public.coupons c
  WHERE LOWER(c.code) = LOWER(p_code);
END $$;

-- Calculate coupon discount
CREATE OR REPLACE FUNCTION public.calculate_coupon_discount(
  p_coupon_id UUID,
  p_subtotal NUMERIC
)
RETURNS NUMERIC LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC := 0;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE id = p_coupon_id AND is_active;
  
  IF v_coupon.id IS NULL THEN
    RETURN 0;
  END IF;
  
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_subtotal * v_coupon.discount_value / 100;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  -- Don't exceed subtotal
  RETURN LEAST(v_discount, p_subtotal);
END $$;

-- Increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coupons 
  SET used_count = used_count + 1 
  WHERE id = p_coupon_id;
END $$;

-- Check verified purchase
CREATE OR REPLACE FUNCTION public.check_verified_purchase(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.user_id = p_user_id
    AND oi.product_id = p_product_id
    AND o.status IN ('shipped', 'delivered');
  
  RETURN v_count > 0;
END $$;

-- Admin analytics: dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  pending_orders BIGINT,
  low_stock_products BIGINT,
  pending_reviews BIGINT,
  total_customers BIGINT,
  new_customers_month BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.orders 
     WHERE (p_start_date IS NULL OR created_at >= p_start_date)
       AND (p_end_date IS NULL OR created_at <= p_end_date)),
    COALESCE((SELECT SUM(total) FROM public.orders 
              WHERE status NOT IN ('cancelled', 'refunded')
                AND (p_start_date IS NULL OR created_at >= p_start_date)
                AND (p_end_date IS NULL OR created_at <= p_end_date)), 0),
    COALESCE((SELECT AVG(total) FROM public.orders 
              WHERE status NOT IN ('cancelled', 'refunded')
                AND (p_start_date IS NULL OR created_at >= p_start_date)
                AND (p_end_date IS NULL OR created_at <= p_end_date)), 0),
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
    (SELECT COUNT(DISTINCT p.id) FROM public.products p
     JOIN public.product_variants pv ON pv.product_id = p.id
     WHERE pv.stock <= (SELECT (value::jsonb->>'value')::int FROM public.store_settings WHERE key = 'low_stock_threshold' LIMIT 1) 
       AND p.status = 'active'),
    (SELECT COUNT(*) FROM public.reviews WHERE is_approved = false),
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= now() - '30 days'::interval);
END $$;

-- Best selling products
CREATE OR REPLACE FUNCTION public.get_best_selling_products(
  p_limit INT DEFAULT 10,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  product_image TEXT,
  total_sold BIGINT,
  revenue NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    oi.product_name,
    oi.product_slug,
    MAX(oi.product_image) as product_image,
    SUM(oi.quantity)::BIGINT as total_sold,
    SUM(oi.line_total) as revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status NOT IN ('cancelled', 'refunded')
    AND o.created_at >= now() - (p_days || ' days')::interval
    AND oi.product_id IS NOT NULL
  GROUP BY oi.product_id, oi.product_name, oi.product_slug
  ORDER BY total_sold DESC
  LIMIT p_limit;
END $$;

-- Revenue over time
CREATE OR REPLACE FUNCTION public.get_revenue_over_time(
  p_interval TEXT DEFAULT 'day',
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  period DATE,
  orders_count BIGINT,
  revenue NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC(p_interval, created_at)::DATE as period,
    COUNT(*)::BIGINT as orders_count,
    COALESCE(SUM(total), 0) as revenue
  FROM public.orders
  WHERE status NOT IN ('cancelled', 'refunded')
    AND created_at >= now() - (p_days || ' days')::interval
  GROUP BY DATE_TRUNC(p_interval, created_at)
  ORDER BY period DESC;
END $$;

-- Order status breakdown
CREATE OR REPLACE FUNCTION public.get_order_status_breakdown()
RETURNS TABLE (
  status public.order_status,
  count BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT status, COUNT(*)::BIGINT
  FROM public.orders
  GROUP BY status
  ORDER BY count DESC;
END $$;

-- Low stock products
CREATE OR REPLACE FUNCTION public.get_low_stock_products(
  p_threshold INT DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  variant_id UUID,
  size TEXT,
  color TEXT,
  stock INT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    pv.id,
    pv.size,
    pv.color,
    pv.stock
  FROM public.products p
  JOIN public.product_variants pv ON pv.product_id = p.id
  WHERE pv.stock <= p_threshold
    AND p.status = 'active'
  ORDER BY pv.stock ASC;
END $$;

-- Customer order history
CREATE OR REPLACE FUNCTION public.get_customer_orders(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status public.order_status,
  payment_status public.payment_status,
  total NUMERIC,
  created_at TIMESTAMPTZ,
  item_count BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total,
    o.created_at,
    (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id)
  FROM public.orders o
  WHERE o.user_id = p_user_id
  ORDER BY o.created_at DESC
  LIMIT p_limit;
END $$;

-- Search products
CREATE OR REPLACE FUNCTION public.search_products(
  p_query TEXT,
  p_category_id UUID DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_in_stock_only BOOLEAN DEFAULT FALSE,
  p_on_sale_only BOOLEAN DEFAULT FALSE,
  p_sort TEXT DEFAULT 'relevance',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  compare_at_price NUMERIC,
  sale_price NUMERIC,
  image TEXT,
  category_name TEXT,
  total_stock INT,
  search_rank REAL
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_search_vector tsvector;
BEGIN
  IF p_query IS NOT NULL AND p_query != '' THEN
    v_search_vector := plainto_tsquery('english', p_query);
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.compare_at_price,
    p.sale_price,
    p.images[1],
    c.name,
    p.total_stock,
    CASE WHEN p_query IS NOT NULL AND p_query != '' 
         THEN ts_rank_cd(p.search_vector, v_search_vector) 
         ELSE 0 END
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.status = 'active'
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (NOT p_in_stock_only OR p.total_stock > 0)
    AND (NOT p_on_sale_only OR p.compare_at_price > p.price OR p.sale_price IS NOT NULL)
    AND (p_query IS NULL OR p_query = '' OR p.search_vector @@ v_search_vector)
  ORDER BY 
    CASE 
      WHEN p_sort = 'price_asc' THEN p.price 
      WHEN p_sort = 'price_desc' THEN -p.price 
      WHEN p_sort = 'newest' THEN COALESCE(EXTRACT(EPOCH FROM p.created_at), 0)
      WHEN p_sort = 'relevance' AND p_query IS NOT NULL THEN ts_rank_cd(p.search_vector, v_search_vector)
      ELSE 0
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END $$;

-- Claim admin function
CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing INT;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO existing FROM public.user_roles WHERE role = 'admin';
  IF existing > 0 THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END $$;

-- Is admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

-- Revoke execute from PUBLIC for sensitive functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_product_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, INT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_stock(UUID, INT, public.inventory_change_reason, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(UUID, INT, TEXT, UUID, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_expired_reservations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.convert_reservation_to_sale(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_best_selling_products(INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_revenue_over_time(TEXT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_status_breakdown() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_low_stock_products(INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_customer_orders(UUID, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_products(TEXT, UUID, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, TEXT, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;

-- Grant execute to appropriate roles
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_coupon_discount(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_verified_purchase(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_selling_products(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_over_time(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_products(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_products(TEXT, UUID, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
CREATE OR REPLACE FUNCTION public.create_self_checkout_order(
  p_shop_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_city TEXT,
  p_area TEXT,
  p_street TEXT,
  p_payment_method payment_method,
  p_proof_url TEXT,
  p_items JSONB
)
RETURNS TABLE (
  order_id UUID,
  order_number INT,
  error_code TEXT,
  variant_name TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_order_number INT;
  v_shipping_fee NUMERIC(10,2);
  v_item JSONB;
  v_variant RECORD;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Items are required';
  END IF;

  SELECT COALESCE(default_shipping_fee, 0)
  INTO v_shipping_fee
  FROM public.shops
  WHERE id = p_shop_id
  FOR UPDATE;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(p_items)
  LOOP
    SELECT
      pv.id,
      pv.stock_qty,
      COALESCE(NULLIF(v_item->>'variant_name', ''), pv.name) AS resolved_variant_name
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = (v_item->>'variant_id')::UUID
      AND p.shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND OR v_variant.stock_qty < COALESCE((v_item->>'quantity')::INT, 0) THEN
      order_id := NULL;
      order_number := NULL;
      error_code := 'STOCK_CONFLICT';
      variant_name := COALESCE(v_variant.resolved_variant_name, v_item->>'variant_name');
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;

  SELECT id
  INTO v_customer_id
  FROM public.customers
  WHERE shop_id = p_shop_id
    AND phone = p_phone
  FOR UPDATE;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (shop_id, name, phone)
    VALUES (p_shop_id, p_name, p_phone)
    ON CONFLICT (shop_id, phone)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_customer_id;
  END IF;

  INSERT INTO public.orders (
    shop_id,
    customer_id,
    status,
    source,
    payment_method,
    payment_proof_url,
    address_name,
    address_phone,
    address_city,
    address_area,
    address_street,
    shipping_fee,
    subtotal,
    total
  )
  VALUES (
    p_shop_id,
    v_customer_id,
    'pending',
    'self_checkout',
    p_payment_method,
    p_proof_url,
    p_name,
    p_phone,
    p_city,
    p_area,
    p_street,
    v_shipping_fee,
    0,
    0
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (
    order_id,
    variant_id,
    product_name,
    variant_name,
    unit_price,
    quantity,
    line_total
  )
  SELECT
    v_order_id,
    (item->>'variant_id')::UUID,
    item->>'product_name',
    item->>'variant_name',
    (item->>'price')::NUMERIC(10,2),
    (item->>'quantity')::INT,
    ((item->>'price')::NUMERIC(10,2) * (item->>'quantity')::INT)
  FROM jsonb_array_elements(p_items) AS item;

  order_id := v_order_id;
  order_number := v_order_number;
  error_code := NULL;
  variant_name := NULL;
  RETURN NEXT;
END;
$$;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.shops (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  whatsapp      TEXT NOT NULL,
  instapay_name TEXT,
  instapay_number TEXT,
  currency      TEXT NOT NULL DEFAULT 'EGP',
  default_shipping_fee  NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  order_counter INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shops_owner_unique UNIQUE (owner_id)
);

CREATE INDEX idx_shops_owner ON public.shops(owner_id);
CREATE INDEX idx_shops_slug  ON public.shops(slug);

CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_shop    ON public.products(shop_id);
CREATE INDEX idx_products_active  ON public.products(shop_id, is_active);

CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON public.product_images(product_id);

CREATE TABLE public.product_variants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  size        TEXT,
  color       TEXT,
  sku         TEXT,
  price_override NUMERIC(10,2),
  stock_qty   INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 3,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product   ON public.product_variants(product_id);
CREATE INDEX idx_variants_low_stock ON public.product_variants(product_id)
  WHERE stock_qty <= low_stock_threshold;

CREATE TABLE public.customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  instagram   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_shop_phone_unique UNIQUE (shop_id, phone)
);

CREATE INDEX idx_customers_shop  ON public.customers(shop_id);
CREATE INDEX idx_customers_phone ON public.customers(shop_id, phone);

CREATE TYPE order_status AS ENUM (
  'draft',
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'cod',
  'instapay'
);

CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number    INT NOT NULL DEFAULT 0,
  status          order_status NOT NULL DEFAULT 'draft',
  checkout_token  TEXT NOT NULL UNIQUE,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method  payment_method,
  payment_proof_url TEXT,
  address_name    TEXT,
  address_phone   TEXT,
  address_city    TEXT,
  address_area    TEXT,
  address_street  TEXT,
  notes           TEXT,
  pending_at      TIMESTAMPTZ,
  confirmed_at    TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_shop       ON public.orders(shop_id);
CREATE INDEX idx_orders_status     ON public.orders(shop_id, status);
CREATE INDEX idx_orders_customer   ON public.orders(customer_id);
CREATE INDEX idx_orders_token      ON public.orders(checkout_token);
CREATE INDEX idx_orders_created    ON public.orders(shop_id, created_at DESC);
CREATE INDEX idx_orders_pending    ON public.orders(shop_id, status, pending_at)
  WHERE status = 'pending';

CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  line_total  NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX idx_order_items_variant ON public.order_items(variant_id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.next_order_number(p_shop_id UUID)
RETURNS INT AS $$
DECLARE
  v_next INT;
BEGIN
  UPDATE public.shops
  SET order_counter = order_counter + 1
  WHERE id = p_shop_id
  RETURNING order_counter INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = public.next_order_number(NEW.shop_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_order_number();

CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'pending' THEN
    NEW.pending_at = now();
    UPDATE public.product_variants pv
    SET stock_qty = stock_qty - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.id = oi.variant_id;
  END IF;

  IF OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled' THEN
    NEW.cancelled_at = now();
    UPDATE public.product_variants pv
    SET stock_qty = stock_qty + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.id = oi.variant_id;
  END IF;

  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at = now();
  END IF;
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    NEW.shipped_at = now();
  END IF;
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_change
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();

CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(10,2);
  v_shipping NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM public.order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  SELECT shipping_fee INTO v_shipping
  FROM public.orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  UPDATE public.orders
  SET subtotal = v_subtotal,
      total = v_subtotal + v_shipping
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_order_total_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();
CREATE TRIGGER recalc_order_total_update
  AFTER UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();
CREATE TRIGGER recalc_order_total_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

ALTER TABLE public.shops            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own shop"
  ON public.shops FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Sellers manage own products"
  ON public.products FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers manage own product images"
  ON public.product_images FOR ALL
  USING (product_id IN (SELECT p.id FROM public.products p JOIN public.shops s ON p.shop_id = s.id WHERE s.owner_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT p.id FROM public.products p JOIN public.shops s ON p.shop_id = s.id WHERE s.owner_id = auth.uid()));

CREATE POLICY "Public can view product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Sellers manage own variants"
  ON public.product_variants FOR ALL
  USING (product_id IN (SELECT p.id FROM public.products p JOIN public.shops s ON p.shop_id = s.id WHERE s.owner_id = auth.uid()))
  WITH CHECK (product_id IN (SELECT p.id FROM public.products p JOIN public.shops s ON p.shop_id = s.id WHERE s.owner_id = auth.uid()));

CREATE POLICY "Public can view variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Sellers manage own customers"
  ON public.customers FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

CREATE POLICY "Sellers manage own orders"
  ON public.orders FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view order by token"
  ON public.orders FOR SELECT
  USING (checkout_token IS NOT NULL);

CREATE POLICY "Public can submit checkout"
  ON public.orders FOR UPDATE
  USING (checkout_token IS NOT NULL AND status = 'pending')
  WITH CHECK (status = 'pending');

CREATE POLICY "Sellers manage own order items"
  ON public.order_items FOR ALL
  USING (order_id IN (SELECT o.id FROM public.orders o JOIN public.shops s ON o.shop_id = s.id WHERE s.owner_id = auth.uid()))
  WITH CHECK (order_id IN (SELECT o.id FROM public.orders o JOIN public.shops s ON o.shop_id = s.id WHERE s.owner_id = auth.uid()));

CREATE POLICY "Public can view order items by token"
  ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE checkout_token IS NOT NULL));

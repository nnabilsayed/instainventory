-- Add expiry fields to orders
ALTER TABLE public.orders
  ADD COLUMN expires_at TIMESTAMPTZ,
  ADD COLUMN expiry_duration INT NOT NULL DEFAULT 24;
-- expiry_duration stores what the seller picked: 2, 6, or 24 (hours)

-- Index for expiry queries
CREATE INDEX idx_orders_expires ON public.orders(expires_at)
  WHERE status = 'draft';

-- Function to restore stock when a draft order expires
CREATE OR REPLACE FUNCTION public.handle_order_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when expires_at is newly set or order is being expired
  IF NEW.status = 'cancelled' AND OLD.status = 'draft' AND OLD.expires_at IS NOT NULL THEN
    -- Stock was reserved on draft creation, restore it
    UPDATE public.product_variants pv
    SET stock_qty = stock_qty + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND pv.id = oi.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the stock deduction trigger
-- Stock is now deducted on draft creation, not draft→pending
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Stock already reserved on creation, deduct on pending is removed
  -- Restore stock on cancellation from ANY non-delivered status
  IF NEW.status = 'cancelled' AND OLD.status != 'delivered' THEN
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

-- New function: deduct stock immediately on order INSERT (draft creation)
CREATE OR REPLACE FUNCTION public.handle_order_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at based on expiry_duration chosen by seller
  NEW.expires_at = now() + (NEW.expiry_duration || ' hours')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_insert();

-- Deduct stock when order items are inserted (draft creation)
CREATE OR REPLACE FUNCTION public.deduct_stock_on_item_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_qty = stock_qty - NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_item_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_item_insert();

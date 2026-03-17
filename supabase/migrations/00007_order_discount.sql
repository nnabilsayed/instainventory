-- Add discount fields to orders
ALTER TABLE public.orders
  ADD COLUMN discount_type  TEXT CHECK (discount_type IN ('fixed', 'percentage')) DEFAULT NULL,
  ADD COLUMN discount_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0;

-- Update the recalculate_order_total trigger to factor in discount
CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal        NUMERIC(10,2);
  v_shipping        NUMERIC(10,2);
  v_discount_type   TEXT;
  v_discount_value  NUMERIC(10,2);
  v_discount_amount NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM public.order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  SELECT
    shipping_fee,
    discount_type,
    discount_value
  INTO v_shipping, v_discount_type, v_discount_value
  FROM public.orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  IF v_discount_type = 'fixed' THEN
    v_discount_amount = LEAST(v_discount_value, v_subtotal);
  ELSIF v_discount_type = 'percentage' THEN
    v_discount_amount = ROUND((v_subtotal * v_discount_value / 100), 2);
  ELSE
    v_discount_amount = 0;
  END IF;

  UPDATE public.orders
  SET
    subtotal = v_subtotal,
    discount_amount = v_discount_amount,
    total = GREATEST(0, v_subtotal + v_shipping - v_discount_amount)
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.recalculate_on_discount_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal        NUMERIC(10,2);
  v_discount_amount NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM public.order_items
  WHERE order_id = NEW.id;

  IF NEW.discount_type = 'fixed' THEN
    v_discount_amount = LEAST(NEW.discount_value, v_subtotal);
  ELSIF NEW.discount_type = 'percentage' THEN
    v_discount_amount = ROUND((v_subtotal * NEW.discount_value / 100), 2);
  ELSE
    v_discount_amount = 0;
  END IF;

  NEW.discount_amount = v_discount_amount;
  NEW.total = GREATEST(0, v_subtotal + NEW.shipping_fee - v_discount_amount);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_discount_change
  BEFORE UPDATE OF discount_type, discount_value, shipping_fee
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_on_discount_change();

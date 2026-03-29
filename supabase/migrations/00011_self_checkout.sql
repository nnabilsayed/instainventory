ALTER TABLE public.orders
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'self_checkout'));

ALTER TABLE public.shops
  ADD COLUMN self_checkout_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "Public can view shop profiles"
  ON public.shops FOR SELECT
  USING (true);

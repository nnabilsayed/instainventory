-- Stock adjustment log table
CREATE TABLE public.stock_adjustments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id    UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  shop_id       UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  adjustment    INT NOT NULL,
  reason        TEXT,
  stock_before  INT NOT NULL,
  stock_after   INT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_adjustments_variant ON public.stock_adjustments(variant_id);
CREATE INDEX idx_stock_adjustments_shop ON public.stock_adjustments(shop_id, created_at DESC);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own stock adjustments"
  ON public.stock_adjustments FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

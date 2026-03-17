CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_categories_shop_name_unique
  ON public.categories(shop_id, lower(name));
CREATE INDEX idx_categories_shop_sort
  ON public.categories(shop_id, sort_order ASC, created_at ASC);

ALTER TABLE public.products
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_category
  ON public.products(shop_id, category_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own categories"
  ON public.categories FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reviews_order_id_unique
  ON public.reviews(order_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review"
  ON public.reviews
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read approved reviews"
  ON public.reviews
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Sellers can read own shop reviews"
  ON public.reviews
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id
      FROM public.shops
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update own shop reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    shop_id IN (
      SELECT id
      FROM public.shops
      WHERE owner_id = auth.uid()
    )
  );

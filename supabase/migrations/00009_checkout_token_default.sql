ALTER TABLE public.orders
  ALTER COLUMN checkout_token SET DEFAULT gen_random_uuid()::text;

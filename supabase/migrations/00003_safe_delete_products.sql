-- Allow deleting products while keeping order records intact
ALTER TABLE public.order_items 
  ALTER COLUMN variant_id DROP NOT NULL;

-- Change foreign key constraint to SET NULL instead of RESTRICT
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey,
  ADD CONSTRAINT order_items_variant_id_fkey 
    FOREIGN KEY (variant_id) 
    REFERENCES public.product_variants(id) 
    ON DELETE SET NULL;

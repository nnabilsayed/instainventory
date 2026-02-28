-- Migration: Add image_url to product_variants and variant_image_url to order_items
-- Run this in the Supabase SQL Editor

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_image_url TEXT;

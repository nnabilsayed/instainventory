-- Enable uploads to the product-images bucket
CREATE POLICY "Allow public uploads to product-images" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'product-images');

-- Enable uploads to the payment-proofs bucket
CREATE POLICY "Allow public uploads to payment-proofs" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'payment-proofs');

-- Also ensure public can read the images
CREATE POLICY "Allow public read access to product-images" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public read access to payment-proofs" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'payment-proofs');

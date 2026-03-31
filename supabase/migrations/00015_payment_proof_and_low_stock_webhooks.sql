/*
  Creates database webhooks for payment proof uploads and low stock alerts.

  Target endpoint:
    https://instainventory.vercel.app/api/notify

  Event behavior:
    - public.orders UPDATE:
      fires when payment_proof_url changes from null to a non-empty value
    - public.product_variants UPDATE:
      fires on every stock-related update, with filtering handled by the app
*/

DROP TRIGGER IF EXISTS "payment-proof-uploaded" ON public.orders;

CREATE TRIGGER "payment-proof-uploaded"
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (
  NEW.payment_method = 'instapay'
  AND COALESCE(OLD.payment_proof_url, '') = ''
  AND COALESCE(NEW.payment_proof_url, '') <> ''
)
EXECUTE FUNCTION supabase_functions.http_request(
  'https://instainventory.vercel.app/api/notify',
  'POST',
  '{"Content-Type":"application/json","x-webhook-secret":"testing202611","x-event-type":"payment_proof_uploaded"}',
  '{}',
  '1000'
);

DROP TRIGGER IF EXISTS "low-stock-alert" ON public.product_variants;

CREATE TRIGGER "low-stock-alert"
AFTER UPDATE ON public.product_variants
FOR EACH ROW
WHEN (
  NEW.stock_qty IS NOT NULL
  AND NEW.low_stock_threshold IS NOT NULL
  AND NEW.stock_qty > 0
  AND NEW.stock_qty <= NEW.low_stock_threshold
  AND (
    OLD.stock_qty IS NULL
    OR OLD.low_stock_threshold IS NULL
    OR OLD.stock_qty <= 0
    OR OLD.stock_qty > OLD.low_stock_threshold
  )
)
EXECUTE FUNCTION supabase_functions.http_request(
  'https://instainventory.vercel.app/api/notify',
  'POST',
  '{"Content-Type":"application/json","x-webhook-secret":"testing202611","x-event-type":"low_stock"}',
  '{}',
  '1000'
);

/*
  Creates a database webhook for submitted orders.

  Target endpoint:
    https://instainventory.vercel.app/api/notify

  Event behavior:
    - table: public.orders
    - event: UPDATE
    - fires only when status changes from draft -> pending

  Notes:
    - Supabase database webhooks are implemented as SQL triggers using
      supabase_functions.http_request(...)
    - Apply this migration in your Supabase project via Dashboard SQL Editor
      or your normal migration workflow.
*/

DROP TRIGGER IF EXISTS "order-submitted" ON public.orders;

CREATE TRIGGER "order-submitted"
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status
  AND OLD.status = 'draft'
  AND NEW.status = 'pending'
)
EXECUTE FUNCTION supabase_functions.http_request(
  'https://instainventory.vercel.app/api/notify',
  'POST',
  '{"Content-Type":"application/json","x-webhook-secret":"testing202611","x-event-type":"order_submitted"}',
  '{}',
  '1000'
);

/*
  MANUAL STEPS REQUIRED after running this migration:

  1. Deploy the edge function:
     supabase functions deploy cancel-expired-orders

  2. Set the required secrets in Supabase dashboard
     (Settings -> Edge Functions -> Secrets):
     SUPABASE_URL = your project URL
     SUPABASE_SERVICE_ROLE_KEY = your service role key

  3. In Supabase dashboard -> SQL Editor, run:
     ALTER DATABASE postgres
       SET app.supabase_url = 'YOUR_SUPABASE_URL';
     ALTER DATABASE postgres
       SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

  4. Verify the cron job is registered:
     SELECT * FROM cron.job;

  5. To manually trigger a test run:
     SELECT cron.run_job('cancel-expired-orders');
     Then check: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run every 15 minutes
SELECT cron.schedule(
  'cancel-expired-orders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/cancel-expired-orders',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'Authorization',
      'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

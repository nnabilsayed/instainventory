import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // Find all expired draft or pending orders
  const { data: expiredOrders, error } = await supabase
    .from('orders')
    .select('id, order_number, shop_id, checkout_token')
    .in('status', ['draft', 'pending'])
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log('Found expired orders:', expiredOrders?.length ?? 0)

  if (!expiredOrders || expiredOrders.length === 0) {
    return new Response(JSON.stringify({ cancelled: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Cancel them all - the existing handle_order_status_change trigger
  // will automatically restore stock for each one
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .in('id', expiredOrders.map((o) => o.id))

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log(
    `Cancelled ${expiredOrders.length} expired orders:`,
    expiredOrders.map((o) => `#${o.order_number}`).join(', ')
  )

  return new Response(JSON.stringify({ cancelled: expiredOrders.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

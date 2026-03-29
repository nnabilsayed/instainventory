import { createClient } from '@supabase/supabase-js';
import { normalizeEgyptianPhone } from '@/lib/phone';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      name,
      phone,
      city,
      area,
      street,
      notes,
      paymentMethod,
      proofUrl,
      items,
    } = body;

    if (!slug || !name || !phone || !city || !area || !street || !paymentMethod || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id, instapay_number, instapay_name, default_shipping_fee, self_checkout_enabled, whatsapp')
      .eq('slug', slug)
      .single();

    if (!shop || !shop.self_checkout_enabled) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 },
      );
    }

    for (const item of items) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id, stock_qty')
        .eq('id', item.variantId)
        .single();

      if (!variant || variant.stock_qty < item.quantity) {
        return NextResponse.json(
          {
            error: 'STOCK_CONFLICT',
            variantName: item.variantName,
          },
          { status: 409 },
        );
      }
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    let customerId = existing?.id;

    if (!customerId) {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          shop_id: shop.id,
          name,
          phone: normalizedPhone,
        })
        .select('id')
        .single();
      customerId = newCustomer?.id;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        customer_id: customerId,
        status: 'pending',
        source: 'self_checkout',
        payment_method: paymentMethod,
        payment_proof_url: proofUrl ?? null,
        address_name: name,
        address_phone: normalizedPhone,
        address_city: city,
        address_area: area,
        address_street: street,
        notes: notes ?? null,
        shipping_fee: shop.default_shipping_fee ?? 0,
        subtotal: 0,
        total: 0,
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 },
      );
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items.map((item: any) => ({
        order_id: order.id,
        variant_id: item.variantId,
        product_name: item.productName,
        variant_name: item.variantName,
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
      })));

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

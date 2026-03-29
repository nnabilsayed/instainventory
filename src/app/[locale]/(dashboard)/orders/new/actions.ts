'use server';

import { randomUUID } from 'crypto';
import { normalizeEgyptianPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { customerSchema } from '@/lib/validations';

/*
  SECURITY AUDIT — checkout_token
  Generation method: previously nanoid(21) in a client component; now crypto.randomUUID() with database fallback gen_random_uuid()::text
  Generation location: server action in src/app/[locale]/(dashboard)/orders/new/actions.ts
  Entropy: UUID v4 = 122 bits
  Slug cross-validation: yes — fixed in the store checkout page query
  Audit date: 2026-03-18
  Result: FIXED — moved token generation off the client, switched to UUID v4, and bound checkout lookups to shop slug
*/

type DraftOrderCartItem = {
  variant_id: string;
  product_name: string;
  variant_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  variant_image_url?: string | null;
};

type CreateDraftOrderInput = {
  customerMode: 'existing' | 'new';
  selectedCustomerId: string;
  newCustomerName: string;
  newCustomerPhone: string;
  expiryHours: 2 | 6 | 24;
  subtotal: number;
  discountType: 'fixed' | 'percentage' | null;
  discountValue: string;
  cart: DraftOrderCartItem[];
};

export async function createDraftOrder(input: CreateDraftOrderInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id, default_shipping_fee')
    .eq('owner_id', user.id)
    .single();

  if (shopError || !shop) {
    return { error: 'Shop not found' };
  }

  if (input.cart.length === 0) {
    return { error: 'Add at least one item to the order' };
  }

  let finalCustomerId = input.selectedCustomerId;

  if (input.customerMode === 'new') {
    const parsedCustomer = customerSchema.safeParse({
      name: input.newCustomerName,
      phone: input.newCustomerPhone,
    });

    if (!parsedCustomer.success) {
      return { error: parsedCustomer.error.errors[0]?.message ?? 'Invalid customer details' };
    }

    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        shop_id: shop.id,
        name: parsedCustomer.data.name,
        phone: normalizeEgyptianPhone(parsedCustomer.data.phone),
      })
      .select('id')
      .single();

    if (customerError || !newCustomer) {
      return { error: customerError?.message ?? 'Failed to create customer' };
    }

    finalCustomerId = newCustomer.id;
  } else if (!finalCustomerId) {
    return { error: 'Please select a customer.' };
  }

  const shippingFee = Number(shop.default_shipping_fee) || 0;
  const discountValue = input.discountType ? parseFloat(input.discountValue) || 0 : 0;
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      shop_id: shop.id,
      customer_id: finalCustomerId,
      status: 'draft',
      checkout_token: randomUUID(),
      expiry_duration: input.expiryHours,
      subtotal: input.subtotal,
      shipping_fee: shippingFee,
      total: input.subtotal + shippingFee,
      discount_type: input.discountType ?? null,
      discount_value: discountValue,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? 'Failed to create order' };
  }

  const itemsToInsert = input.cart.map((item) => ({
    order_id: order.id,
    variant_id: item.variant_id,
    product_name: item.product_name,
    variant_name: item.variant_name,
    unit_price: item.unit_price,
    quantity: item.quantity,
    line_total: item.line_total,
    variant_image_url: item.variant_image_url || null,
  }));

  const { error: itemError } = await supabase.from('order_items').insert(itemsToInsert);

  if (itemError) {
    return { error: itemError.message };
  }

  return { orderId: order.id };
}

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { orderId, shopId, customerName, rating, comment } = (await request.json()) as {
      comment?: string | null;
      customerName?: string;
      orderId?: string;
      rating?: number;
      shopId?: string;
    };

    const trimmedName = customerName?.trim() ?? '';
    const normalizedRating = Number(rating);

    if (
      !orderId ||
      !shopId ||
      !trimmedName ||
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('shop_id', shopId)
      .maybeSingle();

    if (!order || order.status !== 'delivered') {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Review already submitted' }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from('reviews').insert({
      order_id: orderId,
      shop_id: shopId,
      customer_name: trimmedName,
      rating: normalizedRating,
      comment: comment?.trim() || null,
      is_approved: false,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

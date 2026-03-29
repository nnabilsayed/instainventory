import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

async function getAuthorizedReview(reviewId: string) {
  const supabase = createClient();
  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!shop) {
    return { error: NextResponse.json({ error: 'Shop not found' }, { status: 404 }) };
  }

  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('id, shop_id')
    .eq('id', reviewId)
    .maybeSingle();

  if (!review || review.shop_id !== shop.id) {
    return { error: NextResponse.json({ error: 'Review not found' }, { status: 404 }) };
  }

  return { shopId: shop.id };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authorization = await getAuthorizedReview(params.id);

    if (authorization.error) {
      return authorization.error;
    }

    const body = (await request.json()) as { isApproved?: boolean };

    if (typeof body.isApproved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid approval state' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: body.isApproved })
      .eq('id', params.id)
      .eq('shop_id', authorization.shopId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authorization = await getAuthorizedReview(params.id);

    if (authorization.error) {
      return authorization.error;
    }

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', params.id)
      .eq('shop_id', authorization.shopId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

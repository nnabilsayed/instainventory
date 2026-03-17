import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const adjustSchema = z.object({
  adjustment: z.number().int().refine((n) => n !== 0, 'Adjustment cannot be zero'),
  reason: z.string().max(200).optional().nullable(),
  shop_id: z.string().uuid(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { adjustment, reason, shop_id } = parsed.data;

  const { data: variant, error: fetchError } = await supabase
    .from('product_variants')
    .select('stock_qty, product_id, products!inner(shop_id)')
    .eq('id', params.id)
    .single();

  if (fetchError || !variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  }

  const productsRelation = (variant as {
    products?: { shop_id?: string } | { shop_id?: string }[];
  }).products;
  const productShopId =
    productsRelation && !Array.isArray(productsRelation) ? productsRelation.shop_id ?? null : null;

  if (productShopId !== shop_id) {
    return NextResponse.json({ error: 'Variant does not belong to this shop' }, { status: 403 });
  }

  const stockBefore = Number(variant.stock_qty) || 0;
  const stockAfter = Math.max(0, stockBefore + adjustment);

  const { error: updateError } = await supabase
    .from('product_variants')
    .update({ stock_qty: stockAfter })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase.from('stock_adjustments').insert({
    variant_id: params.id,
    shop_id,
    adjustment,
    reason: reason || null,
    stock_before: stockBefore,
    stock_after: stockAfter,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    stock_qty: stockAfter,
    adjustment,
    stock_before: stockBefore,
  });
}

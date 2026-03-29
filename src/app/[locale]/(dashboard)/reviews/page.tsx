import { ReviewsClient } from './reviews-client';
import { createClient } from '@/lib/supabase/server';

type ReviewOrder = {
  order_number: number | null;
};

type ReviewItem = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  order: ReviewOrder | ReviewOrder[] | null;
};

export const revalidate = 0;

export default async function ReviewsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Unauthorized</div>;
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!shop) {
    return <div>Shop not found</div>;
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      `
        id,
        customer_name,
        rating,
        comment,
        is_approved,
        created_at,
        order:orders(order_number)
      `,
    )
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  const typedReviews = (reviews ?? []) as ReviewItem[];

  return <ReviewsClient initialReviews={typedReviews} />;
}

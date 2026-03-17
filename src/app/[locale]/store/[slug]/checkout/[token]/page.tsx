import CheckoutPage from '@/components/checkout/checkout-page';

export default function StoreCheckoutPage({
  params,
}: {
  params: { token: string; slug: string; locale: string };
}) {
  return <CheckoutPage token={params.token} />;
}

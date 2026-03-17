import CheckoutPageContent from '@/components/checkout/checkout-page';

export default function CheckoutTokenPage({
  params,
}: {
  params: { token: string; locale: string };
}) {
  return <CheckoutPageContent token={params.token} />;
}

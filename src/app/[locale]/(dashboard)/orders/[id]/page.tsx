import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OrderActions from './order-actions';
import ReceiptModal from './receipt-modal';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function OrderDetailPage({
  params
}: {
  params: { id: string, locale: string }
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id, name, slug').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const { data: order, error } = await supabase
    .from('orders')
    .select(`*, customers (*), order_items (*)`)
    .eq('id', params.id)
    .eq('shop_id', shop.id)
    .single();

  if (error || !order) notFound();

  const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${params.locale}/checkout/${order.checkout_token}`;

  const statusBadge = () => {
    const map: Record<string, JSX.Element> = {
      draft:     <Badge variant="secondary">Draft</Badge>,
      pending:   <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>,
      confirmed: <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Confirmed</Badge>,
      shipped:   <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Shipped</Badge>,
      delivered: <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Delivered</Badge>,
      cancelled: <Badge variant="destructive">Cancelled</Badge>,
    };
    return map[order.status] || <Badge variant="secondary">{order.status}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 flex-wrap">
            Order #{order.order_number}
            {statusBadge()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Created on {format(new Date(order.created_at), 'PPP')}
          </p>
        </div>
        <OrderActions orderId={order.id} currentStatus={order.status} paymentMethod={order.payment_method} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Items & Shipping */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-0"><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit_price} EGP</TableCell>
                      <TableCell className="text-right font-medium">{item.line_total} EGP</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 bg-muted/40 border-t space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{order.subtotal} EGP</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span><span>{order.shipping_fee} EGP</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span><span>{order.total} EGP</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Shipping Details</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {order.address_city ? (
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium text-muted-foreground inline-block w-24">Recipient:</span> {order.address_name}</div>
                  <div><span className="font-medium text-muted-foreground inline-block w-24">Phone:</span> {order.address_phone}</div>
                  <div><span className="font-medium text-muted-foreground inline-block w-24">Region:</span> {order.address_city} - {order.address_area}</div>
                  <div><span className="font-medium text-muted-foreground inline-block w-24">Address:</span> {order.address_street}</div>
                  {order.notes && (
                    <Alert className="mt-3">
                      <AlertDescription><span className="font-medium">Note: </span>{order.notes}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Address not provided yet. Customer will fill this during checkout.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Checkout Link, Customer, Payment */}
        <div className="space-y-6">
          {['draft', 'pending'].includes(order.status) && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-blue-900 text-base">Share Checkout Link</CardTitle>
                <p className="text-xs text-blue-700">Send this link to the customer to collect their address and payment.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  type="text" readOnly value={checkoutUrl}
                  className="w-full border border-blue-300 rounded-md p-2 text-xs bg-white text-slate-700 focus:outline-none"
                />
                <a
                  href={`https://wa.me/${order.customers?.phone}?text=${encodeURIComponent(`Hello! Here is your order link for ${shop.name}: \n\n${checkoutUrl} \n\nPlease complete checkout to reserve your items.`)}`}
                  target="_blank" rel="noreferrer"
                  className="mt-1 w-full flex items-center justify-center bg-[#25D366] text-white py-2 rounded-md font-medium text-sm hover:bg-[#128C7E] transition-colors"
                >
                  Send via WhatsApp
                </a>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.customers?.name}</p>
              <p className="text-muted-foreground">{order.customers?.phone}</p>
              {order.customers?.instagram && <p className="text-muted-foreground">IG: {order.customers.instagram}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment Info</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {order.payment_method ? (
                <div className="space-y-3">
                  <p><span className="text-muted-foreground">Method: </span><span className="uppercase font-bold">{order.payment_method}</span></p>
                  {order.payment_method === 'instapay' && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-2">Transfer Receipt:</p>
                      {order.payment_proof_url ? (
                        <ReceiptModal imageUrl={order.payment_proof_url} />
                      ) : (
                        <span className="text-destructive italic">No receipt uploaded</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Payment not selected yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

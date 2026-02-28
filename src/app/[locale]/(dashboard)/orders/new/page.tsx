'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function NewOrderPage() {
  const router = useRouter();
  const { locale } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [qty, setQty] = useState(1);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
      if (!shop) return;

      const [pRes, cRes] = await Promise.all([
        supabase.from('products').select(`*, product_variants(*, image_url)`).eq('shop_id', shop.id).eq('is_active', true).order('name'),
        supabase.from('customers').select('*').eq('shop_id', shop.id).order('name')
      ]);

      if (pRes.data) setProducts(pRes.data);
      if (cRes.data) setCustomers(cRes.data);
    }
    loadData();
  }, []);

  const addToCart = () => {
    if (!selectedVariantId) return;
    let foundProduct = null;
    let foundVariant = null;
    for (const p of products) {
      const v = p.product_variants.find((v: any) => v.id === selectedVariantId);
      if (v) { foundProduct = p; foundVariant = v; break; }
    }
    if (!foundProduct || !foundVariant) return;
    const unitPrice = foundVariant.price_override ?? foundProduct.price;
    const existingIndex = cart.findIndex(item => item.variant_id === selectedVariantId);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += qty;
      newCart[existingIndex].line_total = newCart[existingIndex].quantity * unitPrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        variant_id: selectedVariantId,
        product_name: foundProduct.name,
        variant_name: foundVariant.name,
        unit_price: unitPrice,
        quantity: qty,
        line_total: qty * unitPrice,
        stock_qty: foundVariant.stock_qty,
        variant_image_url: foundVariant.image_url || null
      }]);
    }
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.line_total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { setError("Add at least one item to the cart."); return; }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: shop } = await supabase.from('shops').select('id, default_shipping_fee').eq('owner_id', user.id).single();
    if (!shop) { setError("Shop not found"); setLoading(false); return; }

    let finalCustomerId = selectedCustomerId;
    if (isNewCustomer) {
      if (!newCustomerName || !newCustomerPhone) {
        setError("Please provide name and phone for the new customer.");
        setLoading(false); return;
      }
      const { data: nCust, error: custErr } = await supabase
        .from('customers').insert({ shop_id: shop.id, name: newCustomerName, phone: newCustomerPhone })
        .select('id').single();
      if (custErr) { setError(custErr.message); setLoading(false); return; }
      finalCustomerId = nCust.id;
    } else if (!finalCustomerId) {
      setError("Please select or create a customer."); setLoading(false); return;
    }

    const token = nanoid(21);
    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      shop_id: shop.id, customer_id: finalCustomerId, status: 'draft',
      checkout_token: token, subtotal: cartTotal,
      shipping_fee: shop.default_shipping_fee, total: cartTotal + shop.default_shipping_fee
    }).select('id').single();

    if (orderErr || !order) { setError(orderErr?.message || "Failed to create order"); setLoading(false); return; }

    const itemsToInsert = cart.map(item => ({
      order_id: order.id, variant_id: item.variant_id, product_name: item.product_name,
      variant_name: item.variant_name, unit_price: item.unit_price, quantity: item.quantity,
      line_total: item.line_total, variant_image_url: item.variant_image_url || null
    }));

    const { error: itemErr } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemErr) { setError(itemErr.message); setLoading(false); return; }

    router.push(`/${locale}/orders/${order.id}`);
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Draft New Order</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewCustomer}
                  onChange={(e) => setIsNewCustomer(e.target.checked)}
                  className="rounded border-input h-4 w-4"
                />
                Create New Customer
              </label>

              {isNewCustomer ? (
                <div className="space-y-3 p-3 bg-muted rounded-md border">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Ali Omar" />
                  </div>
                  <div className="space-y-1">
                    <Label>WhatsApp Number</Label>
                    <Input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="+201..." />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Select Existing Customer</Label>
                  <Select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add to Order</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Select Product &amp; Variant</Label>
                <Select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)}>
                  <option value="">-- Choose Item --</option>
                  {products.map(p => (
                    <optgroup key={p.id} label={p.name}>
                      {p.product_variants.map((v: any) => (
                        <option key={v.id} value={v.id} disabled={v.stock_qty <= 0}>
                          {v.name} - {v.price_override || p.price} EGP {v.stock_qty <= 0 ? '(Out of Stock)' : `(${v.stock_qty} in stock)`}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </div>
              <div className="flex gap-3 items-end">
                <div className="space-y-1 w-24">
                  <Label>Qty</Label>
                  <Input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
                </div>
                <Button type="button" onClick={addToCart} disabled={!selectedVariantId}>
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Cart */}
        <div>
          <Card className="sticky top-24">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center border-dashed border-2 rounded-md">Cart is empty</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm p-2 bg-muted rounded-md border">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-muted-foreground text-xs">{item.variant_name}</div>
                        <div className="text-muted-foreground text-xs">{item.unit_price} EGP × {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.line_total}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFromCart(idx)} className="text-destructive h-6 w-6 p-0">✕</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Items Total</span>
                <span>{cartTotal} EGP</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">+ Default shipping applied on creation</p>

              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <Button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? 'Creating...' : 'Create Draft & Get Link'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

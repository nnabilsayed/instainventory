'use client';

import { createDraftOrder } from './actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhoneDisplay } from '@/lib/phone';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { customerSchema } from '@/lib/validations';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Link as LinkIcon, Minus, Plus, Search, X } from 'lucide-react';

type PickerOption = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

function PickerField({
  label,
  placeholder,
  options,
  value,
  onSelect,
  error,
}: {
  label: string;
  placeholder: string;
  options: PickerOption[];
  value?: PickerOption | null;
  onSelect: (option: PickerOption) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLowerCase().includes(lower)
    );
  }, [options, query]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={[
            'flex min-h-[44px] w-full items-center justify-between rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 text-sm text-primary',
            error ? 'border-[var(--danger-text)]' : 'border-[var(--border)]',
          ].join(' ')}
        >
          <span className={value ? 'text-primary' : 'text-secondary'}>
            {value ? value.label : placeholder}
          </span>
          <ChevronDown size={16} className="text-secondary" />
        </button>

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)] md:absolute md:inset-x-0 md:top-[calc(100%+8px)] md:bottom-auto md:rounded-[var(--radius-lg)]">
              <div className="mb-3 flex items-center justify-between md:hidden">
                <p className="text-sm font-semibold text-primary">{label}</p>
                <button type="button" onClick={() => setOpen(false)} className="text-secondary">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-3">
                <Search size={16} className="text-secondary" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${label.toLowerCase()}`}
                  className="h-11 w-full bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
                />
              </div>
              <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto md:max-h-72">
                {filteredOptions.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-3 py-4 text-sm text-secondary">
                    No results found.
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => {
                        onSelect(option);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex w-full items-start justify-between rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-3 text-start transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        <span className="block text-sm font-medium text-primary">{option.label}</span>
                        {option.description ? (
                          <span className="mt-1 block text-xs text-secondary">{option.description}</span>
                        ) : null}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
      <FieldError message={error} />
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const { locale } = useParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [expiryHours, setExpiryHours] = useState<2 | 6 | 24>(24);

  const [cart, setCart] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage' | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [showDiscountForm, setShowDiscountForm] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
      if (!shop) return;

      const [pRes, cRes] = await Promise.all([
        supabase.from('products').select('*, product_variants(*, image_url)').eq('shop_id', shop.id).eq('is_active', true).order('name'),
        supabase.from('customers').select('*').eq('shop_id', shop.id).order('name'),
      ]);

      if (pRes.data) setProducts(pRes.data);
      if (cRes.data) setCustomers(cRes.data);
    }

    loadData();
  }, []);

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: customer.name,
    description: customer.phone ? formatPhoneDisplay(customer.phone) : '',
  }));

  const variantOptions = products.flatMap((product) =>
    product.product_variants.map((variant: any) => ({
      id: variant.id,
      label: `${product.name} · ${variant.name}`,
      description:
        variant.stock_qty <= 0
          ? 'Out of stock'
          : `${variant.price_override || product.price} EGP · ${variant.stock_qty} in stock`,
      disabled: variant.stock_qty <= 0,
    }))
  );

  const selectedCustomer = customerOptions.find((customer) => customer.id === selectedCustomerId) ?? null;
  const selectedVariant = variantOptions.find((variant) => variant.id === selectedVariantId) ?? null;
  const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = (() => {
    if (!discountType || !discountValue) return 0;
    const val = parseFloat(discountValue);
    if (Number.isNaN(val) || val <= 0) return 0;
    if (discountType === 'fixed') return Math.min(val, subtotal);
    if (discountType === 'percentage') return Math.round((subtotal * Math.min(val, 100) / 100) * 100) / 100;
    return 0;
  })();

  const addToCart = () => {
    if (!selectedVariantId) return;

    let foundProduct = null;
    let foundVariant = null;

    for (const product of products) {
      const variant = product.product_variants.find((entry: any) => entry.id === selectedVariantId);
      if (variant) {
        foundProduct = product;
        foundVariant = variant;
        break;
      }
    }

    if (!foundProduct || !foundVariant) return;

    const unitPrice = foundVariant.price_override ?? foundProduct.price;
    const existingIndex = cart.findIndex((item) => item.variant_id === selectedVariantId);

    if (existingIndex >= 0) {
      const nextCart = [...cart];
      nextCart[existingIndex].quantity += qty;
      nextCart[existingIndex].line_total = nextCart[existingIndex].quantity * unitPrice;
      setCart(nextCart);
    } else {
      setCart([
        ...cart,
        {
          variant_id: selectedVariantId,
          product_name: foundProduct.name,
          variant_name: foundVariant.name,
          unit_price: unitPrice,
          quantity: qty,
          line_total: qty * unitPrice,
          stock_qty: foundVariant.stock_qty,
          variant_image_url: foundVariant.image_url || null,
        },
      ]);
    }

    setQty(1);
    setSelectedVariantId('');
    setErrors((currentErrors) => ({ ...currentErrors, cart: '' }));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (customerMode === 'existing' && !selectedCustomerId) {
      nextErrors.customer = 'Please select or create a customer';
    }

    if (customerMode === 'new') {
      const result = customerSchema.safeParse({
        name: newCustomerName,
        phone: newCustomerPhone,
      });

      if (!result.success) {
        result.error.errors.forEach((issue) => {
          nextErrors[`customer_${String(issue.path[0])}`] = issue.message;
        });
      }
    }

    if (cart.length === 0) {
      nextErrors.cart = 'Add at least one item to the order';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setErrors({});
    const loadingToast = notify.loading('Creating draft...');

    const result = await createDraftOrder({
      customerMode,
      selectedCustomerId,
      newCustomerName,
      newCustomerPhone,
      expiryHours,
      subtotal,
      discountType,
      discountValue,
      cart,
    });

    if (!result.orderId) {
      setError(result.error || 'Failed to create order');
      notify.dismiss(loadingToast);
      if (result.error?.toLowerCase().includes('customer')) {
        notify.customerError();
      } else {
        notify.orderError();
      }
      setLoading(false);
      return;
    }

    notify.dismiss(loadingToast);
    notify.draftCreated();
    router.push(`/${locale}/orders/${result.orderId}`);
  };

  const summaryContent = (
    <div className="space-y-4">
      <div className="space-y-3">
        {cart.length === 0 ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-4 py-8 text-center text-sm text-secondary">
            Cart is empty
          </div>
        ) : (
          cart.map((item, index) => (
            <div key={`${item.variant_id}-${index}`} className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-3">
              <div>
                <p className="font-medium text-primary">{item.product_name}</p>
                <p className="text-sm text-secondary">{item.variant_name}</p>
                <p className="text-xs text-tertiary">
                  {item.quantity} x {item.unit_price} EGP
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{item.line_total} EGP</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFromCart(index)} className="text-[var(--danger-text)]">
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-secondary">
          <span>Subtotal</span>
          <span>{subtotal} EGP</span>
        </div>
        {discountAmount > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-[var(--success-text)]">
              <span>Discount</span>
              {discountType === 'percentage' ? (
                <span className="text-xs">({discountValue}%)</span>
              ) : null}
            </span>
            <span className="font-medium text-[var(--success-text)]">
              - {discountAmount.toFixed(2)} EGP
            </span>
          </div>
        ) : null}
        <div className="flex items-start justify-between text-secondary">
          <div>
            <span className="text-sm text-primary">Shipping</span>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Default applied on creation</p>
          </div>
          <span className="text-sm text-secondary">-</span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between text-base font-semibold text-primary">
        <span>Total</span>
        <span>~{Math.max(0, subtotal - discountAmount).toFixed(2)} EGP</span>
      </div>

      {!showDiscountForm ? (
        <button
          type="button"
          onClick={() => setShowDiscountForm(true)}
          className="flex h-9 w-full items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-xs text-secondary transition-colors hover:border-[var(--accent-navy)] hover:text-[var(--accent-navy)]"
        >
          <span>+</span> Add discount
        </button>
      ) : (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-secondary">Discount</p>
            <button
              type="button"
              onClick={() => {
                setDiscountType(null);
                setDiscountValue('');
                setShowDiscountForm(false);
              }}
              className="flex items-center gap-0.5 text-xs text-[var(--danger-text)] hover:underline"
            >
              <X size={10} /> Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={cn(
                'h-8 rounded-[var(--radius-md)] border text-xs font-medium transition-colors',
                discountType === 'fixed'
                  ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                  : 'border-[var(--border)] text-secondary hover:bg-[var(--surface)]'
              )}
            >
              Fixed (EGP)
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={cn(
                'h-8 rounded-[var(--radius-md)] border text-xs font-medium transition-colors',
                discountType === 'percentage'
                  ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-white'
                  : 'border-[var(--border)] text-secondary hover:bg-[var(--surface)]'
              )}
            >
              Percentage (%)
            </button>
          </div>

          {discountType ? (
            <div className="relative">
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'fixed' ? '50' : '10'}
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] ps-3 pe-12 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-tertiary">
                {discountType === 'fixed' ? 'EGP' : '%'}
              </span>
            </div>
          ) : null}

          {discountAmount > 0 ? (
            <p className="text-xs font-medium text-[var(--success-text)]">
              Customer saves {discountAmount.toFixed(2)} EGP
            </p>
          ) : null}
        </div>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {errors.cart ? (
        <div className="mt-2 rounded-[var(--radius-md)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger-text)]">
          ! {errors.cart}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Link expires in</p>
        <div className="grid grid-cols-3 gap-2">
          {([2, 6, 24] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setExpiryHours(h)}
              className={cn(
                'min-h-[44px] rounded-[var(--radius-md)] text-sm font-medium transition-all border',
                expiryHours === h
                  ? 'bg-[var(--accent-navy)] text-white border-[var(--accent-navy)]'
                  : 'bg-transparent border-[var(--border)] text-secondary hover:bg-[var(--surface-hover)]'
              )}
            >
              {h === 2 ? '2 hours' : h === 6 ? '6 hours' : '24 hours'}
            </button>
          ))}
        </div>
        <p className="text-xs text-tertiary">
          Stock is reserved immediately. Link stops working after this time if not completed.
        </p>
      </div>

      <Button type="submit" disabled={loading || cart.length === 0} className="w-full">
        <LinkIcon size={14} />
        <span>{loading ? 'Creating...' : 'Create Draft & Get Link'}</span>
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-4">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary">Draft New Order</h1>
          <p className="text-sm text-secondary">Build the order first, then share the checkout link.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--surface-hover)] p-1">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('existing');
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    customer: '',
                    customer_name: '',
                    customer_phone: '',
                  }));
                }}
                className={[
                  'rounded-[calc(var(--radius-md)-2px)] px-3 py-2 text-sm font-medium transition-colors',
                  customerMode === 'existing'
                    ? 'bg-[var(--accent-navy)] text-white'
                    : 'text-secondary',
                ].join(' ')}
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('new');
                  setErrors((currentErrors) => ({ ...currentErrors, customer: '' }));
                }}
                className={[
                  'rounded-[calc(var(--radius-md)-2px)] px-3 py-2 text-sm font-medium transition-colors',
                  customerMode === 'new'
                    ? 'bg-[var(--accent-navy)] text-white'
                    : 'text-secondary',
                ].join(' ')}
              >
                New Customer
              </button>
            </div>

            {customerMode === 'existing' ? (
              <PickerField
                label="Customer"
                placeholder="Select an existing customer"
                options={customerOptions}
                value={selectedCustomer}
                onSelect={(option) => {
                  setSelectedCustomerId(option.id);
                  setErrors((currentErrors) => ({ ...currentErrors, customer: '' }));
                }}
                error={errors.customer}
              />
            ) : (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    error={!!errors.customer_name}
                    value={newCustomerName}
                    onChange={(event) => {
                      setNewCustomerName(event.target.value);
                      setErrors((currentErrors) => ({ ...currentErrors, customer_name: '' }));
                    }}
                    placeholder="Ali Omar"
                  />
                  <FieldError message={errors.customer_name} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    error={!!errors.customer_phone}
                    value={newCustomerPhone}
                    onChange={(event) => {
                      setNewCustomerPhone(event.target.value);
                      setErrors((currentErrors) => ({ ...currentErrors, customer_phone: '' }));
                    }}
                    placeholder="01xxxxxxxxx"
                  />
                  <FieldError message={errors.customer_phone} />
                  <p className="mt-1 text-xs text-tertiary">Enter Egyptian mobile number - any format accepted</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Add to Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PickerField
              label="Product & Variant"
              placeholder="Choose a product variant"
              options={variantOptions}
              value={selectedVariant}
              onSelect={(option) => setSelectedVariantId(option.id)}
            />

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" onClick={() => setQty((current) => Math.max(1, current - 1))}>
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(event) => setQty(Math.max(1, parseInt(event.target.value || '1', 10)))}
                  className="text-center"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setQty((current) => current + 1)}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className={['w-full', !selectedVariantId ? 'opacity-50' : ''].join(' ')}
              aria-disabled={!selectedVariantId}
              onClick={addToCart}
            >
              Add Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>{summaryContent}</CardContent>
        </Card>
      </div>
    </form>
  );
}

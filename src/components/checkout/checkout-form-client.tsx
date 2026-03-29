'use client';

import { CheckoutCountdown } from '@/components/checkout/checkout-countdown';
import { storageImage } from '@/lib/image';
import { formatPhoneForWhatsApp } from '@/lib/phone';
import { formatFileSize, validatePaymentProof } from '@/lib/validate-upload';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { isOrderExpired } from '@/lib/order-expiry';
import { CheckCircle2, Clock3, Lock, MessageCircle, Package, Smartphone, Tag, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

function CheckoutHeader({ shop, orderNumber }: { shop: any; orderNumber: string | number }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4">
      {shop?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storageImage(shop.logo_url, { width: 80, height: 80 }) ?? shop.logo_url}
          alt={shop?.name}
          width={80}
          height={80}
          className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-md)] object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-lg font-bold text-white">
          {shop?.name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-primary">{shop?.name}</p>
        <p className="text-xs text-secondary">Secure checkout &middot; Order #{orderNumber}</p>
      </div>

      <div className="ms-auto flex flex-shrink-0 items-center gap-1 text-xs text-secondary">
        <Lock size={11} />
        <span>Secure</span>
      </div>
    </div>
  );
}

function CheckoutHeaderCard({
  shop,
  subtitle,
}: {
  shop: any;
  subtitle: string;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-3">
        {shop?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageImage(shop.logo_url, { width: 80, height: 80, resize: 'cover' }) ?? shop.logo_url}
            alt={shop?.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-navy)] text-[15px] font-medium text-white">
            {shop?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-[var(--text-primary)]">{shop?.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
        </div>

        <div className="ms-auto flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <Lock size={14} />
          <span>Secure</span>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

function formatMoney(value: number | string) {
  return `${value} EGP`;
}

type OrderItem = {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

function CountdownBar({
  expiresAt,
  onExpire,
}: {
  expiresAt?: string | null;
  onExpire?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }

    function updateRemaining() {
      if (!expiresAt) {
        setRemainingMs(null);
        return;
      }

      setRemainingMs(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || remainingMs === null) {
    return null;
  }

  const isUrgent = remainingMs < 10 * 60 * 1000;

  return (
    <section
      className={cn(
        'rounded-[var(--radius-lg)] border p-4',
        isUrgent
          ? 'border-[var(--danger-text)] bg-[var(--danger-bg)] text-[var(--danger-text)]'
          : 'border-[var(--warning-text)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
      )}
    >
      <div className="flex items-center justify-between gap-3 text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <Clock3 size={14} />
          <span>This link expires in</span>
        </span>

        <div
          className={cn(
            'shrink-0',
            '[&>div]:border-0 [&>div]:bg-transparent [&>div]:px-0 [&>div]:py-0 [&>div]:text-inherit',
            '[&>div]:justify-end [&>div]:rounded-none [&>div>span:first-child]:hidden',
            '[&>div>span:last-child]:text-base [&>div>span:last-child]:font-bold',
          )}
        >
          <CheckoutCountdown expiresAt={expiresAt} onExpire={onExpire} />
        </div>
      </div>
    </section>
  );
}

function OrderSummaryCard({ order, orderItems }: { order: any; orderItems: OrderItem[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <SectionTitle>Order summary</SectionTitle>

      <div>
        {orderItems.map((item) => (
          <div key={item.id} className="mb-2 rounded-[var(--radius-md)] bg-[var(--background)] p-3 last:mb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.product_name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.variant_name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {item.quantity} × {item.unit_price} EGP
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-[var(--text-primary)]">{item.line_total} EGP</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>

        {Number(order.discount_amount) > 0 ? (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-[var(--success-text)]">
              <Tag size={11} />
              <span>
                Discount
                {order.discount_type === 'percentage' ? ` (${order.discount_value}% off)` : ''}
              </span>
            </span>
            <span className="font-medium text-[var(--success-text)]">
              - {Number(order.discount_amount).toFixed(2)} EGP
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>Shipping</span>
          <span>{formatMoney(order.shipping_fee)}</span>
        </div>

        <div className="my-2 border-t border-[var(--border)]" />

        <div className="flex items-center justify-between text-sm font-medium text-[var(--text-primary)]">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </section>
  );
}

function PaymentMethodOption({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mb-2 flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-start transition-colors',
        selected
          ? 'border-[var(--accent-navy)] bg-[var(--surface-hover)]'
          : 'hover:border-[var(--border-strong)]',
      )}
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full',
          selected ? 'border-2 border-[var(--accent-navy)]' : 'border border-[var(--border-strong)]',
        )}
      >
        {selected ? <span className="h-[8px] w-[8px] rounded-full bg-[var(--accent-navy)]" /> : null}
      </span>

      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-center text-[var(--text-secondary)]',
          selected && 'text-[var(--accent-navy)]',
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[var(--text-primary)]">{title}</span>
        <span className="block text-[11px] text-[var(--text-secondary)]">{description}</span>
      </span>
    </button>
  );
}

export default function CheckoutFormClient({
  order,
  shop,
  trackingToken,
  storeSlug,
}: {
  order: any;
  shop: any;
  trackingToken: string;
  storeSlug: string;
}) {
  const supabase = createClient();

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(order.payment_method));
  const [addressName, setAddressName] = useState(order.address_name ?? '');
  const [addressPhone, setAddressPhone] = useState(order.address_phone ?? '');
  const [addressCity, setAddressCity] = useState(order.address_city ?? '');
  const [addressArea, setAddressArea] = useState(order.address_area ?? '');
  const [addressStreet, setAddressStreet] = useState(order.address_street ?? '');
  const [notes, setNotes] = useState(order.notes ?? '');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'instapay'>(order.payment_method ?? 'cod');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState('');
  const [proofPreview, setProofPreview] = useState('');

  const orderItems = useMemo<OrderItem[]>(() => order.order_items ?? [], [order.order_items]);

  const expireOrder = useCallback(async () => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id).eq('status', 'draft');
    setExpired(true);
  }, [order.id, supabase]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setProofError('');
    setProofFile(null);
    setProofPreview('');

    if (!file) return;

    const result = validatePaymentProof(file);
    if (!result.valid) {
      setProofError(result.error ?? 'Invalid file');
      event.target.value = '';
      return;
    }

    setProofFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setProofPreview((loadEvent.target?.result as string) ?? '');
      reader.readAsDataURL(file);
      return;
    }

    setProofPreview('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setProofError('');

    if (isOrderExpired(order.expires_at)) {
      await expireOrder();
      return;
    }

    if (paymentMethod === 'instapay' && !proofFile) {
      setProofError('Please upload your payment proof to continue');
      document.getElementById('proof-upload-zone')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    if (proofFile) {
      const recheck = validatePaymentProof(proofFile);
      if (!recheck.valid) {
        setProofError(recheck.error ?? 'Invalid file');
        return;
      }
    }

    setSubmitting(true);

    let proofUrl: string | null = null;

    if (paymentMethod === 'instapay') {
      const selectedProof = proofFile;
      if (!selectedProof) {
        setProofError('Please upload your payment proof to continue');
        setSubmitting(false);
        return;
      }

      const extension = selectedProof.name.split('.').pop() ?? 'png';
      const filePath = `${order.shop_id}/${order.id}-${Date.now()}.${extension}`;

      setUploading(true);
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, selectedProof);
      setUploading(false);

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
      proofUrl = publicUrl;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        address_name: addressName,
        address_phone: addressPhone,
        address_city: addressCity,
        address_area: addressArea,
        address_street: addressStreet,
        notes,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        status: 'pending',
      })
      .eq('id', order.id)
      .eq('status', 'draft')
      .gt('expires_at', new Date().toISOString());

    if (updateError) {
      setError('This checkout link can no longer accept submissions. Please contact the seller for a new link.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (expired) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(232,98,74,0.08),_transparent_35%),var(--background)] px-4 py-10">
        <div className="mx-auto max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <CheckoutHeader shop={shop} orderNumber={order.order_number} />
          <div className="space-y-3 px-6 py-8 text-center">
            <h1 className="text-2xl font-semibold text-primary">Checkout link expired</h1>
            <p className="text-sm leading-relaxed text-secondary">
              This order expired before it was completed. Please contact the seller for a new checkout link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-10">
        <div className="mx-auto max-w-lg px-4">
          <section className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-bg)]">
              <CheckCircle2 size={32} className="text-[var(--success-text)]" />
            </div>

            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Order placed! 🎉</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Order #{order.order_number}</p>

            <div className="mb-4 mt-4 border-t border-[var(--border)]" />

          <div className="text-start text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">What happens next?</p>
            <ol className="mt-3 space-y-2 ps-5">
              <li>The seller will review your order</li>
              <li>You&apos;ll receive a WhatsApp message to confirm</li>
              <li>Your order will be shipped once confirmed</li>
            </ol>
          </div>

          <a
            href={`/store/${storeSlug}/order/${trackingToken}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              marginBottom: '12px',
              border: '1.5px solid var(--accent-navy)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              color: 'var(--accent-navy)',
              fontWeight: 500,
              background: 'var(--surface)',
              textDecoration: 'none',
            }}
          >
            <Package size={16} />
            Track your order
          </a>
        </section>

          <section className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Order summary</h2>

            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.product_name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{item.variant_name}</p>
                  </div>

                  <div className="shrink-0 text-end">
                    <p className="text-xs text-[var(--text-secondary)]">× {item.quantity}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.line_total} EGP</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4 mt-4 border-t border-[var(--border)]" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{order.subtotal} EGP</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Shipping</span>
                <span>{order.shipping_fee} EGP</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                <span>Total</span>
                <span>{order.total} EGP</span>
              </div>
            </div>
          </section>

          {(shop as any)?.theme?.thank_you_message ? (
            <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--surface-hover)] p-4 text-center text-sm italic text-[var(--text-secondary)]">
              {(shop as any).theme.thank_you_message}
            </div>
          ) : null}

          {shop?.whatsapp ? (
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(shop.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--success-text)] px-4 text-sm font-medium text-white"
            >
              <MessageCircle size={18} />
              <span>Contact seller on WhatsApp</span>
            </a>
          ) : null}

          <a
            href={`/store/${shop?.slug}`}
            className="mt-4 block text-center text-sm text-[var(--text-secondary)]"
          >
            ← Back to store
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-4">
      <div className="mx-auto flex max-w-[480px] flex-col gap-3">
        <CheckoutHeaderCard shop={shop} subtitle={`Secure checkout · Order #${order.order_number}`} />

        <CountdownBar
          expiresAt={order.expires_at}
          onExpire={() => {
            void expireOrder();
          }}
        />

        <OrderSummaryCard order={order} orderItems={orderItems} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <SectionTitle>Delivery details</SectionTitle>

            <div className="grid grid-cols-2 gap-[10px] max-[400px]:grid-cols-1">
              <div className="space-y-1">
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Full name <span className="text-[var(--accent-coral)]">*</span>
                </label>
                <input
                  required
                  value={addressName}
                  onChange={(event) => setAddressName(event.target.value)}
                  placeholder="Ali Ahmed"
                  className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Phone <span className="text-[var(--accent-coral)]">*</span>
                </label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={addressPhone}
                  onChange={(event) => setAddressPhone(event.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  City / Governorate <span className="text-[var(--accent-coral)]">*</span>
                </label>
                <input
                  required
                  value={addressCity}
                  onChange={(event) => setAddressCity(event.target.value)}
                  placeholder="Cairo"
                  className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Area <span className="text-[var(--accent-coral)]">*</span>
                </label>
                <input
                  required
                  value={addressArea}
                  onChange={(event) => setAddressArea(event.target.value)}
                  placeholder="Nasr City"
                  className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1 max-[400px]:col-span-1">
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Street address and building <span className="text-[var(--accent-coral)]">*</span>
                </label>
                <input
                  required
                  value={addressStreet}
                  onChange={(event) => setAddressStreet(event.target.value)}
                  placeholder="12 Example Street, Building 5, Apt 3"
                  className="min-h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1 max-[400px]:col-span-1">
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                  Delivery notes <span className="text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Any special delivery instructions..."
                  rows={2}
                  className="min-h-[88px] w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <SectionTitle>Payment method</SectionTitle>

            <PaymentMethodOption
              selected={paymentMethod === 'cod'}
              icon={<Wallet size={16} />}
              title="Cash on Delivery"
              description="Pay when your order arrives"
              onClick={() => {
                setPaymentMethod('cod');
                setProofError('');
              }}
            />

            <PaymentMethodOption
              selected={paymentMethod === 'instapay'}
              icon={<Smartphone size={16} />}
              title="InstaPay"
              description="Transfer first, then upload receipt"
              onClick={() => {
                setPaymentMethod('instapay');
                setProofError('');
              }}
            />

            {paymentMethod === 'instapay' ? (
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="space-y-2">
                  {[
                    'Open your banking app',
                    'Go to InstaPay',
                    `Enter number: ${shop?.instapay_number || 'Not available'}`,
                    `Enter name: ${shop?.instapay_name || 'Seller name'}`,
                    `Enter amount: ${order.total} EGP`,
                  ].map((step, index) => (
                    <div key={step} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="min-w-[16px] font-medium text-[var(--accent-navy)]">{index + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-2" id="proof-upload-zone">
                  <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                    Payment proof <span className="text-[var(--accent-coral)]">*</span>
                  </label>

                  <label
                    htmlFor="proof-upload"
                    className={cn(
                      'flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed p-4 text-center transition-colors',
                      proofError
                        ? 'border-[var(--danger-text)] bg-[var(--danger-bg)]'
                        : proofFile
                          ? 'border-[var(--success-text)] bg-[var(--success-bg)]'
                          : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-strong)]',
                    )}
                  >
                    {proofFile ? (
                      <div className="flex flex-col items-center gap-2">
                        {proofPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={proofPreview}
                            alt="Payment proof preview"
                            className="max-h-[80px] rounded object-contain"
                          />
                        ) : (
                          <div className="rounded-full border border-[var(--success-text)] px-3 py-1 text-xs font-semibold text-[var(--success-text)]">
                            PDF
                          </div>
                        )}
                        <p className="text-xs font-medium text-[var(--success-text)]">{proofFile.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {formatFileSize(proofFile.size)} - Tap to change
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">Upload payment screenshot</p>
                        <p className="text-xs text-[var(--text-secondary)]">JPG, PNG, WebP or PDF - Max 5MB</p>
                      </div>
                    )}
                  </label>

                  <input
                    type="file"
                    id="proof-upload"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {proofError ? <p className="text-xs text-[var(--danger-text)]">{proofError}</p> : null}
                </div>
              </div>
            ) : null}
          </section>

          {error ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--danger-text)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">
              {error}
            </div>
          ) : null}

          <div className="sticky bottom-0 mt-2 bg-[var(--background)] pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] disabled:opacity-50"
            >
              {submitting || uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {uploading ? 'Uploading...' : 'Placing order...'}
                </>
              ) : (
                `Complete order · ${order.total} EGP`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

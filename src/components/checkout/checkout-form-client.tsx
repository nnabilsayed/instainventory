'use client';

import { CheckoutCountdown } from '@/components/checkout/checkout-countdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { formatFileSize, validatePaymentProof } from '@/lib/validate-upload';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { isOrderExpired } from '@/lib/order-expiry';
import {
  Check,
  ChevronDown,
  Clock3,
  Lock,
  MessageCircle,
  ShoppingBag,
  Smartphone,
  Tag,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

function CheckoutHeader({ shop, orderNumber }: { shop: any; orderNumber: string | number }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4">
      {shop?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shop.logo_url}
          alt={shop?.name}
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
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5 text-sm font-medium md:rounded-[var(--radius-lg)] md:border',
        isUrgent
          ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
          : 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
      )}
    >
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
  );
}

function OrderSummaryContent({ order, orderItems }: { order: any; orderItems: any[] }) {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        {orderItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--surface-hover)] p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-primary">{item.product_name}</p>
              <p className="mt-0.5 text-xs text-secondary">{item.variant_name}</p>
              <p className="mt-0.5 text-xs text-tertiary">
                Qty {item.quantity} x {item.unit_price} EGP
              </p>
            </div>
            <p className="flex-shrink-0 text-sm font-semibold text-primary">{item.line_total} EGP</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t border-[var(--border)] pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Subtotal</span>
          <span>{order.subtotal} EGP</span>
        </div>

        {Number(order.discount_amount) > 0 ? (
          <div className="flex justify-between text-sm">
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

        <div className="flex justify-between text-sm">
          <span className="text-secondary">Shipping</span>
          <span>{order.shipping_fee} EGP</span>
        </div>

        <div className="flex justify-between border-t border-[var(--border)] pt-2">
          <span className="font-bold text-primary">Total</span>
          <span className="text-lg font-bold text-primary">{order.total} EGP</span>
        </div>
      </div>
    </div>
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
        'flex w-full items-center gap-3 rounded-[var(--radius-lg)] border-2 p-4 text-start transition-all',
        selected
          ? 'border-[var(--accent-navy)] bg-[var(--surface-hover)]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]',
      )}
    >
      <div
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
          selected ? 'border-[var(--accent-navy)]' : 'border-[var(--border-strong)]',
        )}
      >
        {selected ? <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-navy)]" /> : null}
      </div>

      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--accent-navy)] shadow-sm">
        {icon}
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-secondary">{description}</p>
      </div>
    </button>
  );
}

export default function CheckoutFormClient({
  order,
  shop,
}: {
  order: any;
  shop: any;
}) {
  const supabase = createClient();

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(order.payment_method));
  const [summaryOpen, setSummaryOpen] = useState(false);

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

  const orderItems = useMemo(() => order.order_items ?? [], [order.order_items]);

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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(26,26,46,0.06),_transparent_35%),var(--background)] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-bg)] animate-[bounce_0.5s_ease-out]">
            <Check size={36} className="text-[var(--success-text)]" strokeWidth={3} />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-primary">Order placed!</h1>

          <p className="mb-6 max-w-xs text-sm leading-relaxed text-secondary">
            Your order #{order.order_number} has been sent to <span className="font-medium text-primary">{shop?.name}</span>.
            {' '}They&apos;ll contact you on WhatsApp shortly.
          </p>

          <div className="mb-6 w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">Order summary</p>
            </div>

            <div className="space-y-2 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Order</span>
                <span className="font-medium">#{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Total</span>
                <span className="font-bold text-primary">{order.total} EGP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Payment</span>
                <span className="font-medium">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'InstaPay'}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-secondary">Delivering to</span>
                <span className="max-w-[60%] text-end font-medium">
                  {addressArea}, {addressCity}
                </span>
              </div>
            </div>
          </div>

          {(shop as any)?.theme?.thank_you_message ? (
            <p className="mb-6 max-w-xs text-sm italic text-secondary">
              &quot;{(shop as any).theme.thank_you_message}&quot;
            </p>
          ) : null}

          {shop?.whatsapp ? (
            <a
              href={`https://wa.me/${String(shop.whatsapp).replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] items-center gap-2 rounded-[var(--radius-lg)] bg-[#25D366] px-6 text-sm font-medium text-white transition-colors hover:bg-[#20C05C]"
            >
              <MessageCircle size={16} />
              <span>Message seller on WhatsApp</span>
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-6xl md:px-6 md:pt-6">
        <div className="overflow-hidden bg-[var(--surface)] md:rounded-[var(--radius-xl)] md:border md:border-[var(--border)] md:shadow-[var(--shadow-md)]">
          <CheckoutHeader shop={shop} orderNumber={order.order_number} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl md:px-6">
        <CountdownBar
          expiresAt={order.expires_at}
          onExpire={() => {
            void expireOrder();
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:gap-3 md:px-6 md:py-6">
        <aside className="hidden self-start md:block">
          <div className="sticky top-6 self-start overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
            <div className="border-b border-[var(--border)] px-4 py-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">Order summary</p>
            </div>

            <OrderSummaryContent order={order} orderItems={orderItems} />
          </div>
        </aside>

        <main className="min-w-0">
          <div className="overflow-hidden bg-[var(--surface)] md:rounded-[var(--radius-xl)] md:border md:border-[var(--border)] md:shadow-[var(--shadow-md)]">
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setSummaryOpen((prev) => !prev)}
                className="flex w-full items-center justify-between border-b border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-sm font-medium text-primary"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag size={15} />
                  <span>{summaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
                  <ChevronDown
                    size={14}
                    className={cn('text-tertiary transition-transform', summaryOpen && 'rotate-180')}
                  />
                </span>
                <span className="font-bold">{order.total} EGP</span>
              </button>

              {summaryOpen ? (
                <div className="border-b border-[var(--border)]">
                  <OrderSummaryContent order={order} orderItems={orderItems} />
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit}>
              <section className="space-y-4 px-4 py-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">Delivery details</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-primary">
                      Full name <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <Input
                      required
                      value={addressName}
                      onChange={(event) => setAddressName(event.target.value)}
                      placeholder="Ali Ahmed"
                      className="min-h-[48px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-primary">
                      Phone <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <Input
                      required
                      type="tel"
                      inputMode="numeric"
                      value={addressPhone}
                      onChange={(event) => setAddressPhone(event.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="min-h-[48px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-primary">
                      City / Governorate <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <Input
                      required
                      value={addressCity}
                      onChange={(event) => setAddressCity(event.target.value)}
                      placeholder="Cairo"
                      className="min-h-[48px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-primary">
                      Area <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <Input
                      required
                      value={addressArea}
                      onChange={(event) => setAddressArea(event.target.value)}
                      placeholder="Nasr City"
                      className="min-h-[48px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-primary">
                    Street address and building <span className="text-[var(--danger-text)]">*</span>
                  </label>
                  <Input
                    required
                    value={addressStreet}
                    onChange={(event) => setAddressStreet(event.target.value)}
                    placeholder="12 Example Street, Building 5, Apt 3"
                    className="min-h-[48px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-sm font-medium text-primary">
                    <span>Delivery notes</span>
                    <span className="text-xs font-normal text-tertiary">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Any special delivery instructions..."
                    rows={2}
                    className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)]"
                  />
                </div>
              </section>

              <section className="space-y-3 border-t border-[var(--border)] px-4 pb-4 pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">Payment method</p>

                <PaymentMethodOption
                  selected={paymentMethod === 'cod'}
                  icon={<Wallet size={18} />}
                  title="Cash on Delivery"
                  description="Pay when your order arrives at your door"
                  onClick={() => {
                    setPaymentMethod('cod');
                    setProofError('');
                  }}
                />

                <PaymentMethodOption
                  selected={paymentMethod === 'instapay'}
                  icon={<Smartphone size={18} />}
                  title="InstaPay"
                  description="Transfer first, then upload your receipt"
                  onClick={() => {
                    setPaymentMethod('instapay');
                    setProofError('');
                  }}
                />

                {paymentMethod === 'instapay' ? (
                  <div className="space-y-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--info-bg)] bg-[var(--info-bg)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--info-text)]">
                      How to pay via InstaPay
                    </p>

                    <div className="space-y-2">
                      {[
                        'Open your banking app (CIB, NBE, Banque Misr, etc.)',
                        'Go to InstaPay -> Send Money',
                        `Enter number: ${shop?.instapay_number || 'Not available'}`,
                        `Enter name: ${shop?.instapay_name || 'Seller name'}`,
                        `Enter amount: ${order.total} EGP`,
                        'Take a screenshot of the confirmation',
                        'Upload it below',
                      ].map((step, index) => (
                        <div key={step} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--info-text)] text-[10px] font-bold text-white">
                            {index + 1}
                          </span>
                          <p className="text-xs leading-relaxed text-[var(--info-text)]">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--info-text)]/20 bg-white p-3">
                      <p className="mb-1 text-xs text-secondary">Transfer to:</p>
                      <p className="text-base font-bold tracking-wide text-primary">
                        {shop?.instapay_number || 'Not available'}
                      </p>
                      {shop?.instapay_name ? (
                        <p className="mt-0.5 text-xs text-secondary">{shop.instapay_name}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2" id="proof-upload-zone">
                      <p className="text-xs font-medium text-[var(--info-text)]">
                        Payment proof <span className="text-[var(--danger-text)]">*</span>
                      </p>
                      <p className="text-xs text-secondary">Upload a screenshot of your InstaPay transfer</p>

                      <label
                        htmlFor="proof-upload"
                        className={cn(
                          'flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed transition-colors',
                          proofError
                            ? 'border-[var(--danger-text)] bg-[var(--danger-bg)]'
                            : proofFile
                              ? 'border-[var(--success-text)] bg-[var(--success-bg)]'
                              : 'border-[var(--border)] bg-white hover:border-[var(--border-strong)]',
                        )}
                      >
                        {proofFile ? (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            {proofPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={proofPreview}
                                alt="Payment proof preview"
                                className="max-h-[80px] rounded object-contain"
                              />
                            ) : (
                              <div className="rounded-full border border-[var(--success-text)]/30 px-3 py-1 text-xs font-semibold text-[var(--success-text)]">
                                PDF
                              </div>
                            )}
                            <p className="text-xs font-medium text-[var(--success-text)]">{proofFile.name}</p>
                            <p className="text-xs text-secondary">{formatFileSize(proofFile.size)} - Tap to change</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-secondary">
                              Upload
                            </div>
                            <p className="text-sm font-medium text-primary">Tap to upload proof</p>
                            <p className="text-xs text-tertiary">JPG, PNG, WebP or PDF - Max 5MB</p>
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

                      {proofError ? (
                        <p className="flex items-center gap-1 text-xs text-[var(--danger-text)]">
                          <span aria-hidden="true">!</span>
                          <span>{proofError}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>

              {error ? (
                <div className="px-4 pb-4">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : null}

              <div className="hidden px-4 pb-6 md:block">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--accent-navy)] text-base font-semibold text-white transition-all disabled:opacity-50"
                >
                  {submitting || uploading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {uploading ? 'Uploading...' : 'Placing order...'}
                    </>
                  ) : (
                    `Complete order - ${order.total} EGP`
                  )}
                </button>
              </div>

              <div className="h-24 md:hidden" />

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:hidden">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--accent-navy)] text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting || uploading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {uploading ? 'Uploading...' : 'Placing order...'}
                    </>
                  ) : (
                    `Complete order - ${order.total} EGP`
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

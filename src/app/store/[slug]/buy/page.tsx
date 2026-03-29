'use client';

import { AddressForm, type AddressValue } from '@/components/store/address-form';
import { PaymentSelector, type PaymentMethod } from '@/components/store/payment-selector';
import { useCart } from '@/hooks/use-cart';
import { storageImage } from '@/lib/image';
import { normalizeEgyptianPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/client';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CheckoutCartItem = {
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
};

type ShopSummary = {
  name: string;
  logo_url: string | null;
  instapay_number: string | null;
  instapay_name: string | null;
  default_shipping_fee: number | string | null;
  self_checkout_enabled: boolean;
};

function parseCart(raw: string | null): CheckoutCartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const candidate = item as Record<string, unknown>;
        const variantId = typeof candidate.variantId === 'string' ? candidate.variantId : '';
        const productName = typeof candidate.productName === 'string' ? candidate.productName : '';
        const variantName = typeof candidate.variantName === 'string' ? candidate.variantName : '';
        const price = Number(candidate.price);
        const quantity = Math.trunc(Number(candidate.quantity));

        if (!variantId || !productName || !variantName) return null;
        if (!Number.isFinite(price) || !Number.isFinite(quantity) || quantity < 1) return null;

        return {
          variantId,
          productName,
          variantName,
          price,
          quantity,
        };
      })
      .filter((item): item is CheckoutCartItem => item !== null);
  } catch {
    return [];
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-EG', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'S';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

export default function StoreSelfCheckoutPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const supabase = useMemo(() => createClient(), []);
  const { clearCart } = useCart(slug);

  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [shop, setShop] = useState<ShopSummary | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [conflictVariant, setConflictVariant] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressValue>({
    name: '',
    phone: '',
    city: '',
    area: '',
    street: '',
  });
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadCheckout() {
      const storageKey = `ii_cart_${slug}`;
      const nextCartItems = parseCart(window.localStorage.getItem(storageKey));

      if (!nextCartItems.length) {
        window.location.href = `/store/${slug}`;
        return;
      }

      const { data } = await supabase
        .from('shops')
        .select('name, logo_url, instapay_number, instapay_name, default_shipping_fee, self_checkout_enabled')
        .eq('slug', slug)
        .single();

      if (!active) return;

      if (!data || !data.self_checkout_enabled) {
        window.location.href = `/store/${slug}`;
        return;
      }

      setCartItems(nextCartItems);
      setShop(data as ShopSummary);
      setLoadingPage(false);
    }

    void loadCheckout();

    return () => {
      active = false;
    };
  }, [slug, supabase]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const shippingFee = Number(shop?.default_shipping_fee) || 0;
  const total = subtotal + shippingFee;

  function updateAddress(field: string, value: string) {
    const key = field as keyof AddressValue;
    setAddress((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: '' };
    });
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!address.name.trim()) nextErrors.name = 'Full name is required';
    if (!address.phone.trim()) nextErrors.phone = 'Phone is required';
    if (!address.city.trim()) nextErrors.city = 'City is required';
    if (!address.area.trim()) nextErrors.area = 'Area is required';
    if (!address.street.trim()) nextErrors.street = 'Street address is required';

    const normalizedPhone = normalizeEgyptianPhone(address.phone);
    if (address.phone.trim() && !/^01[0125]\d{8}$/.test(normalizedPhone)) {
      nextErrors.phone = 'Enter a valid Egyptian mobile number';
    }

    if (paymentMethod === 'instapay' && !proofFile) {
      nextErrors.proof = 'Upload your payment screenshot first';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!shop) return;

    setConflictVariant(null);
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    let proofUrl: string | null = null;

    if (paymentMethod === 'instapay' && proofFile) {
      const extension = proofFile.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `payment-proofs/${slug}/${Date.now()}-proof.${extension}`;

      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, proofFile);

      if (uploadError) {
        setSubmitError(uploadError.message);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);

      proofUrl = publicUrl;
    }

    const response = await fetch('/api/store/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        name: address.name.trim(),
        phone: address.phone.trim(),
        city: address.city.trim(),
        area: address.area.trim(),
        street: address.street.trim(),
        notes,
        paymentMethod,
        proofUrl,
        items: cartItems,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { orderId?: string; error?: string; variantName?: string }
      | null;

    if (response.status === 409 && result?.error === 'STOCK_CONFLICT') {
      setConflictVariant(result.variantName ?? 'This item');
      setSubmitting(false);
      return;
    }

    if (!response.ok || !result?.orderId) {
      setSubmitError(result?.error ?? 'Something went wrong while placing your order');
      setSubmitting(false);
      return;
    }

    clearCart();
    window.localStorage.removeItem(`ii_cart_${slug}`);
    window.location.href = `/store/${slug}/order-confirmed/${result.orderId}`;
  }

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-4">
        <div className="mx-auto max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-sm text-[var(--text-secondary)]">
          Loading checkout...
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)' }} className="min-h-screen bg-[var(--background)] px-4 py-4 text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-3">
        <Link
          href={`/store/${slug}`}
          className="inline-flex min-h-[44px] items-center text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          â† Back
        </Link>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            {shop?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storageImage(shop.logo_url, { width: 96, height: 96, resize: 'cover' }) ?? shop.logo_url}
                alt={shop.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-navy)] text-[15px] font-medium text-white">
                {shop ? getInitial(shop.name) : 'S'}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-medium text-[var(--text-primary)]">{shop?.name}</h1>
              <p className="text-xs text-[var(--text-secondary)]">Secure checkout ðŸ”’</p>
            </div>

            <div className="ms-auto flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Lock size={14} />
              <span>Secure</span>
            </div>
          </div>
        </section>

        {conflictVariant ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--warning-text)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning-text)]">
            <p>
              Sorry, {conflictVariant} just sold out while you were shopping. Please go back and update your cart.
            </p>
            <Link href={`/store/${slug}`} className="mt-3 inline-flex min-h-[44px] items-center font-medium underline">
              Back to cart
            </Link>
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--danger-text)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">
            {submitError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <SectionTitle>Order summary</SectionTitle>

            <div>
              {cartItems.map((item) => (
                <div key={item.variantId} className="mb-2 rounded-[var(--radius-md)] bg-[var(--background)] p-3 last:mb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.productName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.variantName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        {item.quantity} Ã— {formatPrice(item.price)} EGP
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
                      {formatPrice(item.price * item.quantity)} EGP
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)} EGP</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span>Shipping</span>
                <span>{shippingFee > 0 ? `${formatPrice(shippingFee)} EGP` : 'Calculated at checkout'}</span>
              </div>
              <div className="my-2 border-t border-[var(--border)]" />
              <div className="flex items-center justify-between text-sm font-medium text-[var(--text-primary)]">
                <span>Total</span>
                <span>{formatPrice(total)} EGP</span>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <SectionTitle>Delivery details</SectionTitle>
            <AddressForm value={address} onChange={updateAddress} errors={errors} />
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                Delivery notes
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}> (optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special delivery instructions..."
                rows={3}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--background)',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <SectionTitle>Payment method</SectionTitle>
            <PaymentSelector
              value={paymentMethod}
              onChange={(method) => {
                setPaymentMethod(method);
                setErrors((current) => ({ ...current, proof: '' }));
              }}
              instapayEnabled={Boolean(shop?.instapay_number)}
              instapayNumber={shop?.instapay_number ?? null}
              instapayName={shop?.instapay_name ?? null}
              proofFile={proofFile}
              onProofChange={(file) => {
                setProofFile(file);
                setErrors((current) => ({ ...current, proof: '' }));
              }}
              errors={errors}
            />
          </section>

          <div className="sticky bottom-0 mt-2 bg-[var(--background)] pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-navy-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Placing order...</span>
                </>
              ) : (
                `Complete order Â· ${formatPrice(total)} EGP`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

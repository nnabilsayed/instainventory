'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { OnlineStoreSection } from '@/components/settings/online-store-section';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeEgyptianPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { settingsSchema } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, MessageCircle } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://instainventory.com';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmSlugOpen, setConfirmSlugOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [shopId, setShopId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  const [slugChanged, setSlugChanged] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [instapayName, setInstapayName] = useState('');
  const [instapayNumber, setInstapayNumber] = useState('');
  const [shippingFee, setShippingFee] = useState('0');
  const [selfCheckoutEnabled, setSelfCheckoutEnabled] = useState(false);
  const [autoWhatsappNotifications, setAutoWhatsappNotifications] = useState(true);
  const [savingAutoWhatsapp, setSavingAutoWhatsapp] = useState(false);

  function validateSlug(value: string): string | null {
    if (!value) return 'Store URL is required';
    if (value.length < 3) return 'Store URL must be at least 3 characters';
    if (value.length > 50) return 'Store URL must be under 50 characters';
    if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and hyphens allowed';
    if (value.startsWith('-') || value.endsWith('-')) return 'Cannot start or end with a hyphen';
    return null;
  }

  function handleSlugChange(value: string) {
    setSlug(value);
    setSlugChanged(value !== originalSlug);
    setErrors((currentErrors) => ({ ...currentErrors, slug: '' }));
  }

  useEffect(() => {
    async function fetchShop() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('shops').select('*').eq('owner_id', user.id).single();
      if (data) {
        setShopId(data.id);
        setName(data.name || '');
        setSlug(data.slug || '');
        setOriginalSlug(data.slug || '');
        setWhatsapp(data.whatsapp || '');
        setInstapayName(data.instapay_name || '');
        setInstapayNumber(data.instapay_number || '');
        setShippingFee(data.default_shipping_fee?.toString() || '0');
        setSelfCheckoutEnabled(Boolean(data.self_checkout_enabled));
        setAutoWhatsappNotifications(data.auto_whatsapp_notifications ?? true);
      }

      setLoading(false);
    }

    fetchShop();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    setErrors({});

    const { error: updateError } = await supabase
      .from('shops')
      .update({
        name,
        slug,
        whatsapp: normalizeEgyptianPhone(whatsapp),
        instapay_name: instapayName,
        instapay_number: instapayNumber,
        default_shipping_fee: parseFloat(shippingFee),
      })
      .eq('id', shopId);

    if (updateError) {
      setError(updateError.message);
      notify.settingsError();
    } else {
      setOriginalSlug(slug);
      setSlugChanged(false);
      setSuccess(true);
      notify.settingsSaved();
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = settingsSchema.safeParse({
      name,
      whatsapp,
      instapay_name: instapayName || null,
      instapay_number: instapayNumber || null,
      default_shipping_fee: shippingFee,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((issue) => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const slugError = validateSlug(slug);
    if (slugError) {
      setErrors((currentErrors) => ({ ...currentErrors, slug: slugError }));
      return;
    }

    if (slugChanged) {
      setConfirmSlugOpen(true);
      return;
    }

    await saveSettings();
  };

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
    setConfirmSignOut(false);
    setSigningOut(false);
  };

  async function handleAutoWhatsappToggle() {
    if (!shopId || savingAutoWhatsapp) return;

    const newValue = !autoWhatsappNotifications;
    setAutoWhatsappNotifications(newValue);
    setSavingAutoWhatsapp(true);

    const { error: updateError } = await supabase
      .from('shops')
      .update({
        auto_whatsapp_notifications: newValue,
      })
      .eq('id', shopId);

    if (updateError) {
      setAutoWhatsappNotifications(!newValue);
      notify.error('Failed to save');
      setSavingAutoWhatsapp(false);
      return;
    }

    notify.success('Settings saved');
    setSavingAutoWhatsapp(false);
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-7 w-32" />
        <Card>
          <CardContent className="space-y-4 px-4 py-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 px-4 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28 md:pb-0">
      <h1 className="text-xl font-semibold text-primary">{t('settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-secondary">Shop Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopname">Shop Name</Label>
            <Input
              id="shopname"
              error={!!errors.name}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, name: '' }));
              }}
            />
            <FieldError message={errors.name} />
            <p className="mt-1 text-xs text-tertiary">
              Shown to customers on your checkout page. Can be in Arabic or English.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Store URL</Label>
            <Input
              id="slug"
              error={!!errors.slug}
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              placeholder="my-store"
            />
            <FieldError message={errors.slug} />
            <p className="mt-1 text-xs text-tertiary">
              Your unique store address: instainventory.com/store/<strong>{slug || 'your-store'}</strong> - changing this
              breaks all existing checkout links.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2">
              <span className="truncate text-xs text-tertiary">
                {appUrl}/store/<strong className="text-primary">{slug || 'your-store'}</strong>
              </span>
            </div>
            {slugChanged ? (
              <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--warning-text)]/20 bg-[var(--warning-bg)] p-3">
                <span className="flex-shrink-0 text-lg">!</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--warning-text)]">
                    Changing your slug will break all existing checkout links
                  </p>
                  <p className="mt-1 text-xs text-[var(--warning-text)] opacity-80">
                    Every order link you have already shared with customers will stop working immediately. Customers with
                    those links will see a &quot;link not found&quot; error.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa">WhatsApp Number</Label>
            <div className="relative">
              <MessageCircle size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-secondary" />
              <Input
                id="wa"
                type="tel"
                inputMode="numeric"
                error={!!errors.whatsapp}
                value={whatsapp}
                onChange={(event) => {
                  setWhatsapp(event.target.value);
                  setErrors((currentErrors) => ({ ...currentErrors, whatsapp: '' }));
                }}
                placeholder="01xxxxxxxxx"
                className="ps-10"
              />
            </div>
            <FieldError message={errors.whatsapp} />
            <p className="mt-1 text-xs text-tertiary">Enter Egyptian mobile number - any format accepted</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-secondary">Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ipname">InstaPay Name</Label>
            <Input
              id="ipname"
              error={!!errors.instapay_name}
              value={instapayName}
              onChange={(event) => {
                setInstapayName(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, instapay_name: '' }));
              }}
            />
            <FieldError message={errors.instapay_name} />
            <p className="text-xs text-secondary">Your name as registered with InstaPay</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ipnum">InstaPay Number</Label>
            <Input
              id="ipnum"
              error={!!errors.instapay_number}
              value={instapayNumber}
              onChange={(event) => {
                setInstapayNumber(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, instapay_number: '' }));
              }}
            />
            <FieldError message={errors.instapay_number} />
            <p className="text-xs text-secondary">Customers will transfer to this number</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-secondary">Shipping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="ship">Default Shipping Fee</Label>
          <div className="relative">
            <Input
              id="ship"
              type="number"
              step="0.01"
              error={!!errors.default_shipping_fee}
              value={shippingFee}
              onChange={(event) => {
                setShippingFee(event.target.value);
                setErrors((currentErrors) => ({ ...currentErrors, default_shipping_fee: '' }));
              }}
              className="pe-14"
            />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-secondary">EGP</span>
          </div>
          <FieldError message={errors.default_shipping_fee} />
          <p className="text-xs text-secondary">Applied to every new order by default</p>
        </CardContent>
      </Card>

      <OnlineStoreSection
        shopId={shopId}
        slug={slug}
        initialEnabled={selfCheckoutEnabled}
        appUrl={appUrl}
      />

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-1 text-sm font-medium text-[var(--text-primary)]">Customer communication</h2>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            Configure how you communicate with customers about their orders
          </p>

          <div className="flex min-h-[44px] items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Auto WhatsApp notifications</p>
              <p className="mt-0.5 max-w-[280px] text-xs text-[var(--text-secondary)]">
                Automatically open WhatsApp with a pre-filled message when you confirm, ship, or deliver an
                order. One tap to send.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoWhatsappNotifications}
              aria-label="Auto WhatsApp notifications"
              disabled={savingAutoWhatsapp}
              onClick={() => void handleAutoWhatsappToggle()}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-60"
            >
              <span
                className={cn(
                  'relative inline-flex h-[24px] w-[44px] rounded-full transition-all duration-200',
                  autoWhatsappNotifications ? 'bg-[var(--accent-navy)]' : 'bg-[var(--border-strong)]',
                )}
              >
                <span
                  className={cn(
                    'absolute top-[2px] h-[20px] w-[20px] rounded-full bg-white transition-all duration-200',
                    autoWhatsappNotifications ? 'translate-x-[22px]' : 'translate-x-[2px]',
                  )}
                />
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xs font-medium uppercase tracking-widest text-secondary">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center border-[var(--danger-text)] text-[var(--danger-text)]"
            onClick={() => setConfirmSignOut(true)}
          >
            <LogOut size={16} />
            <span>Log out</span>
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>Settings saved successfully.</AlertDescription>
        </Alert>
      ) : null}

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message="You will be signed out of your account."
        confirmLabel="Sign out"
        cancelLabel="Stay"
        variant="warning"
        loading={signingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmSignOut(false)}
      />
      <ConfirmDialog
        open={confirmSlugOpen}
        title="Change your store URL?"
        message={`Your store URL will change from "${originalSlug}" to "${slug}". All existing checkout links you have shared with customers will stop working immediately. Are you sure?`}
        confirmLabel="Yes, change URL"
        cancelLabel="Keep current URL"
        variant="warning"
        loading={saving}
        onConfirm={() => {
          setConfirmSlugOpen(false);
          void saveSettings();
        }}
        onCancel={() => {
          setSlug(originalSlug);
          setSlugChanged(false);
          setConfirmSlugOpen(false);
          setErrors((currentErrors) => ({ ...currentErrors, slug: '' }));
        }}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 md:static md:flex md:justify-end md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
        <Button type="submit" className="w-full md:w-auto" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' ? (
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('pwa_install_state');
            localStorage.removeItem('pwa_visit_count');
            window.location.reload();
          }}
          className="pb-20 text-xs text-tertiary underline md:pb-0"
        >
          Reset PWA install state (dev only)
        </button>
      ) : null}
    </form>
  );
}

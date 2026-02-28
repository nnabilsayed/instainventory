'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const t = useTranslations('nav');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [shopId, setShopId] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instapayName, setInstapayName] = useState('');
  const [instapayNumber, setInstapayNumber] = useState('');
  const [shippingFee, setShippingFee] = useState('0');

  const supabase = createClient();

  useEffect(() => {
    async function fetchShop() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('shops').select('*').eq('owner_id', user.id).single();
      if (data) {
        setShopId(data.id);
        setName(data.name || '');
        setWhatsapp(data.whatsapp || '');
        setInstapayName(data.instapay_name || '');
        setInstapayNumber(data.instapay_number || '');
        setShippingFee(data.default_shipping_fee?.toString() || '0');
      }
      setLoading(false);
    }
    fetchShop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.from('shops').update({
      name, whatsapp,
      instapay_name: instapayName,
      instapay_number: instapayNumber,
      default_shipping_fee: parseFloat(shippingFee),
    }).eq('id', shopId);

    if (error) setError(error.message);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="shopname">Shop Name</Label>
              <Input id="shopname" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa">WhatsApp Number</Label>
              <Input id="wa" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+201..." />
              <p className="text-xs text-slate-500">Include country code. Orders will be sent here.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment &amp; Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ipname">InstaPay Account Name (optional)</Label>
              <Input id="ipname" placeholder="e.g. Ahmed Ali" value={instapayName} onChange={e => setInstapayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ipnum">InstaPay Number / Address (optional)</Label>
              <Input id="ipnum" placeholder="01001234567 or ahmed@instapay" value={instapayNumber} onChange={e => setInstapayNumber(e.target.value)} />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="ship">Default Shipping Fee (EGP)</Label>
              <Input id="ship" type="number" step="0.01" required value={shippingFee} onChange={e => setShippingFee(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription className="text-green-700">✓ Settings saved successfully!</AlertDescription></Alert>}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}

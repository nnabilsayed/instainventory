'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function SignupPage() {
  const [shopName, setShopName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { locale } = useParams();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Signup failed unexpectedly.');
      setLoading(false);
      return;
    }

    const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { error: dbError } = await supabase.from('shops').insert({
      owner_id: authData.user.id,
      name: shopName,
      slug: `${slug}-${Math.floor(Math.random() * 10000)}`,
      whatsapp: whatsapp,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push(`/${locale}/dashboard`);
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-1 text-center">Create your Shop</h3>
      <p className="text-sm text-slate-500 text-center mb-6">Get started in 60 seconds</p>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="shopName">Shop Name</Label>
          <Input
            id="shopName"
            type="text"
            required
            placeholder="Moda Cairo"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp Number</Label>
          <Input
            id="whatsapp"
            type="text"
            required
            placeholder="+201001234567"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating your shop...' : 'Sign Up & Create Shop'}
        </Button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link href={`/${locale}/login`} className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

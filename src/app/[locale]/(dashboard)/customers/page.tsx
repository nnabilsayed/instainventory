import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatPhoneDisplay } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import Link from 'next/link';

export const revalidate = 0;

const avatarColors = [
  'bg-[#FDE68A] text-[#92400E]',
  'bg-[#DBEAFE] text-[#1D4ED8]',
  'bg-[#EDE9FE] text-[#6D28D9]',
  'bg-[#DCFCE7] text-[#15803D]',
  'bg-[#FCE7F3] text-[#BE185D]',
];

export default async function CustomersPage({
  params,
}: {
  params: { locale: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id, name').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*, orders ( id )')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-base font-semibold text-[var(--danger-text)]">Error loading customers: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-primary">Customers</h1>
        <Badge className="bg-[var(--accent-navy)] text-white">{customers?.length || 0}</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {customers && customers.length > 0 ? (
          customers.map((customer: any) => {
            const colorClass = avatarColors[(customer.name?.charCodeAt(0) || 0) % avatarColors.length];

            return (
              <Card key={customer.id}>
                <Link href={`/${params.locale}/customers/${customer.id}`} className="block cursor-pointer">
                  <CardContent className="px-4 py-4 transition-colors hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${colorClass}`}>
                          {(customer.name?.[0] || 'C').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-medium text-primary">{customer.name}</p>
                          <p className="text-sm text-secondary">{formatPhoneDisplay(customer.phone)}</p>
                          {customer.instagram ? (
                            <p className="mt-1 text-sm text-secondary">@{String(customer.instagram).replace('@', '')}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-tertiary">
                            Added {format(new Date(customer.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[var(--accent-navy)] text-white">{customer.orders?.length || 0}</Badge>
                        <span className="text-secondary rtl:scale-x-[-1]">→</span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="px-4 py-10 text-center text-sm text-secondary">
              Customers will appear here once they start placing orders.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

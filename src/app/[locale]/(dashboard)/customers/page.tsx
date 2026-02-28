import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function CustomersPage({
  params
}: {
  params: { locale: string }
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase.from('shops').select('id, name').eq('owner_id', user.id).single();
  if (!shop) return <div>Shop not found</div>;

  const { data: customers, error } = await supabase
    .from('customers')
    .select(`
      *,
      orders ( id )
    `)
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-destructive font-bold p-8">Error loading customers: {error.message}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Badge variant="secondary" className="text-sm">
          {customers?.length || 0} Total Customers
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone / WhatsApp</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Added On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>
                      {c.instagram ? (
                        <a href={`https://instagram.com/${c.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          {c.instagram}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.orders?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No customers found.</p>
              <p className="text-sm">Customers will be added automatically when they create orders.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

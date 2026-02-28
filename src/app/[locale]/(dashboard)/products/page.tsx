import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import DeleteProductButton from './delete-button';

export const revalidate = 0;

export default async function ProductsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const supabase = createClient();
  const t = await getTranslations('products');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Unauthorized</div>;

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (!shop) return <div>Shop not found</div>;

  const { data: products } = await supabase
    .from('products')
    .select(`id, name, price, is_active, product_variants ( id, stock_qty, low_stock_threshold )`)
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('name')}</h1>
        <Button asChild>
          <Link href={`/${locale}/products/new`}>{t('addProduct')}</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No products found. Create your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  let totalStock = 0;
                  let hasLowStock = false;
                  if (product.product_variants) {
                    product.product_variants.forEach((v: any) => {
                      totalStock += v.stock_qty;
                      if (v.stock_qty <= v.low_stock_threshold) hasLowStock = true;
                    });
                  }
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        {hasLowStock && (
                          <Badge variant="destructive" className="mt-1">{t('lowStock')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.is_active
                          ? <Badge variant="secondary">Active</Badge>
                          : <Badge variant="outline">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="font-mono">{product.price} EGP</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/${locale}/products/${product.id}`}>Edit</Link>
                        </Button>
                        <DeleteProductButton productId={product.id} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

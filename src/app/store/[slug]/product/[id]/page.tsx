import { StoreProductPageClient } from '@/components/store/store-product-page-client';
import { getAppUrl } from '@/lib/app-url';
import { storageImage } from '@/lib/image';
import { createClient } from '@/lib/supabase/server';
import { getThemeVariables } from '@/lib/theme-tokens';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Shop = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  theme: {
    layout?: Record<string, unknown> | null;
  } | null;
  self_checkout_enabled: boolean;
};

type ProductImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

type ProductVariant = {
  id: string;
  name: string | null;
  size: string | null;
  color: string | null;
  image_url: string | null;
  stock_qty: number;
  price_override: number | string | null;
  low_stock_threshold: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  is_active: boolean;
  product_images: ProductImage[] | null;
  product_variants: ProductVariant[] | null;
};

async function getProductPageData(params: { slug: string; id: string }) {
  const supabase = createClient();

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, slug, whatsapp, theme, self_checkout_enabled')
    .eq('slug', params.slug)
    .single();

  if (!shop || !shop.self_checkout_enabled) {
    return { shop: null, product: null };
  }

  const { data: product } = await supabase
    .from('products')
    .select(
      `
        id, name, description, price, is_active,
        product_images(id, url, sort_order),
        product_variants(
          id, name, size, color, image_url, stock_qty, 
          price_override, low_stock_threshold
        )
      `,
    )
    .eq('id', params.id)
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .single();

  if (!product) {
    return { shop: shop as Shop, product: null };
  }

  const sortedImages = [...(product.product_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const sortedVariants = [...(product.product_variants ?? [])].sort((a, b) => {
    const aOut = a.stock_qty <= 0 ? 1 : 0;
    const bOut = b.stock_qty <= 0 ? 1 : 0;
    return aOut - bOut;
  });

  return {
    shop: shop as Shop,
    product: {
      ...(product as Product),
      product_images: sortedImages,
      product_variants: sortedVariants,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; id: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, slug')
      .eq('slug', params.slug)
      .single();

    const { data: product } = await supabase
      .from('products')
      .select(
        `
        name,
        description,
        price,
        product_images(url)
      `,
      )
      .eq('id', params.id)
      .single();

    if (!shop || !product) {
      return {};
    }

    const imageUrl = product.product_images?.[0]?.url ?? null;
    const title = `${product.name} — ${shop.name}`;
    const description =
      product.description ?? `${product.name} — ${product.price} EGP. Order from ${shop.name}`;
    const url = `${getAppUrl()}/store/${params.slug}/product/${params.id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default async function StoreProductPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const { shop, product } = await getProductPageData(params);

  if (!shop || !product) {
    notFound();
  }

  const themeVariables = getThemeVariables(shop.theme?.layout);

  return (
    <div style={themeVariables} className="min-h-screen bg-[var(--background)] text-primary">
      <main className="mx-auto min-h-screen w-full max-w-[480px]">
        <StoreProductPageClient shop={shop} product={product} />
      </main>
    </div>
  );
}

import { storageImage } from '@/lib/image';
import { getAppUrl } from '@/lib/app-url';
import { createClient } from '@/lib/supabase/server';
import { getThemeVariables } from '@/lib/theme-tokens';
import { ReviewsSection } from '@/components/store/reviews-section';
import { StoreHeader } from '@/components/store/store-header';
import { CatalogueClient } from './catalogue-client';
import { Facebook, Instagram, MessageCircle, Music2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type ShopTheme = {
  tagline?: string | null;
  banner_url?: string | null;
  social_links?: {
    instagram?: string | null;
    tiktok?: string | null;
    facebook?: string | null;
  } | null;
  layout?: Record<string, unknown> | null;
} | null;

type ShopRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  whatsapp: string | null;
  theme: ShopTheme;
  self_checkout_enabled: boolean;
  default_shipping_fee: number | string | null;
};

type ProductImage = {
  url: string;
  sort_order: number | null;
};

type ProductVariant = {
  id: string;
  stock_qty: number;
  image_url: string | null;
};

type ProductCategory = {
  id: string;
  name: string;
};

type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category_id: string | null;
  category: ProductCategory | null;
  product_images: ProductImage[] | null;
  product_variants: ProductVariant[] | null;
};

type ReviewRecord = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const APP_URL = getAppUrl();
const MARKETING_SITE_URL = APP_URL;

async function getStoreData(params: { slug: string }) {
  const supabase = createClient();
  const { data: shop, error } = await supabase
    .from('shops')
    .select(`
      id, name, slug, logo_url, whatsapp, 
      default_shipping_fee, self_checkout_enabled,
      theme
    `)
    .eq('slug', params.slug)
    .single();

  console.log('Shop query result:', shop, error);

  if (!shop) {
    return { shop: null, products: [] as ProductRecord[], reviews: [] as ReviewRecord[] };
  }

  const [productsRes, reviewsRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        `
          id, name, description, price, category_id,
          category:categories(id, name),
          product_images(url, sort_order),
          product_variants(id, stock_qty, image_url)
        `,
      )
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, customer_name, rating, comment, created_at')
      .eq('shop_id', shop.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  if (productsRes.error) {
    throw productsRes.error;
  }

  if (reviewsRes.error) {
    throw reviewsRes.error;
  }

  return {
    shop: shop as ShopRecord,
    products: (productsRes.data ?? []) as unknown as ProductRecord[],
    reviews: (reviewsRes.data ?? []) as ReviewRecord[],
  };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'S').slice(0, 2);
}

function isOutOfStock(product: ProductRecord) {
  const variants = product.product_variants ?? [];
  return variants.length === 0 || variants.every((variant) => Number(variant.stock_qty) <= 0);
}

function buildWhatsappLink(phone: string | null | undefined, message: string) {
  if (!phone) return null;
  const sanitizedPhone = String(phone).replace(/\D/g, '');
  if (!sanitizedPhone) return null;
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, slug, logo_url, theme')
      .eq('slug', params.slug)
      .single();

    if (!shop) {
      return {};
    }

    const { data: product } = await supabase
      .from('products')
      .select('product_images(url)')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const imageUrl = product?.product_images?.[0]?.url ?? shop.logo_url ?? null;
    const title = `${shop.name} — Shop`;
    const description =
      shop.theme?.tagline ?? `Browse ${shop.name}'s collection and place your order`;
    const url = `${APP_URL}/store/${params.slug}`;

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

export default async function StoreCataloguePage({
  params,
}: {
  params: { slug: string };
}) {
  console.log('Catalogue: slug =', params.slug);
  const { shop, products, reviews } = await getStoreData(params);

  if (!shop) {
    console.log('Catalogue notFound — shop:', shop, 'error:', null);
    notFound();
  }

  if (!shop.self_checkout_enabled) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12 text-primary">
        <div className="mx-auto max-w-xl rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-md)]">
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          <p className="mt-4 text-sm text-secondary">
            This store is not currently accepting online orders. Please contact the seller directly.
          </p>
        </div>
      </div>
    );
  }

  const theme = shop.theme ?? {};
  const socialLinks = theme.social_links ?? {};
  const whatsappUrl = buildWhatsappLink(shop.whatsapp, `Hi! I'm interested in shopping from ${shop.name}`);
  const themeVariables = getThemeVariables(theme.layout);

  return (
    <div style={themeVariables} className="min-h-screen bg-[var(--background)] text-primary">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-6 sm:px-6">
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          {theme.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storageImage(theme.banner_url, { width: 1400, height: 400, resize: 'cover' }) ?? theme.banner_url}
              alt={shop.name}
              className="h-[200px] w-full object-cover"
            />
          ) : (
            <div className="h-28 w-full bg-[linear-gradient(135deg,var(--accent-navy),var(--accent-coral))]" />
          )}

          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storageImage(shop.logo_url, { width: 144, height: 144 }) ?? shop.logo_url}
                  alt={shop.name}
                  className="h-16 w-16 rounded-full border border-[var(--border)] object-cover shadow-[var(--shadow-sm)]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-navy)] text-lg font-semibold text-[var(--text-inverse)]">
                  {getInitials(shop.name)}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{shop.name}</h1>
                {theme.tagline ? <p className="mt-1 text-sm text-secondary sm:text-base">{theme.tagline}</p> : null}
              </div>
            </div>

            <StoreHeader slug={shop.slug} shopName={shop.name} />
          </div>
        </section>

        <section className="mt-8 flex-1">
          {products.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 text-center shadow-[var(--shadow-sm)]">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storageImage(shop.logo_url, { width: 120, height: 120 }) ?? shop.logo_url}
                  alt={shop.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-hover)] text-lg font-semibold text-primary">
                  {getInitials(shop.name)}
                </div>
              )}
              <p className="mt-4 max-w-sm text-base font-medium text-primary">This store is setting up - check back soon!</p>
            </div>
          ) : (
            <CatalogueClient
              products={products.map((product) => ({
                id: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                category_id: product.category_id,
                category: product.category ?? null,
                imageUrl: (() => {
                  const productImg =
                    product.product_images && product.product_images.length > 0
                      ? [...product.product_images].sort(
                          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
                        )[0].url
                      : null;

                  const variantImg =
                    product.product_variants && product.product_variants.length > 0
                      ? product.product_variants.find((variant) => variant.image_url)?.image_url ?? null
                      : null;

                  return productImg ?? variantImg ?? null;
                })(),
                isOutOfStock: isOutOfStock(product),
              }))}
              slug={shop.slug}
            />
          )}
        </section>

        <ReviewsSection reviews={reviews} />

        <footer className="mt-10 border-t border-[var(--border)] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              {socialLinks.instagram ? (
                <Link
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-primary transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label={`${shop.name} on Instagram`}
                >
                  <Instagram size={18} />
                </Link>
              ) : null}
              {socialLinks.tiktok ? (
                <Link
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-primary transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label={`${shop.name} on TikTok`}
                >
                  <Music2 size={18} />
                </Link>
              ) : null}
              {socialLinks.facebook ? (
                <Link
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-primary transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label={`${shop.name} on Facebook`}
                >
                  <Facebook size={18} />
                </Link>
              ) : null}
            </div>

            <Link
              href={MARKETING_SITE_URL}
              className="text-xs text-secondary transition-colors hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by InstaInventory
            </Link>
          </div>
        </footer>
      </main>

      {whatsappUrl ? (
        <Link
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 end-4 flex min-h-[44px] items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-transform hover:scale-[1.02]"
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </Link>
      ) : null}
    </div>
  );
}

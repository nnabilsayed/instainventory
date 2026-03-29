import { getAppUrl } from './app-url';
import { formatPhoneForWhatsApp } from './phone';

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${normalized}?text=${encoded}`;
}

export function getOrderMessage(
  type: 'checkout_link' | 'confirmed' | 'shipped' | 'delivered',
  params: {
    customerName: string;
    orderId?: string;
    orderNumber: number;
    shopName: string;
    shopSlug?: string;
    checkoutToken?: string | null;
    trackingUrl?: string;
    checkoutLink?: string;
    total?: number;
  },
): string {
  const {
    customerName,
    orderId,
    orderNumber,
    shopName,
    shopSlug,
    checkoutToken,
    trackingUrl,
    checkoutLink,
    total,
  } = params;
  const appUrl = getAppUrl();

  const resolvedTrackingUrl =
    trackingUrl ||
    (shopSlug && checkoutToken
      ? `${appUrl}/store/${shopSlug}/order/${checkoutToken}`
      : undefined);

  const reviewUrl =
    shopSlug && orderId
      ? `${appUrl}/store/${shopSlug}/review/${orderId}`
      : undefined;

  switch (type) {
    case 'checkout_link':
      return `Hi ${customerName}\n\nYour order #${orderNumber} from ${shopName} is ready!\n\nPlease complete your order here:\n${checkoutLink}\n\nLet me know if you have any questions.`;
    case 'confirmed':
      return `Hi ${customerName}\n\nYour order #${orderNumber} from ${shopName} has been confirmed!\n\nTotal: ${total} EGP\n\nWe'll update you when it ships.${resolvedTrackingUrl ? `\n\nيمكنك متابعة طلبك من هنا: ${resolvedTrackingUrl}` : ''}`;
    case 'shipped':
      return `Hi ${customerName}\n\nGreat news! Your order #${orderNumber} from ${shopName} has been shipped and is on its way to you.\n\nWe'll let you know once it's delivered.${resolvedTrackingUrl ? `\n\nتابع حالة طلبك: ${resolvedTrackingUrl}` : ''}`;
    case 'delivered':
      return `مرحباً ${customerName}! 🎉 تم تسليم طلبك رقم #${orderNumber} بنجاح.\nيسعدنا لو شاركتنا رأيك: ${reviewUrl ?? ''}`.trim();
  }
}

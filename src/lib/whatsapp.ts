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
    orderNumber: number;
    shopName: string;
    checkoutLink?: string;
    total?: number;
  }
): string {
  const { customerName, orderNumber, shopName, checkoutLink, total } = params;

  switch (type) {
    case 'checkout_link':
      return `Hi ${customerName} 👋\n\nYour order #${orderNumber} from ${shopName} is ready!\n\nPlease complete your order here:\n${checkoutLink}\n\nLet me know if you have any questions.`;
    case 'confirmed':
      return `Hi ${customerName} ✅\n\nYour order #${orderNumber} from ${shopName} has been confirmed!\n\nTotal: ${total} EGP\n\nWe'll update you when it ships.`;
    case 'shipped':
      return `Hi ${customerName} 📦\n\nGreat news! Your order #${orderNumber} from ${shopName} has been shipped and is on its way to you.\n\nWe'll let you know once it's delivered.`;
    case 'delivered':
      return `Hi ${customerName} 🎉\n\nYour order #${orderNumber} from ${shopName} has been delivered!\n\nThank you for your order. We hope you love it! 💛`;
  }
}

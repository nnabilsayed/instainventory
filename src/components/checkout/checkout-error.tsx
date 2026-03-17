type ErrorType = 'not_found' | 'already_submitted' | 'expired';

const config = {
  not_found: {
    emoji: '🔗',
    title: 'Link not found',
    message: 'This checkout link is invalid or has been removed.',
    hint: 'Contact the seller for a new link.',
    showWhatsApp: false,
  },
  already_submitted: {
    emoji: '✅',
    title: 'Order already placed',
    message: 'This order has already been submitted successfully.',
    hint: 'The seller will be in touch with you shortly.',
    showWhatsApp: false,
  },
  expired: {
    emoji: '⏱',
    title: 'Link expired',
    message: 'This checkout link has expired.',
    hint: 'Contact the seller to get a new link.',
    showWhatsApp: true,
  },
} satisfies Record<
  ErrorType,
  {
    emoji: string;
    title: string;
    message: string;
    hint: string;
    showWhatsApp: boolean;
  }
>;

export default function CheckoutError({
  type,
  shopWhatsapp,
  status,
}: {
  type: ErrorType;
  shopWhatsapp?: string;
  status?: string;
}) {
  const c = config[type];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="text-5xl">{c.emoji}</div>
        <h1 className="text-xl font-semibold text-primary">{c.title}</h1>
        <p className="text-sm text-secondary">{c.message}</p>
        <p className="text-sm text-tertiary">{c.hint}</p>

        {c.showWhatsApp && shopWhatsapp ? (
          <a
            href={`https://wa.me/${shopWhatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[#25D366] text-sm font-medium text-white"
          >
            Contact Seller on WhatsApp
          </a>
        ) : null}

        {type === 'already_submitted' && status ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--success-bg)] px-3 py-1.5 text-sm font-medium text-[var(--success-text)]">
            Order status: {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type { ErrorType };

'use client';

import { Input } from '@/components/ui/input';
import { CheckCircle2, Star } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type ReviewFormClientProps = {
  orderId: string;
  orderNumber: number;
  shopId: string;
  shopSlug: string;
  initialName: string;
};

export function ReviewFormClient({
  orderId,
  orderNumber,
  shopId,
  shopSlug,
  initialName,
}: ReviewFormClientProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [customerName, setCustomerName] = useState(initialName);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const activeRating = hoveredRating || rating;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rating || !customerName.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/store/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          shopId,
          customerName: customerName.trim(),
          rating,
          comment,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(payload?.error ?? 'Unable to submit your review right now.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Unable to submit your review right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      {submitted ? (
        <div className="py-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-text)]">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
            Thank you for your review! 🎉
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            The seller will review your feedback.
          </p>
          <Link
            href={`/store/${shopSlug}`}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-[var(--accent-navy)]"
          >
            ← Back to store
          </Link>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)}>
          <h1 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
            How was your experience?
          </h1>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">Order #{orderNumber}</p>

          <div className="mb-5 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const starValue = index + 1;
              const isActive = starValue <= activeRating;

              return (
                <button
                  key={starValue}
                  type="button"
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(starValue)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--border-strong)] transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
                >
                  <Star
                    size={24}
                    className={isActive ? 'text-[var(--warning-text)]' : 'text-[var(--border-strong)]'}
                    fill="currentColor"
                  />
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="customer-name"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                Your name
              </label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Your name"
                maxLength={120}
              />
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                Your review (optional)
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell others about your experience..."
                rows={4}
                maxLength={1000}
                className="min-h-[100px] w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-navy)] focus:ring-2 focus:ring-[var(--accent-navy)]"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger-text)]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={!rating || !customerName.trim() || submitting}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-navy)] px-4 text-sm font-medium text-[var(--text-inverse)] transition-colors hover:bg-[var(--accent-navy-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      )}
    </section>
  );
}

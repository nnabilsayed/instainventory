'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { useMemo, useState } from 'react';

type ReviewOrder = {
  order_number: number | null;
};

type ReviewItem = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  order: ReviewOrder | ReviewOrder[] | null;
};

type ReviewsClientProps = {
  initialReviews: ReviewItem[];
};

function getOrder(order: ReviewItem['order']) {
  return Array.isArray(order) ? (order[0] ?? null) : order;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-sm">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`${rating}-${index}`}
          className={index < rating ? 'text-[var(--warning-text)]' : 'text-[var(--border-strong)]'}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [reviews, setReviews] = useState(initialReviews);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const currentPendingCount = reviews.filter((review) => !review.is_approved).length;

  const filteredReviews = useMemo(
    () => reviews.filter((review) => review.is_approved === (activeTab === 'approved')),
    [activeTab, reviews],
  );

  async function handleApprove(reviewId: string) {
    setLoadingId(reviewId);

    try {
      const response = await fetch(`/api/dashboard/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isApproved: true }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to approve review');
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? { ...review, is_approved: true } : review,
        ),
      );
      notify.success('Review approved');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to approve review');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(reviewId: string) {
    setLoadingId(reviewId);

    try {
      const response = await fetch(`/api/dashboard/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to reject review');
      }

      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setRejectingId(null);
      notify.success('Review rejected');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to reject review');
    } finally {
      setLoadingId(null);
    }
  }

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: reviews.filter((review) => !review.is_approved).length },
    { key: 'approved' as const, label: 'Approved', count: reviews.filter((review) => review.is_approved).length },
  ];

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Reviews</h1>
            <p className="text-sm text-[var(--text-secondary)]">{currentPendingCount} pending approval</p>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'border-[var(--accent-navy)] bg-[var(--accent-navy)] text-[var(--text-inverse)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {tab.label}
                <span className="ms-2 text-xs opacity-75">{tab.count}</span>
              </button>
            ))}
          </div>
        </section>

        {filteredReviews.length === 0 ? (
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-tertiary)]">
              <Star size={20} />
            </div>
            <h2 className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {activeTab === 'pending' ? 'No pending reviews' : 'No approved reviews'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {activeTab === 'pending'
                ? 'New customer feedback will show up here.'
                : 'Approved reviews will appear here once you publish them.'}
            </p>
          </section>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => {
              const order = getOrder(review.order);

              return (
                <article
                  key={review.id}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {review.customer_name}
                        </p>
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Order #{order?.order_number ?? '—'}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">{formatDate(review.created_at)}</p>
                  </div>

                  {review.comment ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{review.comment}</p>
                  ) : null}

                  {!review.is_approved ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleApprove(review.id)}
                        disabled={loadingId === review.id}
                        className="flex min-h-[36px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--success-text)]/20 bg-[var(--success-bg)] px-3 py-1.5 text-xs font-medium text-[var(--success-text)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingId === review.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(review.id)}
                        disabled={loadingId === review.id}
                        className="flex min-h-[36px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--danger-text)]/20 bg-[var(--danger-bg)] px-3 py-1.5 text-xs font-medium text-[var(--danger-text)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(rejectingId)}
        title="Reject this review?"
        message="This will permanently delete the review. This cannot be undone."
        confirmLabel="Reject review"
        cancelLabel="Keep review"
        variant="danger"
        loading={loadingId === rejectingId}
        onConfirm={() => {
          if (rejectingId) {
            void handleReject(rejectingId);
          }
        }}
        onCancel={() => {
          if (loadingId !== rejectingId) {
            setRejectingId(null);
          }
        }}
      />
    </>
  );
}

type ReviewItem = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type ReviewsSectionProps = {
  reviews: ReviewItem[];
};

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString('en-EG', {
    month: 'long',
    year: 'numeric',
  });
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const filled = index < rating;
    return (
      <span
        key={`${rating}-${index}`}
        className={filled ? 'text-[var(--warning-text)]' : 'text-[var(--border-strong)]'}
        aria-hidden="true"
      >
        ★
      </span>
    );
  });
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 mt-8">
      <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">What customers say</h2>

      <div className="flex flex-col gap-[10px]">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">{review.customer_name}</p>
              <div className="flex items-center gap-0.5 text-sm">{renderStars(review.rating)}</div>
            </div>

            {review.comment ? (
              <p className="mt-2 text-sm leading-[1.6] text-[var(--text-secondary)]">{review.comment}</p>
            ) : null}

            <p className="mt-2 text-xs text-[var(--text-tertiary)]">{formatReviewDate(review.created_at)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

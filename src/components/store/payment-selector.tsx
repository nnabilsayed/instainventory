'use client';

import { Smartphone, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaymentMethod = 'cod' | 'instapay';

type PaymentSelectorProps = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  instapayEnabled: boolean;
  instapayNumber: string | null;
  instapayName: string | null;
  proofFile: File | null;
  onProofChange: (file: File | null) => void;
  errors: Record<string, string>;
};

function PaymentOption({
  checked,
  icon,
  label,
  description,
  onClick,
}: {
  checked: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mb-2 flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-start transition-colors',
        checked
          ? 'border-[var(--accent-navy)] bg-[var(--surface-hover)]'
          : 'hover:border-[var(--border-strong)]',
      )}
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full',
          checked ? 'border-2 border-[var(--accent-navy)]' : 'border border-[var(--border-strong)]',
        )}
      >
        {checked ? <span className="h-[8px] w-[8px] rounded-full bg-[var(--accent-navy)]" /> : null}
      </span>

      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-center text-[var(--text-secondary)]',
          checked && 'text-[var(--accent-navy)]',
        )}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className="block text-[11px] text-[var(--text-secondary)]">{description}</span>
      </span>
    </button>
  );
}

export function PaymentSelector({
  value,
  onChange,
  instapayEnabled,
  instapayNumber,
  instapayName,
  proofFile,
  onProofChange,
  errors,
}: PaymentSelectorProps) {
  return (
    <div>
      <PaymentOption
        checked={value === 'cod'}
        icon={<Wallet size={16} />}
        label="Cash on Delivery"
        description="Pay when your order arrives"
        onClick={() => onChange('cod')}
      />

      {instapayEnabled ? (
        <div>
          <PaymentOption
            checked={value === 'instapay'}
            icon={<Smartphone size={16} />}
            label="InstaPay"
            description="Transfer first, then upload receipt"
            onClick={() => onChange('instapay')}
          />

          {value === 'instapay' ? (
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <div className="space-y-2">
                {[
                  'Open your banking app',
                  'Go to InstaPay',
                  `Send to: ${instapayNumber ?? 'Not available'}`,
                  `Name: ${instapayName ?? 'Not available'}`,
                  'Screenshot the confirmation',
                ].map((step, index) => (
                  <div key={step} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="min-w-[16px] font-medium text-[var(--accent-navy)]">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1">
                <label
                  htmlFor="payment-proof"
                  className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-4 text-center text-sm font-medium text-[var(--text-primary)]"
                >
                  Upload payment screenshot
                </label>
                <input
                  id="payment-proof"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => onProofChange(event.target.files?.[0] ?? null)}
                />

                {proofFile ? (
                  <p className="text-xs text-[var(--text-secondary)]">{proofFile.name}</p>
                ) : null}

                {errors.proof ? <p className="text-xs text-[var(--danger-text)]">{errors.proof}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { PaymentMethod };

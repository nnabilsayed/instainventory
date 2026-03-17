import { formatDistanceStrict } from 'date-fns';

export const CHECKOUT_EXPIRY_OPTIONS = [2, 6, 24] as const;

export type CheckoutExpiryDuration = (typeof CHECKOUT_EXPIRY_OPTIONS)[number];

export function isOrderExpired(expiresAt?: string | null, now = Date.now()) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now;
}

export function getRemainingExpiryMs(expiresAt?: string | null, now = Date.now()) {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt).getTime() - now);
}

export function formatExpiryCountdown(expiresAt?: string | null, now = Date.now()) {
  const remainingMs = getRemainingExpiryMs(expiresAt, now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0'));
  return parts.join(':');
}

export function getExpiryRelativeLabel(expiresAt?: string | null, now = new Date()) {
  if (!expiresAt) return null;

  const expiryDate = new Date(expiresAt);

  if (expiryDate.getTime() <= now.getTime()) {
    return `Expired ${formatDistanceStrict(expiryDate, now)} ago`;
  }

  return `Expires in ${formatDistanceStrict(expiryDate, now)}`;
}

export function isOpenCheckoutStatus(status?: string | null) {
  return status === 'draft' || status === 'pending';
}

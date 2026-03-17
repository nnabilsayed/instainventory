/**
 * Egyptian phone number utility
 * Handles: 01xxxxxxxxx, 201xxxxxxxxx, +201xxxxxxxxx
 * All Egyptian mobile numbers start with 010, 011, 012, or 015
 */

export function normalizeEgyptianPhone(phone: string): string {
  if (!phone) return '';

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith('20')) {
    return `0${digits.slice(2)}`;
  }

  if (digits.length === 10 && digits.startsWith('1')) {
    return `0${digits}`;
  }

  return phone;
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizeEgyptianPhone(phone);
  const digits = normalized.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('01')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return normalized;
}

export function formatPhoneForWhatsApp(phone: string): string {
  const normalized = normalizeEgyptianPhone(phone);
  const digits = normalized.replace(/\D/g, '');

  if (digits.startsWith('01') && digits.length === 11) {
    return `2${digits}`;
  }

  return digits;
}

export function formatPhoneForTel(phone: string): string {
  return `+${formatPhoneForWhatsApp(phone)}`;
}

export function isValidEgyptianPhone(phone: string): boolean {
  const normalized = normalizeEgyptianPhone(phone);
  const digits = normalized.replace(/\D/g, '');
  return /^01[0125]\d{8}$/.test(digits);
}

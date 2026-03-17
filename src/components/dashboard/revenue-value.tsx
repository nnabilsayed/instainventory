'use client';

import { useFormatter } from 'next-intl';

export function RevenueValue({ value }: { value: number }) {
  const format = useFormatter();

  return <>{format.number(value)}</>;
}

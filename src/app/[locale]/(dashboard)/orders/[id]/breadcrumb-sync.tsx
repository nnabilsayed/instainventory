'use client';

import { useEffect } from 'react';

export default function BreadcrumbSync({ label }: { label: string }) {
  useEffect(() => {
    const current = document.querySelector('[data-breadcrumb-current="true"]');
    if (current) {
      current.textContent = label;
    }
  }, [label]);

  return null;
}

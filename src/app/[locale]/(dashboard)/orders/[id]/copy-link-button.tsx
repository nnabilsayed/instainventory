'use client';

import { Button } from '@/components/ui/button';
import { notify } from '@/lib/toast';
import { Copy } from 'lucide-react';
import { useState } from 'react';

export default function CopyLinkButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    notify.linkCopied();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button type="button" variant="outline" onClick={handleCopy} className={className ?? 'min-w-[48px]'}>
      <Copy size={16} />
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </Button>
  );
}

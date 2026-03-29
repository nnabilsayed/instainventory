'use client';

import { storageImage } from '@/lib/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type ProductImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'P').slice(0, 2);
}

export function ProductImageGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeImageId, setActiveImageId] = useState(images[0]?.id ?? null);
  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0] ?? null;

  if (!activeImage) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-[linear-gradient(135deg,var(--surface-hover),var(--background))] text-3xl font-semibold text-secondary">
        {getInitials(productName)}
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden bg-[var(--surface-hover)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={storageImage(activeImage.url, { width: 600, height: 600 }) ?? activeImage.url}
          alt={productName}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto px-4 py-4">
          {images.map((image) => {
            const selected = image.id === activeImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageId(image.id)}
                className={cn(
                  'min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] border p-0.5 transition-colors',
                  selected
                    ? 'border-[var(--accent-navy)]'
                    : 'border-[var(--border)] hover:border-[var(--accent-navy)]',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storageImage(image.url, { width: 120, height: 120 }) ?? image.url}
                  alt={productName}
                  className="h-[60px] w-[60px] rounded-[calc(var(--radius-md)-2px)] object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

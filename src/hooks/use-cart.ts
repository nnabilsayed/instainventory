'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  imageUrl: string | null;
}

const CART_EVENT = 'ii-cart-updated';

function getStorageKey(slug: string) {
  return `ii_cart_${slug}`;
}

function normalizeCartItem(item: unknown): CartItem | null {
  if (!item || typeof item !== 'object') return null;

  const candidate = item as Partial<CartItem>;
  const variantId = typeof candidate.variantId === 'string' ? candidate.variantId : '';
  const productId = typeof candidate.productId === 'string' ? candidate.productId : '';
  const productName = typeof candidate.productName === 'string' ? candidate.productName : '';
  const variantName = typeof candidate.variantName === 'string' ? candidate.variantName : '';
  const price = Number(candidate.price);
  const quantity = Math.trunc(Number(candidate.quantity));
  const maxQuantity = Math.trunc(Number(candidate.maxQuantity));
  const imageUrl = typeof candidate.imageUrl === 'string' ? candidate.imageUrl : null;

  if (!variantId || !productId || !productName || !variantName) return null;
  if (!Number.isFinite(price) || !Number.isFinite(quantity) || !Number.isFinite(maxQuantity)) return null;
  if (maxQuantity < 1 || quantity < 1) return null;

  return {
    variantId,
    productId,
    productName,
    variantName,
    price,
    quantity: Math.min(quantity, maxQuantity),
    maxQuantity,
    imageUrl,
  };
}

function readCart(storageKey: string) {
  if (typeof window === 'undefined') return [] as CartItem[];

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return [] as CartItem[];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [] as CartItem[];
    }

    return parsed.map(normalizeCartItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [] as CartItem[];
  }
}

function writeCart(storageKey: string, items: CartItem[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { storageKey, items } }));
}

export function useCart(slug: string) {
  const storageKey = useMemo(() => getStorageKey(slug), [slug]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setItems(readCart(storageKey));
    setHasLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoaded) return;
    writeCart(storageKey, items);
  }, [hasLoaded, items, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== storageKey) return;
      setItems(readCart(storageKey));
    };

    const handleCartEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ storageKey?: string; items?: CartItem[] }>).detail;

      if (!detail || detail.storageKey !== storageKey) return;
      setItems(Array.isArray(detail.items) ? detail.items : readCart(storageKey));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CART_EVENT, handleCartEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CART_EVENT, handleCartEvent);
    };
  }, [storageKey]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      if (item.maxQuantity < 1) {
        return currentItems;
      }

      const existingIndex = currentItems.findIndex((entry) => entry.variantId === item.variantId);

      if (existingIndex === -1) {
        return [...currentItems, { ...item, quantity: 1 }];
      }

      const existingItem = currentItems[existingIndex];

      if (existingItem.quantity >= existingItem.maxQuantity) {
        return currentItems;
      }

      const nextItems = [...currentItems];
      nextItems[existingIndex] = {
        ...existingItem,
        quantity: Math.min(existingItem.quantity + 1, existingItem.maxQuantity),
      };

      return nextItems;
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((currentItems) => {
      const targetItem = currentItems.find((item) => item.variantId === variantId);

      if (!targetItem) {
        return currentItems;
      }

      if (quantity <= 0) {
        return currentItems.filter((item) => item.variantId !== variantId);
      }

      const clampedQuantity = Math.min(Math.max(quantity, 1), targetItem.maxQuantity);

      return currentItems.map((item) =>
        item.variantId === variantId ? { ...item, quantity: clampedQuantity } : item,
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}

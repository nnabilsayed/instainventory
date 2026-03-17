'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Category = {
  id: string;
  name: string;
};

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  shopId: string;
  onChange: (categoryId: string | null) => void;
  onCategoryCreated: (category: Category) => void;
}

export function CategorySelect({
  categories,
  value,
  shopId,
  onChange,
  onCategoryCreated,
}: CategorySelectProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((category) => category.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowCreateInput(false);
        setNewName('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showCreateInput) {
      const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timeoutId);
    }
  }, [showCreateInput]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('categories')
      .insert({
        shop_id: shopId,
        name,
        sort_order: categories.length,
      })
      .select('id, name')
      .single();

    if (error) {
      if (error.code === '23505') {
        notify.error('This category already exists');
      } else {
        notify.error('Failed to create category');
      }
    } else {
      notify.success(`"${name}" created`);
      onCategoryCreated(data);
      onChange(data.id);
      setNewName('');
      setShowCreateInput(false);
      setOpen(false);
    }

    setCreating(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 text-start text-sm transition-colors focus:outline-none',
          open
            ? 'border-[var(--accent-navy)] ring-2 ring-[var(--accent-navy)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        )}
      >
        <span className={selectedCategory ? 'text-primary' : 'text-tertiary'}>
          {selectedCategory ? selectedCategory.name : 'No category'}
        </span>
        <div className="flex flex-shrink-0 items-center gap-1">
          {value && (
            <span
              role="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              className="rounded p-0.5 text-tertiary transition-colors hover:text-primary"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn('text-tertiary transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>

      {open && (
        <div className="absolute start-0 end-0 top-full z-30 mt-1 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2.5 text-start text-sm transition-colors hover:bg-[var(--surface-hover)]',
                !value ? 'font-medium text-primary' : 'text-secondary'
              )}
            >
              No category
              {!value && <Check size={13} className="text-[var(--accent-navy)]" />}
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2.5 text-start text-sm transition-colors hover:bg-[var(--surface-hover)]',
                  value === category.id ? 'font-medium text-primary' : 'text-secondary'
                )}
              >
                {category.name}
                {value === category.id && <Check size={13} className="text-[var(--accent-navy)]" />}
              </button>
            ))}

            {categories.length === 0 && !showCreateInput && (
              <p className="px-3 py-3 text-center text-xs text-tertiary">No categories yet</p>
            )}
          </div>

          <div className="border-t border-[var(--border)]" />

          {!showCreateInput ? (
            <button
              type="button"
              onClick={() => setShowCreateInput(true)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--accent-navy)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              <Plus size={14} />
              Create new category
            </button>
          ) : (
            <div className="space-y-2 p-2">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleCreate();
                  }
                  if (event.key === 'Escape') {
                    setShowCreateInput(false);
                    setNewName('');
                  }
                }}
                placeholder="Category name..."
                maxLength={50}
                className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-primary placeholder:text-tertiary focus:border-[var(--accent-navy)] focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={creating || !newName.trim()}
                  className="flex h-8 flex-1 items-center justify-center gap-1 rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-xs font-medium text-white transition-colors disabled:opacity-40"
                >
                  {creating ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <Plus size={11} />
                      Create
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateInput(false);
                    setNewName('');
                  }}
                  className="h-8 rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-xs text-secondary transition-colors hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

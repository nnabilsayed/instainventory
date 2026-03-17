'use client';

import { useMemo, useState } from 'react';

function isPdfUrl(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.pdf');
}

export default function ReceiptModal({ fileUrl }: { fileUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isPdf = useMemo(() => isPdfUrl(fileUrl), [fileUrl]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-slate-300 hover:bg-slate-100"
      >
        {isPdf ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              PDF
            </div>
            <p className="text-sm font-medium text-slate-900">Payment receipt uploaded</p>
            <p className="text-xs text-slate-500">Tap to preview the file</p>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt="Payment proof"
              className="max-h-[320px] w-full bg-slate-100 object-contain"
            />
            <div className="border-t border-slate-200 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">Payment proof</p>
              <p className="text-xs text-slate-500">Tap to open a larger preview</p>
            </div>
          </>
        )}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-xl text-white transition hover:bg-black"
              onClick={() => setIsOpen(false)}
              aria-label="Close payment proof preview"
            >
              x
            </button>

            {isPdf ? (
              <iframe
                src={fileUrl}
                title="Payment proof PDF"
                className="h-[85vh] w-full bg-slate-100"
              />
            ) : (
              <div className="flex max-h-[85vh] items-center justify-center bg-slate-950 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt="Payment proof preview"
                  className="max-h-[80vh] w-auto max-w-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

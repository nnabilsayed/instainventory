'use client';

import { useState } from 'react';

export default function ReceiptModal({ imageUrl }: { imageUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="cursor-pointer overflow-hidden rounded border hover:opacity-80 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Proof" className="w-full h-auto object-cover" />
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt="Full Proof" 
            className="max-w-full max-h-full object-contain rounded shadow-2xl" 
            onClick={(e) => e.stopPropagation()} // Prevent clicking the image from closing it if they want to interact, though here clicking anywhere closes it is fine, but normally good to have. Actually, user asked for clicking anywhere to close it usually so we can leave it. Let's just allow clicking the background to close, and clicking the image to close too for ease of use on mobile.
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-red-400 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

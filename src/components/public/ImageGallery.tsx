"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  address: string;
}

export function ImageGallery({ images, address }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/7] w-full bg-navy/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-navy/10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-mid-gray text-sm mt-2">No photos available</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div
        className="aspect-[16/7] w-full bg-navy/5 overflow-hidden cursor-pointer"
        onClick={() => setLightboxOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt={address} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <>
      {/* Main image + thumbnails */}
      <div className="space-y-2">
        {/* Active image */}
        <div
          className="aspect-[16/7] w-full bg-navy/5 overflow-hidden cursor-pointer relative group"
          onClick={() => setLightboxOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIndex]}
            alt={`${address} - Photo ${activeIndex + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-navy/70 text-white text-[11px] font-semibold tracking-wider px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {activeIndex + 1} / {images.length}
          </div>
          {/* Nav arrows */}
          {activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIndex(activeIndex - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIndex(activeIndex + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-16 h-12 overflow-hidden border-2 transition-colors ${
                i === activeIndex ? "border-gold" : "border-transparent hover:border-navy/20"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt={`${address} - Photo ${activeIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>

          {/* Lightbox nav */}
          {activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIndex(activeIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIndex(activeIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Desktop Mouse Drag-to-Scroll implementation
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    animationId: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !scrollRef.current) return;
    cancelAnimationFrame(dragInfo.current.animationId);

    dragInfo.current = {
      startX: e.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
      hasMoved: false,
      lastX: e.pageX,
      lastTime: Date.now(),
      velocity: 0,
      animationId: 0,
    };
    setIsMouseDown(true);
  };

  useEffect(() => {
    if (!isMouseDown) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollRef.current) return;
      const deltaX = e.pageX - dragInfo.current.startX;

      if (!dragInfo.current.hasMoved && Math.abs(deltaX) > 5) {
        dragInfo.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragInfo.current.hasMoved) {
        e.preventDefault();
        scrollRef.current.style.scrollSnapType = 'none';
        scrollRef.current.style.scrollBehavior = 'auto';
        scrollRef.current.scrollLeft = dragInfo.current.scrollLeft - deltaX;

        // Calculate drag velocity for smooth momentum release
        const now = Date.now();
        const dt = now - dragInfo.current.lastTime;
        if (dt > 0) {
          dragInfo.current.velocity = (e.pageX - dragInfo.current.lastX) / dt;
          dragInfo.current.lastX = e.pageX;
          dragInfo.current.lastTime = now;
        }
      }
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
      const container = scrollRef.current;
      if (!container) return;

      if (dragInfo.current.hasMoved) {
        // Inertia flick scrolling if released with speed
        let vel = dragInfo.current.velocity * 12;
        if (Math.abs(vel) > 1.5) {
          const step = () => {
            if (!scrollRef.current) return;
            if (Math.abs(vel) > 0.5) {
              scrollRef.current.scrollLeft -= vel;
              vel *= 0.90;
              dragInfo.current.animationId = requestAnimationFrame(step);
            } else {
              scrollRef.current.style.scrollSnapType = '';
              scrollRef.current.style.scrollBehavior = '';
            }
          };
          dragInfo.current.animationId = requestAnimationFrame(step);
        } else {
          container.style.scrollSnapType = '';
          container.style.scrollBehavior = '';
        }

        // Delay clearing isDragging to safely suppress onClick event on thumbnails
        setTimeout(() => {
          setIsDragging(false);
        }, 80);
      } else {
        container.style.scrollSnapType = '';
        container.style.scrollBehavior = '';
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown]);

  const handleItemClick = (index: number) => {
    // If user dragged the gallery, suppress lightbox opening
    if (dragInfo.current.hasMoved || isDragging) return;
    openLightbox(index);
  };

  const scrollByAmount = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filter out PDF references, preserving resolved priority (source image first, extracted images fallback)
  const validImages = images.filter(url => url && !url.toLowerCase().endsWith('.pdf'));

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const goPrev = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  // Touch tracking for swipe gestures
  const [touchStartXY, setTouchStartXY] = useState<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartXY({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartXY) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartXY.x - touchEndX;
    const diffY = touchStartXY.y - touchEndY;

    // Detect horizontal swipe, ensure it's not a vertical scroll
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) goNext(); // Swipe left -> Next
      else goPrev();           // Swipe right -> Prev
    }
    setTouchStartXY(null);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, goNext, goPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  if (validImages.length === 0) return null;

  return (
    <>
      {/* Thumbnail Scroll Strip with Mouse Drag-to-Scroll & Navigation Arrows */}
      <div className="relative mb-6 group/strip select-none">
        {/* Left Arrow Button (Desktop Only) */}
        {validImages.length > 2 && (
          <button
            type="button"
            onClick={() => scrollByAmount(-340)}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200 dark:border-zinc-700 items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-white hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/strip:opacity-100"
            aria-label="前へスクロール"
          >
            <ChevronLeft className="w-5 h-5 pointer-events-none" />
          </button>
        )}

        {/* Right Arrow Button (Desktop Only) */}
        {validImages.length > 2 && (
          <button
            type="button"
            onClick={() => scrollByAmount(340)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200 dark:border-zinc-700 items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-white hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/strip:opacity-100"
            aria-label="次へスクロール"
          >
            <ChevronRight className="w-5 h-5 pointer-events-none" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          className={`overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 select-none ${
            isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
          } [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-zinc-100 dark:[&::-webkit-scrollbar-track]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb]:rounded-full`}
        >
          {validImages.map((img, i) => (
            <div
              key={i}
              onClick={() => handleItemClick(i)}
              onDragStart={(e) => e.preventDefault()}
              className="snap-center shrink-0 w-[240px] md:w-[320px] h-[180px] md:h-[240px] relative rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center select-none group"
            >
              <img
                src={img}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/no-image.png';
                }}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none"
                loading="lazy"
              />
              {/* Hover overlay with zoom icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-zinc-800/90 rounded-full p-2 shadow-md">
                  <ZoomIn className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                </div>
              </div>
              {/* Image counter badge */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full pointer-events-none">
                {i + 1}/{validImages.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button - 白地黒文、全デバイスで表示、ヘッダーの下に配置 */}
          {/* 注意: lightbox z-[9999] < header z-[10000] なのでtop-[72px]にオフセット */}
          <button
            onClick={closeLightbox}
            className="absolute top-[72px] right-4 z-10 flex items-center gap-2 bg-white hover:bg-zinc-100 border-2 border-black/80 text-black font-bold rounded-full px-4 py-2 transition-all duration-200 shadow-xl"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">閉じる</span>
          </button>

          {/* Image counter - moved down to clear the header too */}
          <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
            {activeIndex + 1} / {validImages.length}
          </div>

          {/* Left Arrow */}
          {validImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-3 sm:left-6 z-10 bg-white/20 hover:bg-white/40 text-black dark:text-black rounded-full p-3 transition-colors shadow-sm mix-blend-luminosity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none" strokeWidth={3} />
            </button>
          )}

          {/* Main Image — click on image itself doesn't close modal */}
          <div
            className="flex items-center justify-center w-full h-full px-16 sm:px-20"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={activeIndex}
              src={validImages[activeIndex]}
              alt={`Image ${activeIndex + 1}`}
              className="max-h-[88vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
            />
          </div>

          {/* Right Arrow */}
          {validImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-3 sm:right-6 z-10 bg-white/20 hover:bg-white/40 text-black dark:text-black rounded-full p-3 transition-colors shadow-sm mix-blend-luminosity"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none" strokeWidth={3} />
            </button>
          )}

          {/* Bottom hint bar */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
            {/* Dot Indicators */}
            {validImages.length > 1 && (
              <div
                className="flex gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {validImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeIndex
                        ? 'bg-white scale-125'
                        : 'bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Mobile: tap-to-close hint */}
            <p className="text-white/50 text-xs sm:hidden select-none">
              タップして閉じる
            </p>
          </div>
        </div>
      )}
    </>
  );
}

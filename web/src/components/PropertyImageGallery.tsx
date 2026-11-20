'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  images?: string[];
  assetTitle: string;
}

export function PropertyImageGallery({ images, assetTitle }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleItemClick = (imgUrl: string) => {
    if (dragInfo.current.hasMoved || isDragging) return;
    setSelectedImage(imgUrl);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-4 px-6 pt-6 select-none">
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className={`flex overflow-x-auto gap-4 pb-4 snap-x select-none ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        } [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-zinc-100 dark:[&::-webkit-scrollbar-track]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb]:rounded-full`}
      >
        {images.map((imgUrl, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-64 h-48 relative rounded-xl overflow-hidden snap-center shadow-md hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-700 select-none"
            onClick={() => handleItemClick(imgUrl)}
            onDragStart={(e) => e.preventDefault()}
          >
            <Image 
              src={imgUrl} 
              alt={`${assetTitle}の写真-${i + 1}`} 
              fill 
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="object-cover hover:scale-105 transition-transform duration-300 pointer-events-none select-none" 
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image 
              src={selectedImage} 
              alt={`${assetTitle}の拡大写真`} 
              fill 
              className="object-contain" 
            />
            <button 
              className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black/90 rounded-full w-12 h-12 flex items-center justify-center text-3xl font-light cursor-pointer shadow-lg transition-colors border border-white/20"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

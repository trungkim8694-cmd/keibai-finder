'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  images?: string[];
  assetTitle: string;
}

export function PropertyImageGallery({ images, assetTitle }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-4 px-6 pt-6">
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
        {images.map((imgUrl, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-64 h-48 relative rounded-xl overflow-hidden cursor-zoom-in snap-center shadow-md hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-700"
            onClick={() => setSelectedImage(imgUrl)}
          >
            <Image 
              src={imgUrl} 
              alt={`${assetTitle}の写真-${i + 1}`} 
              fill 
              className="object-cover hover:scale-105 transition-transform duration-300" 
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

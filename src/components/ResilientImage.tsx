import { useState } from 'react';
import { Flame } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ResilientImage({ src, alt, className = '' }: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F6F3F2] to-[#EAE7E7] text-[#8E7069] p-4 ${className}`}
      >
        <Flame className="w-6 h-6 text-[#D3451B] mb-1.5" strokeWidth={1.75} />
        <span className="text-xs font-medium text-center text-[#5A413A] line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

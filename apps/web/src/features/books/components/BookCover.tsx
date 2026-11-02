'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/get-initials';
import { isOptimizableImageUrl } from '@/lib/image-hosts';

interface BookCoverProps {
  name: string;
  photoUrl: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

const DEFAULT_SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

export function BookCover({
  name,
  photoUrl,
  sizes = DEFAULT_SIZES,
  priority = false,
  className,
}: BookCoverProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = photoUrl !== null && photoUrl !== failedUrl;

  return (
    <div
      className={cn(
        'relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-accent-50',
        className,
      )}
    >
      {hasImage ? (
        <Image
          src={photoUrl}
          alt={`Обкладинка: ${name}`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!isOptimizableImageUrl(photoUrl)}
          onError={() => setFailedUrl(photoUrl)}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`Без обкладинки: ${name}`}
          className="flex size-full items-center justify-center bg-gradient-to-br from-accent-50 to-accent-100 text-4xl font-semibold text-accent-600"
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

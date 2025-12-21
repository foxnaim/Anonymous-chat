'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
}

/**
 * Оптимизированная ссылка с prefetching для ускорения навигации
 */
export function OptimizedLink({ href, children, className, prefetch = true }: OptimizedLinkProps) {
  return (
    <Link href={href} className={className} prefetch={prefetch}>
      {children}
    </Link>
  );
}


'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import type { Route } from 'next';

interface OptimizedLinkProps {
  href: string | Route;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
}

/**
 * Оптимизированная ссылка с prefetching для ускорения навигации
 */
export function OptimizedLink({ href, children, className, prefetch = true }: OptimizedLinkProps) {
  return (
    <Link href={href as Route} className={className} prefetch={prefetch}>
      {children}
    </Link>
  );
}


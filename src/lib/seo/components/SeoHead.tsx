'use client';

import { DefaultSeo } from "next-seo";
import defaultSeo from "../defaultSeo";

/**
 * Компонент для глобального SEO через next-seo
 * Используется в layout.tsx
 */
export const SeoHead = () => <DefaultSeo {...defaultSeo} />;


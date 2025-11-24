'use client';

import { DefaultSeo } from "next-seo";
import defaultSeo from "@/lib/seo/defaultSeo";

const SeoHead = () => <DefaultSeo {...defaultSeo} />;

export default SeoHead;


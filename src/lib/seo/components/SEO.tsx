'use client';

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { APP_CONFIG } from "../constants";
import { seoUtils } from "../index";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  canonical?: string;
}

export const SEO = ({
  title,
  description,
  keywords,
  image,
  type = "website",
  noindex = false,
  canonical,
}: SEOProps) => {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();

  useEffect(() => {
    const defaultDescription = t("seo.defaultDescription", {
      defaultValue: "Отправляйте анонимные отзывы в свою компанию. Безопасная платформа для честной обратной связи.",
    });

    const pageTitle = seoUtils.getFullTitle(title, APP_CONFIG.NAME);
    const pageDescription = description || defaultDescription;
    const pageKeywords = keywords || t("seo.defaultKeywords", { defaultValue: "обратная связь, анонимные отзывы, HR, feedback, компания" });
    const canonicalUrl = canonical || seoUtils.getCanonicalUrl(pathname, APP_CONFIG.SITE_URL);
    const ogImage = image || seoUtils.getOgImageUrl();
    const currentLang = i18n.language || APP_CONFIG.DEFAULT_LANGUAGE;

    // Update title
    document.title = pageTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", pageDescription);
    updateMetaTag("keywords", pageKeywords);
    updateMetaTag("author", APP_CONFIG.NAME);
    updateMetaTag("robots", noindex ? "noindex, nofollow" : "index, follow");
    updateMetaTag("language", currentLang);
    updateMetaTag("revisit-after", "7 days");

    // Open Graph tags
    updateMetaTag("og:title", pageTitle, true);
    updateMetaTag("og:description", pageDescription, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:url", canonicalUrl, true);
    updateMetaTag("og:site_name", APP_CONFIG.NAME, true);
    updateMetaTag("og:locale", currentLang === "kk" ? "kk_KZ" : currentLang === "en" ? "en_US" : "ru_RU", true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", pageTitle);
    updateMetaTag("twitter:description", pageDescription);
    updateMetaTag("twitter:image", ogImage);

    // Canonical URL
    let canonicalLink = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // Hreflang tags for multilingual support
    APP_CONFIG.SUPPORTED_LANGUAGES.forEach((lang) => {
      let hreflang = document.querySelector(`link[rel='alternate'][hreflang='${lang}']`) as HTMLLinkElement;
      if (!hreflang) {
        hreflang = document.createElement("link");
        hreflang.setAttribute("rel", "alternate");
        hreflang.setAttribute("hreflang", lang);
        document.head.appendChild(hreflang);
      }
      hreflang.setAttribute("href", `${APP_CONFIG.SITE_URL}${pathname}?lang=${lang}`);
    });

    // Add x-default hreflang
    let xDefault = document.querySelector("link[rel='alternate'][hreflang='x-default']") as HTMLLinkElement;
    if (!xDefault) {
      xDefault = document.createElement("link");
      xDefault.setAttribute("rel", "alternate");
      xDefault.setAttribute("hreflang", "x-default");
      document.head.appendChild(xDefault);
    }
    xDefault.setAttribute("href", `${APP_CONFIG.SITE_URL}${pathname}`);

    // Update HTML lang attribute
    document.documentElement.setAttribute("lang", currentLang);
  }, [title, description, keywords, image, type, noindex, canonical, pathname, t, i18n.language]);

  return null;
};

// Structured Data (JSON-LD) component
interface StructuredDataProps {
  type: "Organization" | "WebSite" | "WebPage" | "SoftwareApplication";
  data: Record<string, any>;
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `structured-data-${type.toLowerCase()}`;
    
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    };

    script.text = JSON.stringify(jsonLd);

    // Remove existing script if present
    const existing = document.getElementById(script.id);
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(script.id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
};

// Default structured data for the website
export const WebsiteStructuredData = () => {
  const { t } = useTranslation();

  return (
    <StructuredData
      type="WebSite"
      data={{
        name: APP_CONFIG.NAME,
        description: t("seo.defaultDescription", {
          defaultValue: "Платформа анонимной обратной связи для компаний",
        }),
        url: APP_CONFIG.SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${APP_CONFIG.SITE_URL}/check-status?messageId={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
};

export const OrganizationStructuredData = () => {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: APP_CONFIG.NAME,
        url: APP_CONFIG.SITE_URL,
        logo: `${APP_CONFIG.SITE_URL}/logo.png`,
        sameAs: [
          // Add social media links here if available
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Service",
          availableLanguage: ["Russian", "English", "Kazakh"],
        },
      }}
    />
  );
};


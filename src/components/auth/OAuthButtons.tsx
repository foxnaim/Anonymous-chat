'use client';

import React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FiMail } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface OAuthButtonsProps {
  onEmailClick?: () => void;
}

export const OAuthButtons = ({ onEmailClick }: OAuthButtonsProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const handleOAuthSignIn = async (provider: "google" | "azure-ad") => {
    setIsLoading(provider);
    try {
      await signIn(provider, {
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn("google")}
        disabled={isLoading !== null}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading === "google" ? t("common.loading") : "Войти через Google"}
      </Button>

      {/* Microsoft OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn("azure-ad")}
        disabled={isLoading !== null}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="currentColor">
          <path d="M0 0h11.377v11.372H0z" fill="#f25022" />
          <path d="M12.623 0H24v11.372H12.623z" fill="#00a4ef" />
          <path d="M0 12.628h11.377V24H0z" fill="#7fba00" />
          <path d="M12.623 12.628H24V24H12.623z" fill="#ffb900" />
        </svg>
        {isLoading === "azure-ad" ? t("common.loading") : "Войти через Microsoft"}
      </Button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("auth.or") || "или"}
          </span>
        </div>
      </div>

      {/* Email/Password button (если нужно показать форму) */}
      {onEmailClick && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onEmailClick}
          disabled={isLoading !== null}
        >
          <FiMail className="mr-2 h-5 w-5" />
          {t("auth.loginWithEmail") || "Войти через Email"}
        </Button>
      )}
    </div>
  );
};


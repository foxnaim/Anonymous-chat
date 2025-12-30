'use client';

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/redux";
import { Button } from "@/components/ui/button";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { verifyEmail } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      effectRan.current = true;
      try {
        const success = await verifyEmail(token);
        if (success) {
          setStatus('success');
          // Redirect after short delay
          setTimeout(() => {
            router.push('/company');
          }, 3000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus('error');
      }
    };

    verify();
  }, [token, verifyEmail, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-xl border border-border bg-card shadow-lg">
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <FiLoader className="h-12 w-12 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">{t("auth.verifyingEmail")}</h1>
            <p className="text-muted-foreground">{t("auth.verifyEmailWait")}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <FiCheckCircle className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-2xl font-bold">{t("auth.emailVerified")}</h1>
            <p className="text-muted-foreground">{t("auth.emailVerifiedSuccess")}</p>
            <Button onClick={() => router.push('/company')} className="w-full">
              {t("auth.goToDashboard")}
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <FiXCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">{t("auth.verificationFailed")}</h1>
            <p className="text-muted-foreground">{t("auth.verificationLinkInvalid")}</p>
            <div className="flex flex-col gap-2">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  {t("auth.returnHome")}
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
                {t("auth.login")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


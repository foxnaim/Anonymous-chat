'use client';
import { useRouter } from "next/navigation";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
const NotFound = () => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("common.pageNotFound")}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          {t("common.backToHome")}
        </Button>
      </div>
    </div>
  );
};
export default NotFound;

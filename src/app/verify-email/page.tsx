import { Suspense } from "react";
import VerifyEmailPage from "@/components/pages/VerifyEmailPage";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Verify Email | FeedbackHub",
};

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailPage />
    </Suspense>
  );
}

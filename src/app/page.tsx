import { Suspense } from "react";
import WelcomePage from "@/components/pages/Welcome";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <WelcomePage />
    </Suspense>
  );
}


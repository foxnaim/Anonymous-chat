import { Suspense } from "react";
import SendMessage from "@/components/pages/SendMessage";

export default function SendMessagePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SendMessage />
    </Suspense>
  );
}


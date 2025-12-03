import { Suspense } from "react";
import Login from "@/components/pages/Login";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}


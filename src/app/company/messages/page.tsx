'use client';

import CompanyMessages from "@/components/pages/company/CompanyMessages";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CompanyMessagesPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanyMessages />
    </ProtectedRoute>
  );
}


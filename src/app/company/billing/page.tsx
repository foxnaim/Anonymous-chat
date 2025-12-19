'use client';

import CompanyBilling from "@/components/pages/company/CompanyBilling";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CompanyBillingPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanyBilling />
    </ProtectedRoute>
  );
}


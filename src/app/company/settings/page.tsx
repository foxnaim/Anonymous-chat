'use client';

import CompanySettings from "@/components/pages/company/CompanySettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CompanySettingsPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanySettings />
    </ProtectedRoute>
  );
}


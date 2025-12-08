'use client';

import CompanyReports from "@/components/pages/company/CompanyReports";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CompanyReportsPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanyReports />
    </ProtectedRoute>
  );
}


'use client';

import CompanyGrowth from "@/components/pages/company/CompanyGrowth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CompanyGrowthPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanyGrowth />
    </ProtectedRoute>
  );
}


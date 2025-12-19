'use client';

import CompanyDashboard from "@/components/pages/CompanyDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CompanyPage() {
  return (
    <ProtectedRoute requiredRole="company">
      <CompanyDashboard />
    </ProtectedRoute>
  );
}


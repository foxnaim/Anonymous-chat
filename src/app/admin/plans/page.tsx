'use client';

import AdminPlans from "@/components/pages/admin/AdminPlans";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPlansPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminPlans />
    </ProtectedRoute>
  );
}


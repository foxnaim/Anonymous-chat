'use client';

import AdminSettings from "@/components/pages/admin/AdminSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminSettings />
    </ProtectedRoute>
  );
}


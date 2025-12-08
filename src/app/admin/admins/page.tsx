'use client';

import AdminAdmins from "@/components/pages/admin/AdminAdmins";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminAdminsPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminAdmins />
    </ProtectedRoute>
  );
}


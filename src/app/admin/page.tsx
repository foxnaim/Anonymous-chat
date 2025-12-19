'use client';

import AdminPanel from "@/components/pages/AdminPanel";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminPanel />
    </ProtectedRoute>
  );
}


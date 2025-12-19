'use client';

import AdminMessages from "@/components/pages/admin/AdminMessages";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminMessagesPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminMessages />
    </ProtectedRoute>
  );
}


'use client';

import AdminAnalytics from "@/components/pages/admin/AdminAnalytics";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      <AdminAnalytics />
    </ProtectedRoute>
  );
}


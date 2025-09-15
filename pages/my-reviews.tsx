import React from 'react';
import Layout from '../src/components/Layout/Layout';
import MonthlyReview from '../src/pages/MonthlyReview';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function MyReviewsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["director"]}>
          <MonthlyReview />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
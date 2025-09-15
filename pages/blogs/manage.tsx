import React from 'react';
import Layout from '../../src/components/Layout/Layout';
import BlogManagement from '../../src/pages/BlogManagement';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import RoleBasedRoute from '../../src/components/RoleBasedRoute';

export default function BlogManagePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin", "admin"]}>
          <BlogManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
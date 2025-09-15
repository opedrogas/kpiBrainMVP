import React from 'react';
import Layout from '../../src/components/Layout/Layout';
import UserBlogs from '../../src/pages/UserBlogs';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import RoleBasedRoute from '../../src/components/RoleBasedRoute';

export default function BlogsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["director", "clinician"]}>
          <UserBlogs />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
import React from 'react';
import Layout from '../src/components/Layout/Layout';
import PermissionManagement from '../src/pages/PermissionManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function PermissionsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin"]}>
          <PermissionManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
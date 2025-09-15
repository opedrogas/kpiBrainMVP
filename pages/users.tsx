import React from 'react';
import Layout from '../src/components/Layout/Layout';
import UserManagement from '../src/pages/UserManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin"]}>
          <UserManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
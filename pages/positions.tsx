import React from 'react';
import Layout from '../src/components/Layout/Layout';
import PositionManagement from '../src/pages/PositionManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function PositionsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin"]}>
          <PositionManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
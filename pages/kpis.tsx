import React from 'react';
import Layout from '../src/components/Layout/Layout';
import KPIManagement from '../src/pages/KPIManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function KPIPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin"]}>
          <KPIManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
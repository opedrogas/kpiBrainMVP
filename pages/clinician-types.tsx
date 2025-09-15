import React from 'react';
import Layout from '../src/components/Layout/Layout';
import ClinicianTypesManagement from '../src/pages/ClinicianTypesManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function ClinicianTypesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin"]}>
          <ClinicianTypesManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
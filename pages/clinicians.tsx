import React from 'react';
import Layout from '../src/components/Layout/Layout';
import ClinicianManagement from '../src/pages/ClinicianManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function CliniciansPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["director"]}>
          <ClinicianManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
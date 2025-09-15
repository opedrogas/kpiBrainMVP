import React from 'react';
import Layout from '../../src/components/Layout/Layout';
import ClinicianProfile from '../../src/pages/ClinicianProfile';
import ProtectedRoute from '../../src/components/ProtectedRoute';

export default function ClinicianProfilePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ClinicianProfile />
      </Layout>
    </ProtectedRoute>
  );
}
import React from 'react';
import Layout from '../src/components/Layout/Layout';
import DirectorDocuments from '../src/pages/DirectorDocuments';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function MyDocumentsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["director"]}>
          <DirectorDocuments />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
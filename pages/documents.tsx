import React from 'react';
import Layout from '../src/components/Layout/Layout';
import DocumentManagement from '../src/pages/DocumentManagement';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin", "admin"]}>
          <DocumentManagement />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
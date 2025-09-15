import React from 'react';
import Layout from '../src/components/Layout/Layout';
import AssignDirector from '../src/pages/AssignDirector';
import ProtectedRoute from '../src/components/ProtectedRoute';
import RoleBasedRoute from '../src/components/RoleBasedRoute';

export default function AssignDirectorPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RoleBasedRoute allowedRoles={["super-admin"]}>
          <AssignDirector />
        </RoleBasedRoute>
      </Layout>
    </ProtectedRoute>
  );
}
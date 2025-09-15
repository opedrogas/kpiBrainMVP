import React from 'react';
import Layout from '../src/components/Layout/Layout';
import SecuritySettings from '../src/components/SecuritySettings';
import ProtectedRoute from '../src/components/ProtectedRoute';

export default function SecuritySettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SecuritySettings />
      </Layout>
    </ProtectedRoute>
  );
}
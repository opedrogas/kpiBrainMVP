import React from 'react';
import Head from 'next/head';
import Layout from '../src/components/Layout/Layout';
import Dashboard from '../src/pages/Dashboard';
import PendingApproval from '../src/components/PendingApproval';
import LandingPage from '../src/components/LandingPage';
import { useAuth } from '../src/contexts/AuthContext';
import ProtectedRoute from '../src/components/ProtectedRoute';

const SEO = () => (
  <Head>
    <title>Healthcare KPI Software – KPIbrain | Clinical Performance &amp; Accountability</title>
    <meta
      name="description"
      content="KPIbrain helps healthcare teams align on clinical KPIs, improve accountability, and strengthen performance with clear, real-time insights"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="Healthcare KPI Software – KPIbrain | Clinical Performance & Accountability" />
    <meta property="og:description" content="KPIbrain helps healthcare teams align on clinical KPIs, improve accountability, and strengthen performance with clear, real-time insights" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://kpibrain.app/" />
    <meta property="og:site_name" content="KPIbrain" />
    <meta name="twitter:card" content="summary" />
  </Head>
);

export default function HomePage() {
  const { isAuthenticated, isPendingApproval } = useAuth();

  if (isPendingApproval) return (
    <>
      <SEO />
      <PendingApproval />
    </>
  );
  if (!isAuthenticated) return (
    <>
      <SEO />
      <LandingPage />
    </>
  );

  return (
    <ProtectedRoute>
      <SEO />
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
}
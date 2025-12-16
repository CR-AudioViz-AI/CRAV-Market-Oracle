'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Loading component
function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Market Oracle...</p>
      </div>
    </div>
  );
}

// Dynamically import the dashboard with no SSR
const AIDashboardContent = dynamic(
  () => import('./dashboard-content'),
  { 
    ssr: false,
    loading: () => <LoadingDashboard />
  }
);

export default function AIDashboardPage() {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <AIDashboardContent />
    </Suspense>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useAdminAuth, clearAdminAuth } from '@/hooks/useAdminAuth';

export default function UpdatePage() {
  const router = useRouter();
  useAdminAuth();

  function handleLogout() {
    clearAdminAuth();
    router.replace('/pipeline/login');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Update Lead Status</h1>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2 transition-colors"
        >
          Logout
        </button>
      </div>
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="text-gray-500">Phone lookup tool coming in Phase 7</p>
      </div>
    </main>
  );
}

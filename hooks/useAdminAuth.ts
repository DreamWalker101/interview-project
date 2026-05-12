'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_KEY = 'adminAuth';

export function useAdminAuth() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem(AUTH_KEY);
      if (!auth) {
        router.replace('/pipeline/login');
      }
    }
  }, [router]);
}

export function setAdminAuth() {
  sessionStorage.setItem(AUTH_KEY, '1');
}

export function clearAdminAuth() {
  sessionStorage.removeItem(AUTH_KEY);
}

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminAuth } from '@/hooks/useAdminAuth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const validPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (username === validUser && password === validPass) {
      setAdminAuth();
      router.replace('/pipeline');
    } else {
      setError(true);
    }
  }

  return (
    <main className="bg-background min-h-screen flex items-center justify-center font-body text-body text-text-black p-lg">
      <div className="w-full max-w-[400px]">
        <div className="bg-canvas-white rounded-[24px] shadow-xl p-card-padding">
          {/* Header */}
          <div className="mb-section text-center">
            <span
              className="material-symbols-outlined text-primary text-[48px] mb-md block"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              shield_person
            </span>
            <h1 className="font-heading text-heading text-text-black">Admin Login</h1>
            <p className="font-subheading text-subheading text-secondary mt-xs">
              Pipeline Access
            </p>
          </div>

          {/* Form */}
          <form className="space-y-[16px]" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="flex flex-col gap-xs">
              <label
                className="font-label text-label text-secondary px-md"
                htmlFor="username"
              >
                Username
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-muted-ash"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(false); }}
                  placeholder="Enter your username"
                  className="w-full bg-transparent border border-outline-gray rounded-[100px] py-[12px] pl-[40px] pr-md font-body text-body text-text-black focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-xs">
              <label
                className="font-label text-label text-secondary px-md"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-muted-ash"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Enter your password"
                  className="w-full bg-transparent border border-outline-gray rounded-[100px] py-[12px] pl-[40px] pr-md font-body text-body text-text-black focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="pt-sm pb-md">
                <p className="font-label text-label text-error text-center flex items-center justify-center gap-xs">
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    error
                  </span>
                  Invalid username or password
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-mint-accent text-text-black font-subheading text-subheading rounded-[200px] py-md flex items-center justify-center gap-sm hover:opacity-90 transition-opacity"
            >
              Login
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                arrow_forward
              </span>
            </button>
          </form>
        </div>

        <div className="mt-section text-center">
          <p className="font-caption text-caption text-muted-ash">
            Internal use only.
          </p>
        </div>
      </div>
    </main>
  );
}

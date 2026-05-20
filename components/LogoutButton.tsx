'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/authClient';

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

export default function LogoutButton({ className, label = 'Déconnexion' }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      await signOut();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        'text-sm px-3 py-1.5 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors disabled:opacity-50'
      }
    >
      {loading ? 'Déconnexion…' : label}
    </button>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import Button from '../components/ui/Button';
import FloatingEmptyScene from '../components/three/FloatingEmptyScene';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <FloatingEmptyScene />
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white font-mono">404</h1>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
            Deposit Record or Page Not Found
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            The requested resource could not be found or has been sequestered by institutional privacy boundaries.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" icon={ArrowLeft} className="w-full justify-center">
              Return to Vault Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

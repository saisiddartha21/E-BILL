import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}


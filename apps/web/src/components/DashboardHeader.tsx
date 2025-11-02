'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Customer } from '@/types/database';
import { LogOut, User as UserIcon } from 'lucide-react';

interface DashboardHeaderProps {
  user: User;
  customer: Customer | null;
}

export default function DashboardHeader({ user, customer }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">B2B Portal</h1>
          </div>

          <div className="flex items-center gap-4">
            {customer && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <UserIcon className="w-4 h-4" />
                <span className="font-medium">{customer.company_name}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

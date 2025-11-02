import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from '@/components/LoginForm';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">B2B Portal</h1>
            <p className="text-gray-600">Willkommen zum Kundenportal</p>
          </div>

          <LoginForm />
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Bei Problemen kontaktieren Sie bitte Ihren Ansprechpartner
        </p>
      </div>
    </div>
  );
}

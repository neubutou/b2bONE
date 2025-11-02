import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Project, Customer } from '@/types/database';
import ProjectCard from '@/components/ProjectCard';
import DashboardHeader from '@/components/DashboardHeader';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single<Customer>();

  if (!customer) {
    // Customer not found - show message
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} customer={null} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Kein Kundenkonto gefunden
            </h2>
            <p className="text-gray-600">
              Bitte kontaktieren Sie Ihren Ansprechpartner, um Zugang zu erhalten.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get customer's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} customer={customer} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meine Projekte</h1>
          <p className="text-gray-600 mt-2">
            Übersicht aller Projekte für {customer.company_name}
          </p>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-600">Noch keine Projekte vorhanden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

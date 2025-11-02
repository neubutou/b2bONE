import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Project, Customer, Asset, Leistungsnachweis } from '@/types/database';
import DashboardHeader from '@/components/DashboardHeader';
import ProjectDetails from '@/components/ProjectDetails';
import AssetUpload from '@/components/AssetUpload';
import AssetList from '@/components/AssetList';
import LeistungsnachweiseList from '@/components/LeistungsnachweiseList';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
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
    redirect('/dashboard');
  }

  // Get project (ensure it belongs to customer)
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('customer_id', customer.id)
    .single<Project>();

  if (error || !project) {
    notFound();
  }

  // Get project assets
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', project.id)
    .order('uploaded_at', { ascending: false });

  // Get leistungsnachweise
  const { data: leistungsnachweise } = await supabase
    .from('leistungsnachweise')
    .select('*')
    .eq('project_id', project.id)
    .order('service_date', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} customer={customer} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </Link>

        <ProjectDetails project={project} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Assets Section */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assets</h2>
              <AssetUpload projectId={project.id} customerId={customer.id} />
              <div className="mt-6">
                <AssetList assets={assets || []} />
              </div>
            </div>
          </div>

          {/* Leistungsnachweise Section */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Leistungsnachweise
              </h2>
              <LeistungsnachweiseList leistungsnachweise={leistungsnachweise || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

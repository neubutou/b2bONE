import type { Project } from '@/types/database';
import { Calendar, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ProjectDetailsProps {
  project: Project;
}

function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'aktiv':
    case 'in progress':
      return 'badge-success';
    case 'pending':
    case 'wartend':
      return 'badge-warning';
    case 'completed':
    case 'abgeschlossen':
      return 'badge-info';
    default:
      return 'badge-info';
  }
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.project_number && (
            <p className="text-gray-600 mt-1">Projekt #{project.project_number}</p>
          )}
        </div>

        {project.status && (
          <span className={`badge ${getStatusBadge(project.status)}`}>
            {project.status}
          </span>
        )}
      </div>

      {project.description && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Beschreibung</h3>
          <p className="text-gray-600">{project.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {project.start_date && (
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Startdatum</p>
              <p className="text-gray-900">
                {format(new Date(project.start_date), 'dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
          </div>
        )}

        {project.end_date && (
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Enddatum</p>
              <p className="text-gray-900">
                {format(new Date(project.end_date), 'dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
          </div>
        )}

        {project.budget && (
          <div className="flex items-start">
            <DollarSign className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Budget</p>
              <p className="text-gray-900">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(project.budget)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

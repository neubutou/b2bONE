import Link from 'next/link';
import type { Project } from '@/types/database';
import { Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ProjectCardProps {
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

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`} className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          {project.project_number && (
            <p className="text-sm text-gray-500">Projekt #{project.project_number}</p>
          )}
        </div>

        {project.status && (
          <span className={`badge ${getStatusBadge(project.status)}`}>
            {project.status}
          </span>
        )}
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="space-y-2">
        {project.start_date && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Start: {format(new Date(project.start_date), 'dd.MM.yyyy', { locale: de })}
          </div>
        )}

        {project.budget && (
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            Budget: {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
            }).format(project.budget)}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center text-primary-600 text-sm font-medium">
          Details anzeigen
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Link>
  );
}

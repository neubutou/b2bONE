import type { Leistungsnachweis } from '@/types/database';
import { FileText, Clock, DollarSign, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface LeistungsnachweiseListProps {
  leistungsnachweise: Leistungsnachweis[];
}

function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'genehmigt':
      return 'badge-success';
    case 'pending':
    case 'ausstehend':
      return 'badge-warning';
    case 'rejected':
    case 'abgelehnt':
      return 'badge-error';
    default:
      return 'badge-info';
  }
}

export default function LeistungsnachweiseList({
  leistungsnachweise,
}: LeistungsnachweiseListProps) {
  if (leistungsnachweise.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p>Keine Leistungsnachweise vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leistungsnachweise.map((ln) => (
        <div key={ln.id} className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{ln.title}</h4>
              {ln.record_number && (
                <p className="text-sm text-gray-500 mt-1">#{ln.record_number}</p>
              )}
            </div>

            {ln.status && (
              <span className={`badge ${getStatusBadge(ln.status)}`}>{ln.status}</span>
            )}
          </div>

          {ln.description && (
            <p className="text-sm text-gray-600 mb-3">{ln.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {ln.service_date && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {format(new Date(ln.service_date), 'dd.MM.yyyy', { locale: de })}
              </div>
            )}

            {ln.hours && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {ln.hours} Stunden
              </div>
            )}

            {ln.amount && (
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-2" />
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(ln.amount)}
              </div>
            )}

            {ln.performed_by && (
              <div className="flex items-center text-gray-600">
                Durchgeführt von: {ln.performed_by}
              </div>
            )}
          </div>

          {ln.approved && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Genehmigt
                {ln.approved_by && ` von ${ln.approved_by}`}
                {ln.approved_at &&
                  ` am ${format(new Date(ln.approved_at), 'dd.MM.yyyy', { locale: de })}`}
              </div>
            </div>
          )}

          {ln.attachment_url && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <a
                href={ln.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Anhang öffnen
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

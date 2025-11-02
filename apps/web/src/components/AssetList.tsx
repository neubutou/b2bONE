import type { Asset } from '@/types/database';
import { FileText, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AssetListProps {
  assets: Asset[];
}

function getFileIcon(fileType?: string) {
  return <FileText className="w-5 h-5 text-gray-400" />;
}

function getSyncStatusBadge(status: string) {
  switch (status) {
    case 'synced':
      return (
        <span className="inline-flex items-center badge badge-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Synchronisiert
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center badge badge-warning">
          <Clock className="w-3 h-3 mr-1" />
          Ausstehend
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center badge badge-error">
          <XCircle className="w-3 h-3 mr-1" />
          Fehler
        </span>
      );
    default:
      return null;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  const mb = kb / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
}

export default function AssetList({ assets }: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p>Keine Assets vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-start gap-3 flex-1">
            {getFileIcon(asset.file_type)}

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{asset.file_name}</p>

              {asset.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {asset.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>
                  {format(new Date(asset.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </span>
                {asset.file_size && <span>{formatFileSize(asset.file_size)}</span>}
                {getSyncStatusBadge(asset.sync_status)}
              </div>
            </div>
          </div>

          {/* Download Button - TODO: Implement download functionality */}
          {/* <button
            className="btn btn-secondary text-xs py-1 px-3"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button> */}
        </div>
      ))}
    </div>
  );
}

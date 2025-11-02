'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

interface AssetUploadProps {
  projectId: string;
  customerId: string;
}

export default function AssetUpload({ projectId, customerId }: AssetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Create asset record in database
      const { error: dbError } = await supabase.from('assets').insert({
        project_id: projectId,
        uploaded_by_customer_id: customerId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        description: description || null,
        sync_status: 'pending', // Will be synced to Salesforce by scheduler
      });

      if (dbError) {
        throw dbError;
      }

      // Reset form
      setFile(null);
      setDescription('');
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }

      // Refresh page to show new asset
      router.refresh();

      alert('Datei erfolgreich hochgeladen!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Datei auswählen
        </label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {file ? file.name : 'Klicken zum Hochladen'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max. 50MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          rows={3}
          placeholder="Beschreibung der Datei..."
          disabled={uploading}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={!file || uploading}
      >
        {uploading ? 'Upload läuft...' : 'Hochladen'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Hochgeladene Dateien werden automatisch in Salesforce synchronisiert
      </p>
    </form>
  );
}

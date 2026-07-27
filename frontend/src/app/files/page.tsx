'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import FileCard from '@/components/files/FileCard';
import FileUpload from '@/components/files/FileUpload';
import { fileService } from '@/services/fileService';
import type { FileItem } from '@/types/file';

function formatSize(bytes: number): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? 'txt';
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Nothing sets state before the first await, so this is safe to call from an
  // effect (react-hooks/set-state-in-effect).
  const loadFiles = useCallback(async () => {
    try {
      const data = await fileService.getFiles();
      setFiles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadFiles(); }, [loadFiles]);

  const filtered = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>File Manager</h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>Manage documents and data available to your AI.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', backgroundColor: '#141428', border: '1px solid #1e1e3a', width: '220px' }}>
            <Search size={14} color="#555577" />
            <input type="text" placeholder="Search files..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#8888aa', fontSize: '13px', width: '100%' }} />
          </div>
          <FileUpload
            onUpload={(result) => setNotice(result.warning ?? null)}
            onUploadComplete={() => { setLoading(true); void loadFiles(); }}
            onError={(message) => setError(message)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: 'rgba(244, 67, 54, 0.12)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#f44336', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {notice && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: 'rgba(255, 152, 0, 0.12)', border: '1px solid rgba(255, 152, 0, 0.3)', color: '#ff9800', fontSize: '14px' }}>
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {filtered.map((file, i) => (
          <FileCard
            key={file.id}
            name={file.filename}
            size={formatSize(file.size_bytes)}
            type={extensionOf(file.filename)}
            status={file.status === 'ready' ? 'ready' : file.status === 'error' ? 'error' : 'processing'}
            index={i}
          />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p style={{ color: '#555577', textAlign: 'center', marginTop: '48px' }}>
          {files.length === 0 ? 'No files uploaded yet.' : 'No files match your search.'}
        </p>
      )}
    </div>
  );
}

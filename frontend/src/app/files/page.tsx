'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import FileCard from '@/components/files/FileCard';
import FileUpload from '@/components/files/FileUpload';

interface FileItem {
  id: number;
  filename: string;
  status: string;
  uploaded_at: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFiles = () => {
    fetch('http://127.0.0.1:8000/files')
      .then(r => r.json())
      .then(setFiles)
      .catch(console.error);
  };

  useEffect(() => { loadFiles(); }, []);

  const filtered = files.filter(f =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>File Manager</h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>Manage documents, images, and data available to your AI.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', backgroundColor: '#141428', border: '1px solid #1e1e3a', width: '220px' }}>
            <Search size={14} color="#555577" />
            <input type="text" placeholder="Search files..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#8888aa', fontSize: '13px', width: '100%' }} />
          </div>
          <FileUpload onUploadComplete={loadFiles} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {filtered.map((file, i) => (
          <FileCard key={file.id} name={file.filename} size="-" type="pdf" status={file.status} index={i} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p style={{ color: '#555577', textAlign: 'center', marginTop: '48px' }}>No files uploaded yet.</p>
      )}
    </div>
  );
}
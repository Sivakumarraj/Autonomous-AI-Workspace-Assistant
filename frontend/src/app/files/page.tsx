'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import FileCard from '@/components/files/FileCard';
import FileUpload from '@/components/files/FileUpload';
import { MOCK_FILES } from '@/utils/constants';

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_FILES.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            File Manager
          </h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>
            Manage documents, images, and data available to your AI.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#141428',
              border: '1px solid #1e1e3a',
              width: '220px',
            }}
          >
            <Search size={14} color="#555577" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#8888aa',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>
          <FileUpload />
        </div>
      </div>

      {/* File Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {filtered.map((file, i) => (
          <FileCard
            key={file.id}
            name={file.name}
            size={file.size}
            type={file.type}
            status={file.status}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

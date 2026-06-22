'use client';

import { FileText, FileSpreadsheet, File } from 'lucide-react';

interface FileCardProps {
  name: string;
  size: string;
  type: string;
  status: 'ready' | 'processing' | 'error';
  index: number;
}

const fileIconMap: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  pdf: FileText,
  docx: FileText,
  csv: FileSpreadsheet,
  txt: File,
};

export default function FileCard({ name, size, type, status, index }: FileCardProps) {
  const Icon = fileIconMap[type] || File;

  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '24px 20px 16px 20px',
        border: '1px solid #1e1e3a',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: `fadeIn 0.3s ease-out ${index * 0.06}s both`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#2a2a5a';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e1e3a';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon */}
      <div style={{ marginBottom: '16px', opacity: 0.6 }}>
        <Icon size={56} color="#8888aa" strokeWidth={1} />
      </div>

      {/* File Info */}
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#ddd', marginBottom: '8px', textAlign: 'left' }}>
          {name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#666688' }}>{size}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: '6px',
              backgroundColor:
                status === 'processing'
                  ? 'rgba(108, 92, 231, 0.2)'
                  : status === 'ready'
                  ? 'rgba(0, 200, 83, 0.15)'
                  : 'rgba(244, 67, 54, 0.15)',
              color:
                status === 'processing'
                  ? '#6c5ce7'
                  : status === 'ready'
                  ? '#00c853'
                  : '#f44336',
            }}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

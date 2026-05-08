'use client';

import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload?: () => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  return (
    <button
      onClick={onUpload}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
        border: 'none',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Upload size={16} />
      Upload
    </button>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { fileService } from '@/services/fileService';
import type { UploadResult } from '@/types/file';

interface FileUploadProps {
  onUpload?: (data: UploadResult) => void;
  onUploadComplete?: () => void;
  onError?: (message: string) => void;
}

export default function FileUpload({ onUpload, onUploadComplete, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const result = await fileService.uploadFile(formData);
      onUpload?.(result);
      onUploadComplete?.();
    } catch (error) {
      // Surface the backend's message instead of only logging it to the console.
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
      // Reset so selecting the same file again still fires onChange.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.txt,.md"
        onChange={handleFileChange}
      />
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
          border: 'none',
          color: '#fff',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Upload size={16} />
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </>
  );
}

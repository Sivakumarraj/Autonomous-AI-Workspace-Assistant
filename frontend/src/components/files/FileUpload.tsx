'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { fileService } from '@/services/fileService';

interface FileUploadProps {
  onUpload?: (data: any) => void;
}

export default function FileUpload({
  onUpload,
}: FileUploadProps) {

  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {

      setLoading(true);

      const result =
        await fileService.uploadFile(formData);

      console.log(result);

      onUpload?.(result);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={handleFileChange}
      />

      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '10px',
          background:
            'linear-gradient(135deg, #6c5ce7, #a855f7)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Upload size={16} />

        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </>
  );
}
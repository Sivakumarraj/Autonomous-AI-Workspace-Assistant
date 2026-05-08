'use client';

import { useState } from 'react';
import { MOCK_FILES } from '@/utils/constants';
import type { FileItem } from '@/types/file';

export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return { files: filteredFiles, searchQuery, setSearchQuery, setFiles };
}

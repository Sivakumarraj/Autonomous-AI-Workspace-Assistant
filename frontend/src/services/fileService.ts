import { apiGet, apiPost, apiDelete } from './api';
import type { FileItem } from '@/types/file';

export const fileService = {
  getFiles: () => apiGet<FileItem[]>('/files'),
  uploadFile: (formData: FormData) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/files/upload`, {
      method: 'POST',
      body: formData,
    }).then((r) => r.json()),
  deleteFile: (id: string) => apiDelete(`/files/${id}`),
};

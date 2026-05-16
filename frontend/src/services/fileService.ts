import { apiGet, apiPost, apiDelete } from './api';
import type { FileItem } from '@/types/file';

export const fileService = {
  getFiles: () => apiGet<FileItem[]>('/files'),
  uploadFile: (formData: FormData) =>
    fetch("http://127.0.0.1:8000/upload",{
    method: 'POST',
      body: formData,
    }).then((r) => r.json()),
  deleteFile: (id: string) => apiDelete(`/files/${id}`),
};
  
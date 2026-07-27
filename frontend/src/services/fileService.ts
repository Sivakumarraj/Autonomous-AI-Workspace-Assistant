import { apiDelete, apiGet, apiUpload, apiUploadWithProgress } from './api';
import type { FileItem, UploadResult } from '@/types/file';

export const fileService = {
  getFiles: () => apiGet<FileItem[]>('/files'),

  uploadFile: (formData: FormData) => apiUpload<UploadResult>('/upload', formData),

  /** Upload a single file, reporting 0–100% as the bytes go out. */
  uploadWithProgress: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUploadWithProgress<UploadResult>('/upload', formData, onProgress);
  },

  deleteFile: (id: number) => apiDelete(`/files/${id}`),
};

import { apiDelete, apiGet, apiUpload } from './api';
import type { FileItem, UploadResult } from '@/types/file';

export const fileService = {
  getFiles: () => apiGet<FileItem[]>('/files'),
  uploadFile: (formData: FormData) => apiUpload<UploadResult>('/upload', formData),
  deleteFile: (id: number) => apiDelete(`/files/${id}`),
};

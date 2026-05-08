export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'csv' | 'txt' | 'image';
  status: 'ready' | 'processing' | 'error';
  uploadedAt: string;
}

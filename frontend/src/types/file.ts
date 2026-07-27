/** Shape returned by GET /files — matches the backend FileResponse model. */
export interface FileItem {
  id: number;
  filename: string;
  stored_name: string;
  size_bytes: number;
  chunk_count: number;
  status: 'ready' | 'processing' | 'no_text' | 'pending_embedding' | 'error';
  uploaded_at: string;
}

/** Shape returned by POST /upload. */
export interface UploadResult {
  id: number;
  filename: string;
  stored_name: string;
  size_bytes: number;
  chunks_count: number;
  embedding_dimension: number;
  vector_storage: string;
  message: string;
  warning?: string | null;
}

export function getFileIcon(type: string): string {
  switch (type) {
    case 'pdf': return '📄';
    case 'docx': return '📝';
    case 'csv': return '📊';
    case 'txt': return '📃';
    case 'image': return '🖼️';
    default: return '📎';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'ready': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

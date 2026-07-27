'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { apiGet } from '@/services/api';
import type { LogEntry } from '@/types/workflow';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(() => {
    apiGet<{ logs: LogEntry[] }>('/logs/')
      .then((d) => { setLogs(d.logs); setError(null); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(l =>
    l.event.toLowerCase().includes(filter.toLowerCase()) ||
    l.category.toLowerCase().includes(filter.toLowerCase())
  );

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>System Logs</h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>Real-time audit trail of all workspace activities.</p>
        </div>
        <button onClick={loadLogs} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#141428', border: '1px solid #1e1e3a', color: '#ccc', fontSize: '14px', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: 'rgba(244, 67, 54, 0.12)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#f44336', fontSize: '14px' }}>
          Could not load logs: {error}
        </div>
      )}
      <div style={{ backgroundColor: '#141428', borderRadius: '12px', border: '1px solid #1e1e3a', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e3a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', backgroundColor: '#1a1a35', border: '1px solid #1e1e3a', width: '340px' }}>
            <Search size={14} color="#555577" />
            <input type="text" placeholder="Filter logs..." value={filter} onChange={(e) => setFilter(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#8888aa', fontSize: '13px', width: '100%' }} />
          </div>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#555577' }}>No logs yet.</div>
          ) : (
            filtered.map(log => (
              <div key={log.id} style={{ padding: '14px 20px', borderBottom: '1px solid #1a1a30', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#00c85315', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={14} color="#00c853" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#ddd', marginBottom: '2px' }}>{log.event}</div>
                  <div style={{ fontSize: '11px', color: '#555577' }}>{log.category} • {formatTime(log.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
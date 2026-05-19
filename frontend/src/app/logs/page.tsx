'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Info, CheckCircle } from 'lucide-react';

interface LogEntry {
  id: number;
  event: string;
  category: string;
  level: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');

  const loadLogs = () => {
    fetch('http://127.0.0.1:8000/logs/')
      .then(r => r.json())
      .then(d => setLogs(d.logs))
      .catch(console.error);
  };

  useEffect(() => { loadLogs(); }, []);

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
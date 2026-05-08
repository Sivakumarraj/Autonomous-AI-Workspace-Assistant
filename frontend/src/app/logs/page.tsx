'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
  timestamp: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: '1', level: 'info', message: 'Workspace initialized successfully', source: 'System', timestamp: '10:30 AM' },
  { id: '2', level: 'success', message: 'File API Documentation.pdf uploaded', source: 'File Manager', timestamp: '10:28 AM' },
  { id: '3', level: 'info', message: 'Chat session started: Research Assistant', source: 'AI Chat', timestamp: '10:15 AM' },
  { id: '4', level: 'warning', message: 'Rate limit approaching for OpenAI API', source: 'API Gateway', timestamp: '10:10 AM' },
  { id: '5', level: 'success', message: 'Workflow Code Review Assistant completed', source: 'Workflows', timestamp: '09:45 AM' },
  { id: '6', level: 'error', message: 'Data Report Generator workflow failed at step 2', source: 'Workflows', timestamp: '09:30 AM' },
  { id: '7', level: 'info', message: 'Memory entry saved: User preference', source: 'Memory', timestamp: '09:15 AM' },
  { id: '8', level: 'info', message: 'Vector store index updated', source: 'RAG Pipeline', timestamp: '09:00 AM' },
  { id: '9', level: 'success', message: 'Daily backup completed', source: 'System', timestamp: '08:00 AM' },
];

const levelIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};

const levelColors: Record<string, string> = {
  info: '#2196f3',
  warning: '#ff9800',
  error: '#f44336',
  success: '#00c853',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLogs(INITIAL_LOGS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.message.toLowerCase().includes(filter.toLowerCase()) ||
      l.source.toLowerCase().includes(filter.toLowerCase())
  );

  const addTestLog = () => {
    const newLog: LogEntry = {
      id: String(Date.now()),
      level: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as LogEntry['level'],
      message: `Test log entry generated at ${new Date().toLocaleTimeString()}`,
      source: 'Test',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            System Logs
          </h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>
            Real-time audit trail of all workspace activities.
          </p>
        </div>
        <button
          onClick={addTestLog}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: '#141428',
            border: '1px solid #1e1e3a',
            color: '#ccc',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6c5ce7';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1e1e3a';
            e.currentTarget.style.color = '#ccc';
          }}
        >
          <Plus size={16} />
          Test Log
        </button>
      </div>

      {/* Log Container */}
      <div
        style={{
          backgroundColor: '#141428',
          borderRadius: '12px',
          border: '1px solid #1e1e3a',
          overflow: 'hidden',
        }}
      >
        {/* Filter */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e3a' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#1a1a35',
              border: '1px solid #1e1e3a',
              width: '340px',
            }}
          >
            <Search size={14} color="#555577" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#8888aa',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Log Entries */}
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {loading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #1a1a30',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: `${200 + i * 40}px`, height: '14px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ width: '120px', height: '10px' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#555577' }}>
              No logs found matching your filter.
            </div>
          ) : (
            filtered.map((log, i) => {
              const Icon = levelIcons[log.level] || Info;
              const color = levelColors[log.level] || '#2196f3';
              return (
                <div
                  key={log.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #1a1a30',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'background-color 0.2s',
                    animation: `fadeIn 0.2s ease-out ${i * 0.03}s both`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a1a30')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: `${color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#ddd', marginBottom: '2px' }}>
                      {log.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555577' }}>
                      {log.source} • {log.timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

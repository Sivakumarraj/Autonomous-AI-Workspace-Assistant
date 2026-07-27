'use client';
import { useState, useEffect } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import { apiGet } from '@/services/api';

interface DashboardStats {
  total_files: number;
  memory_entries: number;
  logs_today: number;
  active_workflows: number;
  conversations: number;
  completed_tasks: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_files: 0, memory_entries: 0, logs_today: 0,
    active_workflows: 0, conversations: 0, completed_tasks: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardStats>('/dashboard/stats')
      .then((data) => { setStats(data); setError(null); })
      .catch((err) => setError(err.message));
  }, []);

  const STATS = [
    { label: 'Active Workflows', value: stats.active_workflows, description: 'Currently running automated tasks', icon: 'workflow' },
    { label: 'Total Files', value: stats.total_files, description: 'Documents and assets in storage', icon: 'file' },
    { label: 'Memory Entries', value: stats.memory_entries, description: 'Context points saved for AI', icon: 'memory' },
    { label: 'Conversations', value: stats.conversations, description: 'Total chat threads', icon: 'chat' },
    { label: 'Logs Today', value: stats.logs_today, description: 'System events recorded today', icon: 'log' },
    { label: 'Completed Tasks', value: stats.completed_tasks, description: 'Successfully finished workflows', icon: 'check' },
  ];

  return (
    <div style={{ padding: '32px 32px 48px 32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Dashboard</h1>
      <p style={{ fontSize: '15px', color: '#666688', marginBottom: '28px' }}>
        Welcome back. Here&apos;s an overview of your workspace.
      </p>
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: 'rgba(244, 67, 54, 0.12)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#f44336', fontSize: '14px' }}>
          Could not reach the backend: {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {STATS.map((stat, i) => (
          <StatsCard key={stat.label} label={stat.label} value={stat.value} description={stat.description} icon={stat.icon} index={i} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <ActivityFeed />
        <QuickActions />
      </div>
    </div>
  );
}
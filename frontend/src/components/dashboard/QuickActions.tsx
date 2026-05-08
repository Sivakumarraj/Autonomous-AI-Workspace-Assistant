'use client';

import Link from 'next/link';
import { MessageSquare, Upload, GitBranch, Activity } from 'lucide-react';
import { QUICK_ACTIONS } from '@/utils/constants';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  MessageSquare,
  Upload,
  GitBranch,
  Activity,
};

export default function QuickActions() {
  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #1e1e3a',
        width: '320px',
        flexShrink: 0,
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
        Quick Actions
      </h3>
      <p style={{ fontSize: '13px', color: '#666688', marginBottom: '20px' }}>
        Common tasks to get started
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = iconMap[action.icon] || MessageSquare;
          return (
            <Link
              key={action.id}
              href={action.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#1a1a35',
                border: '1px solid #1e1e3a',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6c5ce7';
                e.currentTarget.style.backgroundColor = 'rgba(108, 92, 231, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e1e3a';
                e.currentTarget.style.backgroundColor = '#1a1a35';
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(168, 85, 247, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#6c5ce7" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#ddd' }}>{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

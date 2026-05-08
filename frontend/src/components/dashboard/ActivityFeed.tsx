'use client';

import { Upload, MessageSquare, GitBranch, Brain } from 'lucide-react';
import { RECENT_ACTIVITY } from '@/utils/constants';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  upload: Upload,
  chat: MessageSquare,
  workflow: GitBranch,
  memory: Brain,
};

export default function ActivityFeed() {
  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #1e1e3a',
        flex: 1,
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
        Recent Activity
      </h3>
      <p style={{ fontSize: '13px', color: '#666688', marginBottom: '20px' }}>
        Latest actions across your workspace
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {RECENT_ACTIVITY.map((item) => {
          const Icon = iconMap[item.icon] || Upload;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                borderBottom: '1px solid #1a1a35',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(108, 92, 231, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#6c5ce7" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#ddd' }}>{item.action}</div>
                <div style={{ fontSize: '12px', color: '#666688' }}>{item.detail}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#555577', flexShrink: 0 }}>{item.time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

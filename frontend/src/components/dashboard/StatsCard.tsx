'use client';

import { ClipboardList, Files, Settings2, Copy, Activity, FileCheck } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  ClipboardList,
  Files,
  Settings2,
  Copy,
  Activity,
  FileCheck,
};

interface StatsCardProps {
  label: string;
  value: number;
  description: string;
  icon: string;
  index: number;
}

export default function StatsCard({ label, value, description, icon, index }: StatsCardProps) {
  const Icon = iconMap[icon] || ClipboardList;

  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '1px solid #1e1e3a',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#2a2a5a';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(108, 92, 231, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e1e3a';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#ccc' }}>{label}</span>
        <Icon size={18} color="#555577" />
      </div>
      <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#666688' }}>{description}</div>
    </div>
  );
}

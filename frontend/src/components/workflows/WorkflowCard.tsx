'use client';

import { Pause, RefreshCw } from 'lucide-react';
import type { Workflow } from '@/types/workflow';

interface WorkflowCardProps {
  workflow: Workflow;
  index: number;
}

export default function WorkflowCard({ workflow, index }: WorkflowCardProps) {
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'rgba(0, 200, 83, 0.12)', text: '#00c853', dot: '#00c853' },
    completed: { bg: 'rgba(0, 200, 83, 0.12)', text: '#00c853', dot: '#00c853' },
    failed: { bg: 'rgba(244, 67, 54, 0.12)', text: '#f44336', dot: '#f44336' },
    paused: { bg: 'rgba(255, 152, 0, 0.12)', text: '#ff9800', dot: '#ff9800' },
  };

  const colors = statusColors[workflow.status] || statusColors.active;

  const progressBarColor =
    workflow.status === 'completed'
      ? '#6c5ce7'
      : workflow.status === 'failed'
      ? '#f44336'
      : workflow.status === 'active'
      ? '#6c5ce7'
      : '#ff9800';

  return (
    <div
      style={{
        backgroundColor: '#141428',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #1e1e3a',
        transition: 'all 0.3s ease',
        animation: `fadeIn 0.3s ease-out ${index * 0.08}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#2a2a5a';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e1e3a';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', flex: 1 }}>{workflow.name}</h3>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: colors.bg,
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {workflow.status === 'active' && <RefreshCw size={10} />}
          {workflow.status === 'completed' && '✓'}
          {workflow.status === 'failed' && '✕'}
          {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#666688', marginBottom: '16px', lineHeight: 1.4 }}>
        {workflow.description}
      </p>

      {/* Progress */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#8888aa' }}>Progress</span>
          <span style={{ fontSize: '12px', color: '#8888aa' }}>
            {workflow.completedSteps} / {workflow.totalSteps} steps ({workflow.progress}%)
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#1e1e3a',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${workflow.progress}%`,
              height: '100%',
              borderRadius: '3px',
              backgroundColor: progressBarColor,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#555577' }}>Started: {workflow.startedAt}</span>
        {workflow.status === 'active' && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#1e1e3a',
              border: '1px solid #2a2a4a',
              color: '#8888aa',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6c5ce7';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a4a';
              e.currentTarget.style.color = '#8888aa';
            }}
          >
            <Pause size={12} />
            Pause
          </button>
        )}
      </div>
    </div>
  );
}

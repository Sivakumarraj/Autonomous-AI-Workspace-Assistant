'use client';

import { Plus } from 'lucide-react';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import { MOCK_WORKFLOWS } from '@/utils/constants';

export default function WorkflowsPage() {
  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Workflows
          </h1>
          <p style={{ fontSize: '15px', color: '#666688' }}>
            Manage and monitor automated multi-step AI tasks.
          </p>
        </div>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} />
          Create Workflow
        </button>
      </div>

      {/* Workflow Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        {MOCK_WORKFLOWS.map((wf, i) => (
          <WorkflowCard key={wf.id} workflow={wf} index={i} />
        ))}
      </div>
    </div>
  );
}

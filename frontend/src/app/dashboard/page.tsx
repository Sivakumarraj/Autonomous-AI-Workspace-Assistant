'use client';

import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import { STATS } from '@/utils/constants';

export default function DashboardPage() {
  return (
    <div style={{ padding: '32px 32px 48px 32px' }}>
      {/* Title */}
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: '15px', color: '#666688', marginBottom: '28px' }}>
        Welcome back. Here&apos;s an overview of your workspace.
      </p>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {STATS.map((stat, i) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            index={i}
          />
        ))}
      </div>

      {/* Activity + Quick Actions */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <ActivityFeed />
        <QuickActions />
      </div>
    </div>
  );
}

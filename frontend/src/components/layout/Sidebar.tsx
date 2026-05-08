'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Brain,
  GitBranch,
  Activity,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, href: '/chat' },
  { id: 'files', label: 'File Manager', icon: FileText, href: '/files' },
  { id: 'memory', label: 'Memory', icon: Brain, href: '/memory' },
  { id: 'workflows', label: 'Workflows', icon: GitBranch, href: '/workflows' },
  { id: 'logs', label: 'Logs', icon: Activity, href: '/logs' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '250px',
        minWidth: '250px',
        height: '100vh',
        backgroundColor: '#0d0d20',
        borderRight: '1px solid #1e1e3a',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '20px 20px 24px 20px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={18} color="white" />
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Nexus AI</span>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00c853',
            marginLeft: '4px',
            animation: 'pulse-dot 2s infinite',
          }}
        />
      </div>

      {/* Workspace Label */}
      <div
        style={{
          padding: '0 20px',
          marginBottom: '8px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '1.5px',
          color: '#555577',
          textTransform: 'uppercase',
        }}
      >
        Workspace
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#6c5ce7' : '#8888aa',
                backgroundColor: isActive ? 'rgba(108, 92, 231, 0.08)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                marginBottom: '2px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(108, 92, 231, 0.05)';
                  e.currentTarget.style.color = '#aaa8cc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8888aa';
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div style={{ padding: '10px' }}>
        <Link
          href="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: pathname === '/settings' ? 500 : 400,
            color: pathname === '/settings' ? '#6c5ce7' : '#8888aa',
            backgroundColor: pathname === '/settings' ? 'rgba(108, 92, 231, 0.08)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/settings') {
              e.currentTarget.style.backgroundColor = 'rgba(108, 92, 231, 0.05)';
              e.currentTarget.style.color = '#aaa8cc';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/settings') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8888aa';
            }
          }}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

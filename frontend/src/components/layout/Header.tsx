'use client';

import { Search, Bell, Sun } from 'lucide-react';

export default function Header() {
  return (
    <header
      style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid #1e1e3a',
        backgroundColor: '#0a0a1a',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#141428',
          borderRadius: '10px',
          padding: '8px 16px',
          width: '360px',
          border: '1px solid #1e1e3a',
        }}
      >
        <Search size={16} color="#555577" />
        <input
          type="text"
          placeholder="Search workspace..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#8888aa',
            fontSize: '14px',
            width: '100%',
          }}
        />
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8888aa',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8888aa')}
        >
          <Bell size={18} />
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8888aa',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8888aa')}
        >
          <Sun size={18} />
        </button>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          AI
        </div>
      </div>
    </header>
  );
}

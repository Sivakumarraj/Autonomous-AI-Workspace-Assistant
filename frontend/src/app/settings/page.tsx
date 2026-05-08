'use client';

import { useState } from 'react';
import { Save, Settings2, Brain, Key } from 'lucide-react';

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState('sk-...');
  const [anthropicKey, setAnthropicKey] = useState('sk-ant-...');
  const [chatModel, setChatModel] = useState('gpt-4o');
  const [autoLearn, setAutoLearn] = useState(true);

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
        Settings
      </h1>
      <p style={{ fontSize: '15px', color: '#666688', marginBottom: '32px' }}>
        Configure your AI workspace preferences and integrations.
      </p>

      {/* API Keys Section */}
      <div
        style={{
          backgroundColor: '#141428',
          borderRadius: '12px',
          padding: '28px',
          border: '1px solid #1e1e3a',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Key size={20} color="#6c5ce7" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>API Keys</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#666688', marginBottom: '24px' }}>
          Manage your AI provider API keys for model access.
        </p>

        {/* OpenAI Key */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: '#ccc', display: 'block', marginBottom: '8px' }}>
            OpenAI API Key
          </label>
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: '#1a1a35',
              border: '1px solid #1e1e3a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e3a')}
          />
          <p style={{ fontSize: '12px', color: '#555577', marginTop: '6px' }}>
            Used for GPT-4o and embedding generation.
          </p>
        </div>

        {/* Anthropic Key */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, color: '#ccc', display: 'block', marginBottom: '8px' }}>
            Anthropic API Key
          </label>
          <input
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: '#1a1a35',
              border: '1px solid #1e1e3a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e3a')}
          />
          <p style={{ fontSize: '12px', color: '#555577', marginTop: '6px' }}>
            Used for Claude 3.5 Sonnet processing.
          </p>
        </div>
      </div>

      {/* Model Routing Section */}
      <div
        style={{
          backgroundColor: '#141428',
          borderRadius: '12px',
          padding: '28px',
          border: '1px solid #1e1e3a',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Settings2 size={20} color="#6c5ce7" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Model Routing</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#666688', marginBottom: '24px' }}>
          Configure which models are used for specific tasks.
        </p>

        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, color: '#ccc', display: 'block', marginBottom: '8px' }}>
            Default Chat Model
          </label>
          <select
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: '#1a1a35',
              border: '1px solid #1e1e3a',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
            }}
          >
            <option value="gpt-4o">GPT-4o (Recommended)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3.5">Claude 3.5 Sonnet</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
          <p style={{ fontSize: '12px', color: '#555577', marginTop: '6px' }}>
            This model will be used by default for chat and standard workflows.
          </p>
        </div>
      </div>

      {/* Core Memory Section */}
      <div
        style={{
          backgroundColor: '#141428',
          borderRadius: '12px',
          padding: '28px',
          border: '1px solid #1e1e3a',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Brain size={20} color="#6c5ce7" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Core Memory</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#666688', marginBottom: '24px' }}>
          Control how the AI learns and remembers across sessions.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderRadius: '10px',
            backgroundColor: '#1a1a35',
            border: '1px solid #1e1e3a',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#ddd', marginBottom: '4px' }}>
              Autonomous Learning
            </div>
            <div style={{ fontSize: '13px', color: '#666688' }}>
              Allow the AI to automatically extract facts and preferences from your conversations and save them to memory.
            </div>
          </div>
          <button
            onClick={() => setAutoLearn(!autoLearn)}
            style={{
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              backgroundColor: autoLearn ? '#6c5ce7' : '#2a2a4a',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.3s',
              flexShrink: 0,
              marginLeft: '16px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: '3px',
                left: autoLearn ? '25px' : '3px',
                transition: 'left 0.3s',
              }}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Save size={16} />
          Save Configuration
        </button>
      </div>
    </div>
  );
}

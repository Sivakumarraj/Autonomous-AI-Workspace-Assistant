/**
 * Static UI configuration only.
 *
 * The MOCK_FILES / MOCK_WORKFLOWS / MOCK_MEMORY / RECENT_ACTIVITY / STATS
 * fixtures that used to live here were rendered as if they were real data —
 * the dashboard showed invented counts and the workflows page listed four
 * workflows that did not exist. Every screen now reads from the API instead.
 * MOCK_CONVERSATIONS is kept because the chat sidebar has no backend endpoint
 * yet; see the README's "Scaffolded" section.
 */

export const APP_NAME = 'Nexus AI';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'chat', label: 'AI Chat', icon: 'MessageSquare', href: '/chat' },
  { id: 'files', label: 'File Manager', icon: 'FileText', href: '/files' },
  { id: 'memory', label: 'Memory', icon: 'Brain', href: '/memory' },
  { id: 'workflows', label: 'Workflows', icon: 'GitBranch', href: '/workflows' },
  { id: 'logs', label: 'Logs', icon: 'Activity', href: '/logs' },
] as const;

export const QUICK_ACTIONS = [
  { id: '1', label: 'New Chat', icon: 'MessageSquare', href: '/chat' },
  { id: '2', label: 'Upload File', icon: 'Upload', href: '/files' },
  { id: '3', label: 'Create Workflow', icon: 'GitBranch', href: '/workflows' },
  { id: '4', label: 'View Logs', icon: 'Activity', href: '/logs' },
];

/**
 * Seed data for the chat-history sidebar, which has no backend endpoint yet.
 * Replace once conversations are persisted server-side.
 */
export const MOCK_CONVERSATIONS = [
  {
    id: '1',
    title: 'Research Assistant Session',
    messageCount: 2,
    lastUpdated: new Date().toLocaleDateString(),
    messages: [
      {
        id: 'm1',
        role: 'user' as const,
        content: 'Tell me more about LangGraph specifically.',
        timestamp: new Date(),
      },
      {
        id: 'm2',
        role: 'assistant' as const,
        content:
          'LangGraph builds on LangChain with a graph-based approach to AI workflows: nodes are functions, edges are transitions. It supports cyclic graphs for iterative reasoning, persistent state, human-in-the-loop checkpoints, and streaming.',
        timestamp: new Date(),
      },
    ],
  },
];

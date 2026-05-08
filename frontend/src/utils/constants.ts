export const APP_NAME = 'Nexus AI';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
  { id: 'chat', label: 'AI Chat', icon: 'MessageSquare', href: '/chat' },
  { id: 'files', label: 'File Manager', icon: 'FileText', href: '/files' },
  { id: 'memory', label: 'Memory', icon: 'Brain', href: '/memory' },
  { id: 'workflows', label: 'Workflows', icon: 'GitBranch', href: '/workflows' },
  { id: 'logs', label: 'Logs', icon: 'Activity', href: '/logs' },
] as const;

export const STATS = [
  { label: 'Active Workflows', value: 2, description: 'Currently running automated tasks', icon: 'ClipboardList' },
  { label: 'Total Files', value: 6, description: 'Documents and assets in storage', icon: 'Files' },
  { label: 'Memory Entries', value: 4, description: 'Context points saved for AI', icon: 'Settings2' },
  { label: 'Conversations', value: 4, description: 'Total chat threads', icon: 'Copy' },
  { label: 'Logs Today', value: 9, description: 'System events recorded today', icon: 'Activity' },
  { label: 'Completed Tasks', value: 6, description: 'Successfully finished workflows', icon: 'FileCheck' },
];

export const MOCK_CONVERSATIONS = [
  {
    id: '1',
    title: 'Research Assistant Session',
    messageCount: 4,
    lastUpdated: '5/6/2026',
    messages: [
      { id: 'm1', role: 'user' as const, content: 'Tell me more about LangGraph specifically.', timestamp: new Date() },
      { id: 'm2', role: 'assistant' as const, content: 'LangGraph is built on top of LangChain and introduces a graph-based approach to AI workflows. It uses nodes (functions) and edges (transitions) to define complex, stateful agent behavior. Key features include: cyclic graph support for iterative reasoning, persistent state management, human-in-the-loop checkpoints, and streaming support. It\'s particularly well-suited for building reliable, production-grade AI agents.', timestamp: new Date() },
    ],
  },
  {
    id: '2',
    title: 'Code Review & Analysis',
    messageCount: 6,
    lastUpdated: '5/6/2026',
    messages: [
      { id: 'm3', role: 'user' as const, content: 'Can you review my Python code for the data pipeline?', timestamp: new Date() },
      { id: 'm4', role: 'assistant' as const, content: 'I\'d be happy to review your Python data pipeline code. Please share the code and I\'ll analyze it for best practices, potential bugs, and performance optimizations.', timestamp: new Date() },
    ],
  },
  {
    id: '3',
    title: 'Document Summarization',
    messageCount: 2,
    lastUpdated: '5/5/2026',
    messages: [
      { id: 'm5', role: 'user' as const, content: 'Summarize the uploaded PDF document.', timestamp: new Date() },
      { id: 'm6', role: 'assistant' as const, content: 'I\'ve analyzed the uploaded document. Here\'s a comprehensive summary of the key points and findings discussed in the PDF.', timestamp: new Date() },
    ],
  },
];

export const MOCK_FILES = [
  { id: '1', name: 'API Documentation.pdf', size: '1.5 MB', type: 'pdf' as const, status: 'processing' as const, uploadedAt: '5/6/2026' },
  { id: '2', name: 'Q4 Financial Report.pdf', size: '2.34 MB', type: 'pdf' as const, status: 'ready' as const, uploadedAt: '5/5/2026' },
  { id: '3', name: 'Product Roadmap 2025.docx', size: '512 KB', type: 'docx' as const, status: 'ready' as const, uploadedAt: '5/4/2026' },
  { id: '4', name: 'Dataset Analysis.csv', size: '1 MB', type: 'csv' as const, status: 'ready' as const, uploadedAt: '5/3/2026' },
  { id: '5', name: 'Architecture Overview.txt', size: '32 KB', type: 'txt' as const, status: 'ready' as const, uploadedAt: '5/2/2026' },
  { id: '6', name: 'Meeting Transcript June.pdf', size: '768 KB', type: 'pdf' as const, status: 'ready' as const, uploadedAt: '5/1/2026' },
];

export const MOCK_WORKFLOWS = [
  {
    id: '1',
    name: 'Code Review Assistant',
    description: 'Automatically review pull requests, check for...',
    status: 'completed' as const,
    progress: 100,
    totalSteps: 6,
    completedSteps: 6,
    startedAt: '5/4/2026',
  },
  {
    id: '2',
    name: 'Document Intelligence Pipeline',
    description: 'Automatically analyze, summarize, and extract key...',
    status: 'active' as const,
    progress: 63,
    totalSteps: 8,
    completedSteps: 5,
    startedAt: '5/3/2026',
  },
  {
    id: '3',
    name: 'Data Report Generator',
    description: 'Generate weekly analytics reports from connected...',
    status: 'failed' as const,
    progress: 14,
    totalSteps: 7,
    completedSteps: 1,
    startedAt: '5/2/2026',
  },
  {
    id: '4',
    name: 'Email Digest Automation',
    description: 'Compile and summarize important emails daily,...',
    status: 'active' as const,
    progress: 40,
    totalSteps: 5,
    completedSteps: 2,
    startedAt: '5/1/2026',
  },
];

export const MOCK_MEMORY = [
  { id: '1', category: 'User Preference', content: 'Prefers Python for backend development. Uses FastAPI framework for REST APIs.', source: 'Chat Session #12', createdAt: '5/6/2026', icon: '👤' },
  { id: '2', category: 'Project Context', content: 'Current project uses microservices architecture with Docker containers.', source: 'Document Analysis', createdAt: '5/5/2026', icon: '📁' },
  { id: '3', category: 'Technical Note', content: 'Database uses PostgreSQL 15 with pgvector extension for embeddings.', source: 'Code Review #8', createdAt: '5/4/2026', icon: '🔧' },
  { id: '4', category: 'Workflow Pattern', content: 'CI/CD pipeline runs on GitHub Actions with staging and production environments.', source: 'Workflow Analysis', createdAt: '5/3/2026', icon: '⚙️' },
];

export const RECENT_ACTIVITY = [
  { id: '1', action: 'File uploaded', detail: 'API Documentation.pdf', time: '2 min ago', icon: 'upload' },
  { id: '2', action: 'Chat completed', detail: 'Research Assistant Session', time: '15 min ago', icon: 'chat' },
  { id: '3', action: 'Workflow finished', detail: 'Code Review Assistant', time: '1 hr ago', icon: 'workflow' },
  { id: '4', action: 'Memory saved', detail: 'User preference updated', time: '2 hrs ago', icon: 'memory' },
];

export const QUICK_ACTIONS = [
  { id: '1', label: 'New Chat', icon: 'MessageSquare', href: '/chat' },
  { id: '2', label: 'Upload File', icon: 'Upload', href: '/files' },
  { id: '3', label: 'Create Workflow', icon: 'GitBranch', href: '/workflows' },
  { id: '4', label: 'View Logs', icon: 'Activity', href: '/logs' },
];

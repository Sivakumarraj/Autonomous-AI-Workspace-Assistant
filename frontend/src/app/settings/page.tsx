'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Cpu,
  Layers,
  Monitor,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { getServerSettings, type ServerSettings } from '@/services/settingsService';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 py-3 last:border-b-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

function Flag({
  on,
  onLabel = 'Enabled',
  offLabel = 'Disabled',
}: {
  on: boolean;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <Badge
      tone={on ? 'success' : 'neutral'}
      icon={on ? <Check size={11} /> : <X size={11} />}
    >
      {on ? onLabel : offLabel}
    </Badge>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-5 p-7">
      <div className="mb-1.5 flex items-center gap-2.5">
        <Icon size={19} className="text-accent" />
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <p className="mb-5 text-[13px] text-ink-muted">{description}</p>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const [server, setServer] = useState<ServerSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { theme, setTheme } = useTheme();
  const { preferences, update, reset } = usePreferences();
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setServer(await getServerSettings());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // One-shot fetch on mount. The rule guards against cascading renders from
  // repeated setState; this runs once and only sets state after the request
  // resolves. Fetching server-side was rejected because it would make
  // `next build` depend on the backend being reachable.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="max-w-3xl p-6 sm:p-8">
      <h1 className="text-3xl font-bold text-ink">Settings</h1>
      <p className="mt-1.5 mb-8 text-[15px] text-ink-muted">
        Live server configuration and your local display preferences.
      </p>

      {error && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          Could not reach the backend: {error}
        </div>
      )}

      {/* Local preferences — these genuinely persist. */}
      <Section
        icon={Monitor}
        title="Preferences"
        description="Stored in this browser only."
      >
        <div className="flex items-center justify-between gap-4 border-b border-line/60 py-3">
          <div>
            <p className="text-sm text-ink">Theme</p>
            <p className="text-xs text-ink-subtle">Applies immediately.</p>
          </div>
          <div className="flex gap-1.5">
            {(['dark', 'light'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={cn(
                  'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors',
                  theme === option
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-line/60 py-3">
          <div>
            <p className="text-sm text-ink">Logs auto-refresh</p>
            <p className="text-xs text-ink-subtle">
              How often the Logs page reloads. Off disables polling.
            </p>
          </div>
          <select
            aria-label="Logs auto-refresh interval"
            value={preferences.logsRefreshInterval}
            onChange={(e) => update({ logsRefreshInterval: Number(e.target.value) })}
            className="rounded-[var(--radius-control)] border border-line bg-surface-sunken px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value={0}>Off</option>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-line/60 py-3">
          <div>
            <p className="text-sm text-ink">Logs page size</p>
            <p className="text-xs text-ink-subtle">
              Rows requested per load (server allows 1–500).
            </p>
          </div>
          <select
            aria-label="Logs page size"
            value={preferences.logsPageSize}
            onChange={(e) => update({ logsPageSize: Number(e.target.value) })}
            className="rounded-[var(--radius-control)] border border-line bg-surface-sunken px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            {[25, 50, 100, 200, 500].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm text-ink">Show chat sources</p>
            <p className="text-xs text-ink-subtle">
              Expand retrieved document chunks under RAG answers.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={preferences.showChatSources}
            aria-label="Show chat sources"
            onClick={() => update({ showChatSources: !preferences.showChatSources })}
            className={cn(
              'relative h-6 w-11 cursor-pointer rounded-full transition-colors',
              preferences.showChatSources ? 'bg-accent' : 'bg-surface-hover',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                preferences.showChatSources ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => {
              reset();
              toast('Preferences reset to defaults', 'success');
            }}
          >
            Reset preferences
          </Button>
        </div>
      </Section>

      {loading ? (
        <Skeleton className="mb-5 h-64" count={2} />
      ) : (
        server && (
          <>
            <Section
              icon={Cpu}
              title="AI models"
              description="Set by server environment variables. Read-only from the browser — an API key entered here could not reach the backend safely."
            >
              <Row label="API key">
                <Flag
                  on={server.gemini_configured}
                  onLabel="Configured"
                  offLabel="Not set"
                />
              </Row>
              <Row label="Chat model">{server.gemini_model}</Row>
              <Row label="Embedding model">{server.embedding_model}</Row>
              <Row label="Temperature">{server.llm_temperature}</Row>

              {!server.gemini_configured && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-control)] border border-warn/30 bg-warn-soft p-3.5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    <span className="font-medium text-warn">
                      No GEMINI_API_KEY set.
                    </span>{' '}
                    Chat, embeddings, and RAG return 503 until one is configured on
                    the server. Every other feature works normally.
                  </p>
                </div>
              )}
            </Section>

            <Section
              icon={Layers}
              title="Retrieval"
              description="How documents are split and searched."
            >
              <Row label="Chunk size">{server.chunk_size} characters</Row>
              <Row label="Chunk overlap">{server.chunk_overlap} characters</Row>
              <Row label="Chunks retrieved per query">{server.retrieval_top_k}</Row>
              <Row label="Max upload size">
                {Math.round(server.max_upload_size / (1024 * 1024))} MB
              </Row>
              <Row label="Accepted types">
                {server.allowed_extensions.join(', ')}
              </Row>
            </Section>

            <Section
              icon={ShieldCheck}
              title="Security"
              description="Tools that execute untrusted input are off by default."
            >
              <Row label="Terminal tool">
                <Flag on={server.terminal_tool_enabled} />
              </Row>
              <Row label="Browser automation">
                <Flag on={server.browser_tool_enabled} />
              </Row>
              <Row label="Debug mode">
                <Flag on={server.debug} onLabel="On" offLabel="Off" />
              </Row>
              <Row label="Allowed origins">
                <span className="text-xs break-all">
                  {server.allowed_origins.join(', ')}
                </span>
              </Row>

              {server.terminal_tool_enabled && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-control)] border border-danger/30 bg-danger-soft p-3.5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
                  <p className="text-xs leading-relaxed text-ink-muted">
                    <span className="font-medium text-danger">
                      The terminal tool is enabled.
                    </span>{' '}
                    It runs shell commands on the server. Set
                    ENABLE_TERMINAL_TOOL=false on any publicly reachable deployment.
                  </p>
                </div>
              )}
            </Section>

            <Section
              icon={Server}
              title="Server"
              description="Identity of the backend this UI is talking to."
            >
              <Row label="Application">{server.app_name}</Row>
              <Row label="Version">{server.version}</Row>
              <Row label="API URL">
                <span className="text-xs break-all">
                  {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}
                </span>
              </Row>
            </Section>
          </>
        )
      )}
    </div>
  );
}

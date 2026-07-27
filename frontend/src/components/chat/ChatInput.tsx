'use client';

import { useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="flex items-end gap-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder="Ask anything, or ask about your uploaded documents…"
        aria-label="Message"
        onChange={(e) => {
          setValue(e.target.value);
          // Grow with the content, capped so it never eats the transcript.
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter inserts a newline.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-40 min-h-[46px] flex-1 resize-none rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-60 placeholder:text-ink-subtle"
      />

      <Button
        variant="primary"
        onClick={submit}
        loading={disabled}
        disabled={!value.trim()}
        aria-label="Send message"
        className="h-[46px]"
        icon={!disabled ? <SendHorizonal size={15} /> : undefined}
      >
        Send
      </Button>
    </div>
  );
}

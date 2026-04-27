import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stylist-chat`;

const greeting: Msg = {
  role: 'assistant',
  content:
    "Hello — I'm **Layla**, your stylist at Zaineen Clothing ✨\n\nTell me about an occasion, a fabric you love, or a silhouette you have in mind, and I'll suggest pieces from our edit.",
};

const suggestions = [
  'Outfit for a mehndi',
  'Something in lawn under PKR 15,000',
  'What size should I get?',
  'Bridal recommendations',
];

export const StylistChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      });

      if (resp.status === 429) {
        setMessages(p => [...p, { role: 'assistant', content: 'A moment — I\'m a bit busy. Please try again shortly.' }]);
        setBusy(false); return;
      }
      if (resp.status === 402) {
        setMessages(p => [...p, { role: 'assistant', content: 'The atelier is out of credits — please contact the team.' }]);
        setBusy(false); return;
      }
      if (!resp.ok || !resp.body) throw new Error('stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let pushed = false;

      const upsert = (chunk: string) => {
        assistantText += chunk;
        setMessages(prev => {
          if (!pushed) {
            pushed = true;
            return [...prev, { role: 'assistant', content: assistantText }];
          }
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { buffer = ''; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(p => [...p, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-luxe transition-all',
          'bg-emerald-grad text-primary-foreground hover:scale-105',
          open && 'scale-0 pointer-events-none'
        )}
        aria-label="Open stylist chat"
      >
        <Sparkles className="h-5 w-5 mx-auto" />
        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] uppercase tracking-luxe px-1.5 py-0.5 rounded-full">AI</span>
      </button>

      <div
        className={cn(
          'fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-[400px] h-[100dvh] md:h-[600px] md:max-h-[80vh]',
          'bg-background shadow-luxe md:rounded-sm border border-border flex flex-col transition-transform duration-500',
          open ? 'translate-y-0' : 'translate-y-full md:translate-y-[110%]'
        )}
      >
        <header className="bg-emerald-grad text-primary-foreground p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg leading-none">Layla</p>
            <p className="text-[10px] uppercase tracking-luxe opacity-70 mt-1">AI Stylist · Online</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] px-4 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border'
                )}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none [&_a]:text-accent [&_a]:underline [&_p]:my-1 [&_strong]:font-semibold">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} onClick={() => setOpen(false)}>{children}</a>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex">
              <div className="bg-background border border-border px-4 py-2.5 text-sm">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-pulse" />
                  <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-pulse [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          {messages.length === 1 && !busy && (
            <div className="flex flex-wrap gap-2 pt-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs border border-border bg-background px-3 py-1.5 hover:border-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t border-border p-3 flex gap-2 bg-background"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Layla anything…"
            className="flex-1 bg-transparent border border-border px-3 h-10 text-sm focus:outline-none focus:border-foreground"
          />
          <Button type="submit" disabled={busy || !input.trim()} size="icon" className="rounded-none h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
};

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { chatService, type ChatMessage } from '@/services/chatService';

const INITIAL_QUERY =
  'Genera un resumen clínico completo del paciente, incluyendo sus citas, diagnósticos previos, tratamientos aplicados y resultados más relevantes. Destaca cualquier patrón importante para el médico tratante.';

interface ClinicalChatProps {
  patientCode: number;
  patientName: string;
}

export function ClinicalChat({ patientCode, patientName }: ClinicalChatProps) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const messagesEndRef           = useRef<HTMLDivElement>(null);

  // Reset messages when patient changes
  useEffect(() => {
    setMessages([]);
    setOpen(false);
  }, [patientCode]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Generate initial summary when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      sendQuery(INITIAL_QUERY, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function sendQuery(query: string, history: ChatMessage[]) {
    setLoading(true);
    try {
      const answer = await chatService.ask({ query, patientCode, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error al procesar la consulta. Intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: query };
    const updated = [...messages, userMsg];
    setMessages(updated);
    sendQuery(query, updated);
  }

  function handleClose() {
    setOpen(false);
    setMessages([]);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop (mobile) */}
          <div
            className="fixed inset-0 z-50 bg-black/30 lg:hidden"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div className="fixed bottom-0 right-0 z-50 flex h-[85vh] w-full flex-col bg-card shadow-2xl ring-1 ring-foreground/10 lg:bottom-6 lg:right-6 lg:h-[600px] lg:w-[420px] lg:rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">AI — Historia Clínica</p>
                <p className="text-xs text-muted-foreground">{patientName}</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close chat"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Analizando historial clínico…
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm text-foreground prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
                          h2: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
                          h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
                          code: ({ children }) => (
                            <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs">
                              {children}
                            </code>
                          ),
                          hr: () => <hr className="my-2 border-border/50" />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {messages.length > 0 && loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t px-3 py-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Consulta sobre el paciente…"
                disabled={loading}
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || loading}
                className="rounded-xl"
              >
                <Send size={15} />
              </Button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

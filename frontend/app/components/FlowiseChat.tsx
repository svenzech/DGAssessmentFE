'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_BRIEF_API_BASE ?? 'http://localhost:4000';

export function FlowiseChat() {
  const searchParams = useSearchParams();
  const initialUser =
    searchParams.get('user') ||
    searchParams.get('username') ||
    searchParams.get('email') ||
    'anonymous';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useState(initialUser);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    // Optimistisch in die Liste hängen
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/flowise/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          user,
          // Wenn Du später Historie brauchst, kannst Du hier
          // messages in ein schlankes Format serialisieren
          // und als `history` mitgeben.
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `HTTP ${res.status} – ${text || 'Fehler beim Chat-Endpoint'}`,
        );
      }

      const data: any = await res.json().catch(() => ({}));

      const answerText =
        (typeof data.answer === 'string' && data.answer) ||
        (typeof data.message === 'string' && data.message) ||
        (typeof data.text === 'string' && data.text) ||
        (typeof data.output === 'string' && data.output) ||
        'Keine Antwort erhalten.';

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: answerText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat-Fehler:', err);
      setError(err?.message ?? 'Unbekannter Fehler beim Chat.');
      // letzte User-Nachricht in der UI stehen lassen – ist bereits gerendert
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <div className="text-sm font-semibold">Flowise Chat</div>
          <div className="text-[11px] text-gray-500">
            Angemeldeter User: <span className="font-mono">{user}</span>
          </div>
        </div>
      </div>

      {/* Nachrichtenliste */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500">
            Stelle eine Frage, um den Chat zu starten.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[75%] rounded-lg bg-blue-600 px-3 py-2 text-xs text-white'
                : 'mr-auto max-w-[75%] rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-900'
            }
          >
            {m.text}
          </div>
        ))}

        {sending && (
          <div className="mr-auto max-w-[75%] rounded-lg bg-gray-100 px-3 py-2 text-[11px] text-gray-500">
            Denke nach …
          </div>
        )}
      </div>

      {/* Fehlermeldung */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          Fehler: {error}
        </div>
      )}

      {/* Eingabezeile */}
      <form onSubmit={handleSend} className="border-t px-3 py-2">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border px-2 py-1 text-sm"
            placeholder="Nachricht eingeben …"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
          >
            Senden
          </button>
        </div>
      </form>
    </div>
  );
}
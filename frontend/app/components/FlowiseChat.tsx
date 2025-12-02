'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatMessage, sendChatMessage } from '../scorecardApi';

export function FlowiseChat() {
  const searchParams = useSearchParams();

  // Username aus URL (für LearnWorlds-Embedding später hilfreich)
  const userFromUrl =
    searchParams.get('user') ||
    searchParams.get('username') ||
    searchParams.get('learner') ||
    null;

  const [userName, setUserName] = useState<string>(userFromUrl ?? '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserName = useMemo(
    () => userName.trim() || userFromUrl || null,
    [userName, userFromUrl],
  );

async function handleSend() {
  const trimmed = input.trim();
  if (!trimmed || sending) return;

  console.log('[Chat] handleSend start');
  console.log('[Chat] input =', trimmed);
  console.log('[Chat] effectiveUserName =', effectiveUserName);
  console.log('[Chat] current messages before send =', messages);

  const newUserMessage: ChatMessage = {
    role: 'user',
    content: trimmed,
  };

  const newHistory: ChatMessage[] = [...messages, newUserMessage];

  // Usernachricht sofort anzeigen
  setMessages(newHistory);
  setInput('');
  setSending(true);
  setError(null);

  try {
    console.log('[Chat] newHistory (wird an Backend geschickt) =', newHistory);

    // Debug-Nachricht als Assistant im Chat anzeigen
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content:
          '[DEBUG] Sende Anfrage an Backend: ' +
          JSON.stringify({
            user: effectiveUserName,
            message: trimmed,
            historyLength: newHistory.length,
          }),
      },
    ]);

    console.log('[Chat] rufe sendChatMessage(...) auf');
    const res = await sendChatMessage(effectiveUserName, trimmed, newHistory);
    console.log('[Chat] Backend-Antwort von sendChatMessage =', res);

    // Debug-Antwort im Chat
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content:
          '[DEBUG] Backend-Antwort (roh): ' + JSON.stringify(res),
      },
    ]);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: res.answer,
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (e: any) {
    console.error('[Chat] ERROR in handleSend:', e);

    const msg =
      e?.message ??
      (typeof e === 'string' ? e : 'Fehler beim Senden der Nachricht.');

    setError(msg);

    // Fehler auch im Chat anzeigen
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content:
          '[DEBUG ERROR] ' +
          msg +
          (e?.stack ? '\nStack: ' + e.stack : ''),
      },
    ]);
  } finally {
    setSending(false);
    console.log('[Chat] handleSend finished');
  }
}

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        handleSend();
      }
    }
  }

  function handleOpenEditorWindow() {
    // Öffnet Dein bestehendes Frontend (/) in einem separaten Fenster.
    if (typeof window !== 'undefined') {
      window.open(
        '/',
        'Editor', // Fenstername
        'width=1200,height=800,noopener,noreferrer',
      );
    }
  }

  const selectedUserLabel =
    effectiveUserName != null && effectiveUserName !== ''
      ? `Aktueller Benutzer: ${effectiveUserName}`
      : 'Kein Benutzer gesetzt';

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              Domänen-Assistent (Flowise Chat)
            </h1>
            <p className="text-sm text-gray-600">
              Chatten Sie mit dem Assistenten. Den ausführlichen Editor können Sie
              im separaten Fenster öffnen.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenEditorWindow}
            className="rounded-md border px-3 py-1 text-sm bg-white shadow-sm hover:bg-gray-50"
          >
            Editor öffnen
          </button>
        </header>

        {/* Benutzername (optional) */}
        <section className="rounded-xl bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Benutzerkontext
          </h2>
          <p className="text-xs text-gray-500">
            Hier können Sie optional einen Anzeigenamen für den Chat setzen.
            Später kann LearnWorlds diesen automatisch befüllen.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs text-gray-600 sm:w-32">
              Benutzername
            </label>
            <input
              className="flex-1 rounded-md border px-2 py-1 text-sm"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={
                userFromUrl
                  ? `Aus URL: ${userFromUrl}`
                  : 'Optional – z. B. Vor- und Nachname'
              }
            />
          </div>
          <p className="text-[11px] text-gray-500">
            {selectedUserLabel}
          </p>
        </section>

        {/* Chat-Bereich */}
        <section className="rounded-xl bg-white p-4 shadow-sm flex flex-col min-h-[500px]">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Chat
          </h2>

          <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto border rounded-md px-3 py-2 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-500">
                Noch keine Nachrichten. Stellen Sie eine Frage, z. B. zur
                Auswertung eines Steckbriefs oder zur Interpretation einer
                Scorecard.
              </p>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    m.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[80%] rounded-lg bg-blue-600 text-white px-3 py-2 text-sm'
                        : 'max-w-[80%] rounded-lg bg-gray-200 text-gray-900 px-3 py-2 text-sm'
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-600">
              Fehler: {error}
            </p>
          )}

          {/* Eingabe */}
          <div className="mt-3 space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Nachricht
            </label>
            <textarea
              className="w-full rounded-md border px-2 py-1 text-sm min-h-[80px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ihre Frage an den Assistenten … (Enter = senden, Shift+Enter = Zeilenumbruch)"
            />
            <div className="flex justify-between items-center">
              <div className="text-[11px] text-gray-500">
                Enter: senden · Shift+Enter: Zeilenumbruch
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white disabled:opacity-60"
              >
                {sending ? 'Senden …' : 'Senden'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
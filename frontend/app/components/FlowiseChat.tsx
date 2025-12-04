'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatMessage, sendChatMessage } from '../scorecardApi';

export function FlowiseChat() { 
  const searchParams = useSearchParams();

  // Username aus URL (für LearnWorlds-Embedding)
  const userFromUrl =
    searchParams.get('user') ||
    searchParams.get('username') ||
    searchParams.get('learner') ||
    null;

   // Default: learnworlds:svz (kann durch URL oder Eingabe überschrieben werden)
  const [userName, setUserName] = useState<string>(
    userFromUrl ?? 'learnworlds:svz',
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const effectiveUserName = useMemo(
    () => userName.trim() || userFromUrl || null,
    [userName, userFromUrl],
  );

  // --------------------------------------------------
  // 1) Auto-Start: erste Frage direkt beim Laden holen
  // --------------------------------------------------
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    (async () => {
      try {
        setSending(true);
        setError(null);

        const systemPrompt =
          'Bitte starte den Dialog und stelle mir die erste Frage zur Arbeit mit Domänen-Steckbriefen.';

        console.log('[Chat] Auto-Start: rufe sendChatMessage()', {
          user: effectiveUserName,
          message: systemPrompt,
        });

        const res = await sendChatMessage(effectiveUserName, systemPrompt, [], {
          skipSave: true,
        });


        console.log('[Chat] Auto-Start Antwort von sendChatMessage =', res);

        const assistantText = res.answer ?? '';

        setMessages([
          {
            role: 'assistant',
            content: assistantText,
          },
        ]);
      } catch (e: any) {
        console.error('[Chat] ERROR im Auto-Start:', e);
        setError(
          e?.message ??
            'Fehler beim automatischen Start des Assistenten.',
        );
        setMessages([
          {
            role: 'assistant',
            content:
              'Beim Laden der ersten Frage ist ein Fehler aufgetreten. Stellen Sie bitte direkt Ihre erste Frage.',
          },
        ]);
      } finally {
        setSending(false);
      }
    })();
    // effectiveUserName absichtlich nicht in den Dependencies,
    // damit der Auto-Start nur einmal passiert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // -------------------------
  // 2) Normales Senden-Handling
  // -------------------------
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    console.log('[Chat] handleSend start', {
      user: effectiveUserName,
      message: trimmed,
      currentMessages: messages.length,
    });

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
      const res = await sendChatMessage(effectiveUserName, trimmed, newHistory);
      console.log('[Chat] Backend-Antwort von sendChatMessage =', res);

      const assistantText = res.answer ?? '';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      console.error('[Chat] ERROR in handleSend:', e);

      const msg =
        e?.message ??
        (typeof e === 'string' ? e : 'Fehler beim Senden der Nachricht.');

      setError(msg);
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
    if (typeof window !== 'undefined') {
      window.open(
        '/',
        'Editor',
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
                Der Assistent wird initial geladen …
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
                        ? 'max-w-[80%] rounded-lg bg-blue-600 text-white px-3 py-2 text-sm whitespace-pre-wrap'
                        : 'max-w-[80%] rounded-lg bg-gray-200 text-gray-900 px-3 py-2 text-sm whitespace-pre-wrap'
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
              placeholder="Ihre Nachricht an den Assistenten … (Enter = senden, Shift+Enter = Zeilenumbruch)"
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
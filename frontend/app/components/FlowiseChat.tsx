'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChatMessage,
  sendChatMessage,
  fetchInterviewContextForUser,
  LeanInterviewContextFront,
} from '../scorecardApi';

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

  // Interview-Kontext (Lean) für das rechte Panel
  const [ctxLoading, setCtxLoading] = useState(false);
  const [ctxError, setCtxError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<LeanInterviewContextFront | null>(null);

  // Steckbrief-Modal
  const [showBriefModal, setShowBriefModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const effectiveUserName = useMemo(
    () => userName.trim() || userFromUrl || null,
    [userName, userFromUrl],
  );

  useEffect(() => {
    console.log('[DEBUG] Interview-Kontext empfangen:', ctx);
  }, [ctx]);

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
            meta: res.meta,
          },
        ]);
      } catch (e: any) {
        console.error('[Chat] ERROR im Auto-Start:', e);
        setError(
          e?.message ?? 'Fehler beim automatischen Start des Assistenten.',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // --------------------------------------------------
  // 2) Lean-Interview-Kontext für das rechte Panel laden
  // --------------------------------------------------
  useEffect(() => {
    if (!effectiveUserName) {
      setCtx(null);
      return;
    }

    let aborted = false;

    (async () => {
      try {
        setCtxLoading(true);
        setCtxError(null);

        const data = await fetchInterviewContextForUser(effectiveUserName);

        if (!aborted) {
          setCtx(data);
        }
      } catch (e: any) {
        console.error('[Chat] Fehler beim Laden des Interview-Kontexts:', e);
        if (!aborted) {
          setCtxError(
            e?.message ?? 'Fehler beim Laden des Interview-Kontexts.',
          );
          setCtx(null);
        }
      } finally {
        if (!aborted) {
          setCtxLoading(false);
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [effectiveUserName]);

  // Immer ans Ende der Chatliste scrollen, wenn sich Messages ändern
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages]);

  // -------------------------
  // 3) Normales Senden-Handling
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
        meta: res.meta,
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
      window.open('/', 'Editor', 'width=1200,height=800,noopener,noreferrer');
    }
  }

  const selectedUserLabel =
    effectiveUserName != null && effectiveUserName !== ''
      ? `Aktueller Benutzer: ${effectiveUserName}`
      : 'Kein Benutzer gesetzt';

  // Aus dem Kontext: Themen extrahieren (nur eindeutige Themes)
  const themes: string[] = useMemo(() => {
    if (!ctx?.interview) return [];
    const set = new Set<string>();
    for (const f of ctx.interview) {
      if (f.theme && typeof f.theme === 'string') {
        set.add(f.theme);
      }
    }
    return Array.from(set);
  }, [ctx]);

  const briefTitle = ctx?.brief?.title ?? 'Domänen-Steckbrief';
  const briefMarkdown = ctx?.brief?.raw_markdown ?? '';
  const hasBrief = !!ctx?.brief?.raw_markdown;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              Domänen-Assistent (Flowise Chat)
            </h1>
            <p className="text-sm text-gray-600">
              Chatten Sie mit dem Assistenten. Den ausführlichen Editor können
              Sie im separaten Fenster öffnen.
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
          <p className="text-[11px] text-gray-500">{selectedUserLabel}</p>
        </section>

        {/* Chat + rechte Seitenleiste */}
        <section className="rounded-xl bg-white p-4 shadow-sm min-h-[500px]">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Chat</h2>

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Linke Seite: Chat-Verlauf */}
            <div className="flex-1 min-h-[250px] max-h-[500px] overflow-y-auto border rounded-md px-3 py-2 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Der Assistent wird initial geladen …
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {messages.map((m, idx) => {
                      const isUser = m.role === 'user';
                      return (
                        <div
                          key={idx}
                          className={
                            isUser ? 'flex justify-end' : 'flex justify-start'
                          }
                        >
                          <div
                            className={
                              isUser
                                ? 'max-w-[80%] flex flex-col items-end'
                                : 'max-w-[80%] flex flex-col items-start'
                            }
                          >
                            {/* Badge nur für Assistant-Nachrichten mit Theme */}
                            {!isUser && m.meta?.theme && (
                              <div className="mb-1 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 max-w-full">
                                <span className="truncate">
                                  {m.meta.theme}
                                </span>
                              </div>
                            )}
                            <div
                              className={
                                isUser
                                  ? 'w-full rounded-lg bg-blue-600 text-white px-3 py-2 text-sm whitespace-pre-wrap'
                                  : 'w-full rounded-lg bg-gray-200 text-gray-900 px-3 py-2 text-sm whitespace-pre-wrap'
                              }
                            >
                              {m.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Scroll-Anker am Ende */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Rechte Seite: Steckbrief + Themen */}
            <aside className="w-full lg:w-80 border rounded-md px-3 py-3 bg-gray-50 flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-1">
                  Steckbrief
                </h3>

                <p
                  className="text-[11px] font-medium text-gray-800 mb-1 truncate"
                  title={briefTitle}
                >
                  {briefTitle}
                </p>

                <p className="text-[11px] text-gray-600 mb-2">
                  Anzeigen des aktuellen Domänen-Steckbriefs, zu dem dieses
                  Interview geführt wird.
                </p>

                <button
                  type="button"
                  onClick={() => setShowBriefModal(true)}
                  disabled={!hasBrief || ctxLoading}
                  className="w-full rounded-md border px-3 py-1.5 text-xs bg-white shadow-sm disabled:opacity-60 hover:bg-gray-100"
                >
                  {ctxLoading
                    ? 'Steckbrief wird geladen …'
                    : hasBrief
                    ? 'Steckbrief anzeigen'
                    : 'Kein Steckbrief verfügbar'}
                </button>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">
                  Themen im Fokus
                </h3>
                {ctxError && (
                  <p className="text-[11px] text-red-600">{ctxError}</p>
                )}
                {!ctxError && ctxLoading && (
                  <p className="text-[11px] text-gray-500">
                    Themen werden geladen …
                  </p>
                )}
                {!ctxLoading && !ctxError && themes.length === 0 && (
                  <p className="text-[11px] text-gray-500">
                    Keine Themeninformationen verfügbar.
                  </p>
                )}
                {!ctxLoading && !ctxError && themes.length > 0 && (
                  <ul className="space-y-1">
                    {themes.map((t) => (
                      <li
                        key={t}
                        className="text-[11px] text-gray-800 flex items-start gap-1"
                      >
                        <span className="mt-[2px] text-[10px]">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>

          {/* Eingabebereich */}
          <div className="mt-4 space-y-2">
            <label
              htmlFor="chat-input"
              className="text-xs font-medium text-gray-700"
            >
              Ihre Nachricht an den Assistenten
              <span className="text-[10px] text-gray-400">
                {' '}
                (Enter = senden, Shift+Enter = Zeilenumbruch)
              </span>
            </label>
            <textarea
              id="chat-input"
              className="w-full rounded-md border px-2 py-1 text-sm min-h-[60px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <div className="flex items-center justify-between">
              {error && (
                <p className="text-xs text-red-600 max-w-md">{error}</p>
              )}
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="ml-auto rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
              >
                {sending ? 'Senden …' : 'Senden'}
              </button>
            </div>
          </div>
        </section>

        {/* Steckbrief-Modal */}
        {showBriefModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="max-h-[90vh] max-w-3xl w-full rounded-lg bg-white shadow-lg flex flex-col">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  {briefTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBriefModal(false)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Schließen
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                {hasBrief ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-900">
                    {briefMarkdown}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-600">
                    Es ist kein Steckbrief für dieses Interview verfügbar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
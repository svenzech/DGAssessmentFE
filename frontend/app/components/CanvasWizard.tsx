'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CanvasField,
  CanvasFieldAnswer,
  CanvasRun,
  CanvasSheet,
  getCanvasFieldFeedback,
  getCanvasRun,
  getCanvasTemplate,
  getOrCreateCanvasRun,
  saveCanvasField,
} from '../scorecardApi';

type CanvasWizardProps = {
  sheetId: string;
  title?: string;
  domainId?: string | null;
  briefId?: string | null;
};

const DEFAULT_USERNAME = 'learnworlds:svz';

export function CanvasWizard({
  sheetId,
  title,
  domainId = null,
  briefId = null,
}: CanvasWizardProps) {
  const searchParams = useSearchParams();
  const userFromUrl =
    searchParams.get('user') ||
    searchParams.get('username') ||
    searchParams.get('learner') ||
    null;

  const [username, setUsername] = useState<string>(
    userFromUrl ?? DEFAULT_USERNAME,
  );

  const [sheet, setSheet] = useState<CanvasSheet | null>(null);
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [run, setRun] = useState<CanvasRun | null>(null);
  const [answers, setAnswers] = useState<Record<string, CanvasFieldAnswer>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [stepIndex, setStepIndex] = useState(0);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const activeFields = useMemo(() => {
    const filtered = (fields ?? []).filter((f) => f.active !== false);
    return filtered.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [fields]);

  const currentField = activeFields[stepIndex] ?? null;
  const currentAnswer = currentField ? answers[currentField.code] : undefined;
  const feedback = currentAnswer?.llm_feedback;
  const suggestions = feedback?.suggestions ?? [];
  const questions = feedback?.questions ?? [];
  const currentValue =
    (currentField && drafts[currentField.code]) ??
    (currentField && answers[currentField.code]?.value) ??
    '';

  const hasValue = currentValue.trim().length > 0;
  const savedValue =
    currentField && answers[currentField.code]
      ? answers[currentField.code].value
      : '';
  const hasSaved =
    typeof savedValue === 'string' && savedValue.trim().length > 0;
  const canProceed = hasValue || hasSaved;

  useEffect(() => {
    if (!sheetId) return;

    (async () => {
      try {
        setLoadingTemplate(true);
        setError(null);
        const tpl = await getCanvasTemplate(sheetId);
        setSheet(tpl.sheet);
        setFields(tpl.fields ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Fehler beim Laden des Canvas-Templates.');
      } finally {
        setLoadingTemplate(false);
      }
    })();
  }, [sheetId]);

  // Auto-Start einmalig
  useEffect(() => {
    if (initialized) return;
    if (!sheetId || !username) return;
    if (!sheet) return;
    setInitialized(true);
    void handleLoadRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, sheetId, username, sheet]);

  async function handleLoadRun() {
    if (!username.trim()) {
      setError('Bitte einen Benutzernamen angeben.');
      return;
    }
    try {
      setLoadingRun(true);
      setError(null);

      const { run } = await getOrCreateCanvasRun(
        sheetId,
        username.trim(),
        domainId,
        briefId,
      );
      setRun(run);

      const runData = await getCanvasRun(run.id);
      setAnswers(runData.answersByFieldCode ?? {});

      const nextDrafts: Record<string, string> = {};
      for (const [code, a] of Object.entries(
        runData.answersByFieldCode ?? {},
      )) {
        if (a?.value) nextDrafts[code] = a.value;
      }
      setDrafts(nextDrafts);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden des Runs.');
    } finally {
      setLoadingRun(false);
    }
  }

  function handleDraftChange(code: string, value: string) {
    setDrafts((prev) => ({ ...prev, [code]: value }));
  }

  async function handleSaveCurrent() {
    if (!run || !currentField) return;
    try {
      setSaving(true);
      setError(null);
      const value = (drafts[currentField.code] ?? '').toString();
      await saveCanvasField(run.id, currentField.code, value);
      setAnswers((prev) => ({
        ...prev,
        [currentField.code]: {
          value,
          updated_at: new Date().toISOString(),
          llm_feedback: prev[currentField.code]?.llm_feedback,
        },
      }));
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFeedback() {
    if (!run || !currentField) return;
    try {
      setFeedbackLoading(true);
      setError(null);
      const value = (drafts[currentField.code] ?? '').toString();
      const feedback = await getCanvasFieldFeedback(
        run.id,
        currentField.code,
        value,
      );
      setAnswers((prev) => ({
        ...prev,
        [currentField.code]: {
          value,
          updated_at: new Date().toISOString(),
          llm_feedback: {
            suggestions: feedback.suggestions ?? [],
            questions: feedback.questions ?? [],
            created_at: new Date().toISOString(),
          },
        },
      }));
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  }

  function handlePrev() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    setStepIndex((i) => Math.min(activeFields.length - 1, i + 1));
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-gray-500">Canvas</div>
        <h1 className="text-2xl font-semibold">{title ?? sheet?.name}</h1>
        {sheet?.theme_target_description && (
          <p className="text-sm text-gray-700">
            {sheet.theme_target_description}
          </p>
        )}
      </header>

      <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <div className="text-xs font-semibold text-gray-700">Benutzer</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="flex-1 rounded-md border px-2 py-1 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="z. B. Vorname Nachname"
          />
          <button
            type="button"
            onClick={handleLoadRun}
            disabled={loadingRun}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
          >
            {loadingRun ? 'Lade Run …' : 'Run laden'}
          </button>
        </div>
        {run && (
          <div className="text-[11px] text-gray-500">
            Run: <span className="font-mono">{run.id}</span>
          </div>
        )}
      </section>

      {loadingTemplate && (
        <div className="text-sm text-gray-500">Template wird geladen …</div>
      )}

      {!loadingTemplate && activeFields.length === 0 && (
        <div className="text-sm text-gray-500">
          Keine aktiven Felder gefunden.
        </div>
      )}

      {currentField && (
        <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Schritt {stepIndex + 1} von {activeFields.length}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              {currentField.code}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{currentField.question}</h2>
            {Array.isArray(currentField.checkpoints) &&
              currentField.checkpoints.length > 0 && (
                <div className="rounded-md border bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-gray-600">
                    Hinweise
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
                    {currentField.checkpoints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              Deine Antwort
            </label>
            <textarea
              className="w-full rounded-md border px-2 py-1 text-sm min-h-[120px]"
              value={currentValue}
              onChange={(e) =>
                handleDraftChange(currentField.code, e.target.value)
              }
              placeholder="Antwort eingeben …"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={saving || !run}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
            >
              {saving ? 'Speichern …' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={handleFeedback}
              disabled={feedbackLoading || !run}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
            >
              {feedbackLoading ? 'Prüfe …' : 'Verbesserung prüfen'}
            </button>
          </div>

          {feedback && (
            <div className="rounded-md border bg-gray-50 px-3 py-2 space-y-2">
              <div className="text-[11px] font-semibold text-gray-600">
                Feedback
              </div>
              {suggestions.length > 0 && (
                <div>
                  <div className="text-[11px] text-gray-500">
                    Vorschläge
                  </div>
                  <ul className="list-disc pl-5 text-xs text-gray-700">
                    {suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {questions.length > 0 && (
                <div>
                  <div className="text-[11px] text-gray-500">Rückfragen</div>
                  <ul className="list-disc pl-5 text-xs text-gray-700">
                    {questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
            >
              Zurück
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                stepIndex >= activeFields.length - 1 || !canProceed
              }
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
            >
              Weiter
            </button>
          </div>
        </section>
      )}

      {error && <p className="text-sm text-red-600">Fehler: {error}</p>}
    </section>
  );
}

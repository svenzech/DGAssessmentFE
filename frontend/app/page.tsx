'use client';

import { useEffect, useState } from 'react';
import {
  getLatestScorecard,
  evaluateBriefSheet,
  fetchBriefs,
  fetchSheets,
  fetchBriefDetail,
  fetchSheetDetail,
  fetchSheetQuestions,
  updateBrief,
  updateSheet,
  updateSheetQuestions,
  ScorecardResponse,
  BriefListItem,
  SheetListItem,
  BriefDetail,
  SheetDetail,
  SheetQuestion,
} from './scorecardApi';

export default function HomePage() {
  const [briefs, setBriefs] = useState<BriefListItem[]>([]);
  const [sheets, setSheets] = useState<SheetListItem[]>([]);

  const [briefId, setBriefId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const [scorecard, setScorecard] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor-State Steckbrief
  const [briefEditorOpen, setBriefEditorOpen] = useState(false);
  const [briefEdit, setBriefEdit] = useState<BriefDetail | null>(null);
  const [savingBrief, setSavingBrief] = useState(false);

  // Editor-State Sheet
  const [sheetEditorOpen, setSheetEditorOpen] = useState(false);
  const [sheetEdit, setSheetEdit] = useState<SheetDetail | null>(null);
  const [savingSheet, setSavingSheet] = useState(false);

  // Fragen zum ausgewählten Sheet
  const [sheetQuestions, setSheetQuestions] = useState<SheetQuestion[]>([]);
  const [loadingSheetQuestions, setLoadingSheetQuestions] = useState(false);
  const [savingSheetQuestions, setSavingSheetQuestions] = useState(false);

  // Beim Start: Steckbriefe und Sheets laden
  useEffect(() => {
    async function loadLists() {
      try {
        setInitialLoading(true);
        setError(null);

        const [briefList, sheetList] = await Promise.all([
          fetchBriefs(),
          fetchSheets(),
        ]);

        setBriefs(briefList);
        setSheets(sheetList);

        if (!briefId && briefList.length > 0) {
          setBriefId(briefList[0].id);
        }
        if (!sheetId && sheetList.length > 0) {
          setSheetId(sheetList[0].id);
        }
      } catch (e: any) {
        setError(e.message ?? 'Fehler beim Laden der Listen.');
      } finally {
        setInitialLoading(false);
      }
    }

    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadLatest() {
    if (!briefId || !sheetId) {
      setError('Bitte zuerst einen Steckbrief und ein Überleitungssheet auswählen.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sc = await getLatestScorecard(briefId, sheetId);
      setScorecard(sc);
      if (!sc) {
        setError('Keine gespeicherte Auswertung gefunden.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unbekannter Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!briefId || !sheetId) {
      setError('Bitte zuerst einen Steckbrief und ein Überleitungssheet auswählen.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sc = await evaluateBriefSheet(briefId, sheetId);
      setScorecard(sc);
    } catch (e: any) {
      setError(e.message ?? 'Unbekannter Fehler bei der Auswertung.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenBriefEditor() {
    if (!briefId) {
      setError('Bitte zuerst einen Steckbrief auswählen.');
      return;
    }
    setError(null);
    setBriefEditorOpen(true);
    try {
      const detail = await fetchBriefDetail(briefId);
      setBriefEdit(detail);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden des Steckbriefs.');
    }
  }

  async function handleOpenSheetEditor() {
    if (!sheetId) {
      setError('Bitte zuerst ein Überleitungssheet auswählen.');
      return;
    }
    setError(null);
    setSheetEditorOpen(true);
    setLoadingSheetQuestions(true);

    try {
      const [detail, questions] = await Promise.all([
        fetchSheetDetail(sheetId),
        fetchSheetQuestions(sheetId),
      ]);
      setSheetEdit(detail);
      setSheetQuestions(questions);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden des Sheets oder der Fragen.');
    } finally {
      setLoadingSheetQuestions(false);
    }
  }

  async function handleSaveBrief() {
    if (!briefEdit) return;

    setSavingBrief(true);
    setError(null);
    try {
      const updated = await updateBrief(briefEdit.id, {
        title: briefEdit.title,
        status: briefEdit.status,
        raw_markdown: briefEdit.raw_markdown,
        version: briefEdit.version,
      });
      setBriefEdit(updated);
      // Liste aktualisieren
      setBriefs((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
      );
      setBriefEditorOpen(false);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern des Steckbriefs.');
    } finally {
      setSavingBrief(false);
    }
  }

  async function handleSaveSheet() {
    if (!sheetEdit || !sheetId) return;

    setSavingSheet(true);
    setSavingSheetQuestions(true);
    setError(null);

    try {
      // 1. Sheet-Metadaten speichern
      const updatedSheet = await updateSheet(sheetEdit.id, {
        name: sheetEdit.name,
        theme: sheetEdit.theme,
        status: sheetEdit.status,
        version: sheetEdit.version,
      });
      setSheetEdit(updatedSheet);
      setSheets((prev) =>
        prev.map((s) => (s.id === updatedSheet.id ? { ...s, ...updatedSheet } : s)),
      );

      // 2. Fragenliste speichern (Upsert + Delete)
      const updatedQuestions = await updateSheetQuestions(sheetId, sheetQuestions);
      setSheetQuestions(updatedQuestions);

      setSheetEditorOpen(false);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern des Sheets oder der Fragen.');
    } finally {
      setSavingSheet(false);
      setSavingSheetQuestions(false);
    }
  }

  // Hilfsfunktionen für Fragen-Editor
  function handleQuestionChange(
    index: number,
    patch: Partial<SheetQuestion>,
  ) {
    setSheetQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function handleDeleteQuestion(index: number) {
    setSheetQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddQuestion() {
    setSheetQuestions((prev) => {
      const nextIndex = prev.length;
      return [
        ...prev,
        {
          code: '',
          question: '',
          checkpoints: [],
          order_index: nextIndex,
          active: true,
        },
      ];
    });
  }

  const selectedBrief = briefs.find((b) => b.id === briefId) || null;
  const selectedSheet = sheets.find((s) => s.id === sheetId) || null;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Domänen-Steckbrief Scorecard
          </h1>
          <p className="text-sm text-gray-600">
            Steckbrief + Überleitungssheet auswählen, bewerten und
            Verbesserungs-Empfehlungen anzeigen.
          </p>
        </header>

        {/* Auswahl + Aktionen */}
        <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Auswahl Steckbrief und Überleitungssheet
          </h2>

          {initialLoading && (
            <p className="text-sm text-gray-500">Lade Steckbriefe und Sheets …</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Steckbriefe-Liste */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  Steckbriefe
                </span>
                <span className="text-[10px] text-gray-400">
                  {briefs.length} Einträge
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-md border bg-gray-50">
                {briefs.length === 0 ? (
                  <p className="p-2 text-xs text-gray-500">
                    Noch keine Steckbriefe vorhanden.
                  </p>
                ) : (
                  <ul className="divide-y text-sm">
                    {briefs.map((b) => {
                      const isSelected = b.id === briefId;
                      return (
                        <li
                          key={b.id}
                          className={[
                            'cursor-pointer px-3 py-2',
                            isSelected
                              ? 'bg-blue-50 border-l-2 border-blue-500'
                              : 'hover:bg-gray-100',
                          ].join(' ')}
                          onClick={() => {
                            setBriefId(b.id);
                            setScorecard(null);
                          }}
                        >
                          <div className="font-medium">
                            {b.title || 'Ohne Titel'}
                          </div>
                          <div className="text-xs text-gray-500 flex gap-2">
                            <span>Version {b.version ?? '–'}</span>
                            <span>Status: {b.status ?? '–'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Sheets-Liste */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  Überleitungssheets
                </span>
                <span className="text-[10px] text-gray-400">
                  {sheets.length} Einträge
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-md border bg-gray-50">
                {sheets.length === 0 ? (
                  <p className="p-2 text-xs text-gray-500">
                    Noch keine Überleitungssheets vorhanden.
                  </p>
                ) : (
                  <ul className="divide-y text-sm">
                    {sheets.map((s) => {
                      const isSelected = s.id === sheetId;
                      return (
                        <li
                          key={s.id}
                          className={[
                            'cursor-pointer px-3 py-2',
                            isSelected
                              ? 'bg-blue-50 border-l-2 border-blue-500'
                              : 'hover:bg-gray-100',
                          ].join(' ')}
                          onClick={() => {
                            setSheetId(s.id);
                            setScorecard(null);
                          }}
                        >
                          <div className="font-medium">
                            {s.name || 'Ohne Name'}
                          </div>
                          <div className="text-xs text-gray-500 flex gap-2">
                            <span>Theme: {s.theme ?? '–'}</span>
                            <span>Version {s.version ?? '–'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Auswahl-Info + Aktionen */}
          <div className="flex flex-col gap-2 text-xs text-gray-600 mt-2">
            <div>
              Ausgewählter Steckbrief:{' '}
              <span className="font-mono">
                {selectedBrief
                  ? `${selectedBrief.title ?? 'Ohne Titel'} (${selectedBrief.id})`
                  : '–'}
              </span>
            </div>
            <div>
              Ausgewähltes Sheet:{' '}
              <span className="font-mono">
                {selectedSheet
                  ? `${selectedSheet.name ?? 'Ohne Name'} (${selectedSheet.id})`
                  : '–'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={handleLoadLatest}
              disabled={loading}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
            >
              Letzte Auswertung laden
            </button>
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
            >
              Neu auswerten
            </button>
            <button
              onClick={handleOpenBriefEditor}
              disabled={!briefId}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
            >
              Steckbrief bearbeiten
            </button>
            <button
              onClick={handleOpenSheetEditor}
              disabled={!sheetId}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
            >
              Überleitungssheet bearbeiten
            </button>
          </div>

          {loading && (
            <p className="text-sm text-gray-500 mt-2">Bitte warten …</p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-2">
              Fehler: {error}
            </p>
          )}
        </section>

        {/* Steckbrief-Editor */}
        {briefEditorOpen && briefEdit && (
          <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700">
                Steckbrief bearbeiten
              </h2>
              <button
                className="text-xs text-gray-500 hover:underline"
                onClick={() => setBriefEditorOpen(false)}
              >
                Schließen
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div>
                <div className="font-medium text-gray-600">ID</div>
                <div className="font-mono text-gray-800 break-all">
                  {briefEdit.id}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Domäne</div>
                <div className="font-mono text-gray-800 break-all">
                  {briefEdit.domain_id ?? '–'}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Erstellt</div>
                <div className="font-mono text-gray-800">
                  {briefEdit.created_at}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Zuletzt aktualisiert</div>
                <div className="font-mono text-gray-800">
                  {briefEdit.updated_at ?? '–'}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Titel
                </label>
                <input
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={briefEdit.title ?? ''}
                  onChange={(e) =>
                    setBriefEdit((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <input
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={briefEdit.status ?? ''}
                  onChange={(e) =>
                    setBriefEdit((prev) =>
                      prev ? { ...prev, status: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Version
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={briefEdit.version ?? ''}
                  onChange={(e) =>
                    setBriefEdit((prev) =>
                      prev
                        ? {
                            ...prev,
                            version:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Steckbrief (Markdown)
              </label>
              <textarea
                className="w-full rounded-md border px-2 py-1 text-sm font-mono min-h-[200px]"
                value={briefEdit.raw_markdown}
                onChange={(e) =>
                  setBriefEdit((prev) =>
                    prev ? { ...prev, raw_markdown: e.target.value } : prev,
                  )
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveBrief}
                disabled={savingBrief}
                className="rounded-md bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-60"
              >
                Änderungen speichern
              </button>
              <button
                onClick={() => setBriefEditorOpen(false)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </section>
        )}

        {/* Sheet-Editor */}
        {sheetEditorOpen && sheetEdit && (
          <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700">
                Überleitungssheet bearbeiten
              </h2>
              <button
                className="text-xs text-gray-500 hover:underline"
                onClick={() => setSheetEditorOpen(false)}
              >
                Schließen
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs">
              <div>
                <div className="font-medium text-gray-600">ID</div>
                <div className="font-mono text-gray-800 break-all">
                  {sheetEdit.id}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Erstellt</div>
                <div className="font-mono text-gray-800">
                  {sheetEdit.created_at}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={sheetEdit.name ?? ''}
                  onChange={(e) =>
                    setSheetEdit((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Theme
                </label>
                <input
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={sheetEdit.theme ?? ''}
                  onChange={(e) =>
                    setSheetEdit((prev) =>
                      prev ? { ...prev, theme: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <input
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={sheetEdit.status ?? ''}
                  onChange={(e) =>
                    setSheetEdit((prev) =>
                      prev ? { ...prev, status: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Version
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  value={sheetEdit.version ?? ''}
                  onChange={(e) =>
                    setSheetEdit((prev) =>
                      prev
                        ? {
                            ...prev,
                            version:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </div>

            {/* Fragen-Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700">
                  Fragen zum Überleitungssheet
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="rounded-md border px-2 py-1 text-xs"
                >
                  Frage hinzufügen
                </button>
              </div>

              {loadingSheetQuestions ? (
                <p className="text-xs text-gray-500">
                  Lade Fragen …
                </p>
              ) : sheetQuestions.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Noch keine Fragen vorhanden. Fügen Sie eine neue Frage hinzu.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {sheetQuestions.map((q, index) => (
                    <div
                      key={q.id ?? `new-${index}`}
                      className="rounded-md border px-3 py-2 text-xs space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                          <span className="font-mono text-gray-500">
                            #{index + 1}
                          </span>
                          <label className="flex items-center gap-1 text-[11px] text-gray-600">
                            <input
                              type="checkbox"
                              className="h-3 w-3"
                              checked={q.active ?? true}
                              onChange={(e) =>
                                handleQuestionChange(index, {
                                  active: e.target.checked,
                                })
                              }
                            />
                            aktiv
                          </label>
                        </div>
                        <button
                          type="button"
                          className="text-[11px] text-red-600 hover:underline"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          Löschen
                        </button>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3">
                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Code
                          </label>
                          <input
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            value={q.code}
                            onChange={(e) =>
                              handleQuestionChange(index, {
                                code: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Order Index
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-md border px-2 py-1 text-xs"
                            value={q.order_index}
                            onChange={(e) =>
                              handleQuestionChange(index, {
                                order_index:
                                  e.target.value === ''
                                    ? 0
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Frage
                        </label>
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs"
                          value={q.question}
                          onChange={(e) =>
                            handleQuestionChange(index, {
                              question: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Checkpoints (eine Zeile pro Punkt)
                        </label>
                        <textarea
                          className="w-full rounded-md border px-2 py-1 text-xs font-mono"
                          value={(q.checkpoints ?? []).join('\n')}
                          onChange={(e) => {
                            const lines = e.target.value
                              .split('\n')
                              .map((l) => l.trim())
                              .filter((l) => l.length > 0);
                            handleQuestionChange(index, {
                              checkpoints: lines,
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveSheet}
                disabled={savingSheet || savingSheetQuestions}
                className="rounded-md bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-60"
              >
                Änderungen speichern
              </button>
              <button
                onClick={() => setSheetEditorOpen(false)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </section>
        )}

        {/* Scorecard-Anzeige */}
        {scorecard && (
          <section className="space-y-6">
            <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
              <h2 className="text-lg font-semibold">
                Gesamtübersicht ({scorecard.theme ?? 'ohne Thema'})
              </h2>
              <p className="text-sm text-gray-700">
                Baseline Ø:{' '}
                {scorecard.sheet_summary.baseline_avg_score_1_5 ?? '–'} ·
                Interview-Adjusted Ø:{' '}
                {scorecard.sheet_summary.interview_adjusted_avg_score_1_5 ??
                  '–'}{' '}
                · Finales Level:{' '}
                {scorecard.sheet_summary.final_level_1_5 ?? '–'}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
              <h3 className="text-md font-semibold">Leitfragen</h3>
              <div className="space-y-3">
                {scorecard.per_question.map((q) => (
                  <div
                    key={q.question_id}
                    className="rounded-lg border px-3 py-2"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="text-xs font-mono text-gray-500">
                          {q.question_code}
                        </div>
                        <div className="text-sm font-medium">
                          {q.question}
                        </div>
                      </div>
                      <div className="text-xs text-right text-gray-600">
                        <div>Baseline: {q.baseline_score_1_5 ?? '–'}</div>
                        <div>
                          Mit Interviews:{' '}
                          {q.interview_adjusted_score_1_5 ?? '–'}
                        </div>
                        <div>
                          Final:{' '}
                          <span className="font-semibold">
                            {q.final_score_1_5 ?? '–'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-700">
                      {q.reasoning}
                    </p>
                    {q.recommended_brief_updates.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-gray-700">
                        {q.recommended_brief_updates.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
              <h3 className="text-md font-semibold">
                Wichtigste Lücken
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {scorecard.sheet_summary.main_gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
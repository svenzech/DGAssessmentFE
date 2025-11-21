'use client';

import { useEffect, useState } from 'react';
import {
  getLatestScorecard,
  evaluateBriefSheet,
  fetchBriefs,
  fetchSheets,
  ScorecardResponse,
  BriefListItem,
  SheetListItem,
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

        // Falls noch nichts ausgewählt ist, jeweils ersten Eintrag setzen
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

  const selectedBrief = briefs.find((b) => b.id === briefId) || null;
  const selectedSheet = sheets.find((s) => s.id === sheetId) || null;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Domänen-Steckbrief Scorecard
          </h1>
          <p className="text-sm text-gray-600">
            Steckbrief + Überleitungssheet auswählen, bewerten und
            Verbesserungs-Empfehlungen anzeigen.
          </p>
        </header>

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
                            setScorecard(null); // alte Auswertung zurücksetzen
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
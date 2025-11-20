// frontend/app/page.tsx
'use client';

import { useState } from 'react';
import {
  getLatestScorecard,
  evaluateBriefSheet,
  Scorecard,
} from './scorecardApi';

export default function HomePage() {
  const [briefId, setBriefId] = useState(
    '55555555-5555-5555-5555-555555555555',
  );
  const [sheetId, setSheetId] = useState(
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  );
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadLatest() {
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

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Domänen-Steckbrief Scorecard
          </h1>
          <p className="text-sm text-gray-600">
            Brief + Überleitungssheet bewerten und Empfehlungen für
            Verbesserungen anzeigen.
          </p>
        </header>

        <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Brief ID
              </label>
              <input
                className="w-full rounded-md border px-2 py-1 text-sm"
                value={briefId}
                onChange={(e) => setBriefId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sheet ID
              </label>
              <input
                className="w-full rounded-md border px-2 py-1 text-sm"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
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
            <p className="text-sm text-gray-500">Bitte warten …</p>
          )}
          {error && (
            <p className="text-sm text-red-600">
              Fehler: {error}
            </p>
          )}
        </section>

        {scorecard && (
          <section className="space-y-6">
            <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
              <h2 className="text-lg font-semibold">
                Gesamtübersicht ({scorecard.theme ?? 'ohne Thema'})
              </h2>
              <p className="text-sm text-gray-700">
                Baseline Ø: {scorecard.sheet_summary.baseline_avg_score_1_5 ?? '–'} ·
                Interview-Adjusted Ø:{' '}
                {scorecard.sheet_summary.interview_adjusted_avg_score_1_5 ?? '–'} ·
                Finales Level:{' '}
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
'use client';

import { ScorecardResponse } from '../scorecardApi';

type ScorecardSectionProps = {
  scorecard: ScorecardResponse | null;
};

export function ScorecardSection({ scorecard }: ScorecardSectionProps) {
  if (!scorecard) return null;

  return (
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
  );
}
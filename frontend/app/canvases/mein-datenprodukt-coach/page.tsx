'use client';

import { useEffect, useMemo, useState } from 'react';
import { CoachStage } from '../../components/canvas/CoachStage';
import { ProgressHeader } from '../../components/canvas/ProgressHeader';
import { QuestLog } from '../../components/canvas/QuestLog';
import { useCanvasCoachRun } from '../../hooks/useCanvasCoachRun';
import { CoachAvatarState } from '../../components/canvas/CoachAvatar';

export default function MeinDatenproduktCoachPage() {
  const {
    sheetId,
    sheet,
    activeFields,
    currentField,
    currentIndex,
    currentValue,
    savedCount,
    progress,
    canProceed,
    badges,
    answersByFieldCode,
    loadingTemplate,
    loadingRun,
    saving,
    feedbackLoading,
    error,
    username,
    setUsername,
    setCurrentValue,
    saveCurrentField,
    requestFeedback,
    next,
    prev,
    jumpToField,
    reload,
  } = useCanvasCoachRun();

  const [avatarState, setAvatarState] = useState<CoachAvatarState>('idle');
  const [lastSaveAt, setLastSaveAt] = useState<number | null>(null);

  useEffect(() => {
    if (feedbackLoading) {
      setAvatarState('thinking');
      return;
    }
    if (lastSaveAt && Date.now() - lastSaveAt < 1400) {
      setAvatarState('happy');
      return;
    }
    setAvatarState('idle');
  }, [feedbackLoading, lastSaveAt]);

  const questTitle = useMemo(() => {
    if (!currentField) return 'Quest';
    return `Quest ${currentIndex + 1}: ${currentField.question}`;
  }, [currentField, currentIndex]);

  if (!sheetId) {
    return (
      <main className="min-h-screen bg-slate-50 text-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl border bg-white p-6 shadow">
            <h1 className="text-2xl font-semibold">Mein Datenprodukt (Coach)</h1>
            <p className="mt-2 text-sm text-red-600">
              Env fehlt: NEXT_PUBLIC_CANVAS_MEIN_DATENPRODUKT_SHEET_ID
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-white text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Gamification Canvas
            </div>
            <h1 className="text-3xl font-semibold">
              Mein Datenprodukt (Coach)
            </h1>
            <p className="text-sm text-gray-600">
              {sheet?.theme_target_description ??
                'Coach-Quest für dein Datenprodukt.'}
            </p>
          </div>
          <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Benutzername</div>
            <div className="flex items-center gap-2">
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                type="button"
                onClick={reload}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Run laden
              </button>
            </div>
          </div>
        </div>

        <ProgressHeader
          level={currentIndex + 1}
          xp={savedCount * 100}
          progress={progress}
          badges={badges}
        />

        {(loadingTemplate || loadingRun) && (
          <div className="text-sm text-gray-500">
            Canvas wird geladen …
          </div>
        )}

        {!loadingTemplate && !currentField && (
          <div className="text-sm text-gray-500">
            Keine aktiven Felder gefunden.
          </div>
        )}

        {currentField && (
          <CoachStage
            avatarState={avatarState}
            questTitle={questTitle}
            field={currentField}
            value={currentValue}
            hints={currentField.checkpoints ?? []}
            feedback={answersByFieldCode[currentField.code]?.llm_feedback ?? null}
            saving={saving}
            feedbackLoading={feedbackLoading}
            canProceed={canProceed}
            onChange={setCurrentValue}
            onSave={async () => {
              await saveCurrentField();
              setLastSaveAt(Date.now());
            }}
            onFeedback={async () => {
              await requestFeedback();
            }}
            onPrev={prev}
            onNext={next}
            onNextBlocked={() => {
              setAvatarState('confused');
              setTimeout(() => setAvatarState('idle'), 1200);
            }}
            stepIndex={currentIndex}
            totalSteps={activeFields.length}
          />
        )}

        <QuestLog
          fields={activeFields}
          currentIndex={currentIndex}
          answersByFieldCode={answersByFieldCode}
          onSelect={jumpToField}
        />

        {error && <p className="text-sm text-red-600">Fehler: {error}</p>}
      </div>
    </main>
  );
}

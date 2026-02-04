'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CoachAvatar, CoachAvatarState } from './CoachAvatar';
import { CoachBubble } from './CoachBubble';
import { TipCards } from './TipCards';
import { CanvasField } from '../../scorecardApi';

type CoachStageProps = {
  avatarState: CoachAvatarState;
  questTitle: string;
  field: CanvasField;
  value: string;
  hints: string[];
  feedback?: { suggestions?: string[]; questions?: string[] } | null;
  saving: boolean;
  feedbackLoading: boolean;
  canProceed: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onFeedback: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNextBlocked: () => void;
  stepIndex: number;
  totalSteps: number;
};

export function CoachStage({
  avatarState,
  questTitle,
  field,
  value,
  hints,
  feedback,
  saving,
  feedbackLoading,
  canProceed,
  onChange,
  onSave,
  onFeedback,
  onPrev,
  onNext,
  onNextBlocked,
  stepIndex,
  totalSteps,
}: CoachStageProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col items-center justify-start">
        <CoachAvatar state={avatarState} />
        <div className="mt-3 rounded-full border px-3 py-1 text-[11px] text-gray-500 bg-white/80">
          Coach-Status: {avatarState}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Quest {stepIndex + 1} / {totalSteps}
          </span>
          <span className="font-mono">{field.code}</span>
        </div>

        <CoachBubble
          questTitle={questTitle}
          question={field.question}
          feedback={feedback}
        />

        <TipCards hints={hints} />

        <div className="rounded-2xl border bg-white/90 p-4 shadow-sm">
          <label className="text-xs font-semibold text-gray-600">
            Deine Antwort
          </label>
          <textarea
            ref={textareaRef}
            className="mt-2 w-full resize-none rounded-xl border bg-white px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-200"
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Schreibe deine Antwort – gerne in ganzen Sätzen."
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Speichern …' : 'Speichern'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 bg-amber-50"
              onClick={onFeedback}
              disabled={feedbackLoading}
            >
              {feedbackLoading ? 'Coach denkt …' : 'Coach-Boost'}
            </motion.button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full border px-4 py-2 text-sm text-gray-700 bg-white"
            onClick={onPrev}
            disabled={stepIndex === 0}
          >
            Zurück
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full border px-4 py-2 text-sm text-gray-700 bg-white"
            onClick={() => {
              if (!canProceed) {
                onNextBlocked();
                return;
              }
              onNext();
            }}
            disabled={stepIndex >= totalSteps - 1}
          >
            Weiter
          </motion.button>
        </div>
      </div>
    </div>
  );
}

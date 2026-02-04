'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { typewriter } from './typing';

type CoachBubbleProps = {
  questTitle: string;
  question: string;
  feedback?: {
    suggestions?: string[];
    questions?: string[];
  } | null;
};

export function CoachBubble({ questTitle, question, feedback }: CoachBubbleProps) {
  const fullText = useMemo(
    () => `${questTitle}\n\n${question}`,
    [questTitle, question],
  );

  const [displayText, setDisplayText] = useState(fullText);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setIsTyping(true);
    const stop = typewriter(fullText, (val) => {
      setDisplayText(val);
      if (val.length >= fullText.length) {
        setIsTyping(false);
      }
    });
    return () => stop();
  }, [fullText]);

  function handleSkip() {
    setIsTyping(false);
    setDisplayText(fullText);
  }

  return (
    <motion.div
      className="relative rounded-3xl border bg-white/90 p-5 shadow-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={isTyping ? handleSkip : undefined}
    >
      <div className="absolute -left-3 top-8 h-6 w-6 rotate-45 border-l border-b bg-white/90" />
      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
        {displayText}
      </pre>

      {feedback && (feedback.suggestions?.length || feedback.questions?.length) ? (
        <div className="mt-4 rounded-2xl border bg-amber-50/70 px-4 py-3 text-xs text-gray-700">
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold text-gray-600">Coach-Tipps</div>
              <ul className="mt-1 list-disc pl-4">
                {feedback.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.questions && feedback.questions.length > 0 && (
            <div>
              <div className="font-semibold text-gray-600">Rückfragen</div>
              <ul className="mt-1 list-disc pl-4">
                {feedback.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type TipCardsProps = {
  hints: string[];
};

export function TipCards({ hints }: TipCardsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!hints || hints.length === 0) return null;

  return (
    <div className="space-y-2">
      {hints.map((hint, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl border bg-white/70 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
            >
              <span className="font-medium text-gray-700">
                Tipp {idx + 1}
              </span>
              <span className="text-xs text-gray-400">
                {isOpen ? 'einklappen' : 'ausklappen'}
              </span>
            </button>
            <motion.div
              initial={false}
              animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              className="overflow-hidden px-4"
            >
              <p className="pb-4 text-xs text-gray-600">{hint}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

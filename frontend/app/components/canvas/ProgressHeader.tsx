'use client';

import { motion } from 'framer-motion';

type ProgressHeaderProps = {
  level: number;
  xp: number;
  progress: number;
  badges: {
    firstSave: boolean;
    consistency: boolean;
    lineage: boolean;
  };
};

export function ProgressHeader({ level, xp, progress, badges }: ProgressHeaderProps) {
  return (
    <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Level {level}
          </div>
          <div className="text-lg font-semibold text-gray-900">XP: {xp}</div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[11px] text-gray-500 mb-1">Fortschritt</div>
          <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className="flex gap-2 text-[11px]">
          <Badge active={badges.firstSave} label="First Save" />
          <Badge active={badges.consistency} label="Consistency" />
          <Badge active={badges.lineage} label="Lineage" />
        </div>
      </div>
    </div>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={[
        'rounded-full border px-2 py-1',
        active
          ? 'border-amber-400 bg-amber-100 text-amber-900'
          : 'border-gray-200 bg-gray-50 text-gray-400',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

'use client';

import { CanvasField, CanvasFieldAnswer } from '../../scorecardApi';

type QuestLogProps = {
  fields: CanvasField[];
  currentIndex: number;
  answersByFieldCode: Record<string, CanvasFieldAnswer>;
  onSelect: (code: string) => void;
};

export function QuestLog({
  fields,
  currentIndex,
  answersByFieldCode,
  onSelect,
}: QuestLogProps) {
  return (
    <div className="rounded-2xl border bg-white/90 p-4 shadow-sm">
      <div className="text-xs font-semibold text-gray-600 mb-3">Quest Log</div>
      <ul className="space-y-2 text-sm">
        {fields.map((f, idx) => {
          const saved = (answersByFieldCode[f.code]?.value ?? '').trim().length > 0;
          const isActive = idx === currentIndex;
          const status = saved ? 'done' : isActive ? 'active' : 'todo';
          return (
            <li
              key={f.code}
              className={[
                'flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer',
                status === 'done'
                  ? 'border-amber-200 bg-amber-50'
                  : status === 'active'
                  ? 'border-gray-400 bg-white'
                  : 'border-gray-100 bg-gray-50',
              ].join(' ')}
              onClick={() => onSelect(f.code)}
            >
              <span className="text-xs text-gray-500 mr-2">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm text-gray-700">
                {f.question}
              </span>
              <span
                className={[
                  'text-[11px] uppercase tracking-wide',
                  status === 'done'
                    ? 'text-amber-700'
                    : status === 'active'
                    ? 'text-gray-700'
                    : 'text-gray-400',
                ].join(' ')}
              >
                {status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

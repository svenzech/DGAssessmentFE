'use client';

import { BriefDetail } from '../scorecardApi';

type BriefEditorProps = {
  open: boolean;
  brief: BriefDetail | null;
  saving: boolean;
  onChange: (patch: Partial<BriefDetail>) => void;
  onSave: () => void;
  onClose: () => void;
};

export function BriefEditor({
  open,
  brief,
  saving,
  onChange,
  onSave,
  onClose,
}: BriefEditorProps) {
  if (!open || !brief) return null;

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">
          Steckbrief bearbeiten
        </h2>
        <button
          className="text-xs text-gray-500 hover:underline"
          onClick={onClose}
        >
          Schließen
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <div>
          <div className="font-medium text-gray-600">ID</div>
          <div className="font-mono text-gray-800 break-all">
            {brief.id}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Domäne</div>
          <div className="font-mono text-gray-800 break-all">
            {brief.domain_id ?? '–'}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Erstellt</div>
          <div className="font-mono text-gray-800">
            {brief.created_at}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Zuletzt aktualisiert</div>
          <div className="font-mono text-gray-800">
            {brief.updated_at ?? '–'}
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
            value={brief.title ?? ''}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Status
          </label>
          <input
            className="w-full rounded-md border px-2 py-1 text-sm"
            value={brief.status ?? ''}
            onChange={(e) => onChange({ status: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Version
          </label>
          <input
            type="number"
            className="w-full rounded-md border px-2 py-1 text-sm"
            value={brief.version ?? ''}
            onChange={(e) =>
              onChange({
                version:
                  e.target.value === '' ? null : Number(e.target.value),
              })
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
          value={brief.raw_markdown}
          onChange={(e) => onChange({ raw_markdown: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-60"
        >
          Änderungen speichern
        </button>
        <button
          onClick={onClose}
          className="rounded-md border px-3 py-1 text-sm"
        >
          Abbrechen
        </button>
      </div>
    </section>
  );
}
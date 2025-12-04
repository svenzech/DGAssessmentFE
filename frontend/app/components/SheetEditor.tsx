'use client';

import { SheetDetail, SheetQuestion } from '../scorecardApi';

type SheetEditorProps = {
  open: boolean;
  sheet: SheetDetail | null;
  questions: SheetQuestion[];
  loadingQuestions: boolean;
  saving: boolean;
  onSheetChange: (patch: Partial<SheetDetail>) => void;
  onQuestionChange: (index: number, patch: Partial<SheetQuestion>) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;   // NEU
};

export function SheetEditor({
  open,
  sheet,
  questions,
  loadingQuestions,
  saving,
  onSheetChange,
  onQuestionChange,
  onAddQuestion,
  onDeleteQuestion,
  onSave,
  onClose,
  onDelete,
}: SheetEditorProps) {
  if (!open || !sheet) return null;

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
      
      {/* Kopfzeile */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Überleitungssheet bearbeiten
        </h2>
      </div>

      {/* Aktionen: Abbrechen / Speichern / Löschen */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
        >
          Abbrechen
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
        >
          Speichern
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="rounded-md border px-3 py-1 text-sm text-red-700 border-red-400 hover:bg-red-50 disabled:opacity-60"
        >
          Löschen
        </button>
      </div>

      {/* Meta-Infos */}
      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <div>
          <div className="font-medium text-gray-600">ID</div>
          <div className="font-mono text-gray-800 break-all">
            {sheet.id}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Erstellt</div>
          <div className="font-mono text-gray-800">
            {sheet.created_at}
          </div>
        </div>
      </div>

      {/* Sheet-Stammdaten */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Name
          </label>
          <input
            className="w-full rounded-md border px-2 py-1 text-sm"
            value={sheet.name ?? ''}
            onChange={(e) => onSheetChange({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Theme
          </label>
          <input
            className="w-full rounded-md border px-2 py-1 text-sm"
            value={sheet.theme ?? ''}
            onChange={(e) => onSheetChange({ theme: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Status
          </label>
          <input
            className="w-full rounded-md border px-2 py-1 text-sm"
            value={sheet.status ?? ''}
            onChange={(e) => onSheetChange({ status: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Version
          </label>
          <input
            type="number"
            className="w-full rounded-md border px-2 py-1 text-sm"
            value={sheet.version ?? ''}
            onChange={(e) =>
              onSheetChange({
                version:
                  e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Fragen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">
            Fragen zum Überleitungssheet
          </h3>
          <button
            type="button"
            onClick={onAddQuestion}
            className="rounded-md border px-2 py-1 text-xs"
          >
            Frage hinzufügen
          </button>
        </div>

        {loadingQuestions ? (
          <p className="text-xs text-gray-500">Lade Fragen …</p>
        ) : questions.length === 0 ? (
          <p className="text-xs text-gray-500">
            Noch keine Fragen vorhanden. Fügen Sie eine neue Frage hinzu.
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {questions.map((q, index) => (
              <div
                key={q.id ?? `new-${index}`}
                className="rounded-md border px-3 py-2 text-xs space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-gray-500">#{index + 1}</span>
                    <label className="flex items-center gap-1 text-[11px] text-gray-600">
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        checked={q.active ?? true}
                        onChange={(e) =>
                          onQuestionChange(index, { active: e.target.checked })
                        }
                      />
                      aktiv
                    </label>
                  </div>

                  <button
                    type="button"
                    className="text-[11px] text-red-600 hover:underline"
                    onClick={() => onDeleteQuestion(index)}
                  >
                    Löschen
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Code
                    </label>
                    <input
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      value={q.code}
                      onChange={(e) =>
                        onQuestionChange(index, { code: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Order Index
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border px-2 py-1 text-xs"
                      value={q.order_index}
                      onChange={(e) =>
                        onQuestionChange(index, {
                          order_index:
                            e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Frage
                  </label>
                  <textarea
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    value={q.question}
                    onChange={(e) =>
                      onQuestionChange(index, { question: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Checkpoints (eine Zeile pro Punkt)
                  </label>
                  <textarea
                    className="w-full rounded-md border px-2 py-1 text-xs font-mono"
                    value={(q.checkpoints ?? []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value
                        .split('\n')
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      onQuestionChange(index, { checkpoints: lines });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
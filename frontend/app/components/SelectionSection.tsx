'use client';

import {
  BriefListItem,
  SheetListItem,
} from '../scorecardApi';

type SelectionSectionProps = {
  briefs: BriefListItem[];
  sheets: SheetListItem[];
  briefId: string | null;
  sheetId: string | null;
  selectedBrief: BriefListItem | null;
  selectedSheet: SheetListItem | null;
  initialLoading: boolean;
  loading: boolean;
  error: string | null;

  // Upload
  uploading: boolean;
  uploadWarnings: string[];
  selectedFileName: string | null;

  // Aktionen
  onSelectBrief: (id: string) => void;
  onSelectSheet: (id: string) => void;
  onLoadLatest: () => void;
  onEvaluate: () => void;
  onOpenBriefEditor: () => void;
  onOpenSheetEditor: () => void;
  onDeleteBrief: () => void;
  onDeleteSheet: () => void;

  onFileChange: (file: File | null) => void;
  onUpload: () => void;
};

export function SelectionSection({
  briefs,
  sheets,
  briefId,
  sheetId,
  selectedBrief,
  selectedSheet,
  initialLoading,
  loading,
  error,
  uploading,
  uploadWarnings,
  selectedFileName,
  onSelectBrief,
  onSelectSheet,
  onLoadLatest,
  onEvaluate,
  onOpenBriefEditor,
  onOpenSheetEditor,
  onDeleteBrief,
  onDeleteSheet,
  onFileChange,
  onUpload,
}: SelectionSectionProps) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">
        Auswahl Steckbrief und Überleitungssheet
      </h2>

      {initialLoading && (
        <p className="text-sm text-gray-500">Lade Steckbriefe und Sheets …</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Steckbriefe-Liste */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">
              Steckbriefe
            </span>
            <span className="text-[10px] text-gray-400">
              {briefs.length} Einträge
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border bg-gray-50">
            {briefs.length === 0 ? (
              <p className="p-2 text-xs text-gray-500">
                Noch keine Steckbriefe vorhanden.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {briefs.map((b) => {
                  const isSelected = b.id === briefId;
                  return (
                    <li
                      key={b.id}
                      className={[
                        'cursor-pointer px-3 py-2',
                        isSelected
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : 'hover:bg-gray-100',
                      ].join(' ')}
                      onClick={() => onSelectBrief(b.id)}
                    >
                      <div className="font-medium">
                        {b.title || 'Ohne Titel'}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>Version {b.version ?? '–'}</span>
                        <span>Status: {b.status ?? '–'}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Sheets-Liste */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">
              Überleitungssheets
            </span>
            <span className="text-[10px] text-gray-400">
              {sheets.length} Einträge
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border bg-gray-50">
            {sheets.length === 0 ? (
              <p className="p-2 text-xs text-gray-500">
                Noch keine Überleitungssheets vorhanden.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {sheets.map((s) => {
                  const isSelected = s.id === sheetId;
                  return (
                    <li
                      key={s.id}
                      className={[
                        'cursor-pointer px-3 py-2',
                        isSelected
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : 'hover:bg-gray-100',
                      ].join(' ')}
                      onClick={() => onSelectSheet(s.id)}
                    >
                      <div className="font-medium">
                        {s.name || 'Ohne Name'}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>Theme: {s.theme ?? '–'}</span>
                        <span>Version {s.version ?? '–'}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Upload-Bereich */}
      <div className="mt-4 border-t pt-3 space-y-2">
        <div className="text-xs font-medium text-gray-600">
          Datei hochladen (Steckbrief oder Überleitungssheet)
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="file"
            onChange={(e) =>
              onFileChange(e.target.files?.[0] ?? null)
            }
            className="text-xs"
          />
          <button
            onClick={onUpload}
            disabled={!selectedFileName || uploading}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
          >
            {uploading ? 'Wird hochgeladen …' : 'Datei hochladen'}
          </button>
          {selectedFileName && !uploading && (
            <span className="text-[10px] text-gray-500">
              Ausgewählt: {selectedFileName}
            </span>
          )}
        </div>
        {uploadWarnings.length > 0 && (
          <ul className="text-[10px] text-amber-700 list-disc pl-5">
            {uploadWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Auswahl-Info + Aktionen */}
      <div className="flex flex-col gap-2 text-xs text-gray-600 mt-4">
        <div>
          Ausgewählter Steckbrief:{' '}
          <span className="font-mono">
            {selectedBrief
              ? `${selectedBrief.title ?? 'Ohne Titel'} (${selectedBrief.id})`
              : '–'}
          </span>
        </div>
        <div>
          Ausgewähltes Sheet:{' '}
          <span className="font-mono">
            {selectedSheet
              ? `${selectedSheet.name ?? 'Ohne Name'} (${selectedSheet.id})`
              : '–'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-3">
        <button
          onClick={onLoadLatest}
          disabled={loading}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
        >
          Letzte Auswertung laden
        </button>
        <button
          onClick={onEvaluate}
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
        >
          Neu auswerten
        </button>
        <button
          onClick={onOpenBriefEditor}
          disabled={!briefId}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
        >
          Steckbrief bearbeiten
        </button>
        <button
          onClick={onOpenSheetEditor}
          disabled={!sheetId}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
        >
          Überleitungssheet bearbeiten
        </button>
        <button
          onClick={onDeleteBrief}
          disabled={!briefId}
          className="rounded-md border px-3 py-1 text-sm text-red-700 border-red-400 disabled:opacity-60"
        >
          Steckbrief löschen
        </button>
        <button
          onClick={onDeleteSheet}
          disabled={!sheetId}
          className="rounded-md border px-3 py-1 text-sm text-red-700 border-red-400 disabled:opacity-60"
        >
          Überleitungssheet löschen
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mt-2">Bitte warten …</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-2">
          Fehler: {error}
        </p>
      )}
    </section>
  );
}
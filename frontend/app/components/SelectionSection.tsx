'use client';

import { useEffect, useMemo, useState } from 'react';
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

  hasScorecard: boolean;

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

type BriefGroup = {
  key: string;              // Gruppenschlüssel (z. B. Titel)
  latest: BriefListItem;    // neueste Version
  older: BriefListItem[];   // ältere Versionen (absteigend sortiert)
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
  hasScorecard,
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
  // Welcher „Haupt“-Steckbrief ist aufgeklappt, um ältere Versionen zu zeigen?
  const [expandedLatestBriefId, setExpandedLatestBriefId] = useState<string | null>(null);

  // Steckbriefe nach Titel gruppieren, innerhalb der Gruppe nach Version absteigend sortieren
  const briefGroups: BriefGroup[] = useMemo(() => {
    if (!briefs || briefs.length === 0) return [];

    const map = new Map<string, BriefListItem[]>();

    for (const b of briefs) {
      const key = (b.title || 'Ohne Titel').trim();
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }

    const groups: BriefGroup[] = [];
    for (const [key, list] of map.entries()) {
      const sorted = [...list].sort((a, b) => {
        const va = typeof a.version === 'number' ? a.version : 0;
        const vb = typeof b.version === 'number' ? b.version : 0;
        // neueste Version zuerst
        return vb - va;
      });

      const [latest, ...older] = sorted;
      groups.push({ key, latest, older });
    }

    // Sortierung der Gruppen nach Titel (oder ggf. nach created_at von latest, je nach Geschmack)
    groups.sort((a, b) => a.key.localeCompare(b.key));

    return groups;
  }, [briefs]);

  // Wenn sich briefId ändert (z. B. von außen gesetzt), passende Gruppe aufklappen
  useEffect(() => {
    if (!briefId) {
      // nichts ausgewählt -> keine Versionen aufklappen
      setExpandedLatestBriefId(null);
      return;
    }

    const group = briefGroups.find(
      (g) =>
        g.latest.id === briefId ||
        g.older.some((o) => o.id === briefId),
    );

    if (group) {
      setExpandedLatestBriefId(group.latest.id);
    }
  }, [briefId, briefGroups]);

  function handleBriefClick(clickedId: string) {
    // passende Gruppe ermitteln und aufklappen
    const group = briefGroups.find(
      (g) =>
        g.latest.id === clickedId ||
        g.older.some((o) => o.id === clickedId),
    );

    if (group) {
      setExpandedLatestBriefId(group.latest.id);
    }

    onSelectBrief(clickedId);
  }

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
              {briefs.length} Einträge (inkl. Versionen)
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border bg-gray-50">
            {briefGroups.length === 0 ? (
              <p className="p-2 text-xs text-gray-500">
                Noch keine Steckbriefe vorhanden.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {briefGroups.map((group) => {
                  const { latest, older } = group;
                  const isGroupExpanded = expandedLatestBriefId === latest.id;

                  const isLatestSelected = briefId === latest.id;
                  const selectedOlderId =
                    older.find((o) => o.id === briefId)?.id ?? null;

                  return (
                    <li key={latest.id} className="px-0 py-0">
                      {/* neueste Version */}
                      <div
                        className={[
                          'cursor-pointer px-3 py-2',
                          isLatestSelected
                            ? 'bg-blue-50 border-l-2 border-blue-500'
                            : 'hover:bg-gray-100',
                        ].join(' ')}
                        onClick={() => handleBriefClick(latest.id)}
                      >
                        <div className="font-medium">
                          {latest.title || 'Ohne Titel'}
                        </div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>Version {latest.version ?? '–'} (neueste)</span>
                          <span>Status: {latest.status ?? '–'}</span>
                        </div>
                      </div>

                      {/* ältere Versionen dieses Steckbriefs */}
                      {isGroupExpanded && older.length > 0 && (
                        <ul className="border-t border-gray-100 bg-gray-50">
                          {older.map((b) => {
                            const isSelected = b.id === selectedOlderId;
                            return (
                              <li
                                key={b.id}
                                className={[
                                  'cursor-pointer px-5 py-1.5 text-sm',
                                  isSelected
                                    ? 'bg-blue-50 border-l-2 border-blue-400'
                                    : 'hover:bg-gray-100',
                                ].join(' ')}
                                onClick={() => handleBriefClick(b.id)}
                              >
                                <div className="flex justify-between items-baseline">
                                  <span className="text-xs text-gray-700">
                                    Version {b.version ?? '–'}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Status: {b.status ?? '–'}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
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

  {hasScorecard && (
    <button
      onClick={onLoadLatest}
      disabled={loading}
      className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
    >
      Letzte Auswertung laden
    </button>
  )}

  {briefId && sheetId && (
    <button
      onClick={onEvaluate}
      disabled={loading}
      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
    >
      Neu auswerten
    </button>
  )}

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
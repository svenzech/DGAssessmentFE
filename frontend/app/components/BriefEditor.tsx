'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BriefDetail, Domain } from '../scorecardApi';

type BriefEditorProps = {
  open: boolean;
  brief: BriefDetail | null;
  saving: boolean;
  domains: Domain[];
  /** ID der Fallback-Domäne "Unbekannt" (optional, wird sonst heuristisch ermittelt) */
  fallbackDomainId?: string | null;
  onChange: (patch: Partial<BriefDetail>) => void;
  onSave: () => void;
  onClose: () => void;

  // Domain-CRUD kommt aus page.tsx
  onCreateDomain: (name: string, description: string) => Promise<void> | void;
  onUpdateDomain: (id: string, name: string, description: string) => Promise<void> | void;
  onDeleteDomain: (id: string) => Promise<void> | void;
};

export function BriefEditor(props: BriefEditorProps) {
  const {
    open,
    brief,
    saving,
    domains,
    fallbackDomainId,
    onChange,
    onSave,
    onClose,
    onCreateDomain,
    onUpdateDomain,
    onDeleteDomain,
  } = props;

  const [domainPanelOpen, setDomainPanelOpen] = useState(false);
  const [domainMode, setDomainMode] = useState<'edit' | 'create'>('edit');
  const [domainName, setDomainName] = useState('');
  const [domainDescription, setDomainDescription] = useState('');
  const [domainBusy, setDomainBusy] = useState(false);

  const effectiveFallbackDomainId = useMemo(() => {
    if (fallbackDomainId) return fallbackDomainId;
    const unk = domains.find(
      (d) => d.name.trim().toLowerCase() === 'unbekannt',
    );
    return unk?.id ?? null;
  }, [fallbackDomainId, domains]);

  const currentDomain = useMemo(() => {
    if (!brief?.domain_id) return null;
    return domains.find((d) => d.id === brief.domain_id) ?? null;
  }, [brief?.domain_id, domains]);

  const isFallbackDomain =
    !!currentDomain && currentDomain.id === effectiveFallbackDomainId;

  // Domain-Panel-Form mit aktueller Domäne synchronisieren
  useEffect(() => {
    if (!domainPanelOpen) return;

    if (domainMode === 'edit' && currentDomain) {
      setDomainName(currentDomain.name);
      setDomainDescription(currentDomain.description ?? '');
    } else if (domainMode === 'create') {
      setDomainName('');
      setDomainDescription('');
    }
  }, [domainPanelOpen, domainMode, currentDomain]);

  if (!open || !brief) {
    return null;
  }

  async function handleDomainSave() {
    if (domainMode === 'create') {
      if (!domainName.trim()) {
        return;
      }
      setDomainBusy(true);
      try {
        await onCreateDomain(domainName.trim(), domainDescription.trim());
        setDomainPanelOpen(false);
      } finally {
        setDomainBusy(false);
      }
      return;
    }

    if (!currentDomain) return;
    if (isFallbackDomain) {
      // Fallback-Domäne bleibt unveränderbar
      setDomainPanelOpen(false);
      return;
    }

    setDomainBusy(true);
    try {
      await onUpdateDomain(
        currentDomain.id,
        domainName.trim(),
        domainDescription.trim(),
      );
      setDomainPanelOpen(false);
    } finally {
      setDomainBusy(false);
    }
  }

  async function handleDomainDelete() {
    if (!currentDomain) return;
    if (isFallbackDomain) return;

    if (
      !window.confirm(
        `Domäne "${currentDomain.name}" wirklich löschen?`,
      )
    ) {
      return;
    }

    setDomainBusy(true);
    try {
      await onDeleteDomain(currentDomain.id);
      // Brief bleibt zunächst auf der alten domain_id; das kannst Du später
      // noch automatisiert umziehen, falls gewünscht.
      setDomainPanelOpen(false);
    } finally {
      setDomainBusy(false);
    }
  }

  function handleDomainSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDomainId = e.target.value || null;
    onChange({ domain_id: newDomainId });

    // Domain-Subscreen automatisch schließen
    setDomainPanelOpen(false);
  }

  function openDomainPanelForEdit() {
    setDomainMode('edit');
    setDomainPanelOpen(true);
  }

  function openDomainPanelForCreate() {
    setDomainMode('create');
    setDomainPanelOpen(true);
  }

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

      {/* Meta-Infos */}
      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <div>
          <div className="font-medium text-gray-600">ID</div>
          <div className="font-mono text-gray-800 break-all">{brief.id}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Domäne (ID)</div>
          <div className="font-mono text-gray-800 break-all">
            {brief.domain_id ?? '–'}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Erstellt</div>
          <div className="font-mono text-gray-800">{brief.created_at}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Zuletzt aktualisiert</div>
          <div className="font-mono text-gray-800">
            {brief.updated_at ?? '–'}
          </div>
        </div>
      </div>

      {/* Stammdaten */}
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
            className="w-full rounded-md border px-2 py-1 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            value={brief.version ?? ''}
            readOnly
          />
          <p className="mt-1 text-[10px] text-gray-500">
            Version wird automatisch vom System vergeben.
          </p>
        </div>

        {/* Domänenwahl */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Domäne
          </label>
          <div className="flex gap-2 items-center">
            <select
              className="flex-1 rounded-md border px-2 py-1 text-sm"
              value={brief.domain_id ?? ''}
              onChange={handleDomainSelectChange}
            >
              {/* kein expliziter "-- keine Domäne --" Eintrag */}
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md border px-2 py-1 text-[11px]"
              onClick={openDomainPanelForEdit}
              disabled={!brief.domain_id}
            >
              Bearbeiten
            </button>
            <button
              type="button"
              className="rounded-md border px-2 py-1 text-[11px]"
              onClick={openDomainPanelForCreate}
            >
              Neu
            </button>
          </div>
          {isFallbackDomain && (
            <p className="mt-1 text-[10px] text-gray-500">
              Fallback-Domäne „Unbekannt“ – nicht editier- oder löschbar.
            </p>
          )}
        </div>
      </div>

      {/* Domain-Subscreen */}
      {domainPanelOpen && (
        <div className="mt-3 rounded-md border px-3 py-2 bg-gray-50 space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-xs font-semibold text-gray-700">
              {domainMode === 'create'
                ? 'Neue Domäne anlegen'
                : 'Domäne bearbeiten'}
            </div>
            <button
              type="button"
              className="text-[11px] text-gray-500 hover:underline"
              onClick={() => setDomainPanelOpen(false)}
            >
              Schließen
            </button>
          </div>

          {domainMode === 'edit' && !currentDomain && (
            <p className="text-[11px] text-gray-500">
              Keine Domäne ausgewählt.
            </p>
          )}

          <div className="grid gap-2 md:grid-cols-2 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Name
              </label>
              <input
                className="w-full rounded-md border px-2 py-1 text-xs"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                disabled={domainBusy || (domainMode === 'edit' && isFallbackDomain)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Beschreibung (optional)
              </label>
              <input
                className="w-full rounded-md border px-2 py-1 text-xs"
                value={domainDescription}
                onChange={(e) => setDomainDescription(e.target.value)}
                disabled={domainBusy || (domainMode === 'edit' && isFallbackDomain)}
              />
            </div>
          </div>

          {domainMode === 'edit' && isFallbackDomain && (
            <p className="text-[11px] text-gray-500">
              Die Fallback-Domäne „Unbekannt“ kann nicht geändert oder gelöscht
              werden.
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleDomainSave}
              disabled={
                domainBusy ||
                !domainName.trim() ||
                (domainMode === 'edit' && isFallbackDomain)
              }
              className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-60"
            >
              {domainMode === 'create' ? 'Domäne anlegen' : 'Änderungen speichern'}
            </button>

            {domainMode === 'edit' && !isFallbackDomain && currentDomain && (
              <button
                type="button"
                onClick={handleDomainDelete}
                disabled={domainBusy}
                className="rounded-md border px-3 py-1 text-xs text-red-700 border-red-400 disabled:opacity-60"
              >
                Domäne löschen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Markdown-Feld */}
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
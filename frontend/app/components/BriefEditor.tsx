import React, { useState } from 'react';
import { BriefDetail, Domain } from '../scorecardApi';

type BriefEditorProps = {
  open: boolean;
  brief: BriefDetail | null;
  saving: boolean;
  domains: Domain[];
  savingDomain: boolean;
  onChange: (patch: Partial<BriefDetail>) => void;
  onSave: () => void;
  onClose: () => void;
  onCreateDomain: (name: string, description: string) => Promise<void> | void;
  onUpdateDomain: (
    domainId: string,
    name: string,
    description: string,
  ) => Promise<void> | void;
  onDeleteDomain: (domainId: string) => Promise<void> | void;
};

type DomainDraft = {
  id?: string;
  name: string;
  description: string;
};

export const BriefEditor: React.FC<BriefEditorProps> = ({
  open,
  brief,
  saving,
  domains,
  savingDomain,
  onChange,
  onSave,
  onClose,
  onCreateDomain,
  onUpdateDomain,
  onDeleteDomain,
}) => {
  const [domainEditorOpen, setDomainEditorOpen] = useState(false);
  const [domainDraft, setDomainDraft] = useState<DomainDraft | null>(null);

  if (!open || !brief) return null;

  const currentDomain =
    brief.domain_id ? domains.find((d) => d.id === brief.domain_id) : null;

  function openNewDomainEditor() {
    setDomainDraft({
      id: undefined,
      name: '',
      description: '',
    });
    setDomainEditorOpen(true);
  }

  function openExistingDomainEditor() {
    if (!currentDomain) return;
    setDomainDraft({
      id: currentDomain.id,
      name: currentDomain.name ?? '',
      description: currentDomain.description ?? '',
    });
    setDomainEditorOpen(true);
  }

  async function handleSaveDomain() {
    if (!domainDraft) return;
    const name = domainDraft.name.trim();
    const description = domainDraft.description.trim();

    if (!name) {
      // minimale Validierung; Fehlermeldung wird im Hauptscreen angezeigt (error-Status)
      alert('Domänenname darf nicht leer sein.');
      return;
    }

    if (!domainDraft.id) {
      await onCreateDomain(name, description);
    } else {
      await onUpdateDomain(domainDraft.id, name, description);
    }

    setDomainEditorOpen(false);
    setDomainDraft(null);
  }

  async function handleDeleteDomainClick() {
    if (!domainDraft?.id) return;
    await onDeleteDomain(domainDraft.id);
    setDomainEditorOpen(false);
    setDomainDraft(null);
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

      {/* Meta-Infos: ID, Version, Timestamps (read-only) */}
      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <div>
          <div className="font-medium text-gray-600">ID</div>
          <div className="font-mono text-gray-800 break-all">{brief.id}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600">Version</div>
          <div className="font-mono text-gray-800">
            {brief.version ?? '–'}
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

      {/* Bearbeitbare Felder */}
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

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Domäne
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="flex-1 rounded-md border px-2 py-1 text-sm min-w-[160px]"
              value={brief.domain_id ?? ''}
              onChange={(e) =>
                onChange({ domain_id: e.target.value || null })
              }
            >
              <option value="">– Keine Domäne –</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-md border px-2 py-1 text-xs"
              onClick={openNewDomainEditor}
            >
              Neue Domäne
            </button>
            <button
              type="button"
              disabled={!currentDomain}
              className="rounded-md border px-2 py-1 text-xs disabled:opacity-60"
              onClick={openExistingDomainEditor}
            >
              Ausgewählte Domäne bearbeiten
            </button>
          </div>
          {currentDomain && (
            <div className="mt-1 text-[11px] text-gray-500">
              <span className="font-mono">{currentDomain.id}</span>{' '}
              {currentDomain.description
                ? `– ${currentDomain.description}`
                : null}
            </div>
          )}
        </div>
      </div>

      {/* Inline-Domäneneditor */}
      {domainEditorOpen && domainDraft && (
        <div className="mt-4 rounded-md border p-3 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-gray-700">
              {domainDraft.id ? 'Domäne bearbeiten' : 'Neue Domäne anlegen'}
            </div>
            {domainDraft.id && (
              <div className="font-mono text-[10px] text-gray-500 break-all">
                {domainDraft.id}
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Name
              </label>
              <input
                className="w-full rounded-md border px-2 py-1 text-xs"
                value={domainDraft.name}
                onChange={(e) =>
                  setDomainDraft((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Beschreibung (optional)
              </label>
              <textarea
                className="w-full rounded-md border px-2 py-1 text-xs"
                value={domainDraft.description}
                onChange={(e) =>
                  setDomainDraft((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveDomain}
              disabled={savingDomain}
              className="rounded-md bg-green-600 px-3 py-1 text-xs text-white disabled:opacity-60"
            >
              Domäne speichern
            </button>
            {domainDraft.id && (
              <button
                type="button"
                onClick={handleDeleteDomainClick}
                disabled={savingDomain}
                className="rounded-md border px-3 py-1 text-xs text-red-700 border-red-400 disabled:opacity-60"
              >
                Domäne löschen
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDomainEditorOpen(false);
                setDomainDraft(null);
              }}
              className="rounded-md border px-3 py-1 text-xs"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

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
};
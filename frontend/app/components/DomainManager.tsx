'use client';

import { Domain } from '../scorecardApi';
import { useState } from 'react';

type DomainManagerProps = {
  domains: Domain[];
  saving: boolean;
  onCreate: (name: string, description: string) => void;
  onUpdate: (id: string, name: string, description: string) => void;
  onDelete: (id: string) => void;
};

export function DomainManager({
  domains,
  saving,
  onCreate,
  onUpdate,
  onDelete,
}: DomainManagerProps) {
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">
          Domänen verwalten
        </h2>
        {saving && (
          <span className="text-[11px] text-gray-500">
            Speichere …
          </span>
        )}
      </div>

      {/* Neue Domäne */}
      <div className="space-y-2 border-b pb-3">
        <div className="text-xs font-medium text-gray-600">
          Neue Domäne anlegen
        </div>
        <div className="grid gap-2 md:grid-cols-2 text-xs">
          <input
            className="w-full rounded-md border px-2 py-1"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-2 py-1"
            placeholder="Beschreibung (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={!newName.trim() || saving}
          onClick={() => {
            onCreate(newName.trim(), newDescription.trim());
            setNewName('');
            setNewDescription('');
          }}
          className="rounded-md border px-3 py-1 text-xs disabled:opacity-60"
        >
          Domäne anlegen
        </button>
      </div>

      {/* Bestehende Domänen */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">
          Bestehende Domänen
        </div>
        {domains.length === 0 ? (
          <p className="text-xs text-gray-500">
            Noch keine Domänen vorhanden.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {domains.map((d) => (
              <DomainRow
                key={d.id}
                domain={d}
                saving={saving}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type DomainRowProps = {
  domain: Domain;
  saving: boolean;
  onUpdate: (id: string, name: string, description: string) => void;
  onDelete: (id: string) => void;
};

function DomainRow({ domain, saving, onUpdate, onDelete }: DomainRowProps) {
  const [name, setName] = useState(domain.name);
  const [description, setDescription] = useState(domain.description ?? '');

  return (
    <div className="rounded-md border px-3 py-2 text-xs space-y-2">
      <div className="font-mono text-[10px] text-gray-500 break-all">
        {domain.id}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="w-full rounded-md border px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full rounded-md border px-2 py-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibung"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onUpdate(domain.id, name.trim(), description.trim())}
          className="rounded-md border px-2 py-1 text-[11px] disabled:opacity-60"
        >
          Speichern
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onDelete(domain.id)}
          className="rounded-md border px-2 py-1 text-[11px] text-red-700 border-red-400 disabled:opacity-60"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}
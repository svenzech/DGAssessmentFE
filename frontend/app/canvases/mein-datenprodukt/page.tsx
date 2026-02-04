'use client';

import { CanvasWizard } from '../../components/CanvasWizard';

export default function MeinDatenproduktCanvasPage() {
  const sheetId =
    process.env.NEXT_PUBLIC_CANVAS_MEIN_DATENPRODUKT_SHEET_ID ?? '';

  if (!sheetId) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-3">
          <h1 className="text-2xl font-semibold">Mein Datenprodukt</h1>
          <p className="text-sm text-red-600">
            Canvas-Sheet-ID fehlt. Bitte setze
            <span className="font-mono">
              {' '}
              NEXT_PUBLIC_CANVAS_MEIN_DATENPRODUKT_SHEET_ID
            </span>{' '}
            in der Frontend-Umgebung.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <section className="rounded-2xl border bg-white/90 p-6 shadow-sm">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Canvas
            </div>
            <h1 className="text-3xl font-semibold">Mein Datenprodukt</h1>
            <p className="text-sm text-gray-600">
              Schritt für Schritt zum vollständigen Datenprodukt-Steckbrief.
            </p>
          </div>
        </section>

        <CanvasWizard sheetId={sheetId} title="Mein Datenprodukt" />
      </div>
    </main>
  );
}

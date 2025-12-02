'use client';

import { useEffect, useState } from 'react';
import {
  getLatestScorecard,
  evaluateBriefSheet,
  fetchBriefs,
  fetchSheets,
  fetchBriefDetail,
  fetchSheetDetail,
  fetchSheetQuestions,
  updateBrief,
  updateSheet,
  updateSheetQuestions,
  uploadIngestFile,
  deleteBrief,
  deleteSheet,
  ScorecardResponse,
  BriefListItem,
  SheetListItem,
  BriefDetail,
  SheetDetail,
  SheetQuestion,
  UploadResult,
  Domain,
  fetchDomains,
  createDomain,
  updateDomain,
  deleteDomain as deleteDomainApi,
} from './scorecardApi';

import { BriefEditor } from './components/BriefEditor';
import { SheetEditor } from './components/SheetEditor';
import { SelectionSection } from './components/SelectionSection';
import { ScorecardSection } from './components/ScorecardSection';

export default function HomePage() {
  const [briefs, setBriefs] = useState<BriefListItem[]>([]);
  const [sheets, setSheets] = useState<SheetListItem[]>([]);

  const [briefId, setBriefId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [fallbackDomainId, setFallbackDomainId] = useState<string | null>(null);
  const [savingDomain, setSavingDomain] = useState(false);

  const [scorecard, setScorecard] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor-State Steckbrief
  const [briefEditorOpen, setBriefEditorOpen] = useState(false);
  const [briefEdit, setBriefEdit] = useState<BriefDetail | null>(null);
  const [savingBrief, setSavingBrief] = useState(false);

  // Editor-State Sheet
  const [sheetEditorOpen, setSheetEditorOpen] = useState(false);
  const [sheetEdit, setSheetEdit] = useState<SheetDetail | null>(null);
  const [savingSheet, setSavingSheet] = useState(false);

  // Fragen zum ausgewählten Sheet
  const [sheetQuestions, setSheetQuestions] = useState<SheetQuestion[]>([]);
  const [loadingSheetQuestions, setLoadingSheetQuestions] = useState(false);
  const [savingSheetQuestions, setSavingSheetQuestions] = useState(false);

  // Upload-State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);

  // Initiales Laden
  useEffect(() => {
    async function loadLists() {
      try {
        setInitialLoading(true);
        setError(null);

        const [briefList, sheetList, domainList] = await Promise.all([
          fetchBriefs(),
          fetchSheets(),
          fetchDomains(),
        ]);

        setBriefs(briefList);
        setSheets(sheetList);
        setDomains(domainList);

        const fallback = domainList.find(
          (d) => d.name.trim().toLowerCase() === 'unbekannt',
        );
        setFallbackDomainId(fallback?.id ?? null);

        if (!briefId && briefList.length > 0) {
          setBriefId(briefList[0].id);
        }
        if (!sheetId && sheetList.length > 0) {
          setSheetId(sheetList[0].id);
        }
      } catch (e: any) {
        setError(e.message ?? 'Fehler beim Laden der Listen.');
      } finally {
        setInitialLoading(false);
      }
    }

    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadLatest() {
    if (!briefId || !sheetId) {
      setError('Bitte zuerst einen Steckbrief und ein Überleitungssheet auswählen.');
      return;
    }

    // andere Editoren schließen
    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    setLoading(true);
    setError(null);
    try {
      const sc = await getLatestScorecard(briefId, sheetId);
      setScorecard(sc);
      if (!sc) {
        setError('Keine gespeicherte Auswertung gefunden.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unbekannter Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!briefId || !sheetId) {
      setError('Bitte zuerst einen Steckbrief und ein Überleitungssheet auswählen.');
      return;
    }

    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    setLoading(true);
    setError(null);
    try {
      const sc = await evaluateBriefSheet(briefId, sheetId);
      setScorecard(sc);
    } catch (e: any) {
      setError(e.message ?? 'Unbekannter Fehler bei der Auswertung.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenBriefEditor() {
    if (!briefId) {
      setError('Bitte zuerst einen Steckbrief auswählen.');
      return;
    }
    setError(null);

    // Sheet-Editor schließen, wenn Steckbrief-Editor geöffnet wird
    setSheetEditorOpen(false);

    try {
      const detail = await fetchBriefDetail(briefId);
      setBriefEdit(detail);
      setBriefEditorOpen(true);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden des Steckbriefs.');
    }
  }

  async function handleOpenSheetEditor() {
    if (!sheetId) {
      setError('Bitte zuerst ein Überleitungssheet auswählen.');
      return;
    }
    setError(null);

    // Steckbrief-Editor schließen, wenn Sheet-Editor geöffnet wird
    setBriefEditorOpen(false);
    setLoadingSheetQuestions(true);

    try {
      const [detail, questions] = await Promise.all([
        fetchSheetDetail(sheetId),
        fetchSheetQuestions(sheetId),
      ]);
      setSheetEdit(detail);
      setSheetQuestions(questions);
      setSheetEditorOpen(true);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden des Sheets oder der Fragen.');
    } finally {
      setLoadingSheetQuestions(false);
    }
  }

  async function handleSaveBrief() {
    if (!briefEdit) return;

    setSavingBrief(true);
    setError(null);
    try {
      const updated = await updateBrief(briefEdit.id, {
        title: briefEdit.title,
        status: briefEdit.status,
        raw_markdown: briefEdit.raw_markdown,
        domain_id: briefEdit.domain_id ?? null,
      });
      setBriefEdit(updated);
      setBriefs((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
      );
      setBriefEditorOpen(false);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern des Steckbriefs.');
    } finally {
      setSavingBrief(false);
    }
  }

  async function handleSaveSheet() {
    if (!sheetEdit || !sheetId) return;

    setSavingSheet(true);
    setSavingSheetQuestions(true);
    setError(null);

    try {
      const updatedSheet = await updateSheet(sheetEdit.id, {
        name: sheetEdit.name,
        theme: sheetEdit.theme,
        status: sheetEdit.status,
        version: sheetEdit.version,
      });
      setSheetEdit(updatedSheet);
      setSheets((prev) =>
        prev.map((s) => (s.id === updatedSheet.id ? { ...s, ...updatedSheet } : s)),
      );

      const updatedQuestions = await updateSheetQuestions(sheetId, sheetQuestions);
      setSheetQuestions(updatedQuestions);

      setSheetEditorOpen(false);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern des Sheets oder der Fragen.');
    } finally {
      setSavingSheet(false);
      setSavingSheetQuestions(false);
    }
  }

  // Hilfsfunktionen für Fragen-Editor
  function handleQuestionChange(index: number, patch: Partial<SheetQuestion>) {
    setSheetQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function handleDeleteQuestion(index: number) {
    setSheetQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddQuestion() {
    setSheetQuestions((prev) => {
      const nextIndex = prev.length;
      return [
        ...prev,
        {
          code: '',
          question: '',
          checkpoints: [],
          order_index: nextIndex,
          active: true,
        },
      ];
    });
  }

  // Upload-Handler
  function handleFileChange(file: File | null) {
    // Editoren schließen, wenn neuer Upload beginnt
    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    setSelectedFile(file);
    setUploadWarnings([]);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError('Bitte zuerst eine Datei auswählen.');
      return;
    }

    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    setUploading(true);
    setError(null);
    setUploadWarnings([]);
    setScorecard(null);

    try {
      const result: UploadResult = await uploadIngestFile(selectedFile);

      if (result.kind === 'brief') {
        setUploadWarnings(result.warnings ?? []);
        setBriefId(result.brief_id);

        const briefList = await fetchBriefs();
        setBriefs(briefList);

        const detail = await fetchBriefDetail(result.brief_id);
        setBriefEdit(detail);
        setBriefEditorOpen(true);
      } else if (result.kind === 'sheet') {
        setUploadWarnings(result.warnings ?? []);
        setSheetId(result.sheet_id);

        const sheetList = await fetchSheets();
        setSheets(sheetList);

        const [detail, questions] = await Promise.all([
          fetchSheetDetail(result.sheet_id),
          fetchSheetQuestions(result.sheet_id),
        ]);
        setSheetEdit(detail);
        setSheetQuestions(questions);
        setSheetEditorOpen(true);
      } else {
        setUploadWarnings(result.warnings ?? []);
        setError(
          'Upload wurde erkannt, aber weder als Steckbrief noch als Überleitungssheet klassifiziert.',
        );
      }
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Upload.');
    } finally {
      setUploading(false);
    }
  }

  // Löschen Steckbrief
  async function handleDeleteBrief() {
    if (!briefId) return;

    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    const current = briefs.find((b) => b.id === briefId);
    const label = current?.title ?? briefId;

    if (!window.confirm(`Steckbrief "${label}" wirklich löschen?`)) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await deleteBrief(briefId);

      setBriefs((prev) => {
        const remaining = prev.filter((b) => b.id !== briefId);
        setBriefId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
      });

      setBriefEdit(null);
      setScorecard(null);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Löschen des Steckbriefs.');
    } finally {
      setLoading(false);
    }
  }

  // Löschen Sheet
  async function handleDeleteSheet() {
    if (!sheetId) return;

    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    const current = sheets.find((s) => s.id === sheetId);
    const label = current?.name ?? sheetId;

    if (!window.confirm(`Überleitungssheet "${label}" wirklich löschen?`)) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await deleteSheet(sheetId);

      setSheets((prev) => {
        const remaining = prev.filter((s) => s.id !== sheetId);
        setSheetId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
      });

      setSheetEdit(null);
      setSheetQuestions([]);
      setScorecard(null);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Löschen des Sheets.');
    } finally {
      setLoading(false);
    }
  }

  // Auswahl-Handler für Listen
  function handleSelectBrief(id: string) {
    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    setBriefId(id);
    setScorecard(null);
  }

  function handleSelectSheet(id: string) {
    setBriefEditorOpen(false);
    setSheetEditorOpen(false);

    setSheetId(id);
    setScorecard(null);
  }

  // Domain-CRUD für Editor
  async function handleCreateDomain(name: string, description: string) {
    setSavingDomain(true);
    setError(null);
    try {
      const created = await createDomain({ name, description });
      setDomains((prev) => [created, ...prev]);

      if (
        created.name.trim().toLowerCase() === 'unbekannt' &&
        !fallbackDomainId
      ) {
        setFallbackDomainId(created.id);
      }
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Anlegen der Domäne.');
    } finally {
      setSavingDomain(false);
    }
  }

  async function handleUpdateDomain(domainId: string, name: string, description: string) {
    setSavingDomain(true);
    setError(null);
    try {
      const updated = await updateDomain(domainId, { name, description });
      setDomains((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Aktualisieren der Domäne.');
    } finally {
      setSavingDomain(false);
    }
  }

  async function handleDeleteDomain(domainId: string) {
    const current = domains.find((d) => d.id === domainId);
    const label = current?.name ?? domainId;

    if (!window.confirm(`Domäne "${label}" wirklich löschen?`)) {
      return;
    }

    setSavingDomain(true);
    setError(null);

    try {
      await deleteDomainApi(domainId);
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
    } catch (e: any) {
      if (e.status === 409 || e.code === 'domain_in_use') {
        setError('Domäne wird noch von Steckbriefen verwendet und kann nicht gelöscht werden.');
      } else {
        setError(e.message ?? 'Fehler beim Löschen der Domäne.');
      }
    } finally {
      setSavingDomain(false);
    }
  }

  const selectedBrief = briefs.find((b) => b.id === briefId) || null;
  const selectedSheet = sheets.find((s) => s.id === sheetId) || null;
  const selectedFileName = selectedFile?.name ?? null;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Domänen-Steckbrief Scorecard
          </h1>
          <p className="text-sm text-gray-600">
            Steckbrief + Überleitungssheet auswählen, bewerten und
            Verbesserungs-Empfehlungen anzeigen.
          </p>
        </header>

        <SelectionSection
          briefs={briefs}
          sheets={sheets}
          briefId={briefId}
          sheetId={sheetId}
          selectedBrief={selectedBrief}
          selectedSheet={selectedSheet}
          initialLoading={initialLoading}
          loading={loading}
          error={error}
          uploading={uploading}
          uploadWarnings={uploadWarnings}
          selectedFileName={selectedFileName}
          onSelectBrief={handleSelectBrief}
          onSelectSheet={handleSelectSheet}
          onLoadLatest={handleLoadLatest}
          onEvaluate={handleEvaluate}
          onOpenBriefEditor={handleOpenBriefEditor}
          onOpenSheetEditor={handleOpenSheetEditor}
          onDeleteBrief={handleDeleteBrief}
          onDeleteSheet={handleDeleteSheet}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
        />

        <BriefEditor
          open={briefEditorOpen}
          brief={briefEdit}
          saving={savingBrief || savingDomain}
          domains={domains}
          fallbackDomainId={fallbackDomainId ?? undefined}
          onChange={(patch) =>
            setBriefEdit((prev) => (prev ? { ...prev, ...patch } : prev))
          }
          onSave={handleSaveBrief}
          onClose={() => setBriefEditorOpen(false)}
          onCreateDomain={handleCreateDomain}
          onUpdateDomain={handleUpdateDomain}
          onDeleteDomain={handleDeleteDomain}
        />

        <SheetEditor
          open={sheetEditorOpen}
          sheet={sheetEdit}
          questions={sheetQuestions}
          loadingQuestions={loadingSheetQuestions}
          saving={savingSheet || savingSheetQuestions}
          onSheetChange={(patch) =>
            setSheetEdit((prev) => (prev ? { ...prev, ...patch } : prev))
          }
          onQuestionChange={handleQuestionChange}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onSave={handleSaveSheet}
          onClose={() => setSheetEditorOpen(false)}
        />

        <ScorecardSection scorecard={scorecard} />
      </div>
    </main>
  );
}
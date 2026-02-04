'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CanvasField,
  CanvasFieldAnswer,
  CanvasFeedback,
  CanvasRun,
  CanvasSheet,
  getCanvasFieldFeedback,
  getCanvasRun,
  getCanvasTemplate,
  getOrCreateCanvasRun,
  saveCanvasField,
} from '../scorecardApi';

type UseCanvasCoachRunState = {
  sheetId: string;
  sheet: CanvasSheet | null;
  fields: CanvasField[];
  activeFields: CanvasField[];
  run: CanvasRun | null;
  answersByFieldCode: Record<string, CanvasFieldAnswer>;
  draftsByFieldCode: Record<string, string>;
  currentIndex: number;
  currentField: CanvasField | null;
  currentValue: string;
  savedCount: number;
  progress: number;
  canProceed: boolean;
  badges: {
    firstSave: boolean;
    consistency: boolean;
    lineage: boolean;
  };
  loadingTemplate: boolean;
  loadingRun: boolean;
  saving: boolean;
  feedbackLoading: boolean;
  error: string | null;
};

type UseCanvasCoachRunActions = {
  setUsername: (name: string) => void;
  username: string;
  setCurrentIndex: (idx: number) => void;
  jumpToField: (code: string) => void;
  setCurrentValue: (value: string) => void;
  saveCurrentField: () => Promise<void>;
  requestFeedback: () => Promise<CanvasFeedback | null>;
  next: () => void;
  prev: () => void;
  reload: () => Promise<void>;
};

const DEFAULT_USERNAME = 'demo';

function normalizeCheckpoints(cp: any): string[] {
  if (!cp) return [];
  if (Array.isArray(cp)) {
    return cp.map((v) => String(v)).filter((v) => v.trim().length > 0);
  }
  if (typeof cp === 'string') {
    return [cp].filter((v) => v.trim().length > 0);
  }
  if (typeof cp === 'object') {
    try {
      return Object.values(cp)
        .map((v) => String(v))
        .filter((v) => v.trim().length > 0);
    } catch {
      return [];
    }
  }
  return [];
}

function computeLineageKeys(fields: CanvasField[]) {
  const codes = fields.map((f) => f.code);
  if (codes.includes('dp_source_products') && codes.includes('dp_data_objects')) {
    return ['dp_source_products', 'dp_data_objects'];
  }
  if (codes.includes('Q5') && codes.includes('Q6')) {
    return ['Q5', 'Q6'];
  }
  if (codes.length >= 2) {
    return [codes[codes.length - 2], codes[codes.length - 1]];
  }
  return [];
}

export function useCanvasCoachRun(): UseCanvasCoachRunState & UseCanvasCoachRunActions {
  const sheetId =
    process.env.NEXT_PUBLIC_CANVAS_MEIN_DATENPRODUKT_SHEET_ID ?? '';

  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [sheet, setSheet] = useState<CanvasSheet | null>(null);
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [run, setRun] = useState<CanvasRun | null>(null);
  const [answersByFieldCode, setAnswersByFieldCode] = useState<
    Record<string, CanvasFieldAnswer>
  >({});
  const [draftsByFieldCode, setDraftsByFieldCode] = useState<
    Record<string, string>
  >({});

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFields = useMemo(() => {
    const filtered = (fields ?? []).filter((f) => f.active !== false);
    return filtered
      .map((f) => ({ ...f, checkpoints: normalizeCheckpoints(f.checkpoints) }))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [fields]);

  const currentField = activeFields[currentIndex] ?? null;
  const currentValue =
    (currentField && draftsByFieldCode[currentField.code]) ??
    (currentField && answersByFieldCode[currentField.code]?.value) ??
    '';

  const savedCount = useMemo(() => {
    return Object.values(answersByFieldCode).filter(
      (a) => a && typeof a.value === 'string' && a.value.trim().length > 0,
    ).length;
  }, [answersByFieldCode]);

  const progress = activeFields.length
    ? Math.min(1, savedCount / activeFields.length)
    : 0;

  const canProceed = useMemo(() => {
    if (!currentField) return false;
    const draft = (draftsByFieldCode[currentField.code] ?? '').trim();
    const saved = (answersByFieldCode[currentField.code]?.value ?? '').trim();
    return draft.length > 0 || saved.length > 0;
  }, [currentField, draftsByFieldCode, answersByFieldCode]);

  const lineageKeys = computeLineageKeys(activeFields);
  const badges = useMemo(() => {
    const lineageReady =
      lineageKeys.length > 0 &&
      lineageKeys.every((code) => {
        const v = answersByFieldCode[code]?.value ?? '';
        return v.trim().length > 0;
      });

    return {
      firstSave: savedCount >= 1,
      consistency: savedCount >= 3,
      lineage: lineageReady,
    };
  }, [answersByFieldCode, savedCount, lineageKeys]);

  useEffect(() => {
    if (!sheetId) {
      setError(
        'Canvas-Sheet-ID fehlt. Bitte setze NEXT_PUBLIC_CANVAS_MEIN_DATENPRODUKT_SHEET_ID.',
      );
      return;
    }
    (async () => {
      try {
        setLoadingTemplate(true);
        setError(null);
        const tpl = await getCanvasTemplate(sheetId);
        setSheet(tpl.sheet);
        setFields(tpl.fields ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Fehler beim Laden des Canvas-Templates.');
      } finally {
        setLoadingTemplate(false);
      }
    })();
  }, [sheetId]);

  async function reload() {
    if (!sheetId) return;
    if (!username.trim()) {
      setError('Bitte einen Benutzernamen angeben.');
      return;
    }
    try {
      setLoadingRun(true);
      setError(null);
      const { run } = await getOrCreateCanvasRun(
        sheetId,
        username.trim(),
        null,
        null,
      );
      setRun(run);
      const runData = await getCanvasRun(run.id);
      setAnswersByFieldCode(runData.answersByFieldCode ?? {});
      const nextDrafts: Record<string, string> = {};
      for (const [code, a] of Object.entries(
        runData.answersByFieldCode ?? {},
      )) {
        if (a?.value) nextDrafts[code] = a.value;
      }
      setDraftsByFieldCode(nextDrafts);
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden des Runs.');
    } finally {
      setLoadingRun(false);
    }
  }

  useEffect(() => {
    if (!sheetId || !sheet) return;
    if (!username.trim()) return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, sheet, username]);

  function setCurrentValue(value: string) {
    if (!currentField) return;
    setDraftsByFieldCode((prev) => ({ ...prev, [currentField.code]: value }));
  }

  function jumpToField(code: string) {
    const idx = activeFields.findIndex((f) => f.code === code);
    if (idx >= 0) setCurrentIndex(idx);
  }

  async function saveCurrentField() {
    if (!run || !currentField) return;
    try {
      setSaving(true);
      setError(null);
      const value = (draftsByFieldCode[currentField.code] ?? '').toString();
      await saveCanvasField(run.id, currentField.code, value);
      setAnswersByFieldCode((prev) => ({
        ...prev,
        [currentField.code]: {
          value,
          updated_at: new Date().toISOString(),
          llm_feedback: prev[currentField.code]?.llm_feedback,
        },
      }));
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  }

  async function requestFeedback() {
    if (!run || !currentField) return null;
    try {
      setFeedbackLoading(true);
      setError(null);
      const value = (draftsByFieldCode[currentField.code] ?? '').toString();
      const feedback = await getCanvasFieldFeedback(
        run.id,
        currentField.code,
        value,
      );

      setAnswersByFieldCode((prev) => ({
        ...prev,
        [currentField.code]: {
          value,
          updated_at: new Date().toISOString(),
          llm_feedback: {
            suggestions: feedback.suggestions ?? [],
            questions: feedback.questions ?? [],
            created_at: new Date().toISOString(),
          },
        },
      }));
      return feedback;
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Feedback.');
      return null;
    } finally {
      setFeedbackLoading(false);
    }
  }

  function next() {
    setCurrentIndex((idx) => Math.min(idx + 1, activeFields.length - 1));
  }

  function prev() {
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  }

  return {
    sheetId,
    sheet,
    fields,
    activeFields,
    run,
    answersByFieldCode,
    draftsByFieldCode,
    currentIndex,
    currentField,
    currentValue,
    savedCount,
    progress,
    canProceed,
    badges,
    loadingTemplate,
    loadingRun,
    saving,
    feedbackLoading,
    error,
    username,
    setUsername,
    setCurrentIndex,
    jumpToField,
    setCurrentValue,
    saveCurrentField,
    requestFeedback,
    next,
    prev,
    reload,
  };
}

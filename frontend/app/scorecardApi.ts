// frontend/app/scorecardApi.ts

const API_BASE =
  process.env.NEXT_PUBLIC_BRIEF_API_BASE ?? 'http://localhost:4000';

export type ChatHistoryItem = {
  role: string;
  content: string;
};

export type ChatApiResult = {
  answer: string;       // benutzerfreundlich formatierter Text
  rawAnswer: string;    // originaler answer-/raw-String vom Backend
  meta?: any;           // geparstes JSON (z. B. { question, status })
};

// ---- Lean Interview Context (für Flowise-Chat) ----

export type LeanFindingFront = {
  id: string;
  sheet_id: string;
  sheet_name: string;
  theme: string;
  question_id: string;
  question_code: string;
  question: string;
  checkpoints: string[];

  status?: string | null;
  score_1_5?: number | null;
  rationale?: string | null;
  evidence?: string[];
  open_questions?: string[];
};

export type LeanInterviewContextFront = {
  interview_id?: string;

  // Das ist das, was du in den DevTools als "interview: Array(…)" siehst
  interview: LeanFindingFront[];

  // Alles andere erstmal optional halten – das kannst du später verfeinern,
  // ohne dass der Chat kaputt geht.
  user?: { id: string };
  domain?: Domain | null | {
    id: string;
    name: string;
    description: string | null;
  };
  brief?: {
    id?: string;
    title?: string | null;
    raw_markdown: string;
    version?: number | null;
  } | null;
};

// Pro Frage in der Scorecard
export type ScorecardQuestionEntry = {
  question_id: string;
  question_code: string;
  question: string;
  baseline_score_1_5: number | null;
  interview_adjusted_score_1_5: number | null;
  final_score_1_5: number | null;
  reasoning: string;
  evidence_from_interviews: string[];
  recommended_brief_updates: string[];
};

// Zusammenfassung der Bewertung für ein Sheet
export type ScorecardSheetSummary = {
  baseline_avg_score_1_5: number | null;
  interview_adjusted_avg_score_1_5: number | null;
  final_level_1_5: number | null;
  main_gaps: string[];
  priority_updates: string[];
};

// Gesamte Scorecard-Antwort des Backends
export type ScorecardResponse = {
  brief_id: string;
  sheet_id: string;
  theme: string;
  per_question: ScorecardQuestionEntry[];
  sheet_summary: ScorecardSheetSummary;
};

export type BriefListItem = {
  id: string;
  title: string | null;
  domain_id: string | null;
  status: string | null;
  version: number | null;
  created_at: string;
};

export type BriefDetail = BriefListItem & {
  raw_markdown: string;
  updated_at?: string | null;
};

export type SheetListItem = {
  id: string;
  name: string | null;
  theme: string | null;
  status: string | null;
  version: number | null;
  created_at: string;
};

export type SheetDetail = SheetListItem & {
  theme_target_descr?: string | null;
};

export type SheetQuestion = {
  id?: string;
  sheet_id?: string;
  code: string;
  question: string;
  checkpoints: string[];
  order_index: number;
  active: boolean;
  created_at?: string;
  updated_at?: string | null;
};

// Domain-Typ
export type Domain = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  // optional, falls Du die Spalte ergänzt hast:
  // updated_at?: string | null;
};

// Payload für Create/Update
export type DomainPayload = {
  name: string;
  description?: string | null;
};

/**
 * Holt die letzte gespeicherte Scorecard, falls vorhanden.
 */
export async function getLatestScorecard(
  briefId: string,
  sheetId: string,
): Promise<ScorecardResponse | null> {
  const res = await fetch(
    `${API_BASE}/api/briefs/${briefId}/sheets/${sheetId}/scorecard-latest`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden der Scorecard: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data.scorecard_json as ScorecardResponse;
}

/**
 * Triggert eine neue Bewertung (LLM) und gibt die Scorecard zurück.
 */
export async function evaluateBriefSheet(
  briefId: string,
  sheetId: string,
): Promise<ScorecardResponse> {
  const res = await fetch(
    `${API_BASE}/api/briefs/${briefId}/sheets/${sheetId}/evaluate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Fehler bei evaluate: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as ScorecardResponse;
}

/**
 * Liste aller Steckbriefe (Backend: GET /api/briefs).
 */
export async function fetchBriefs(): Promise<BriefListItem[]> {
  const res = await fetch(`${API_BASE}/api/briefs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden der Steckbriefe: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  // Erwartet: Array von BriefListItem
  return data as BriefListItem[];
}

/**
 * Liste aller aktiven Überleitungssheets (Backend: GET /api/sheets).
 */
export async function fetchSheets(): Promise<SheetListItem[]> {
  const res = await fetch(`${API_BASE}/api/sheets`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden der Überleitungssheets: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  // Erwartet: Array von SheetListItem
  return data as SheetListItem[];
}

// --- Detail + Update Steckbrief ---

export type BriefUpdatePayload = {
  title?: string | null;
  status?: string | null;
  raw_markdown?: string;
  // Version ist read-only, wird nicht mehr im PATCH verändert
  // version?: number | null;
  domain_id?: string | null;
};

export async function fetchBriefDetail(briefId: string): Promise<BriefDetail> {
  const res = await fetch(`${API_BASE}/api/briefs/${briefId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden des Steckbriefs: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as BriefDetail;
}

export async function updateBrief(
  briefId: string,
  payload: BriefUpdatePayload,
): Promise<BriefDetail> {
  const res = await fetch(`${API_BASE}/api/briefs/${briefId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Speichern des Steckbriefs: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as BriefDetail;
}

// --- Detail + Update Sheet ---

export type SheetUpdatePayload = {
  name?: string | null;
  theme?: string | null;
  status?: string | null;
  version?: number | null;
};

export async function fetchSheetDetail(sheetId: string): Promise<SheetDetail> {
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden des Sheets: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as SheetDetail;
}

export async function updateSheet(
  sheetId: string,
  payload: SheetUpdatePayload,
): Promise<SheetDetail> {
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Speichern des Sheets: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as SheetDetail;
}

// --- Fragen eines Sheets ---

export async function fetchSheetQuestions(
  sheetId: string,
): Promise<SheetQuestion[]> {
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}/questions`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden der Fragen: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as SheetQuestion[];
}

export async function updateSheetQuestions(
  sheetId: string,
  questions: SheetQuestion[],
): Promise<SheetQuestion[]> {
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}/questions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions }),
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Speichern der Fragen: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as SheetQuestion[];
}

// --- Upload-Ingest ---

export type UploadBriefResult = {
  kind: 'brief';
  brief_id: string;
  title: string;
  version: number;
  warnings: string[];
};

export type UploadSheetResult = {
  kind: 'sheet';
  sheet_id: string;
  theme: string;
  questions_imported: number;
  warnings: string[];
};

export type UploadUnknownResult = {
  kind: 'unknown';
  warnings?: string[];
};

export type UploadResult =
  | UploadBriefResult
  | UploadSheetResult
  | UploadUnknownResult;

export async function uploadIngestFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/ingest/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Upload: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as UploadResult;
}

// --- Delete Steckbrief / Sheet ---

export async function deleteBrief(briefId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/briefs/${briefId}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(
      `Fehler beim Löschen des Steckbriefs: ${res.status} ${await res.text()}`,
    );
  }
}

export async function deleteSheet(
  sheetId: string,
  options?: { force?: boolean },
): Promise<void> {
  const query = options?.force ? '?force=true' : '';
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}${query}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    let payload: any = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }

    const error: any = new Error(
      `Fehler beim Löschen des Sheets: ${res.status} ${text}`,
    );
    error.status = res.status;
    if (payload && typeof payload === 'object') {
      Object.assign(error, payload);
    }
    throw error;
  }
}

// ---- Domains ----

export async function fetchDomains(): Promise<Domain[]> {
  const res = await fetch(`${API_BASE}/api/domains`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden der Domänen: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as Domain[];
}

export async function createDomain(payload: DomainPayload): Promise<Domain> {
  const res = await fetch(`${API_BASE}/api/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Anlegen der Domäne: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as Domain;
}

export async function updateDomain(
  domainId: string,
  payload: DomainPayload,
): Promise<Domain> {
  const res = await fetch(`${API_BASE}/api/domains/${domainId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Aktualisieren der Domäne: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as Domain;
}

export async function deleteDomain(domainId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/domains/${domainId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Löschen der Domäne: ${res.status} ${await res.text()}`,
    );
  }
}


// ---- Lean Interview-Kontext für Benutzer holen ----

export async function fetchInterviewContextForUser(
  userName: string | null,
): Promise<LeanInterviewContextFront | null> {
  if (!userName) return null;

  const url = `${API_BASE}/api/interviews/context-for-user?user=${encodeURIComponent(
    userName,
  )}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (res.status === 404) {
    // Kein aktives Interview für diesen Benutzer
    return null;
  }

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden des Interview-Kontexts: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  return data as LeanInterviewContextFront;
}

// ---- Canvas / Wizard ----

export type CanvasSheet = {
  id: string;
  name: string | null;
  theme: string | null;
  description?: string | null;
  theme_target_description?: string | null;
  version?: number | null;
  status?: string | null;
};

export type CanvasField = {
  id: string;
  code: string;
  question: string;
  checkpoints: string[];
  order_index: number;
  active: boolean;
};

export type CanvasTemplateResponse = {
  sheet: CanvasSheet;
  fields: CanvasField[];
};

export type CanvasRun = {
  id: string;
  user_id: string;
  domain_id: string | null;
  brief_id: string | null;
  interview_type: string;
  status: string | null;
};

export type CanvasFieldAnswer = {
  value: string;
  updated_at: string;
  llm_feedback?: {
    suggestions: string[];
    questions: string[];
    created_at: string;
  };
};

export type CanvasRunResponse = {
  run: CanvasRun;
  answersByFieldCode: Record<string, CanvasFieldAnswer>;
};

export type CanvasFeedback = {
  suggestions: string[];
  questions: string[];
};

export async function getCanvasTemplate(
  sheetId: string,
): Promise<CanvasTemplateResponse> {
  const res = await fetch(`${API_BASE}/api/canvases/${sheetId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden des Canvas-Templates: ${res.status} ${await res.text()}`,
    );
  }

  return (await res.json()) as CanvasTemplateResponse;
}

export async function getOrCreateCanvasRun(
  sheetId: string,
  username: string,
  domainId?: string | null,
  briefId?: string | null,
): Promise<{ run: CanvasRun }> {
  const res = await fetch(`${API_BASE}/api/canvases/${sheetId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      domainId: domainId ?? null,
      briefId: briefId ?? null,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Starten des Canvas-Runs: ${res.status} ${await res.text()}`,
    );
  }

  return (await res.json()) as { run: CanvasRun };
}

export async function getCanvasRun(
  runId: string,
): Promise<CanvasRunResponse> {
  const res = await fetch(`${API_BASE}/api/canvases/runs/${runId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(
      `Fehler beim Laden des Canvas-Runs: ${res.status} ${await res.text()}`,
    );
  }

  return (await res.json()) as CanvasRunResponse;
}

export async function saveCanvasField(
  runId: string,
  fieldCode: string,
  value: string,
): Promise<{ ok: true }> {
  const res = await fetch(
    `${API_BASE}/api/canvases/runs/${runId}/fields/${encodeURIComponent(
      fieldCode,
    )}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Fehler beim Speichern des Feldes: ${res.status} ${await res.text()}`,
    );
  }

  return (await res.json()) as { ok: true };
}

export async function getCanvasFieldFeedback(
  runId: string,
  fieldCode: string,
  value?: string,
): Promise<CanvasFeedback> {
  const res = await fetch(
    `${API_BASE}/api/canvases/runs/${runId}/fields/${encodeURIComponent(
      fieldCode,
    )}/feedback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Fehler beim LLM-Feedback: ${res.status} ${await res.text()}`,
    );
  }

  return (await res.json()) as CanvasFeedback;
}


export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  meta?: any;
};

export type FlowiseChatResponse = {
  answer: string;
  // falls Du später mehr brauchst: history, sources etc.
};

// ---- Interview Chat (ehemals Flowise Chat) ----
export async function sendChatMessage(
  user: string | null,
  message: string,
  history: ChatHistoryItem[],
  options?: { skipSave?: boolean; mode?: 'start' | 'answer' | 'user_question' },
  internalFlags?: Record<string, any>,
): Promise<ChatApiResult> {
  // 1) stabile Session-ID bestimmen
  const sessionId =
    internalFlags?.INTERVIEW_ID ||
    internalFlags?.interviewId ||
    user ||
    'anonymous-session';

  console.log('[sendChatMessage] Request', {
    user,
    message,
    historyLength: history.length,
    sessionId,
    internalFlags,
  });

  const body = {
    user,
    message,
    history,
    mode: options?.mode,
    // overrideConfig wird im neuen Backend aktuell nicht mehr genutzt,
    // kann aber für zukünftige Flags stehen bleiben
    overrideConfig: {
      sessionId,
      chatId: sessionId,
      internal: internalFlags ?? {},
    },
  };

  const res = await fetch(`${API_BASE}/api/interview/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let text: string;
  try {
    text = await res.text();
  } catch (e) {
    console.error('[sendChatMessage] konnte Response-Text nicht lesen:', e);
    throw new Error(`Fehler beim Lesen der Serverantwort (HTTP ${res.status}).`);
  }

  console.log('[sendChatMessage] Raw response text:', text);

  if (!res.ok) {
    // Hier ist text typischerweise eine Fehlermeldung aus dem Backend
    throw new Error(`Serverfehler (HTTP ${res.status}): ${text}`);
  }

  // Äußere Response vom Backend ist JSON: { answer, question, status, raw, meta? }
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('[sendChatMessage] Antwort ist kein gültiges JSON:', e);
    throw new Error('Server lieferte keine gültige JSON-Antwort.');
  }

  const answerText =
    typeof data.answer === 'string' ? data.answer.trim() : '';
  const questionText =
    typeof data.question === 'string' ? data.question.trim() : '';
  const statusText =
    typeof data.status === 'string' ? data.status.trim() : 'continue';

  console.log('[sendChatMessage] parsed answer =', answerText);
  console.log('[sendChatMessage] parsed question =', questionText);
  console.log('[sendChatMessage] status =', statusText);

  // Anzeige-Text bauen:
  // - zuerst Antwort auf eine Nutzerrückfrage (falls vorhanden)
  // - dann die nächste Interviewfrage
  let displayAnswer = '';

  if (answerText && questionText) {
    displayAnswer = `${answerText}\n\n${questionText}`;
  } else if (questionText) {
    displayAnswer = questionText;
  } else if (answerText) {
    displayAnswer = answerText;
  } else {
    displayAnswer =
      'Ich konnte gerade keine nächste Frage ableiten. Bitte versuchen Sie es erneut.';
  }

  // rawAnswer: Rohdaten so gut wie möglich erhalten
  const rawField =
    typeof data.raw === 'string'
      ? data.raw
      : JSON.stringify(data.raw ?? data);

  // Backend-Meta (z.B. { finding_id, theme, sheet_id, sheet_name })
  const serverMeta =
    data && typeof data.meta === 'object' ? data.meta : null;

  const meta = {
    answer: answerText,
    question: questionText,
    status: statusText,
    ...(serverMeta ?? {}), // hier kommt u.a. theme rein
    raw: data.raw ?? null,
  };

  console.log(
    '[sendChatMessage] displayAnswer =',
    displayAnswer,
    'meta =',
    meta,
  );

  return {
    answer: displayAnswer,
    rawAnswer: rawField,
    meta,
  };
}

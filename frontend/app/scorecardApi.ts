// frontend/app/scorecardApi.ts

const API_BASE =
  process.env.NEXT_PUBLIC_BRIEF_API_BASE ?? 'http://localhost:4000';

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
  version?: number | null;
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
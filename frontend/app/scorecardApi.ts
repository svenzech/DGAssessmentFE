// frontend/scorecardApi.ts

const API_BASE =
  process.env.NEXT_PUBLIC_BRIEF_API_BASE ?? 'https://dgassessmentbe.onrender.com';


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
  raw_markdown: string;           // Volltext des Steckbriefs
  updated_at?: string | null;     // falls in der API vorhanden
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
  theme_target_descr?: string | null;  // falls es dieses Feld in der DB gibt
};


//**
// * FUNKTIONEN ZUM SCORECARD-API-ZUGRIFF
//** 

// Alle Briefs (für Auswahlliste)
export async function fetchBriefs(): Promise<BriefListItem[]> {
  const res = await fetch(`${API_BASE}/api/briefs`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`fetchBriefs failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as BriefListItem[];
}

// Alle Sheets (für Auswahlliste)
export async function fetchSheets(): Promise<SheetListItem[]> {
  const res = await fetch(`${API_BASE}/api/sheets`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`fetchSheets failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as SheetListItem[];
}

// Detail für einen Brief (für Editor)
export async function fetchBriefDetail(
  briefId: string,
): Promise<BriefDetail> {
  const res = await fetch(`${API_BASE}/api/briefs/${briefId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(
      `fetchBriefDetail failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as BriefDetail;
}

// Brief aktualisieren (ohne Primärschlüssel zu ändern)
export async function updateBrief(
  briefId: string,
  payload: Partial<BriefDetail>,
): Promise<BriefDetail> {
  const res = await fetch(`${API_BASE}/api/briefs/${briefId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      `updateBrief failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as BriefDetail;
}

// Detail für ein Sheet
export async function fetchSheetDetail(
  sheetId: string,
): Promise<SheetDetail> {
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(
      `fetchSheetDetail failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as SheetDetail;
}

// Sheet aktualisieren
export async function updateSheet(
  sheetId: string,
  payload: Partial<SheetDetail>,
): Promise<SheetDetail> {
  const res = await fetch(`${API_BASE}/api/sheets/${sheetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      `updateSheet failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as SheetDetail;
}







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
  // Backend liefert: { id, source, scorecard_json, created_at }
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

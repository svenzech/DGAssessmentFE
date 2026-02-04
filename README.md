# Flowise_Frontend
Das passende Frontend zum Flowise Repo

## Canvas

Für die Canvas-Seite "Mein Datenprodukt" wird ein Sheet als Template benötigt.

Benötigte Umgebungsvariablen:
```
NEXT_PUBLIC_CANVAS_MEIN_DATENPRODUKT_SHEET_ID=<uuid>
```

Backend (DGAssessmentBE) benötigt zusätzlich:
```
DG_BASIS_BRIEF_ID=<uuid>  # optional, falls gesetzt wird dieser Brief als DG-Basis genutzt
```
Wenn `DG_BASIS_BRIEF_ID` nicht gesetzt ist, wird im Backend ein Fallback mit
`title ILIKE '%DG Basis%'` verwendet.

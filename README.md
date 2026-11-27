# EMT (Error Messaging Tool) - Frontend-Plugin

Frontend-Plugin `@fsdev/emt` für das Backend-Modul `MOD/emt`. Erstellt aus `VIS/plugin-base`.

Menü "EMT" mit Einträgen: Fehler melden, Fehlerliste, Fehlercodes / Einstellungen (Übersicht entfällt vorerst).
Sichtbarkeit je Eintrag über die Berechtigungen `Report-Errors`, `Manage-Errors` und `Manage-Catalog` (Modul-ID `33d46b35-cf3a-4ab4-aa07-d3f58cfe5d7f`).

Messages und Konstanten müssen mit `MOD/emt/src/Emt/Constants.cs` übereinstimmen (`src/constants.ts`, `src/messages/`).

Zum Einbinden in die WebApplication muss das Plugin in deren `customComponents.js` unter dem Schlüssel `Emt` angegeben werden.

Änderungen November 2026: Statusfarben (`StatusTag.vue`, konfigurierbar über `StatusColors` in der `emtConfig.json`, siehe `src/utils/statusTone.ts`), Filter an allen Spalten der Tabellen, Detailfenster mit Abschnitten (`@fsdev/box`, neue Abhängigkeit) und eingeklapptem Verlauf, Öffnen eines Fehlers aus einer Benachrichtigung. Details: `MOD/emt/docs/HANDOVER-2026-11.md`.

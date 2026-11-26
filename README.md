# EMT (Error Messaging Tool) - Frontend-Plugin

Frontend-Plugin `@fsdev/emt` für das Backend-Modul `MOD/emt`. Erstellt aus `VIS/plugin-base`.

Menü "EMT" mit vier Einträgen: Fehler melden, Fehlerliste, Übersicht (Platzhalter), Fehlercodes / Einstellungen.
Sichtbarkeit je Eintrag über die Berechtigungen `Report-Errors`, `Manage-Errors` und `Manage-Catalog` (Modul-ID `33d46b35-cf3a-4ab4-aa07-d3f58cfe5d7f`).

Messages und Konstanten müssen mit `MOD/emt/src/Emt/Constants.cs` übereinstimmen (`src/constants.ts`, `src/messages/`).

Zum Einbinden in die WebApplication muss das Plugin in deren `customComponents.js` unter dem Schlüssel `Emt` angegeben werden.

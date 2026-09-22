| položka | zdroj | status | poznámka |
| --- | --- | --- | --- |
| A — logika a invarianty | `docs/spec.md`, `tests/spec-invariants.test.ts` | ASSIGNED | Výhradní vlastník: `src/timer.ts`, `tests/spec-invariants.test.ts`, tento append-only stavový soubor. |
| B — UI a integrace | `docs/spec.md` | ASSIGNED | Výhradní vlastník: `index.html`, `src/main.ts`, `src/style.css`, `tsconfig.json`, `vite.config.ts`, `package.json`, `package-lock.json`. |
| UI kontrola 100/3 | uživatel | NOT_APPLICABLE | Výslovně ignorovat; šlo o text z jiného problému. |
| A — logika a invarianty | `docs/spec.md`, `tests/spec-invariants.test.ts` | IMPLEMENTED | Přidán `src/timer.ts`: přísně budoucí 15s hranice, vzory :00/:15/:30/:45 a okno doručení 0–250 ms včetně. Čeká ověření testy. |
| A — logika a invarianty | `npm test`, `git diff --check` | PASS | Vitest: 1 soubor, 3 testy passed. Kontrola diffu bez chyb; připraveno k nezávislému review. |

| položka | zdroj | status | poznámka |
| --- | --- | --- | --- |
| A — logika a invarianty | `docs/spec.md`, `tests/spec-invariants.test.ts` | ASSIGNED | Výhradní vlastník: `src/timer.ts`, `tests/spec-invariants.test.ts`, tento append-only stavový soubor. |
| B — UI a integrace | `docs/spec.md` | ASSIGNED | Výhradní vlastník: `index.html`, `src/main.ts`, `src/style.css`, `tsconfig.json`, `vite.config.ts`, `package.json`, `package-lock.json`. |
| UI kontrola 100/3 | uživatel | NOT_APPLICABLE | Výslovně ignorovat; šlo o text z jiného problému. |
| A — logika a invarianty | `docs/spec.md`, `tests/spec-invariants.test.ts` | IMPLEMENTED | Přidán `src/timer.ts`: přísně budoucí 15s hranice, vzory :00/:15/:30/:45 a okno doručení 0–250 ms včetně. Čeká ověření testy. |
| A — logika a invarianty | `npm test`, `git diff --check` | PASS | Vitest: 1 soubor, 3 testy passed. Kontrola diffu bez chyb; připraveno k nezávislému review. |
| A — logika a invarianty | https://github.com/harrywebdev/gym_interval_timer/issues/1 | REJECT | Nezávislý reviewer odhalil zobecněnou chybu: záporný zbytek JavaScriptu v `cueForBoundary` mapoval záporné čtvrtminutové hranice mimo vzor hodin. |
| A — logika a invarianty | `npm test`, `git diff --check` | PASS | Opraven normalizovaný modulo indexu na 0–3; přidán property/regresní test pro 2 000 záporných hranic a `-15 000 → :45 → 3` pípnutí. Vitest: 4 testy passed. |
| A — logika a invarianty | nezávislý reviewer | PASS | Druhé oddělené review po opravě ticketu #1: všechny relevantní invarianty prošly, `npm test` 4/4 PASS. |
| B — UI a integrace | https://github.com/harrywebdev/gym_interval_timer/issues/2 | REJECT | Nezávislý reviewer: chybí import/instanciace timeru, funkční Start/Stop, audio/persistence/offline cesta a testy se bez `src/timer.ts` nesbírají. |
| B — UI a integrace | ticket #2, rebase na `work/logic` | IN_PROGRESS | B pokračuje nad reviewed kontraktem bez merge worktree; vlastní pouze integrační/UI/PWA/dokumentační soubory a doplní browserovou regresní kontrolu. |
| B — UI a integrace | nezávislý reviewer, ticket #2 | REJECT | SW cache při první nekontrolované návštěvě nezachytí hashované assety pro okamžitý offline reload; browser suite nedokončila v omezeném sandboxovém běhu. |
| B — UI a integrace | ticket #2 | IN_PROGRESS | Opravit offline cache zobecněně s regresním testem a interně omezit délku browser testu; skutečný browser výsledek zůstane evidence pro další review. |
| B — UI a integrace | nezávislý reviewer, ticket #2 | REJECT | Offline cache je staticky ověřená a Vitest/build PASS, ale povinný Playwright běh po 30,2 s skončil `timedout` bez dokončených výsledků; reviewer podle pravidel nemůže dát PASS. |

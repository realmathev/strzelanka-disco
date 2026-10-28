# Prośby od ds-input-menus (poza js/ui, js/input, css)

Nowe opcje (pola `opt`, domyślne wartości w `js/input/optdefs.js`, bo DEF_OPT w core/save.js jest poza moją własnością; ds-architect może je przenieść):
1. **player/input.js, mousemove**: czułość z `DS.input.sensitivity()` zamiast `opt.sens` (uwzględnia `opt.adsSens` w trakcie ADS).
2. **ds-gunfeel (ADS)**: czytaj `DS.input.isDown('ads')` (tryb przytrzymaj/przełącz obsługuje warstwa input); `DS.input.adsActive()`.
3. **player.js**: akcja `crouch` (`DS.input.isDown('crouch')`), `melee` (`pressed('melee')`), `perkMenu` zarejestrowane, nic ich jeszcze nie czyta. Sprint przełączany też przez `isDown('sprint')`.
4. **audio/sfx**: `opt.hitVol` (0..1) skaluje dźwięk trafień. **game/combat.js, addFloater liczb obrażeń**: pomiń przy `opt.dmgNum===0`.
5. **game/waves, combat**: `opt.difficulty` ('easy'|'normal'|'hard'); `opt.level` = wybrany poziom (ui woła `loadLevel(id)`, gdy różni się od `world.level.id`; wymaga sprzątania sceny w loadLevel po stronie ds-level-designer). Zdarzenie `levelSelect {level}`.
6. Zdarzenia dodane przez input: `input:down/up {action,code}` (tylko w grze), `keys` (zmiana przypisań). `DS.input.pressed(id)` = prawda w klatce wciśnięcia.
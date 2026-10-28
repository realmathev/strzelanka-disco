---
name: ds-input-menus
description: Faza 1d Disco Strzelnicy. Przebudowa menu głównego i podmenu, rozbudowane opcje, system akcji z przypisywaniem klawiszy (rebind).
model: sonnet
tools: Read, Write, Edit, Glob, Grep, PowerShell
---

Najpierw przeczytaj `ARCHITECTURE.md`. Edytujesz **tylko** `js/ui/`, `js/input/` i `css/`.

## Zadania

1. **System akcji** (`DS.input`): wszystkie sterowania jako nazwane akcje (move_fwd/back/left/right, fire, ads, reload, sprint, jump, crouch, use, heal, weapon_1..9, weapon_next/prev, melee, pause, perk_menu). Domyślne przypisania, odczyt przez `DS.input.isDown(action)`, `pressed(action)`, zdarzenia. Obsługa klawiatury i przycisków myszy. Gra ma pytać o akcje, nie o `e.code`.
2. **Rebind:** ekran Sterowanie: lista akcji, klik → „Naciśnij klawisz…”, wykrywanie konfliktów (zamiana lub odrzucenie), reset do domyślnych (per akcja i wszystkie), zapis w localStorage (migracja z `opt.v1` bez utraty ustawień), klawisz zarezerwowany Esc anuluje.
3. **Opcje:** Grafika (preset, rozdzielczość, FOV, zasięg, cienie, kontury, raster), Dźwięk (muzyka, efekty, utwór, głośność trafień), Sterowanie (czułość, osobna czułość ADS, odwrócenie Y, **przytrzymaj/przełącz** ADS, sprint, kucanie), Celownik (styl, kolor, rozmiar, kropka), Dostępność (intensywność błysków i wstrząsów, rozmiar napisów, wyciszenie onomatopei), Gra (trudność, wskaźniki obrażeń).
4. **Menu główne i podmenu:** nowy układ w obecnej estetyce komiksu: Graj (wybór poziomu, trudność), Sklep, Kasyno, Skrzynki, Ekwipunek (z podglądem 3D broni, jeśli `weapons/models` już jest), Kolekcja znajdziek, Osiągnięcia, Opcje, Wyjście. Płynne przejścia, nawigacja klawiaturą i padem, focus widoczny, `prefers-reduced-motion`.
5. Ekran pauzy z opcjami i rebindem w trakcie gry.

## Zasady

- Nie zmieniaj logiki sklepu/kasyna/skrzynek, tylko ich prezentację, jeśli zajdzie potrzeba.
- Dostępność: kontrast, rozmiary celów, `aria`, brak informacji tylko kolorem.
- Sprawdź w przeglądarce (`mcp__Claude_Browser__*`) wąski i szeroki widok.

Raport ≤ 15 linii.

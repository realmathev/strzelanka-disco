---
name: ds-weapon-modeler
description: Faza 1b Disco Strzelnicy. Proceduralne modele 3D prawdziwych broni (viewmodel + model świata) z działającymi przyrządami do ADS. Odpalać osobno dla jednej klasy broni (pistolety, PM, strzelby, karabiny, wyborowe, LKM).
model: sonnet
tools: Read, Write, Edit, Glob, Grep, PowerShell, WebSearch, WebFetch
---

Najpierw przeczytaj `ARCHITECTURE.md` i `PLAN.md`. Edytujesz **tylko** `js/weapons/models/`. Dane broni (`js/weapons/data/`) czytaj, nie zmieniaj.

W prompcie dostaniesz **klasę broni** do zrobienia (np. „pistolety”). Rób tylko ją.

## Wymagania per broń

- Realne proporcje i wymiary w metrach (długość lufy, wysokość chwytu, szerokość zamka) według zdjęć/rysunków referencyjnych. Wyszukaj referencję i zapisz w komentarzu nad modelem (nazwa + wymiary kluczowe).
- Budowa z prymitywów Three.js (Box, Cylinder, Extrude z sylwetki, Lathe do luf i tłumików). Rozpoznawalna sylwetka i charakterystyczne elementy (np. szyna Picatinny, kolba składana AKMS, magazynek bananowy AKM, łoże i chwyt pistoletowy MP5, zamek i dźwignia Mosina, taśma PKM).
- Styl: materiały toon + kontury z `render/` (jak reszta gry), czytelne w komiksowej oprawie.
- **Przyrządy do ADS:** muszka + szczerbinka (lub dioptr, kolimator, luneta PSO-1 z siatką) jako obiekty, ze znacznikiem `sightAnchor` (punkt, na który kamera ma się ustawić w ADS) oraz `muzzle`, `ejectionPort`, `magazine` (do animacji przeładowania) jako nazwane dzieci. W ADS linia: oko → szczerbinka → muszka → cel musi się zgadzać z osią lufy.
- Osobny `getWorldModel()` (uproszczony, do upuszczonej broni) i `getViewModel()` (szczegółowy).
- Ruchome części, które będą animowane (zamek, magazynek, kurek, dźwignia pump): osobne grupy z pivotem w poprawnym punkcie.
- Budżet: viewmodel ≤ 1500 trójkątów, świat ≤ 300. Geometrię i materiały buduj raz i współdziel.

## Weryfikacja

Zrób stronę `tools/weapon-viewer.html` (jeśli jej brak): obracana broń na stojaku, przełącznik ADS pokazujący widok przez przyrządy. Sprawdź każdy model w przeglądarce (`mcp__Claude_Browser__*`) i oceń sylwetkę przy porównaniu z referencją. Popraw, aż rozpoznasz broń bez podpisu.

Raport ≤ 15 linii: które modele gotowe, co uproszczone, ile trójkątów.

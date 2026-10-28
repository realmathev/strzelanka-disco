---
name: ds-gunfeel
description: Faza 2a Disco Strzelnicy. Feeling broni: ADS, odrzut (sprężyna + krzywa), sway/bob, animacje dobycia i przeładowania, błysk, łuski, smugi, ślady trafień, hitmarker, warstwowy dźwięk strzału. Odpalać po 1a i 1b.
model: opus
tools: Read, Write, Edit, Glob, Grep, PowerShell, WebSearch, WebFetch
---

Najpierw przeczytaj `ARCHITECTURE.md` i sekcję „Feeling broni” w `PLAN.md`. Edytujesz **tylko** `js/gunfeel/` i `js/audio/gunsfx.js`. Modele broni i dane czytasz przez rejestr, nie zmieniasz.

Zasada nadrzędna: **feel kosmetyczny oddziel od balansu**. Wszystkie liczby feelingu w `js/gunfeel/tuning.js`, per broń i globalne, żeby stroić bez ruszania obrażeń i rozrzutu.

## Zadania

1. **ADS:** wejście z akcji `ads` (przytrzymaj/przełącz z opcji), płynne przesunięcie viewmodelu tak, by `sightAnchor` trafił w oś kamery, zmiana FOV per broń, krzywa ease w obie strony, zmniejszony rozrzut i prędkość ruchu, tłumienie bobu, widoczność przyrządów. Lunety: siatka rysowana na tekście, zoom przez FOV (render-to-texture opcjonalnie, jeśli wydajność pozwala).
2. **Odrzut:** sprężyna tłumiona (impuls → przeregulowanie → powrót) dla ciężaru **plus** krzywa dla charakterystycznego kopniaka; pula 3–5 lekko różnych wzorców na broń z losową składową; kolejne strzały sumują się; powrót ease-out. Osobno kamera (aim punch, częściowo wraca) i viewmodel (cofnięcie, uniesienie lufy, rotacja).
3. **Ruch:** sway od obrotu myszy, bob od chodu i sprintu, pozycja sprintu (broń opuszczona), skok i lądowanie, oddychanie w ADS (lufa lekko wędruje, mocniej w lunecie).
4. **Animacje proceduralne (fazy):** dobycie, przeładowanie (wyjęcie magazynka → włożenie → przeładowanie zamka, wariant „na zamku” gdy pusty), pompowanie Mossberga, zamek Mosina, taśma PKM. Użyj nazwanych części z modeli (`magazine`, `ejectionPort`, zamek).
5. **Efekty strzału:** błysk wylotowy (sprite + chwilowe światło), wyrzut łuski ze zmierzchem fizyki (puli obiektów), dym z lufy, smuga pocisku, ślady trafień i iskry na różnych powierzchniach, krew/komiksowe onomatopeje przy wrogach, **hitmarker** (osobny dla headshota i zabicia), hit-stop przy zabiciu (≤ 40 ms, wyłączalny w opcjach dostępności).
6. **Dźwięk (`gunsfx.js`, proceduralny Web Audio):** strzał w warstwach (trzask, dudnienie, ogon pomieszczenia), inna charakterystyka per kaliber, dźwięk martwego spustu, kliknięcia mechaniki przy przeładowaniu, krótkie opóźnienie trafienia zgodne z odległością (małe, żeby nie psuło pętli zwrotnej), tłumienie wysokich częstotliwości przy odległych strzałach.
7. **Intensywność:** wszystko skaluje z opcji efektów (`Bezpieczna`/`Normalna`/`Maksymalna`); w trybie bezpiecznym brak błysków światła i trzęsienia kamery.

## Weryfikacja

Sprawdź w przeglądarce (`mcp__Claude_Browser__*`) każdą klasę broni: nagraj sekwencję (strzał, seria, ADS, przeładowanie). Zmierz FPS przy serii z Uzi/PKM (cel: bez spadku poniżej 55 FPS na presecie „Wysoka”). Zapisz wartości początkowe i uzasadnienie w `js/gunfeel/TUNING.md`.

Raport ≤ 20 linii: co działa, które liczby najbardziej wpływają na odczucie, co do dalszego strojenia przez gracza.

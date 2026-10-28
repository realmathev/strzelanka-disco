---
name: ds-healing
description: Faza 1f Disco Strzelnicy. Więcej sposobów leczenia: apteczki, bandaże, adrenalina, kamizelka, jedzenie, automaty, regeneracja tarczy.
model: haiku
tools: Read, Write, Edit, Glob, Grep, PowerShell
---

Najpierw przeczytaj `ARCHITECTURE.md`. Edytujesz **tylko** `js/pickups/`.

## Zadania (wszystko przez `DS.pickups.register`)

- **Apteczka** (jest w grze, przenieś): natychmiastowe leczenie, klawisz H.
- **Bandaż:** powolne leczenie w czasie (przerywane obrażeniami, jeśli tak ustawisz w konfiguracji).
- **Adrenalina:** natychmiastowe +HP niewielkie, plus 8 s zwiększonej szybkości i mniejszego odrzutu.
- **Kamizelka:** osobny pasek pancerza, pochłania część obrażeń.
- **Jedzenie z mapy:** zapiekanka, kebab, Żubr z kaucją (leczenie + zabawny dymek), losowe z wagami.
- **Automat apteczny** i **stacje leczenia:** na mapie, jednorazowe lub z cooldownem, za ZD.
- **Regeneracja tarczy:** po 6 s bez obrażeń pasek tarczy się odnawia (wartość do opcji trudności).
- Wzorzec dropu z wrogów (szansa zależna od HP gracza: im mniej HP, tym większa szansa).

Każdy typ: dane (ilość, czas, dźwięk, onomatopeja), prosty model 3D (nisko-poligonowy, toon, wymiary realne), zdarzenia `heal`/`pickup` przez `DS.bus`. Konfiguracja liczb w `js/pickups/config.js`. HUD pokazuje stany przez zdarzenia (nie edytuj `ui`).

Raport ≤ 10 linii.

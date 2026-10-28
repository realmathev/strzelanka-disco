---
name: ds-world-modeler
description: Faza 1c Disco Strzelnicy. Biblioteka szczegółowych, realistycznych rekwizytów i budynków (latarnie, samochody, bloki, wagony itd.). Odpalać osobno dla jednej kategorii (miasto, osiedle, wnętrza, kolej, wieś, droga).
model: sonnet
tools: Read, Write, Edit, Glob, Grep, PowerShell, WebSearch, WebFetch
---

Najpierw przeczytaj `ARCHITECTURE.md` i `PLAN.md`. Edytujesz **tylko** `js/world/props/`.

W prompcie dostaniesz **kategorię** (np. „osiedle”). Rób tylko ją.

## Wymagania

- Każdy rekwizyt to fabryka `DS.props.register(name, (opts) => THREE.Group)` z prawdziwymi wymiarami w metrach (Fiat 126p ~3,05×1,38×1,35 m, ławka ~1,8 m, płyta blokowa, trzepak ~2,4 m, itp.). Zweryfikuj wymiary w sieci, zapisz w komentarzu.
- Realistyczne szczegóły: okna z ramami i parapetami, balkony, rynny, drzwi z klamkami, koła z felgami, lampy, tablice rejestracyjne, graffiti, pęknięcia, rdza (tekstury canvas, bez plików).
- Wersje wariantowe (kolor, zużycie, losowy detal) przez `opts.seed`, żeby mapy nie wyglądały jak kopiuj-wklej.
- **Kolizja:** każdy rekwizyt zwraca `userData.collider` (AABB lub lista) i `userData.cover` (czy daje osłonę).
- **Wydajność:** geometria i materiały współdzielone, rekwizyty powtarzalne przez `InstancedMesh` (`DS.props.instance(name, transforms)`), statyczne elementy scalaj. Cel: pojedynczy rekwizyt < 800 trójkątów, blok < 4000.
- Neony i oświetlone znaki: materiały emisyjne, **nigdy** `visible=false` do mrugania (znany błąd znikających neonów) — mruganie przez intensywność emisji.
- Styl: toon + kontury z `render/`, kształty realistyczne.

## Weryfikacja

`tools/prop-viewer.html`: siatka wszystkich zarejestrowanych rekwizytów z podpisami i wymiarami. Obejrzyj w przeglądarce (`mcp__Claude_Browser__*`), porównaj z referencją, popraw proporcje.

Raport ≤ 15 linii: lista rekwizytów, trójkąty, co uproszczone.

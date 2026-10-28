# Prośby i kontrakt od ds-weapon-modeler (klasa: pistolety)

## Kontrakt modeli (dla ds-gunfeel)
Pistolety są w `js/weapons/models/pistols.js` (+ `pistol-kit.js`). `DS.weapons.get(id).model(...)` działa jak dotąd (buildGun bez zmian),
a na definicji broni są dodatkowo: `getViewModel(mats?)`, `getWorldModel(mats?)` (świat, ≤300 tri), `sightAnchor`, `sightRear`, `sightFront`
(Vector3, metry, układ modelu = układ `group` z buildGun), `modelTris()`. `group.userData` (po `model()`): `parts`, `muzzle`, `sightAnchor`,
`sightRear`, `sightFront`, `eyeRelief`, `anim(t)`; części nazwane (`getObjectByName`): `muzzle`, `ejectionPort`, `sightAnchor`, `magazine`, `slide`, `trigger`
(Python: `hammer`, `trigger`, `magazine` = dźwignia z bębnem, w `parts` także `cylinderSwing`, zagnieżdżony `cylinder`). Spoczynek części: `part.userData.p0`.

**ADS:** `sightAnchor` to punkt OKA (leży na linii celowania `eyeRelief` za szczerbinką, ~0,19–0,23 m). W ADS ustaw viewmodel tak, by
`gunRoot.position + sightAnchor` (z uwzględnieniem obrotu) wypadło w początku kamery (0,0,0). Wtedy oko → szczerbinka → muszka leży na osi −Z,
równoległej do lufy (linia celowania jest 22–31 mm nad osią lufy; zgodność sprawdza `tools/weapon-viewer.html`, przycisk ADS).
Wylot: `muzzle` (Vector3 ustawiany przez `model()`), oś lufy y=0, z=wylot.

## Prośby poza `models/`
1. **`weapons/viewmodel.js` `buildGun`**: dodać zabezpieczenie `const W=DS.weapons.get(id); if(typeof W.model==='function') W.model(...)`. Dziś każda broń ma stub z danych,
   ale stub tylko ustawia `muzzle`, a nowa broń bez `model` wywali grę.
2. **`buildGun` przecieka**: stary `gunModel` jest tylko zdejmowany z `gunRoot`, a jego kontury zostają w `outlines` (lista rośnie przy każdej zmianie broni).
   Warto wołać `disposeObject`-podobne sprzątanie (kontury z `hullGeo` mają `userData.hull=true`; geometrie z modeli są współdzielone: `geometry.userData.shared=true`, nie zwalniać).
3. **Skórki**: modele używają `mat1` (zamek/lufa/rama) i `mat2` (szkielet); okładziny/muszki mają własne stałe materiały, więc skórki ich nie zmieniają (zamierzone).

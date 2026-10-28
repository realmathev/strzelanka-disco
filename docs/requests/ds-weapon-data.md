# Prośby od ds-weapon-data (do ds-architect / ds-input-menus)

1. **Duplikat Uzi.** `legacy.js` ma `smg` („Uzi „Weselne””, 15 dmg), a `data/uzi.js` to nowy `uzi` (Uzi 9×19, 30 dmg). Do decyzji: usunąć/zastąpić `smg` w legacy, albo zostawić oba. legacy.js nie był zmieniany.
2. **Klawisze 5–19.** Nowe bronie mają `key` '5'…'19' (kolejność rejestracji). `DS.input` ma tylko `weapon1–4`, a `weaponNext/Prev` przechodzą po `ids()`. Trzeba zdecydować, czy dodać akcje weapon5+ czy zostawić przewijanie.
3. **BALANCE.md.** Formuły i tabela są w `js/weapons/data/BALANCE.md` (utworzony). Formuła skrócona jest też w komentarzu `data/index.js`.
4. **Nowe pola w danych.** Każda broń ma `slot`, `adsFov`, `adsTime`, `moveMult`, `moveMultAds`, `recoil:{pitch,yaw,recovery}`. Silnik ich jeszcze nie czyta, więc nic się nie psuje. ds-gunfeel może z nich korzystać. Dodatkowo `real.mag_x` (powiększenie) dla SVD i Mosina.
5. **Stuby model().** `buildGun` wywołuje `model()` bez sprawdzenia, więc bez stubu zmiana na broń kończy się błędem. Każdy plik ma stub z `muzzle`. ds-weapon-modeler musi nadpisać wszystkie 15 w `models/`.
6. **Dźwięki.** `sfx.js` zna tylko `pistol|smg|shotgun|rifle`; nowe bronie używają tych nazw. Osobne dźwięki wymagają `sfxBank` (ds-gunfeel).
7. **Wartości unverified** (w `real.unv`): patrz sekcja „Niepewne wartości” w BALANCE.md.

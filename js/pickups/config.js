// Liczby leczenia, pancerza i dropów (właściciel: ds-healing). Balans tylko tutaj.
export const CFG={
  // Apteczka z ekwipunku (H), medkit.js.
  medkit:{heal:50},
  // Bandaż z mapy: total HP rozłożone na dur sekund; breakOnHit = obrażenia przerywają leczenie.
  bandage:{total:30,dur:8,breakOnHit:true},
  // Adrenalina z mapy: natychmiastowe HP + czas działania (speed/recoil czyta player/gunfeel z S.G.adrenT).
  adrenaline:{heal:15,time:8,sprintMul:1.35,recoilMul:.7},
  // Kamizelka: dodaje pancerz (max = pasek); absorb = ułamek obrażeń pochłaniany przez pancerz.
  vest:{add:50,max:100,absorb:.5},
  // Regeneracja tarczy (pancerza): delay s bez obrażeń, potem regen pancerza/s zależnie od trudności (opt.difficulty).
  shield:{delay:6,regen:{easy:9,normal:5,hard:2}},
  // Jedzenie z mapy: heal HP, w = waga w losowaniu; Żubr zwraca kaucję (deposit ZD).
  food:{zapiekanka:{heal:20,w:40},kebab:{heal:35,w:35},zubr:{heal:8,deposit:3,w:25}},
  // Drop z wroga: szansa = base + lowHp*(1 - hp/maxHp); boss x bossMul. Wagi tabeli łupów.
  drop:{base:.06,lowHp:.22,bossMul:2,
    table:{med:20,bandage:25,adrenaline:15,food:30,vest:10}},
  // Automaty na mapie (E w pobliżu): price ZD, heal HP, cooldown s (vending) / jednorazowe (station).
  machines:{
    vending:{price:40,heal:40,cooldown:20},
    station:{price:100,heal:9999,armor:true},
  },
  useRange:2.2,
};

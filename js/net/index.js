// Co-op (JuicyJuicy rooms). Projekt: docs/COOP.md, protokół i hooki: ARCHITECTURE.md („Sieć / co-op”).
//  proto.js     rodzaje wiadomości, walidacja, kwantyzacja
//  interp.js    bufor próbek i interpolacja (~100 ms)
//  session.js   pokój, lista graczy, odbiór z walidacją i limitem, API DS.net
//  avatars.js   awatary pozostałych graczy
//  replicas.js  klient: repliki wrogów ze snapshotów
//  host.js      host: cele AI, trafienia zdalne, snapshoty, rany zdalnych graczy
//  world.js     znajdźki pod kontrolą hosta, drzwi/windy/beczki/automaty (stan `ws`)
//  coop.js      przebieg runu: start, `in`, strzały, powalenie/podnoszenie, koniec, poziom ukończony, „Dalej”
//  lobby.js     ekran „Graj ze znajomymi”
import './session.js';
import './host.js';
import './world.js';
import './replicas.js';
import './coop.js';
import './lobby.js';

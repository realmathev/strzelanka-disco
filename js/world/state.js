// Stan świata bieżącego poziomu. Jednostki: metry, +Y w górę.
import {DS} from '../core/ds.js';

export const world={
  level:null,     // definicja aktywnego poziomu (DS.levels)
  arena:42,       // połowa boku grywalnego kwadratu (gracz/wrogowie są do niego przycinani)
  colliders:[],   // AABB w XZ: {x0,x1,z0,z1,h}
  meshes:[],      // statyczna geometria trafiana raycastem (strzały, linia wzroku)
  neon:[],        // szyldy neonowe (migotanie w animateWorld)
  bulbs:[],       // InstancedMesh-e żarówek kasyna (kolor per instancja ustawia animateWorld)
};
DS.world=world;

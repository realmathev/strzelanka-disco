// Współdzielony, zmienny stan sesji. ES moduły nie pozwalają przypisać importu,
// dlatego wszystko, co bywa podmieniane (G, mode...), żyje jako pola obiektu S.
export const S={
  G:null,          // stan bieżącego runu (game/run.js: newRun) albo null
  mode:'warn',     // 'warn' | 'menu' | 'game'
  mouseDown:false, // przytrzymany spust (akcja 'fire')
  fxTap:null,      // co-op (host): fn(rodzaj,...args) podgląda efekty kosmetyczne wrogów (napisy, dźwięki e_*, smugi, dym), żeby wysłać je klientom
};

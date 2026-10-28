// Wspólne klocki typów wrogów: fabryka człowieka, rejestracja, atak wręcz, skalowanie z falą.
import {rand,pick,clamp} from '../core/util.js';
import {DS} from '../core/ds.js';
import {P} from '../player/player.js';
import {humanModel,assemble,SKIN} from './kit.js';
import {initAI,updateAI,dyingHuman,moveToward,stopMove,hitPlayer,faceTo} from './ai.js';
import {sfx} from '../audio/sfx.js';

export {SKIN,rand,pick,clamp};
export const wv=(base,per,w)=>base+per*Math.min(w,40);
/** Wariant modelu 0..n-1: z opts.variant (testy, arena) albo losowy. Mało wariantów = mało geometrii na GPU. */
export const variantOf=(o,n)=>o.variant!==undefined?o.variant%n:Math.floor(Math.random()*n);

/**
 * Składa wroga-człowieka. spec: {key (klucz modelu: typ+wariant), build(P,meta), meta, hp, dmg, radius, scale, boss, name, xp, cfg, opts}
 * Model (geometria) jest budowany raz na klucz; wróg dostaje własny materiał i grupę.
 */
export function makeHuman(spec){
  const model=humanModel(spec.key,spec.build,spec.meta);
  const e=assemble(model);
  e.mats=[e.mat];e.alive=true;e.dieT=0;e.boss=!!spec.boss;e.hp=e.maxHp=spec.hp;e.dmg=spec.dmg;e.radius=spec.radius||.5;
  e.name=spec.name;e.xp=spec.xp;e.hipH=model.meta.hipH;e.headY=model.meta.headY;
  e.g.scale.setScalar(spec.scale||1);
  if(!spec.boss)e.mat.color.setScalar(rand(.9,1.06));                    // drobna zmiana jasności zamiast kolejnych wariantów geometrii
  initAI(e,spec.cfg,spec.opts);
  if(spec.setup)spec.setup(e);
  return e;
}
/** Rejestruje typ z domyślnym update/dying. extra: {drops, xp, onKill...}. */
export function reg(id,name,create,extra){
  DS.enemies.register(Object.assign({id,name,create,update:updateAI,dying:dyingHuman},extra));
}
/** Opcje wspólne: czy wróg zna położenie gracza (fale) i jaki ma punkt domowy patrolu. */
export const aiOpts=o=>({aware:o.aware!==false,wave:o.aware!==false&&!o.noRelentless,home:o.at||null});

/** Atak wręcz: dojście, zamach (cofnięcie), cios (wyskok do przodu), przerwa. Telegrafuje zamach, trafienie sprawdza dystans i kierunek. */
export function meleeAttack(e,dt,ctx,o){
  const a=e.ai,c=e.cfg;
  a.face=1;a.cd-=dt;
  switch(a.sub){
    case 0:
      if(ctx.dist>o.reach*.85){moveToward(e,dt,P.pos.x,P.pos.z,c.speed*(o.approach||1),o.reach*.7);e.lean=0}
      else{stopMove(e,dt);if(a.cd<=0){a.sub=1;a.st=0;if(o.snd)sfx(o.snd)}}
      break;
    case 1:
      a.st+=dt;stopMove(e,dt);e.lean=-.35*Math.min(1,a.st/o.windup);if(e.armR)e.armT=-.9*Math.min(1,a.st/o.windup);
      if(a.st>=o.windup){a.sub=2;a.st=0;e.lean=.75;if(e.armR)e.armT=.8;sfx('e_whoosh');
        if(ctx.dist<o.reach*1.3){const ok=hitPlayer(e,o.dmg);if(ok){P.vel.x+=ctx.nx*(o.knock||5);P.vel.z+=ctx.nz*(o.knock||5);if(o.hitSnd)sfx(o.hitSnd)}}}
      break;
    case 2:
      a.st+=dt;if(a.st>.2){a.sub=3;a.st=0;e.lean=0;if(e.armR)e.armT=0}
      break;
    case 3:
      a.st+=dt;stopMove(e,dt);if(a.st>=o.cool){a.sub=0;a.cd=0}
      break;
  }
}

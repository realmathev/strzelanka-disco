// Rejestr definicji (broń, wrogowie, poziomy...). Kolejność rejestracji = kolejność w ids()/all().
// Ponowna rejestracja tego samego id nadpisuje definicję, zachowując jej pozycję.
export function createRegistry(kind){
  const map=new Map();
  return {
    kind,
    register(def){
      if(!def||typeof def.id!=='string'||!def.id)throw new Error(`DS.${kind}.register: wymagane pole "id"`);
      map.set(def.id,def);return def;
    },
    get(id){return map.get(id)},
    has(id){return map.has(id)},
    remove(id){return map.delete(id)},
    ids(){return [...map.keys()]},
    all(){return [...map.values()]},
  };
}

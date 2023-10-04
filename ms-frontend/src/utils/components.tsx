export type StringMapObject = { [key: string]: string };
export type NumberMapObject = { [key: number]: string };
export type StringMap = Map<string, string>;
export type NumberMap = Map<number, string>;  
export type StringMapR = ReadonlyMap<string, string>;
export type NumberMapR = ReadonlyMap<number, string>;  

// eslint-disable-next-line no-unused-vars
type NumberStringFunction = (key: number) => string;
// eslint-disable-next-line no-unused-vars
type StringStringFunction = (key: string) => string;


export const asReadonly = <K, V>(attrs: Map<K, V>): ReadonlyMap<K, V> => {
  const trueRuntimeReadonlyMap: ReadonlyMap<K, V> = Object.freeze({
    entries: attrs.entries.bind(attrs),
    forEach: attrs.forEach.bind(attrs),
    get: attrs.get.bind(attrs),
    has: attrs.has.bind(attrs),
    keys: attrs.keys.bind(attrs),
    size: attrs.size,
    values: attrs.values.bind(attrs),
    [Symbol.iterator]: attrs[Symbol.iterator].bind(attrs)
  });
  return trueRuntimeReadonlyMap;
};

// number

export const composeOptions = (list: NumberMapR | StringMapR) => {
  const ret = [...list.entries()].map(([x, y], i) => (
    <option key={`key_${x}_${i}`} value={x}>{y}</option>
  ));
  return ret;
};

const DEFAULT_UNMATCHED = 'その他';


export const useNumberOptionsMap = (list: NumberMap, unmatched?: string):
  [NumberMapR, NumberStringFunction] => {
  return [
    asReadonly(list),
    (type: number): string => {
      return list.get(type) ?? `${unmatched ?? DEFAULT_UNMATCHED} (${type})`;
    }
  ];
};

export const useNumberOptionsArray = (array: number[], map?: NumberStringFunction, unmatched?: string):
  [NumberMapR, NumberStringFunction] => {
  const map2: NumberMap = new Map();
  array.forEach(x => { 
    const y = map !== undefined ? map(x) : String(x); 
    if (y !== undefined) map2.set(x, y); 
  });
  return useNumberOptionsMap(map2, unmatched);
};

export const useNumberOptionsObject = (list: NumberMapObject, unmatched?: string):
  [NumberMapR, NumberStringFunction] => {
  const map2: NumberMap = new Map();
  for (const key in list) {
    map2.set(Number(key), list[key]);
  }
  return useNumberOptionsMap(map2, unmatched);
};

// eslint-disable-next-line no-unused-vars
export function useNumberOptions(list: NumberMapObject | NumberMap, unmatched?: string): [NumberMapR, NumberStringFunction];
// eslint-disable-next-line no-unused-vars
export function useNumberOptions(array: number[], map?: (key: number) => string, unmatched?: string): [NumberMapR, NumberStringFunction];
export function useNumberOptions(arg1: NumberMapObject | NumberMap | number[], arg2?: string | NumberStringFunction, arg3?: string) {
  if (arg1 instanceof Array)
    return useNumberOptionsArray(arg1, arg2 as NumberStringFunction, arg3);
  if (arg1 instanceof Map)
    return useNumberOptionsMap(arg1, arg2 as string);
  return useNumberOptionsObject(arg1, arg2 as string);
}

// string

export const useStringOptionsMap = (list: StringMap, unmatched?: string):
  [StringMapR, StringStringFunction] => {
  return [
    asReadonly(list),
    (type: string): string => {
      return list.get(type) ?? `${unmatched ?? DEFAULT_UNMATCHED} (${type})`;
    }
  ];
};

export const useStringOptionsArray = (array: string[], map?: StringStringFunction, unmatched?: string):
  [StringMapR, StringStringFunction] => {
  const map2: StringMap = new Map();
  array.forEach(x => { 
    const y = map !== undefined ? map(x) : String(x); 
    if (y !== undefined) map2.set(x, y); 
  });
  return useStringOptionsMap(map2, unmatched);
};

export const useStringOptionsObject = (list: StringMapObject, unmatched?: string):
  [StringMapR, StringStringFunction] => {
  const map2: StringMap = new Map();
  for (const key in list) {
    map2.set(String(key), list[key]);
  }
  return useStringOptionsMap(map2, unmatched);
};

// eslint-disable-next-line no-unused-vars
export function useStringOptions(list: StringMapObject | StringMap, unmatched?: string): [StringMapR, StringStringFunction];
// eslint-disable-next-line no-unused-vars
export function useStringOptions(array: string[], map?: (key: string) => string, unmatched?: string): [StringMapR, StringStringFunction];
export function useStringOptions(arg1: StringMapObject | StringMap | string[], arg2?: string | StringStringFunction, arg3?: string) {
  if (arg1 instanceof Array)
    return useStringOptionsArray(arg1, arg2 as StringStringFunction, arg3);
  if (arg1 instanceof Map)
    return useStringOptionsMap(arg1, arg2 as string);
  return useStringOptionsObject(arg1, arg2 as string);
}
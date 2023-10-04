export const arraysEqual = (a: unknown[] | undefined, b: unknown[] | undefined): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const findCommonPrefixLength = (arr1: unknown[], arr2: unknown[]) => {
  const minLength = Math.min(arr1.length, arr2.length);
  let commonPrefixLength = 0;

  for (let i = 0; i < minLength; i++) {
    if (arr1[i] === arr2[i]) {
      commonPrefixLength++;
    } else {
      break;
    }
  }

  return commonPrefixLength;
};

export const getInsertedArray = <T>(arr: T[], obj: T, index?: number) => {
  if (index == undefined || index >= arr.length)
    return [...arr, obj];
  if (index <= 0)
    return [obj, ...arr];
  return [...arr.slice(0, index), obj, ...arr.slice(index)];
};

export const getChangedArray = <T>(arr: T[], obj: T, index: number) => {
  if (index < 0 || index >= arr.length)
    return [...arr];
  return [...arr.slice(0, index), obj, ...arr.slice(index + 1)];
};

export const getDeletedArray = <T>(arr: T[], index: number) => {
  if (index < 0 || index >= arr.length)
    return [...arr];
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
};

export const isEmptyObj = (obj: unknown) => {
  if (obj == null) {
    return true;
  }
  if (typeof obj !== 'object') {
    return false;
  }
  return Object.keys(obj).length === 0;
};

export type AjaxPayload = {
  [key: string]: string | number
};

export const getDiff = <T extends AjaxPayload = AjaxPayload>(org: T, data: T) => {
  const diff: AjaxPayload = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const val: string | number = data[key];
      const orgVal = org[key];
      if (val === orgVal || (isEmptyObj(val) && isEmptyObj(orgVal))) {
        continue;
      }
      if (Array.isArray(val) && arraysEqual(orgVal as unknown as unknown[], val)) {
        continue;
      }
      diff[key] = val;
    }
  }
  return diff as Partial<T>;
};

// eslint-disable-next-line no-unused-vars
export const mergeArray = <T extends object>(dst: T[], src: T[], key: (object: object) => string): T[] => {
  const dstDict: { [key: string]: T } = {};
  dst.forEach(x => dstDict[key(x)] = x);
  src.forEach(x => dstDict[key(x)] = x);
  return Object.values(dstDict);
};

export const deepCopy = <T>(obj: T): T => {
  if (typeof obj !== 'object')
    return obj;
  if (obj instanceof Function)
    return obj;
  return JSON.parse(JSON.stringify(obj));
};
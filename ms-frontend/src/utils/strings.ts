export const truncateString = (str: string, len?: number) => {
  if (len == undefined || isNaN(Number(len)))
    len = 16;
  len = Math.max(len, 4);
  if (str.length <= len)
    return str;
  return str.substring(0, len - 1) + '…';
};

export const concludeString = (str: string, len?: number) => {
  str = str.trim().replace(/[\n\r]+/g, ' ');
  return str ? truncateString(str, len) : '<空白>';
};

const STORAGE_UNITS_1024 = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
const STORAGE_UNITS_1000 = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
export const formatStorage = (bytes: number, base1000?: boolean): string => {
  bytes = Math.round(bytes);
  if (isNaN(bytes) || !isFinite(bytes))
    bytes = 0;
  if (bytes == 0)
    return '0.00B';
  else if (bytes < 0)
    return formatStorage(-bytes, base1000);
  const bytesInt = bytes;
  const base = base1000 ? 1000 : 1024;
  const unit = Math.floor(Math.log(bytesInt) / Math.log(base));
  const diffBase = (bytesInt / Math.pow(base, unit)).toFixed(2);
  return `${diffBase}${(base1000 ? STORAGE_UNITS_1000 : STORAGE_UNITS_1024)[unit]}`;
};

export const parseStorage = (str: string, base1000?: boolean): number => {
  let unit = 1;
  let num = 0;
  str = str.trim().toLowerCase();
  let uFlag = false;
  for (const i in STORAGE_UNITS_1024) {
    if (str.endsWith(STORAGE_UNITS_1024[i].toLowerCase())) {
      unit = Math.pow(base1000 ? 1000 : 1024, Number(i));
      num = Number(str.substring(0, str.length - STORAGE_UNITS_1024[i].length).trim());
      if (!isNaN(num)) {
        uFlag = true;
        break;
      }
    } else if (str.endsWith(STORAGE_UNITS_1000[i].toLowerCase())) {
      unit = Math.pow(1000, Number(i));
      num = Number(str.substring(0, str.length - STORAGE_UNITS_1000[i].length).trim());
      if (!isNaN(num)) {
        uFlag = true;
        break;
      }
    }
  }
  if (!uFlag)
    num = Number(str);
  return Math.round(num * unit);
};

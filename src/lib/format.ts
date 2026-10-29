const UNITS = ["B", "KB", "MB", "GB"];
const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/** 1536 → "1,5 KB". Uses 1024-based units, like most file managers. */
export function formatBytes(bytes: number) {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${number.format(value)} ${UNITS[unit]}`;
}

/** Size change as a signed percentage, e.g. "−75%" or "+3%". */
export function formatChange(before: number, after: number) {
  if (before === 0) return "0%";
  const percent = Math.round(((after - before) / before) * 100);
  if (percent === 0) return "0%";
  return percent < 0 ? `−${-percent}%` : `+${percent}%`;
}

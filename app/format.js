// Money formatting for HomeLedger. All figures are Indonesian Rupiah;
// US dollar equivalents use one stated rate so the reader can check them.
export const USD_RATE = 16500; // Rp per US$1, November 2026

// Full Rupiah: 8000000 -> "Rp 8.000.000"
export function rupiah(n) {
  const v = Math.round(Number(n) || 0);
  return 'Rp ' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Short Rupiah for chart labels: 8000000 -> "Rp 8 jt", 450000 -> "Rp 450 rb"
export function rupiahShort(n) {
  const v = Math.round(Number(n) || 0);
  if (v >= 1000000) {
    const jt = v / 1000000;
    return 'Rp ' + (Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')) + ' jt';
  }
  if (v >= 1000) return 'Rp ' + Math.round(v / 1000) + ' rb';
  return 'Rp ' + v;
}

// US dollar equivalent at the stated rate: 8000000 -> "$485"
export function usd(n) {
  const v = (Number(n) || 0) / USD_RATE;
  return '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(0));
}

// Rupiah plus its dollar equivalent: 8000000 -> "Rp 8.000.000 ($485)"
export function rupiahUsd(n) {
  return rupiah(n) + ' (' + usd(n) + ')';
}

// Percent of a whole, one decimal: pct(800000, 8000000) -> "10,0%"
export function pct(part, whole) {
  if (!whole) return '0%';
  return ((part / whole) * 100).toFixed(1).replace('.', ',') + '%';
}

// Small inline SVG charts for HomeLedger. No libraries, no network:
// every chart is a string of SVG built from the site's own numbers.

import { rupiahShort } from './format.js';

const PALETTE = ['#1d6b45', '#d9931e', '#2e7fa8', '#b4552d', '#6a4fa3', '#4d8a4f', '#a33c5e', '#5b7a29', '#8a6d3b'];

// Horizontal bars: one row per category, planned vs actually spent.
export function planVsActualBars(rows) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.planned, r.spent]));
  const width = 640;
  const rowH = 44;
  const height = rows.length * rowH + 8;
  const labelW = 150;
  const barW = width - labelW - 130;
  const body = rows
    .map((r, i) => {
      const y = 8 + i * rowH;
      const pw = Math.max(2, (r.planned / max) * barW);
      const sw = Math.max(r.spent > 0 ? 2 : 0, (r.spent / max) * barW);
      const over = r.spent > r.planned;
      return `<text x="0" y="${y + 13}" class="chart-label">${r.label}</text>
      <rect x="${labelW}" y="${y}" width="${pw}" height="13" rx="3" fill="#cfe3d6" />
      <rect x="${labelW}" y="${y + 17}" width="${sw}" height="13" rx="3" fill="${over ? '#b4552d' : '#1d6b45'}" />
      <text x="${labelW + barW + 8}" y="${y + 13}" class="chart-value">${rupiahShort(r.planned)}</text>
      <text x="${labelW + barW + 8}" y="${y + 30}" class="chart-value ${over ? 'over' : ''}">${rupiahShort(r.spent)}${over ? ' — over' : ''}</text>`;
    })
    .join('\n');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Planned versus spent by category" class="chart">${body}</svg>
  <p class="chart-key"><span class="key-swatch planned"></span> Planned &nbsp; <span class="key-swatch spent"></span> Spent so far &nbsp; <span class="key-swatch over"></span> Over plan</p>`;
}

// Donut: share of total spending by category.
export function spendingDonut(rows) {
  const total = rows.reduce((s, r) => s + r.spent, 0) || 1;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 82;
  const hole = 58;
  let angle = -Math.PI / 2;
  const slices = rows
    .filter((row) => row.spent > 0)
    .map((row, i) => {
      const frac = row.spent / total;
      const a0 = angle;
      const a1 = angle + frac * Math.PI * 2;
      angle = a1;
      const large = frac > 0.5 ? 1 : 0;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      return `<path d="M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${PALETTE[i % PALETTE.length]}" />`;
    })
    .join('\n');
  const legend = rows
    .map((row, i) => `<li><span class="dot" style="background:${PALETTE[i % PALETTE.length]}"></span>${row.label} — ${((row.spent / total) * 100).toFixed(0)}%</li>`)
    .join('\n');
  return `<div class="donut-wrap"><svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending share by category" class="donut">${slices}<circle cx="${cx}" cy="${cy}" r="${hole}" fill="#fffdf7" /><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-total">${rupiahShort(total)}</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-sub">spent in Nov</text></svg><ul class="donut-legend">${legend}</ul></div>`;
}

// Vertical bars: monthly spending trend with the Rp 8 jt income line.
export function monthlyBars(months, income) {
  const width = 640;
  const height = 240;
  const base = height - 34;
  const max = Math.max(income * 1.1, ...months.map((m) => m.spent));
  const gap = 14;
  const bw = (width - gap * (months.length + 1)) / months.length;
  const incomeY = base - (income / max) * (base - 20);
  const bars = months
    .map((m, i) => {
      const h = (m.spent / max) * (base - 20);
      const x = gap + i * (bw + gap);
      const over = m.spent > income;
      return `<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${over ? '#b4552d' : '#1d6b45'}" />
      <text x="${(x + bw / 2).toFixed(1)}" y="${(base - h - 6).toFixed(1)}" text-anchor="middle" class="chart-value">${rupiahShort(m.spent)}</text>
      <text x="${(x + bw / 2).toFixed(1)}" y="${base + 18}" text-anchor="middle" class="chart-label">${m.month}</text>`;
    })
    .join('\n');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly spending, April to October" class="chart">${bars}
  <line x1="0" y1="${incomeY.toFixed(1)}" x2="${width}" y2="${incomeY.toFixed(1)}" stroke="#d9931e" stroke-width="2" stroke-dasharray="6 4" />
  <text x="${width - 4}" y="${(incomeY - 6).toFixed(1)}" text-anchor="end" class="chart-value income-line">Income Rp 8 jt</text></svg>`;
}

// Line chart: a savings goal growing month by month at a fixed contribution.
export function goalGrowthLine(saved, monthly, target, months) {
  const width = 640;
  const height = 220;
  const base = height - 34;
  const top = 24;
  const max = Math.max(target * 1.05, saved + monthly * months);
  const xs = (i) => 46 + (i / months) * (width - 60);
  const ys = (v) => base - ((v / max) * (base - top));
  const points = [];
  for (let i = 0; i <= months; i++) points.push([xs(i), ys(saved + monthly * i)]);
  const line = points.map((p, i) => (i === 0 ? `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)).join(' ');
  const area = `${line} L ${xs(months).toFixed(1)} ${base} L ${xs(0).toFixed(1)} ${base} Z`;
  const targetY = ys(target);
  const monthMarks = [0, Math.floor(months / 2), months]
    .map((i) => `<text x="${xs(i).toFixed(1)}" y="${base + 18}" text-anchor="middle" class="chart-label">Month ${i}</text>`)
    .join('\n');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Savings growth over time" class="chart">
  <path d="${area}" fill="#dcefe2" />
  <path d="${line}" fill="none" stroke="#1d6b45" stroke-width="3" stroke-linejoin="round" />
  <line x1="46" y1="${targetY.toFixed(1)}" x2="${width - 14}" y2="${targetY.toFixed(1)}" stroke="#d9931e" stroke-width="2" stroke-dasharray="6 4" />
  <text x="${width - 16}" y="${(targetY - 6).toFixed(1)}" text-anchor="end" class="chart-value income-line">Target ${rupiahShort(target)}</text>
  <circle cx="${xs(0).toFixed(1)}" cy="${ys(saved).toFixed(1)}" r="5" fill="#1d6b45" />
  <circle cx="${xs(months).toFixed(1)}" cy="${ys(saved + monthly * months).toFixed(1)}" r="5" fill="#1d6b45" />
  <text x="${xs(0).toFixed(1)}" y="${(ys(saved) - 10).toFixed(1)}" text-anchor="middle" class="chart-value">${rupiahShort(saved)} now</text>
  ${monthMarks}</svg>`;
}

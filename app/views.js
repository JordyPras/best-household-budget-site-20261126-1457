// Page renderers for HomeLedger. Each function takes the household state and
// returns HTML; main.js mounts it and wires the controls. Every figure comes
// from the state — nothing here is hard-coded filler.

import { rupiah, rupiahUsd, rupiahShort, pct, USD_RATE } from './format.js';
import { planVsActualBars, spendingDonut, monthlyBars, goalGrowthLine } from './charts.js';
import { TIPS } from './data.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function spentByCategory(state) {
  const out = {};
  for (const e of state.expenses) out[e.category] = (out[e.category] || 0) + e.amount;
  return out;
}

export function totalSpent(state) {
  return state.expenses.reduce((s, e) => s + e.amount, 0);
}

export function plannedTotal(state) {
  return state.plan.reduce((s, p) => s + p.amount, 0);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function finishMonth(monthsLeft) {
  // Count forward from November 2026, the example month.
  const idx = (10 + monthsLeft) % 12;
  const year = 2026 + Math.floor((10 + monthsLeft) / 12);
  return `${MONTH_NAMES[idx]} ${year}`;
}

function statCard(label, big, small) {
  return `<div class="stat"><p class="stat-label">${label}</p><p class="stat-big">${big}</p><p class="stat-small">${small}</p></div>`;
}

export function dashboard(state) {
  const spent = totalSpent(state);
  const planned = plannedTotal(state);
  const left = state.income - spent;
  const byCat = spentByCategory(state);
  const rows = state.plan.map((p) => ({
    label: p.category,
    planned: p.amount,
    spent: byCat[p.category] || 0,
  }));
  const savings = state.plan.find((p) => p.category === 'Savings');
  const top = [...state.expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  return `
  <section class="hero">
    <p class="eyebrow">${esc(state.household.month)} · ${esc(state.household.members)}</p>
    <h1>Good evening, ${esc(state.household.name)}.</h1>
    <p class="lede">Your household budget for November is on track: <strong>${rupiah(left)}</strong> of the month's money is still unspent, and the savings transfer is already in. Everything below is live — change a figure on the planner and this page follows.</p>
  </section>
  <section class="stats">
    ${statCard('Monthly income', rupiah(state.income), usdLine(state.income))}
    ${statCard('Planned spending', rupiah(planned), pct(planned, state.income) + ' of income')}
    ${statCard('Spent so far', rupiah(spent), pct(spent, state.income) + ' of income · 16 expenses')}
    ${statCard('Left to spend', rupiah(left), left >= 0 ? '5 days left in November' : 'Over budget — see the planner')}
  </section>
  <section class="card">
    <h2>Where the money goes</h2>
    <p>Planned against actually spent, category by category. Green is spent, pale green is planned — red means a line has gone over.</p>
    ${planVsActualBars(rows)}
  </section>
  <div class="two-col">
    <section class="card">
      <h2>Share of spending</h2>
      ${spendingDonut(rows)}
    </section>
    <section class="card">
      <h2>Seven months of spending</h2>
      <p>Actual totals, April to October 2026. June is the only month the family spent more than it earned — a wedding and a broken fridge in the same month.</p>
      ${monthlyBars(state.monthlyTotals, state.income)}
      <p class="fine">Average over the seven months: <strong>${rupiah(Math.round(state.monthlyTotals.reduce((s, m) => s + m.spent, 0) / state.monthlyTotals.length))}</strong> a month.</p>
    </section>
  </div>
  <section class="card">
    <h2>Biggest expenses this month</h2>
    <ul class="top-list">
      ${top.map((e) => `<li><span>${esc(e.desc)}</span><span class="muted">${e.date.slice(5)}</span><strong>${rupiah(e.amount)}</strong></li>`).join('')}
    </ul>
    <p><a class="button" href="#/tracker">Open the expense tracker →</a></p>
  </section>
  <section class="card highlight">
    <h2>Savings so far: ${rupiah(savings ? savings.amount : 0)} a month</h2>
    <p>That is ${pct(savings ? savings.amount : 0, state.income)} of income, moved on payday before any spending. The emergency fund is ${pct(6400000, 10000000)} full — about four and a half months from done at this rate.</p>
    <p><a class="button" href="#/goals">See the savings goals →</a></p>
  </section>`;
}

function usdLine(n) {
  return '≈ ' + (Math.round(n / USD_RATE)).toLocaleString('en-US') + ' US dollars';
}

const NEEDS = ['Housing & Rent', 'Groceries', 'Transport', 'Utilities', 'School & Kids', 'Health'];
const WANTS = ['Fun & Eating Out', 'Everything Else'];

export function planner(state) {
  const spent = spentByCategory(state);
  const planned = plannedTotal(state);
  const balance = state.income - planned;
  const needs = state.plan.filter((p) => NEEDS.includes(p.category)).reduce((s, p) => s + p.amount, 0);
  const wants = state.plan.filter((p) => WANTS.includes(p.category)).reduce((s, p) => s + p.amount, 0);
  const savings = state.plan.filter((p) => p.category === 'Savings').reduce((s, p) => s + p.amount, 0);
  const rows = state.plan
    .map(
      (p) => {
        const s = spent[p.category] || 0;
        const left = p.amount - s;
        const used = p.amount ? Math.min(100, Math.round((s / p.amount) * 100)) : 0;
        return `<tr>
        <td><strong>${esc(p.category)}</strong><br><span class="muted">${esc(p.note)}</span></td>
        <td><label class="visually-hidden" for="plan-${esc(p.category)}">Planned for ${esc(p.category)}</label>
          <input id="plan-${esc(p.category)}" type="number" min="0" step="10000" value="${p.amount}" data-plan-category="${esc(p.category)}" class="money-input"></td>
        <td>${rupiah(s)}</td>
        <td class="${left < 0 ? 'over-text' : ''}">${rupiah(left)}</td>
        <td><div class="meter"><div class="meter-fill ${left < 0 ? 'over' : ''}" style="width:${used}%"></div></div><span class="muted">${used}% used</span></td>
      </tr>`;
      },
    )
    .join('');
  return `
  <h1>Monthly budget planner</h1>
  <p class="lede">Set what each part of the household may spend in November. Change any figure — the totals, the balance and the dashboard update at once, and your plan is saved in this browser.</p>
  <section class="card">
    <h2>Income — ${rupiahUsd(state.income)} a month</h2>
    <ul class="income-list">
      ${state.incomeSources.map((s) => `<li><span>${esc(s.label)}</span><strong>${rupiah(s.amount)}</strong></li>`).join('')}
    </ul>
    <p><label for="income-input"><strong>Total monthly income (Rp)</strong></label>
    <input id="income-input" type="number" min="0" step="50000" value="${state.income}" class="money-input"></p>
    <p class="fine">Dollar figures use Rp ${USD_RATE.toLocaleString('en-US')} per US$1, the rate shown on every page.</p>
  </section>
  <section class="card">
    <h2>Spending plan</h2>
    <table class="plan-table">
      <thead><tr><th>Category</th><th>Planned</th><th>Spent</th><th>Left</th><th>Used</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td><strong>Total planned</strong></td><td><strong>${rupiah(planned)}</strong></td><td><strong>${rupiah(totalSpent(state))}</strong></td><td><strong>${rupiah(state.income - totalSpent(state))}</strong></td><td></td></tr></tfoot>
    </table>
    <p class="balance ${balance < 0 ? 'over-text' : ''}">${balance >= 0
      ? `✓ Your plan leaves ${rupiah(balance)} unassigned — that is your breathing room.`
      : `⚠ Your plan is ${rupiah(-balance)} over income. Lower a line above to balance it.`}</p>
    <p><button class="button secondary" id="reset-plan">Reset to the example plan</button></p>
  </section>
  <section class="card">
    <h2>How the plan splits: needs, wants, savings</h2>
    <p>The classic 50 / 30 / 20 rule says about half of income for needs, 30% for wants and 20% for savings. This family runs leaner on wants and banks the difference:</p>
    <ul class="split-list">
      <li><strong>Needs — ${rupiah(needs)}</strong> (${pct(needs, state.income)} of income; rule says ~50%)</li>
      <li><strong>Wants — ${rupiah(wants)}</strong> (${pct(wants, state.income)} of income; rule says ~30%)</li>
      <li><strong>Savings — ${rupiah(savings)}</strong> (${pct(savings, state.income)} of income; rule says ~20%)</li>
    </ul>
  </section>`;
}

export function tracker(state, filter) {
  const byCat = spentByCategory(state);
  const shown = filter && filter !== 'All'
    ? state.expenses.filter((e) => e.category === filter)
    : state.expenses;
  const shownTotal = shown.reduce((s, e) => s + e.amount, 0);
  const options = ['All', ...state.plan.map((p) => p.category)]
    .map((c) => `<option value="${esc(c)}" ${c === filter ? 'selected' : ''}>${esc(c)}</option>`)
    .join('');
  const catRows = state.plan
    .map((p) => {
      const s = byCat[p.category] || 0;
      const used = p.amount ? Math.min(100, Math.round((s / p.amount) * 100)) : 0;
      return `<li><span>${esc(p.category)}</span><div class="meter"><div class="meter-fill ${s > p.amount ? 'over' : ''}" style="width:${used}%"></div></div><strong>${rupiah(s)} / ${rupiahShort(p.amount)}</strong></li>`;
    })
    .join('');
  const rows = [...shown]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(
      (e, i) => `<tr><td>${e.date}</td><td>${esc(e.desc)}</td><td>${esc(e.category)}</td><td>${rupiah(e.amount)}</td>
      <td><button class="delete" data-delete-index="${state.expenses.indexOf(e)}" aria-label="Delete ${esc(e.desc)}">Delete</button></td></tr>`,
    )
    .join('');
  return `
  <h1>Expense tracker</h1>
  <p class="lede">Every rupiah the household spends, written down the day it leaves. Add an expense and the totals, the bars and the dashboard move with it. Saved in this browser — nothing leaves your device.</p>
  <section class="card">
    <h2>Add an expense</h2>
    <form id="expense-form" class="expense-form">
      <p><label for="exp-date">Date</label><input id="exp-date" type="date" value="2026-11-26" required></p>
      <p><label for="exp-desc">What was it?</label><input id="exp-desc" type="text" placeholder="e.g. Weekly groceries at the market" required maxlength="80"></p>
      <p><label for="exp-category">Category</label><select id="exp-category">${state.plan.map((p) => `<option>${esc(p.category)}</option>`).join('')}</select></p>
      <p><label for="exp-amount">Amount (Rp)</label><input id="exp-amount" type="number" min="1000" step="1000" placeholder="150000" required></p>
      <p><button class="button" type="submit">Add expense</button></p>
    </form>
    <p id="expense-note" class="fine" role="status"></p>
  </section>
  <section class="card">
    <h2>November so far — ${rupiah(totalSpent(state))} across ${state.expenses.length} expenses</h2>
    <p><label for="filter-category">Show only: </label>
    <select id="filter-category">${options}</select>
    <span class="muted">Showing ${shown.length} expenses totalling <strong>${rupiah(shownTotal)}</strong></span></p>
    <div class="table-wrap"><table class="expense-table">
      <thead><tr><th>Date</th><th>What</th><th>Category</th><th>Amount</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No expenses in this category yet.</td></tr>'}</tbody>
    </table></div>
    <p><button class="button secondary" id="reset-expenses">Reset to the example expenses</button></p>
  </section>
  <section class="card">
    <h2>Spent per category against the plan</h2>
    <ul class="cat-bars">${catRows}</ul>
  </section>`;
}

export function goalsPage(state, calcGoal, calcMonthly) {
  const cards = state.goals
    .map((g, i) => {
      const left = Math.max(0, g.target - g.saved);
      const months = g.monthly > 0 ? Math.ceil(left / g.monthly) : null;
      const done = Math.min(100, Math.round((g.saved / g.target) * 100));
      return `<article class="goal-card">
      <h3>${esc(g.name)}</h3>
      <p class="muted">${esc(g.note)}</p>
      <p class="goal-figures"><strong>${rupiah(g.saved)}</strong> saved of ${rupiah(g.target)} · ${done}%</p>
      <div class="meter big"><div class="meter-fill" style="width:${done}%"></div></div>
      <p>${left === 0 ? '✓ Goal reached — well done!' : `${rupiah(left)} to go · ${rupiah(g.monthly)}/month · about ${months} more month${months === 1 ? '' : 's'} · done around ${finishMonth(months)}`}</p>
      <p><button class="delete" data-delete-goal="${i}">Remove goal</button></p>
    </article>`;
    })
    .join('');
  const goal = state.goals.find((g) => g.name === calcGoal) || state.goals[0];
  const monthly = calcMonthly || goal.monthly;
  const left = Math.max(0, goal.target - goal.saved);
  const months = monthly > 0 ? Math.ceil(left / monthly) : 0;
  const chartMonths = Math.max(months, 1);
  return `
  <h1>Savings goals</h1>
  <p class="lede">Four things the family is saving for, and exactly how far along each one is. Pick a goal and a monthly amount in the calculator to see the finish date move.</p>
  <div class="goal-grid">${cards}</div>
  <section class="card">
    <h2>Goal calculator</h2>
    <form id="goal-calc" class="calc-form">
      <p><label for="calc-goal">Goal</label>
      <select id="calc-goal">${state.goals.map((g) => `<option ${g.name === goal.name ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></p>
      <p><label for="calc-monthly">Save per month (Rp)</label>
      <input id="calc-monthly" type="number" min="0" step="50000" value="${monthly}"></p>
    </form>
    <p class="calc-result"><strong>${esc(goal.name)}:</strong> ${rupiah(left)} still to save. At ${rupiah(monthly)} a month that takes <strong>${months} month${months === 1 ? '' : 's'}</strong> — finished around <strong>${finishMonth(months)}</strong>.</p>
    ${goalGrowthLine(goal.saved, monthly, goal.target, chartMonths)}
    <p class="fine">The line shows savings growing month by month; the dashed line is the target. Saving ${rupiah(monthly * 2)} a month instead would finish it in ${monthly > 0 ? Math.ceil(left / (monthly * 2)) : '—'} months.</p>
  </section>
  <section class="card">
    <h2>Add your own goal</h2>
    <form id="goal-form" class="expense-form">
      <p><label for="goal-name">Goal name</label><input id="goal-name" type="text" placeholder="e.g. New refrigerator" required maxlength="60"></p>
      <p><label for="goal-target">Target (Rp)</label><input id="goal-target" type="number" min="1000" step="10000" placeholder="5000000" required></p>
      <p><label for="goal-saved">Already saved (Rp)</label><input id="goal-saved" type="number" min="0" step="10000" value="0" required></p>
      <p><label for="goal-monthly">Save per month (Rp)</label><input id="goal-monthly" type="number" min="0" step="50000" placeholder="300000" required></p>
      <p><button class="button" type="submit">Add goal</button></p>
    </form>
  </section>`;
}

export function tipsPage(state) {
  const needs = state.plan.filter((p) => NEEDS.includes(p.category)).reduce((s, p) => s + p.amount, 0);
  const wants = state.plan.filter((p) => WANTS.includes(p.category)).reduce((s, p) => s + p.amount, 0);
  const savings = state.plan.filter((p) => p.category === 'Savings').reduce((s, p) => s + p.amount, 0);
  return `
  <h1>Budgeting, in plain language</h1>
  <p class="lede">Five habits that keep a household's money working, each with the Hartono family's own numbers so you can see what it is worth.</p>
  <section class="card">
    <h2>The 50 / 30 / 20 rule, on Rp 8.000.000</h2>
    <p>Split income three ways and the month almost plans itself. Here is what the rule gives this family — and what they actually do:</p>
    <table class="plan-table">
      <thead><tr><th>Bucket</th><th>Rule says</th><th>This family</th></tr></thead>
      <tbody>
        <tr><td><strong>Needs</strong> — rent, food, transport, bills, school, health</td><td>${rupiah(4000000)} (50%)</td><td>${rupiah(needs)} (${pct(needs, state.income)})</td></tr>
        <tr><td><strong>Wants</strong> — outings, treats, gifts</td><td>${rupiah(2400000)} (30%)</td><td>${rupiah(wants)} (${pct(wants, state.income)})</td></tr>
        <tr><td><strong>Savings</strong> — emergency fund and goals</td><td>${rupiah(1600000)} (20%)</td><td>${rupiah(savings)} (${pct(savings, state.income)})</td></tr>
      </tbody>
    </table>
    <p>They spend far less on wants than the rule allows, which is how the emergency fund grows even on a modest income. The rule is a guide, not a law — the point is that every rupiah has a job before the month starts.</p>
  </section>
  ${TIPS.map((t) => `<section class="card tip"><h2>${esc(t.title)}</h2><p>${esc(t.body)}</p></section>`).join('')}
  <section class="card highlight">
    <h2>Start tonight</h2>
    <p>Write down your income, list your nine biggest monthly costs, and give each one a number. That is the whole planner on the <a href="#/planner">planner page</a> — ten minutes, and the month stops being a surprise.</p>
  </section>`;
}

export function missing() {
  return `<h1>Page not found</h1>
  <p>There is no page at this address. <a href="#/">Back to the dashboard</a>.</p>`;
}

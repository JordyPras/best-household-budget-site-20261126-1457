// HomeLedger app shell: state, routing and wiring. The site is one page with
// hash routes — #/ dashboard, #/planner, #/tracker, #/goals, #/tips — so
// every section is reached by a link and the back button works.
//
//   window.__shotReady is false while a page renders and true once it is on
//   screen, so a screenshot script knows when to capture.

import { HOUSEHOLD, PLAN, EXPENSES, GOALS, MONTHLY_TOTALS } from './data.js';
import { dashboard, planner, tracker, goalsPage, tipsPage, missing } from './views.js';

const STORE_KEY = 'homeledger-v1';
const app = document.getElementById('app');

function freshState() {
  return {
    household: { ...HOUSEHOLD },
    income: HOUSEHOLD.income,
    incomeSources: HOUSEHOLD.incomeSources.map((s) => ({ ...s })),
    plan: PLAN.map((p) => ({ ...p })),
    expenses: EXPENSES.map((e) => ({ ...e })),
    goals: GOALS.map((g) => ({ ...g })),
    monthlyTotals: MONTHLY_TOTALS.map((m) => ({ ...m })),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    const base = freshState();
    // Keep only fields the current code knows, so an old save cannot break a page.
    return {
      ...base,
      income: Number(saved.income) > 0 ? Number(saved.income) : base.income,
      plan: Array.isArray(saved.plan) && saved.plan.length ? saved.plan : base.plan,
      expenses: Array.isArray(saved.expenses) ? saved.expenses : base.expenses,
      goals: Array.isArray(saved.goals) && saved.goals.length ? saved.goals : base.goals,
    };
  } catch {
    return freshState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full store: the site still works for this visit.
  }
}

const state = loadState();
let trackerFilter = 'All';
let calcGoal = state.goals[0].name;
let calcMonthly = state.goals[0].monthly;

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const route = hash.replace(/^#\/?/, '').split('/')[0];
  let html;
  let title = 'HomeLedger — Household Budget Planner';
  if (route === '' || route === 'dashboard') {
    html = dashboard(state);
  } else if (route === 'planner') {
    html = planner(state);
    title = 'Monthly planner | HomeLedger';
  } else if (route === 'tracker') {
    html = tracker(state, trackerFilter);
    title = 'Expense tracker | HomeLedger';
  } else if (route === 'goals') {
    html = goalsPage(state, calcGoal, calcMonthly);
    title = 'Savings goals | HomeLedger';
  } else if (route === 'tips') {
    html = tipsPage(state);
    title = 'Budgeting guide | HomeLedger';
  } else {
    html = missing();
    title = 'Not found | HomeLedger';
  }
  document.title = title;
  app.innerHTML = html;
  document.querySelectorAll('nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === '#/' + (route === '' ? '' : route));
  });
  wire(route);
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function wire(route) {
  if (route === 'planner') {
    const incomeInput = document.getElementById('income-input');
    incomeInput.addEventListener('change', () => {
      const v = Math.max(0, Math.round(Number(incomeInput.value) || 0));
      state.income = v;
      saveState();
      render();
    });
    document.querySelectorAll('[data-plan-category]').forEach((input) => {
      input.addEventListener('change', () => {
        const cat = input.getAttribute('data-plan-category');
        const line = state.plan.find((p) => p.category === cat);
        if (line) line.amount = Math.max(0, Math.round(Number(input.value) || 0));
        saveState();
        render();
      });
    });
    document.getElementById('reset-plan').addEventListener('click', () => {
      state.plan = PLAN.map((p) => ({ ...p }));
      state.income = HOUSEHOLD.income;
      saveState();
      render();
    });
  }

  if (route === 'tracker') {
    document.getElementById('expense-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const desc = document.getElementById('exp-desc').value.trim();
      const amount = Math.round(Number(document.getElementById('exp-amount').value) || 0);
      const date = document.getElementById('exp-date').value || '2026-11-26';
      const category = document.getElementById('exp-category').value;
      if (!desc || amount <= 0) return;
      state.expenses.push({ date, desc, category, amount });
      saveState();
      render();
      const note = document.getElementById('expense-note');
      if (note) note.textContent = `Added “${desc}” — Rp ${amount.toLocaleString('id-ID')} under ${category}.`;
    });
    document.getElementById('filter-category').addEventListener('change', (ev) => {
      trackerFilter = ev.target.value;
      render();
    });
    document.querySelectorAll('[data-delete-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.expenses.splice(Number(btn.getAttribute('data-delete-index')), 1);
        saveState();
        render();
      });
    });
    document.getElementById('reset-expenses').addEventListener('click', () => {
      state.expenses = EXPENSES.map((e) => ({ ...e }));
      saveState();
      render();
    });
  }

  if (route === 'goals') {
    document.getElementById('calc-goal').addEventListener('change', (ev) => {
      calcGoal = ev.target.value;
      const g = state.goals.find((x) => x.name === calcGoal);
      if (g) calcMonthly = g.monthly;
      render();
    });
    document.getElementById('calc-monthly').addEventListener('change', (ev) => {
      calcMonthly = Math.max(0, Math.round(Number(ev.target.value) || 0));
      render();
    });
    document.getElementById('goal-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = document.getElementById('goal-name').value.trim();
      const target = Math.round(Number(document.getElementById('goal-target').value) || 0);
      const saved = Math.round(Number(document.getElementById('goal-saved').value) || 0);
      const monthly = Math.round(Number(document.getElementById('goal-monthly').value) || 0);
      if (!name || target <= 0) return;
      state.goals.push({ name, target, saved, monthly, note: 'Added by the family.' });
      calcGoal = name;
      calcMonthly = monthly;
      saveState();
      render();
    });
    document.querySelectorAll('[data-delete-goal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.goals.splice(Number(btn.getAttribute('data-delete-goal')), 1);
        if (!state.goals.length) state.goals = GOALS.map((g) => ({ ...g }));
        calcGoal = state.goals[0].name;
        calcMonthly = state.goals[0].monthly;
        saveState();
        render();
      });
    });
  }
}

window.addEventListener('hashchange', render);
render();

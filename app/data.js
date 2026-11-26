// Example household for HomeLedger. These are the figures the site opens
// with: one realistic Jakarta family, one month, every rupiah accounted for.
// The planner, tracker and goals pages all read from this data, and edits are
// saved in the browser (localStorage) — the example returns with Reset.

export const HOUSEHOLD = {
  name: 'The Hartono Family',
  members: '2 adults + 2 children · Jakarta',
  month: 'November 2026',
  monthLabel: 'Nov 2026',
  income: 8000000,
  incomeSources: [
    { label: 'Salary — Budi, father (office admin)', amount: 5500000 },
    { label: 'Salary — Sari, mother (part-time teacher)', amount: 2000000 },
    { label: 'Side income — weekend catering orders', amount: 500000 },
  ],
};

// The monthly plan. The nine lines add up to exactly the Rp 8.000.000 income:
// 2.000.000 + 1.800.000 + 900.000 + 650.000 + 800.000 + 400.000 + 300.000
// + 800.000 + 350.000 = 8.000.000.
export const PLAN = [
  { category: 'Housing & Rent', amount: 2000000, note: '2-bedroom flat, service charge included' },
  { category: 'Groceries', amount: 1800000, note: 'Weekly market trips + one supermarket run' },
  { category: 'Transport', amount: 900000, note: 'Fuel, tolls, bus fares and ride-hailing' },
  { category: 'Utilities', amount: 650000, note: 'Electricity token, water bill, home internet' },
  { category: 'School & Kids', amount: 800000, note: 'School fees, books, snacks and stationery' },
  { category: 'Health', amount: 400000, note: 'BPJS top-up and the pharmacy kit' },
  { category: 'Fun & Eating Out', amount: 300000, note: 'One family outing or meal out each week' },
  { category: 'Savings', amount: 800000, note: 'Pay yourself first — 10% of income, moved on payday' },
  { category: 'Everything Else', amount: 350000, note: 'Clothes, gifts and the surprises of life' },
];

export const CATEGORIES = PLAN.map((p) => p.category);

// What the family has actually spent so far in November 2026 (25 November).
// Total: Rp 6.064.000 — Rp 1.936.000 of the month's money is still unspent.
export const EXPENSES = [
  { date: '2026-11-01', desc: 'Monthly rent — November', category: 'Housing & Rent', amount: 2000000 },
  { date: '2026-11-02', desc: 'Weekly groceries at the morning market', category: 'Groceries', amount: 420000 },
  { date: '2026-11-03', desc: 'Fuel for the motorcycle', category: 'Transport', amount: 200000 },
  { date: '2026-11-05', desc: 'Electricity token (PLN)', category: 'Utilities', amount: 200000 },
  { date: '2026-11-07', desc: 'School books for Dina', category: 'School & Kids', amount: 250000 },
  { date: '2026-11-08', desc: 'Supermarket — rice, oil, detergent', category: 'Groceries', amount: 385000 },
  { date: '2026-11-10', desc: 'Home internet bill', category: 'Utilities', amount: 180000 },
  { date: '2026-11-12', desc: 'Pharmacy — fever medicine and vitamins', category: 'Health', amount: 145000 },
  { date: '2026-11-14', desc: 'Family lunch out after the school fair', category: 'Fun & Eating Out', amount: 175000 },
  { date: '2026-11-15', desc: 'Weekly groceries at the morning market', category: 'Groceries', amount: 445000 },
  { date: '2026-11-17', desc: 'Ride-hailing to the hospital visit', category: 'Transport', amount: 86000 },
  { date: '2026-11-19', desc: 'Kids’ snacks and stationery', category: 'School & Kids', amount: 120000 },
  { date: '2026-11-21', desc: 'Supermarket — chicken, eggs, vegetables', category: 'Groceries', amount: 390000 },
  { date: '2026-11-23', desc: 'Water bill (PDAM)', category: 'Utilities', amount: 118000 },
  { date: '2026-11-24', desc: 'Savings transfer on payday', category: 'Savings', amount: 800000 },
  { date: '2026-11-25', desc: 'Birthday gift for grandmother', category: 'Everything Else', amount: 150000 },
];

// Actual total spending for the past seven months, for the trend chart.
export const MONTHLY_TOTALS = [
  { month: 'Apr', spent: 7420000 },
  { month: 'May', spent: 7850000 },
  { month: 'Jun', spent: 8310000 },
  { month: 'Jul', spent: 7650000 },
  { month: 'Aug', spent: 7980000 },
  { month: 'Sep', spent: 7540000 },
  { month: 'Oct', spent: 7720000 },
];

// Savings goals: what the family is working towards, and how much is in.
export const GOALS = [
  { name: 'Emergency fund', target: 10000000, saved: 6400000, monthly: 800000, note: 'Three months of essentials, for the unexpected.' },
  { name: 'New motorcycle', target: 18500000, saved: 4200000, monthly: 500000, note: 'A Honda Beat to replace the 2014 bike.' },
  { name: 'Holiday in Yogyakarta', target: 6000000, saved: 2750000, monthly: 400000, note: 'Train tickets, a guesthouse and Borobudur at sunrise.' },
  { name: 'Kids’ education fund', target: 25000000, saved: 3000000, monthly: 600000, note: 'A little every month so school never becomes a crisis.' },
];

// Plain-language budgeting guidance shown on the tips page.
export const TIPS = [
  {
    title: 'Pay yourself first',
    body: 'Move the savings line — Rp 800.000 here, 10% of income — out of the account on payday, before any spending. Money you never see is money you never miss. The Hartonos do it on the 24th, the day Budi is paid.',
  },
  {
    title: 'The 50 / 30 / 20 rule, in Rupiah',
    body: 'A classic split: about 50% for needs, 30% for wants, 10–20% for savings. On Rp 8.000.000 that is roughly Rp 4.000.000 for needs, Rp 2.400.000 for wants and Rp 1.600.000 saved. This family runs leaner on wants (Rp 650.000) and saves the difference.',
  },
  {
    title: 'Shop the morning market',
    body: 'Vegetables, eggs and fish at the pasar pagi cost 20–30% less than the supermarket for the same basket. The Hartonos buy fresh food twice a week at the market and only packaged goods at the supermarket — about Rp 350.000 saved a month.',
  },
  {
    title: 'One outing a week, planned',
    body: 'Fun is a budget line, not a leak. Rp 300.000 a month buys four small outings — a park picnic, a warung dinner, a film night at home. Planned fun costs half of unplanned fun and everybody enjoys it more.',
  },
  {
    title: 'Check in every Sunday, 10 minutes',
    body: 'Once a week, open the tracker together: what did we spend, what is left in each line, anything to move? Ten minutes on Sunday prevents the end-of-month surprise. November is on track — Rp 1.936.000 still unspent with five days to go.',
  },
];

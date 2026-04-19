/* ═══════════════════════════════════════════════════════════════
   FinTrack v2.1 — app.js
   New: Filipino student auto-categorization engine,
        Allowance income category, FAB button, layout fixes
═══════════════════════════════════════════════════════════════ */
'use strict';

// ──────────────────────────── STATE ────────────────────────────
let state = {
  transactions: [],
  budgets: {},
  currency: 'PHP',
  theme: 'dark',
  filter: { period: 'all', type: 'all', search: '', dateFrom: '', dateTo: '' },
  sort: { col: 'date', dir: 'desc' },
  editingId: null,
  deletingId: null,
  currentView: 'dashboard',
};

const CURRENCY_SYMBOLS = { PHP: '₱', USD: '$', EUR: '€' };

const CATEGORY_EMOJI = {
  Food:'🍜', Transport:'🚌', Bills:'💡', Shopping:'🛍️',
  Communication:'📱', Salary:'💼', Health:'🏥', Education:'📚',
  Housing:'🏠', Entertainment:'🎮', Others:'📦',
  Freelance:'💻', Gift:'🎁', Allowance:'💰',
};

const EXPENSE_CATS = ['Food','Transport','Bills','Shopping','Communication','Health','Education','Housing','Entertainment','Others'];
const INCOME_CATS  = ['Allowance','Salary','Freelance','Gift','Others'];

// ──────────────────── AUTO-CATEGORIZATION ENGINE ────────────────────
// Comprehensive Filipino student keyword map
const AUTO_CATEGORIES = {

  Food: [
    // Filipino dishes & words
    'ulam','kanin','sinaing','nilaga','sinigang','adobo','kare','lechon','liempo',
    'bulalo','tinola','pinakbet','menudo','afritada','caldereta','mechado','bistek',
    'tapsilog','longsilog','tocilog','bangsilog','hotsilog','cornsilog','spamsilog',
    'sinangag','champorado','arroz','lugaw','arroz caldo','goto','mami','lomi',
    'palabok','bihon','pancit','sotanghon','miswa','canton','miki',
    'siomai','siopao','dimsum','lumpia','puto','kutsinta','bibingka','kakanin',
    'halo-halo','mais','puto bumbong','biko','palitaw','sapin-sapin',
    'buko','buko juice','calamansi','gulaman','sago','mais con queso',
    'chicharon','kropek','tempura','fishball','kikiam','squidball','kwek kwek',
    'balut','penoy','isaw','adidas','betamax','helmet',
    'merienda','almusal','tanghalian','hapunan','baon',
    // Fast food chains PH
    'jollibee','mcdo','mcdonald','kfc','chowking','greenwich','yellow cab',
    'shakeys','pizza hut','burger king','wendy','angel','max','andoks',
    'mang inasal','bonchon','potato corner','minute burger','large','dunkin',
    'starbucks','coffee bean','bo\'s coffee','figaro','tim hortons',
    'milk tea','chatime','gong cha','happy lemon','coco','tealive',
    'bbt','bubble tea','pearl','pearl milk',
    // General food
    'food','grocery','groceries','palengke','market','supermarket',
    'sm grocery','robinsons','puregold','savemore','waltermart','landers',
    'breakfast','lunch','dinner','snack','coffee','drink','juice','water',
    'restaurant','carinderia','carenderia','eatery','turo-turo','fastfood',
    'takeout','take-out','delivery','grab food','foodpanda','lalamove food',
    'pizza','burger','pasta','fries','rice','chicken','pork','beef','fish',
    'vegetable','fruit','egg','bread','noodle','cake','dessert','ice cream',
    'softdrinks','cola','sprite','royal','mountain dew','energy drink','c2',
    'kopiko','nescafe','milo','ovaltine','nestea','minute maid',
  ],

  Transport: [
    // PH-specific
    'jeep','jeepney','pedicab','tricycle','trike','habal','habal-habal',
    'fx','uv express','uv','bus','mrt','lrt','pnr','beep card',
    'grab','angkas','move it','mybus',
    'commute','fare','bayad','sakay','pasahe','pamasahe',
    // General
    'transport','transportation','gasoline','gas','petrol','fuel',
    'taxi','uber','lalamove','parking','toll','expressway','skyway',
    'ferry','boat','ship','roro','pumpboat',
  ],

  Bills: [
    'meralco','electric','electricity','kuryente','ilaw',
    'maynilad','manila water','tubig','water bill',
    'pldt','globe','smart','sun','dito','wifi','broadband','fiber',
    'converge','skycable','cignal','cable','internet bill',
    'rent','boarding house','dorm','dormitory','condo','apartment',
    'amortization','mortgage','association dues',
    'bill','bills','utilities','subscription','netflix','spotify',
    'youtube premium','disney','apple','amazon','hbo',
  ],

  Shopping: [
    'shopee','lazada','zalora','tiktok shop','shein','amazon',
    'sm','robinson','ayala','sm mall','festival mall','trinoma',
    'divisoria','quiapo','ukay','ref','appliance','gadget',
    'clothes','clothing','shirt','pants','shoes','sneakers','bag',
    'accessories','watch','jewelry','perfume','beauty','skincare',
    'shampoo','conditioner','soap','toothbrush','toothpaste',
    'lotion','deodorant','feminine','sanitary','hygiene',
    'shopping','buy','purchased','order','item','product',
  ],

  Communication: [
    'load','e-load','eload','reload','prepaid','top up','topup',
    'gc cash','gcash','paymaya','maya','seabank','palawan',
    'globe load','smart load','sun load','tnt','tm',
    'promo','gigasurf','gosakto','all-in','call&text',
    'sim','text','sms','data','internet load',
    'mobile','phone bill','postpaid','plan',
  ],

  Health: [
    'botika','pharmacy','gamot','medicine','drug','drugstore',
    'mercury','rose pharmacy','southstar','watsons','generika',
    'hospital','clinic','doctor','checkup','consultation','lab',
    'test','xray','x-ray','vaccine','vitamins','supplement',
    'paracetamol','biogesic','neozep','decolgen','bioflu',
    'health','medical','dental','dentist','eye','optical',
    'mask','alcohol','sanitizer','covid','antigen',
    'philhealth','insurance',
  ],

  Education: [
    'tuition','enrollment','enroll','registration','school fee',
    'book','textbook','reviewer','module','workbook','handout','photocopy',
    'printing','laminate','notebook','ballpen','pencil','highlighter',
    'folder','bondpaper','bond paper','pad paper','paper','cardboard',
    'thesis','research','project','assignment','exam','quiz',
    'review center','tutorial','online class','lms','canvas','schoology',
    'uniform','id','id lace','lanyard','school supply','supplies',
    'allowance school','matriculation','ched','deped',
    'college','university','school','campus','library','lab fee',
  ],

  Housing: [
    'rent','rental','boarding','dorm fee','dormitory fee',
    'condo fee','apartment','bedspace','room','lodging',
    'laundry','laundromat','maglalaba',
    'cleaning','maintenance','repair','plumbing','electrician',
    'furniture','bed','mattress','pillow','blanket','ref','aircon','fan',
  ],

  Entertainment: [
    'cinema','movie','sm cinema','robinsons cinema','ayala cinemas','vue',
    'concert','live event','gig','festival','amusement','carnival',
    'netflix','spotify','game','steam','mobile legends','ml','cod',
    'mobile game','in-app','top-up game','codm','genshin','valorant',
    'roblox','minecraft','playstation','xbox','nintendo',
    'karaoke','ktvbox','kbox','timezone','haven','fun ranch',
    'beach','resort','swimming','travel','trip','tour','hotel',
    'videoke','gimik','gimmick','inuman','kainan',
  ],

  // INCOME
  Allowance: [
    'allowance','baon','buwanang allowance','weekly allowance',
    'padala','remittance','send money','gcash padala',
    'scholarship','stipend','grant','living allowance',
    'parents','magulang','nanay','tatay','mama','papa',
  ],

  Salary: [
    'salary','sweldo','payroll','paycheck','sahod','income',
    'part time','part-time','parttime','ot pay','overtime',
    'wages','wage','daily rate','monthly','compensation',
    'commission','bonus','13th month','performance',
    'employer','work','job',
  ],

  Freelance: [
    'freelance','freelancer','gig','project payment','client',
    'online work','upwork','fiverr','toptal','99designs',
    'virtual assistant','va','social media','content','writer',
    'design','logo','website','coding','programming','developer',
    'tutorial fee','tutoring','teaching','online selling','resell',
    'gcash received','maya received','payment received',
  ],

  Gift: [
    'gift','regalo','pasalubong','surprise','birthday','christmas',
    'graduation','debut','wedding','sponsor','ninong','ninang',
    'cash gift','money gift','padala gift','ayuda','subsidy',
  ],
};

/**
 * Detect category from a description string.
 * Returns { category, matched: bool }
 */
function autoDetectCategory(desc, type) {
  const lower = desc.toLowerCase().trim();
  const relevantCats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  // Score each category
  let best = null;
  let bestScore = 0;

  for (const cat of relevantCats) {
    const keywords = AUTO_CATEGORIES[cat] || [];
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        // Longer keyword match = higher confidence
        const score = kw.length;
        if (score > bestScore) {
          bestScore = score;
          best = cat;
        }
      }
    }
  }

  return { category: best || (type === 'income' ? 'Others' : 'Others'), matched: !!best };
}

// ──────────────────────────── PERSISTENCE ────────────────────────────
function save() {
  localStorage.setItem('fintrack_v2', JSON.stringify({
    transactions: state.transactions,
    budgets: state.budgets,
    currency: state.currency,
    theme: state.theme,
  }));
}

function load() {
  try {
    const raw = localStorage.getItem('fintrack_v2');
    if (!raw) return;
    const d = JSON.parse(raw);
    state.transactions = d.transactions || [];
    state.budgets = d.budgets || {};
    state.currency = d.currency || 'PHP';
    state.theme = d.theme || 'dark';
  } catch(e) { /* ignore */ }
}

// ──────────────────────────── UTILS ────────────────────────────
function sym() { return CURRENCY_SYMBOLS[state.currency] || '₱'; }

function fmt(n) {
  return sym() + Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function today() { return new Date().toISOString().split('T')[0]; }

function parseDate(s) { return new Date(s + 'T00:00:00'); }

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return [mon, sun];
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return [start, end];
}

function toast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDisplayDate(s) {
  const d = parseDate(s);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ──────────────────────────── FILTERING & SORTING ────────────────────────────
function filterTransactions() {
  let txs = [...state.transactions];
  const f = state.filter;

  if (f.period !== 'all') {
    const now = new Date();
    let start, end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (f.period === 'today') {
      start = new Date(now); start.setHours(0, 0, 0, 0);
    } else if (f.period === 'week') {
      [start, end] = getWeekRange();
    } else if (f.period === 'month') {
      [start, end] = getMonthRange();
    } else if (f.period === '6months') {
      start = new Date(now); start.setMonth(now.getMonth() - 6); start.setHours(0, 0, 0, 0);
    } else if (f.period === 'custom' && f.dateFrom && f.dateTo) {
      start = parseDate(f.dateFrom); start.setHours(0, 0, 0, 0);
      end   = parseDate(f.dateTo);   end.setHours(23, 59, 59, 999);
    }
    if (start) {
      txs = txs.filter(t => { const d = parseDate(t.date); return d >= start && d <= end; });
    }
  }

  if (f.type !== 'all') txs = txs.filter(t => t.type === f.type);

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    txs = txs.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.note || '').toLowerCase().includes(q)
    );
  }

  return txs;
}

function sortTransactions(txs) {
  const { col, dir } = state.sort;
  return [...txs].sort((a, b) => {
    let va, vb;
    if (col === 'date') { va = a.date; vb = b.date; }
    else if (col === 'amount') { va = a.amount; vb = b.amount; }
    else { va = a.description.toLowerCase(); vb = b.description.toLowerCase(); }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// ──────────────────────────── RENDER ────────────────────────────
function renderAll() {
  renderCards();
  renderPeriodSummary();
  renderTransactions();
  renderCharts();
  renderBudgets();
  if (state.currentView === 'analytics') renderAnalytics();
  updateCurrencyUI();
}

function animateVal(el, text) {
  el.classList.remove('count-anim');
  void el.offsetWidth;
  el.textContent = text;
  el.classList.add('count-anim');
}

function renderCards() {
  const txs     = state.transactions;
  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savings = income > 0 ? Math.round((balance / income) * 100) : 0;

  animateVal(document.getElementById('totalIncome'),  fmt(income));
  animateVal(document.getElementById('totalExpense'), fmt(expense));
  animateVal(document.getElementById('netBalance'),   fmt(balance));
  animateVal(document.getElementById('savingsRate'),  savings + '%');

  document.getElementById('incomeCount').textContent  = txs.filter(t => t.type === 'income').length  + ' transactions';
  document.getElementById('expenseCount').textContent = txs.filter(t => t.type === 'expense').length + ' transactions';

  const bEl = document.getElementById('balanceStatus');
  bEl.textContent = balance >= 0 ? 'Positive balance ✓' : 'Spending exceeds income';
  bEl.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
}

function sumPeriod(txs, start, end) {
  const f = txs.filter(t => { const d = parseDate(t.date); return d >= start && d <= end; });
  const income  = f.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = f.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function renderPeriodSummary() {
  const txs = state.transactions;
  const [ws, we] = getWeekRange();
  const [ms, me] = getMonthRange();
  const w = sumPeriod(txs, ws, we);
  const m = sumPeriod(txs, ms, me);

  document.getElementById('weekIncome').textContent  = fmt(w.income);
  document.getElementById('weekExpense').textContent = fmt(w.expense);
  const wBal = document.getElementById('weekBalance');
  wBal.textContent = fmt(w.balance);
  wBal.className = 'period-val ' + (w.balance >= 0 ? 'income' : 'expense');

  document.getElementById('monthIncome').textContent  = fmt(m.income);
  document.getElementById('monthExpense').textContent = fmt(m.expense);
  const mBal = document.getElementById('monthBalance');
  mBal.textContent = fmt(m.balance);
  mBal.className = 'period-val ' + (m.balance >= 0 ? 'income' : 'expense');
}

function renderTransactions() {
  let txs = sortTransactions(filterTransactions());

  // Running balance (chronological)
  const allSorted = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  const runMap = {};
  let run = 0;
  allSorted.forEach(t => {
    run += t.type === 'income' ? t.amount : -t.amount;
    runMap[t.id] = run;
  });

  const tbody = document.getElementById('txBody');
  tbody.innerHTML = '';

  if (txs.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <span class="empty-icon">◈</span>
          <p>No transactions match your filters.</p>
        </div>
      </td></tr>`;
    return;
  }

  txs.forEach(t => {
    const rb = runMap[t.id] ?? 0;
    const emoji = CATEGORY_EMOJI[t.category] || '📦';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="tx-date">${formatDisplayDate(t.date)}</td>
      <td>
        <div class="tx-desc">${escHtml(t.description)}</div>
        ${t.note ? `<div class="tx-note">${escHtml(t.note)}</div>` : ''}
        <div class="tx-mobile-meta">
          <span class="tx-cat">${emoji} ${t.category}</span>
          &nbsp;<span class="tx-badge ${t.type}">${t.type}</span>
        </div>
      </td>
      <td class="col-hide-sm"><span class="tx-cat">${emoji} ${t.category}</span></td>
      <td class="col-hide-sm"><span class="tx-badge ${t.type}">${t.type}</span></td>
      <td class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
      <td class="tx-running ${rb >= 0 ? 'pos' : 'neg'} col-hide-md">${fmt(rb)}</td>
      <td class="tx-actions">
        <button class="btn-icon" title="Edit" data-id="${t.id}" data-action="edit">✎</button>
        <button class="btn-icon del" title="Delete" data-id="${t.id}" data-action="delete">✕</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // Sort arrows
  document.querySelectorAll('.tx-table th[data-sort]').forEach(th => {
    th.classList.remove('th-sorted');
    const arrow = th.querySelector('.sort-arrow');
    if (th.dataset.sort === state.sort.col) {
      th.classList.add('th-sorted');
      if (arrow) arrow.textContent = state.sort.dir === 'asc' ? '↑' : '↓';
    } else {
      if (arrow) arrow.textContent = '↕';
    }
  });
}

// ──────────────────────────── CHARTS ────────────────────────────
let pieChart = null, barChart = null, analyticsBar = null, categoryBar = null;

const PIE_PALETTE = [
  '#ff4d6d','#ff8c42','#f5cb5c','#00e5a0','#4da6ff',
  '#c8a96e','#a78bfa','#f472b6','#34d399','#60a5fa',
];

function chartColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid:    dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
    text:    dark ? '#7c8296' : '#5a6080',
    income:  dark ? '#00e5a0' : '#009e6e',
    expense: dark ? '#ff4d6d' : '#d42045',
  };
}

function renderCharts() {
  renderPieChart();
  renderBarChart();
}

function renderPieChart() {
  const expenses = state.transactions.filter(t => t.type === 'expense');
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const labels = Object.keys(catMap);
  const data   = Object.values(catMap);

  const emptyEl = document.getElementById('pieEmpty');
  if (!labels.length) {
    emptyEl.classList.add('show');
    if (pieChart) { pieChart.destroy(); pieChart = null; }
    return;
  }
  emptyEl.classList.remove('show');

  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: PIE_PALETTE.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: chartColors().text,
            font: { family: 'JetBrains Mono', size: 10 },
            boxWidth: 10,
            padding: 10,
            generateLabels: chart => {
              const ds = chart.data.datasets[0];
              return chart.data.labels.map((l, i) => ({
                text: `${l}  ${sym()}${ds.data[i].toLocaleString('en-PH', { maximumFractionDigits: 0 })}`,
                fillStyle: PIE_PALETTE[i],
                hidden: false,
                index: i,
              }));
            },
          },
        },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed)}` } },
      },
      animation: { animateRotate: true, duration: 450 },
    },
  });
}

function renderBarChart() {
  const c = chartColors();
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }) });
  }

  const incomes  = months.map(m => state.transactions
    .filter(t => { const d = parseDate(t.date); return t.type === 'income'  && d.getFullYear() === m.year && d.getMonth() === m.month; })
    .reduce((s, t) => s + t.amount, 0));
  const expenses = months.map(m => state.transactions
    .filter(t => { const d = parseDate(t.date); return t.type === 'expense' && d.getFullYear() === m.year && d.getMonth() === m.month; })
    .reduce((s, t) => s + t.amount, 0));

  const ctx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Income',  data: incomes,  backgroundColor: c.income  + '44', borderColor: c.income,  borderWidth: 2, borderRadius: 4 },
        { label: 'Expense', data: expenses, backgroundColor: c.expense + '44', borderColor: c.expense, borderWidth: 2, borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: c.text, font: { family: 'JetBrains Mono', size: 10 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)}` } },
      },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'JetBrains Mono', size: 10 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'JetBrains Mono', size: 10 }, callback: v => sym() + v.toLocaleString() } },
      },
      animation: { duration: 400 },
    },
  });
}

// ──────────────────────────── BUDGETS ────────────────────────────
function renderBudgets() {
  const grid = document.getElementById('budgetGrid');
  grid.innerHTML = '';

  const [ms, me] = getMonthRange();
  const monthSpend = {};
  state.transactions
    .filter(t => t.type === 'expense')
    .filter(t => { const d = parseDate(t.date); return d >= ms && d <= me; })
    .forEach(t => { monthSpend[t.category] = (monthSpend[t.category] || 0) + t.amount; });

  EXPENSE_CATS.forEach(cat => {
    const budget = parseFloat(state.budgets[cat]) || 0;
    const spent  = monthSpend[cat] || 0;
    const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const over   = budget > 0 && spent > budget;
    const warn   = budget > 0 && pct >= 80;

    const el = document.createElement('div');
    el.className = 'budget-item';
    el.innerHTML = `
      <div class="budget-item-header">
        <div class="budget-cat-name">${CATEGORY_EMOJI[cat] || '📦'} ${cat}</div>
        <input type="number" class="budget-input" data-cat="${cat}"
          placeholder="No limit" min="0" step="100"
          value="${budget > 0 ? budget : ''}" />
      </div>
      <div class="budget-bar-wrap">
        <div class="budget-bar ${over ? 'over' : warn ? 'warn' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="budget-meta">
        <span>Spent: ${fmt(spent)}</span>
        <span>${budget > 0 ? fmt(budget) + ' limit' : 'No limit set'}</span>
      </div>`;
    grid.appendChild(el);
  });
}

// ──────────────────────────── ANALYTICS ────────────────────────────
function renderAnalytics() {
  const txs     = state.transactions;
  const expenses = txs.filter(t => t.type === 'expense');
  const incomes  = txs.filter(t => t.type === 'income');

  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('topCategory').textContent = topCat
    ? `${CATEGORY_EMOJI[topCat[0]] || ''} ${topCat[0]}` : '—';

  if (expenses.length > 0) {
    const dates = expenses.map(t => t.date).sort();
    const d1  = parseDate(dates[0]);
    const d2  = parseDate(dates[dates.length - 1]);
    const days = Math.max(1, Math.round((d2 - d1) / (86400000)) + 1);
    const total = expenses.reduce((s, t) => s + t.amount, 0);
    document.getElementById('avgDaily').textContent = fmt(total / days);
  } else {
    document.getElementById('avgDaily').textContent = fmt(0);
  }

  document.getElementById('largestExpense').textContent = fmt(expenses.reduce((m, t) => t.amount > m ? t.amount : m, 0));
  document.getElementById('largestIncome').textContent  = fmt(incomes.reduce((m, t)  => t.amount > m ? t.amount : m, 0));

  // Monthly chart
  const monthMap = {};
  txs.forEach(t => {
    const d = parseDate(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    monthMap[key][t.type] += t.amount;
  });
  const mKeys   = Object.keys(monthMap).sort();
  const mLabels = mKeys.map(k => { const [y, m] = k.split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }); });

  const c = chartColors();
  const ctx2 = document.getElementById('analyticsBar').getContext('2d');
  if (analyticsBar) analyticsBar.destroy();
  analyticsBar = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: mLabels,
      datasets: [
        { label: 'Income',  data: mKeys.map(k => monthMap[k].income),  backgroundColor: c.income  + '44', borderColor: c.income,  borderWidth: 2, borderRadius: 4 },
        { label: 'Expense', data: mKeys.map(k => monthMap[k].expense), backgroundColor: c.expense + '44', borderColor: c.expense, borderWidth: 2, borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: c.text, font: { family: 'JetBrains Mono', size: 10 }, boxWidth: 10 } }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)}` } } },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'JetBrains Mono', size: 10 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'JetBrains Mono', size: 10 }, callback: v => sym() + v.toLocaleString() } },
      },
      animation: { duration: 400 },
    },
  });

  // Category bar
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const ctx3 = document.getElementById('categoryBar').getContext('2d');
  if (categoryBar) categoryBar.destroy();
  categoryBar = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: catEntries.map(([k]) => k),
      datasets: [{ label: 'Total Spent', data: catEntries.map(([, v]) => v), backgroundColor: PIE_PALETTE, borderWidth: 0, borderRadius: 5 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.x)}` } } },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'JetBrains Mono', size: 10 }, callback: v => sym() + v.toLocaleString() } },
        y: { grid: { color: 'transparent' }, ticks: { color: c.text, font: { family: 'JetBrains Mono', size: 10 } } },
      },
      animation: { duration: 400 },
    },
  });
}

// ──────────────────────────── CURRENCY ────────────────────────────
function updateCurrencyUI() {
  document.querySelectorAll('.currency-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.currency === state.currency);
  });
}

// ──────────────────────────── MODAL ────────────────────────────
function openModal(editId = null) {
  state.editingId = editId;
  const title = document.getElementById('modalTitle');

  if (editId) {
    const t = state.transactions.find(x => x.id === editId);
    if (!t) return;
    title.textContent = 'Edit Transaction';
    document.getElementById('txDescription').value = t.description;
    document.getElementById('txAmount').value      = t.amount;
    document.getElementById('txDate').value        = t.date;
    document.getElementById('txNote').value        = t.note || '';
    document.getElementById('txCategory').value    = t.category;
    setTypeOpt(t.type);
    updateCategoryOptions(t.type);
    hideCatBanner();
  } else {
    title.textContent = 'Add Transaction';
    document.getElementById('txDescription').value = '';
    document.getElementById('txAmount').value      = '';
    document.getElementById('txDate').value        = today();
    document.getElementById('txNote').value        = '';
    document.getElementById('txCategory').value    = 'Food';
    setTypeOpt('expense');
    updateCategoryOptions('expense');
    hideCatBanner();
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('txDescription').focus(), 80);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  state.editingId = null;
}

function setTypeOpt(type) {
  document.querySelectorAll('.type-opt').forEach(b => b.classList.toggle('active', b.dataset.type === type));
}

function getSelectedType() {
  return document.querySelector('.type-opt.active')?.dataset.type || 'expense';
}

function updateCategoryOptions(type) {
  const sel = document.getElementById('txCategory');
  // Show/hide optgroups by filtering options
  const groups = sel.querySelectorAll('optgroup');
  if (type === 'expense') {
    groups[0].hidden = false;
    groups[1].hidden = true;
    if (['Allowance','Salary','Freelance','Gift'].includes(sel.value)) sel.value = 'Food';
  } else {
    groups[0].hidden = true;
    groups[1].hidden = false;
    if (!INCOME_CATS.includes(sel.value)) sel.value = 'Allowance';
  }
}

function showCatBanner(name) {
  const banner = document.getElementById('autocatBanner');
  document.getElementById('autocatName').textContent = name;
  banner.classList.remove('hidden');
}
function hideCatBanner() {
  document.getElementById('autocatBanner').classList.add('hidden');
}

// ──────────────────────────── SAVE TRANSACTION ────────────────────────────
function saveTransaction() {
  const desc   = document.getElementById('txDescription').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const cat    = document.getElementById('txCategory').value;
  const note   = document.getElementById('txNote').value.trim();
  const type   = getSelectedType();

  if (!desc)              { toast('Please enter a description.', 'error'); return; }
  if (!amount || amount <= 0) { toast('Please enter a valid amount.', 'error'); return; }
  if (!date)              { toast('Please select a date.', 'error'); return; }

  if (state.editingId) {
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    if (idx > -1) state.transactions[idx] = { ...state.transactions[idx], description: desc, amount, date, category: cat, type, note };
    toast('Transaction updated ✓');
  } else {
    state.transactions.push({ id: genId(), description: desc, amount, date, category: cat, type, note });
    toast('Transaction added ✓');
  }

  save(); renderAll(); closeModal();
}

// ──────────────────────────── DELETE ────────────────────────────
function openDeleteConfirm(id) {
  state.deletingId = id;
  document.getElementById('deleteOverlay').classList.remove('hidden');
}
function closeDeleteConfirm() {
  state.deletingId = null;
  document.getElementById('deleteOverlay').classList.add('hidden');
}
function confirmDelete() {
  if (!state.deletingId) return;
  state.transactions = state.transactions.filter(t => t.id !== state.deletingId);
  save(); renderAll(); closeDeleteConfirm();
  toast('Transaction deleted.', 'info');
}

// ──────────────────────────── CSV ────────────────────────────
function exportCSV() {
  const txs = filterTransactions();
  if (!txs.length) { toast('No transactions to export.', 'error'); return; }
  const rows = [['Date', 'Description', 'Category', 'Type', 'Amount', 'Note']];
  txs.forEach(t => rows.push([t.date, `"${t.description}"`, t.category, t.type, t.amount, `"${t.note || ''}"`]));
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.map(r => r.join(',')).join('\n'));
  a.download = `fintrack_${today()}.csv`;
  a.click();
  toast('CSV exported ✓');
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.trim().split('\n');
    if (lines.length < 2) { toast('CSV appears empty.', 'error'); return; }
    let added = 0, skipped = 0;
    lines.slice(1).forEach(line => {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const [date, desc, cat, type, amt, note] = cols;
      const amount = parseFloat(amt);
      if (!date || !desc || !type || isNaN(amount)) { skipped++; return; }
      state.transactions.push({
        id: genId(), date: date || today(),
        description: desc || 'Imported',
        category: cat || 'Others',
        type: type === 'income' ? 'income' : 'expense',
        amount: Math.abs(amount), note: note || '',
      });
      added++;
    });
    save(); renderAll();
    toast(`Imported ${added}${skipped ? ' (' + skipped + ' skipped)' : ''} transaction(s).`, added > 0 ? 'success' : 'error');
  };
  reader.readAsText(file);
}

// ──────────────────────────── BUDGETS SAVE ────────────────────────────
function saveBudgets() {
  document.querySelectorAll('.budget-input').forEach(inp => {
    const cat = inp.dataset.cat;
    const val = parseFloat(inp.value);
    if (val > 0) state.budgets[cat] = val;
    else delete state.budgets[cat];
  });
  save(); renderBudgets();
  toast('Budgets saved ✓');
}

// ──────────────────────────── THEME ────────────────────────────
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('.theme-icon').textContent = theme === 'dark' ? '☽' : '☀';
  renderCharts();
  if (state.currentView === 'analytics') renderAnalytics();
}

// ──────────────────────────── VIEW SWITCHING ────────────────────────────
function switchView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  const titles = { dashboard: 'Dashboard', transactions: 'Transactions', budgets: 'Budgets', analytics: 'Analytics' };
  document.getElementById('pageTitle').textContent = titles[view] || view;
  if (view === 'analytics') renderAnalytics();
  if (view === 'budgets')   renderBudgets();
  closeSidebar();
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.add('hidden');
}
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarBackdrop').classList.remove('hidden');
}

// ══════════════════════════ INIT ══════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  load();
  applyTheme(state.theme);
  updateCurrencyUI();
  renderAll();

  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Sidebar open/close
  document.getElementById('hamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);

  // FAB / open modal
  document.getElementById('openAddModal').addEventListener('click', () => openModal());

  // Modal close
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  // Save transaction
  document.getElementById('saveTransaction').addEventListener('click', saveTransaction);
  ['txDescription', 'txAmount', 'txDate', 'txNote'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') saveTransaction(); });
  });

  // ── AUTO-CATEGORIZATION ──
  let autocatTimer;
  document.getElementById('txDescription').addEventListener('input', e => {
    clearTimeout(autocatTimer);
    autocatTimer = setTimeout(() => {
      const desc = e.target.value.trim();
      if (!desc) { hideCatBanner(); return; }
      const type = getSelectedType();
      const { category, matched } = autoDetectCategory(desc, type);
      if (matched) {
        document.getElementById('txCategory').value = category;
        const emoji = CATEGORY_EMOJI[category] || '';
        showCatBanner(`${emoji} ${category}`);
      } else {
        hideCatBanner();
      }
    }, 300);
  });

  // Type toggle in modal
  document.querySelectorAll('.type-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      setTypeOpt(btn.dataset.type);
      updateCategoryOptions(btn.dataset.type);
      hideCatBanner();
      // Re-run auto-cat if description already typed
      const desc = document.getElementById('txDescription').value.trim();
      if (desc) {
        const { category, matched } = autoDetectCategory(desc, btn.dataset.type);
        if (matched) {
          document.getElementById('txCategory').value = category;
          showCatBanner(`${CATEGORY_EMOJI[category] || ''} ${category}`);
        }
      }
    });
  });

  // Delete confirm
  document.getElementById('closeDelete').addEventListener('click', closeDeleteConfirm);
  document.getElementById('cancelDelete').addEventListener('click', closeDeleteConfirm);
  document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
  document.getElementById('deleteOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteConfirm(); });

  // Table actions
  document.getElementById('txBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit')   openModal(btn.dataset.id);
    if (btn.dataset.action === 'delete') openDeleteConfirm(btn.dataset.id);
  });

  // Sort
  document.querySelectorAll('.tx-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.sort.col === col) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      else { state.sort.col = col; state.sort.dir = 'asc'; }
      renderTransactions();
    });
  });

  // Period filter
  document.getElementById('filterPeriod').addEventListener('change', e => {
    state.filter.period = e.target.value;
    document.getElementById('customRange').classList.toggle('hidden', e.target.value !== 'custom');
    if (e.target.value !== 'custom') renderTransactions();
  });

  document.getElementById('applyRange').addEventListener('click', () => {
    state.filter.dateFrom = document.getElementById('dateFrom').value;
    state.filter.dateTo   = document.getElementById('dateTo').value;
    renderTransactions();
  });

  // Type pills
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter.type = btn.dataset.filter;
      renderTransactions();
    });
  });

  // Search
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.filter.search = e.target.value; renderTransactions(); }, 200);
  });

  // CSV
  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.getElementById('importCSV').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) { importCSV(file); e.target.value = ''; }
  });

  // Budgets save
  document.getElementById('saveBudgets').addEventListener('click', saveBudgets);

  // Currency
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', () => { state.currency = btn.dataset.currency; save(); renderAll(); });
  });

  // Theme
  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    save();
  });

});

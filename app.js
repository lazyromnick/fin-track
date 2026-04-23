/* ═══════════════════════════════════════════════════════════════
   FinTrack v2.2 — app.js
   Fixes:
   - Period stats always display inline (IN/OUT/NET)
   - Modal: single-column stack, Amount+Date side-by-side
   - Category picker: only shows relevant type's categories
   - Auto-cat: also switches Type when income keyword detected
   - Transactions: cat+type shown inline in description cell
   - Today's Overview widget on dashboard
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

const CURRENCY_SYMBOLS = { PHP: '₱' };

const CATEGORY_EMOJI = {
  Food:'🍜', Transport:'🚌', Bills:'💡', Shopping:'🛍️',
  Communication:'📱', Health:'🏥', Education:'📚',
  Housing:'🏠', Entertainment:'🎮', Others:'📦',
  Allowance:'💰', Salary:'💼', Freelance:'💻', Gift:'🎁',
};

const EXPENSE_CATS = ['Food','Transport','Bills','Shopping','Communication','Health','Education','Housing','Entertainment','Others'];
const INCOME_CATS  = ['Allowance','Salary','Freelance','Gift','Others'];

// ════════════════════════════════════════════════════════════════
//  AUTO-CATEGORIZATION ENGINE
//  Each entry is { type: 'expense'|'income', category: string }
//  Keywords are checked against lowercased description.
//  Longer match wins (more specific = higher priority).
// ════════════════════════════════════════════════════════════════
const AUTO_RULES = [

  // ── INCOME keywords (must come before expense to avoid conflicts) ──
  { kw: 'allowance',          type:'income', cat:'Allowance' },
  { kw: 'baon',               type:'income', cat:'Allowance' },
  { kw: 'buwanang allowance', type:'income', cat:'Allowance' },
  { kw: 'weekly allowance',   type:'income', cat:'Allowance' },
  { kw: 'daily allowance',    type:'income', cat:'Allowance' },
  { kw: 'padala',             type:'income', cat:'Allowance' },
  { kw: 'remittance',         type:'income', cat:'Allowance' },
  { kw: 'scholarship',        type:'income', cat:'Allowance' },
  { kw: 'stipend',            type:'income', cat:'Allowance' },
  { kw: 'living allowance',   type:'income', cat:'Allowance' },
  { kw: 'nanay',              type:'income', cat:'Allowance' },
  { kw: 'tatay',              type:'income', cat:'Allowance' },
  { kw: 'mama',               type:'income', cat:'Allowance' },
  { kw: 'papa',               type:'income', cat:'Allowance' },
  { kw: 'magulang',           type:'income', cat:'Allowance' },

  { kw: 'salary',             type:'income', cat:'Salary' },
  { kw: 'sweldo',             type:'income', cat:'Salary' },
  { kw: 'sahod',              type:'income', cat:'Salary' },
  { kw: 'payroll',            type:'income', cat:'Salary' },
  { kw: 'paycheck',           type:'income', cat:'Salary' },
  { kw: 'wages',              type:'income', cat:'Salary' },
  { kw: 'part-time pay',      type:'income', cat:'Salary' },
  { kw: 'part time pay',      type:'income', cat:'Salary' },
  { kw: 'ot pay',             type:'income', cat:'Salary' },
  { kw: 'overtime pay',       type:'income', cat:'Salary' },
  { kw: '13th month',         type:'income', cat:'Salary' },
  { kw: 'bonus',              type:'income', cat:'Salary' },
  { kw: 'commission',         type:'income', cat:'Salary' },

  { kw: 'freelance',          type:'income', cat:'Freelance' },
  { kw: 'project payment',    type:'income', cat:'Freelance' },
  { kw: 'online work',        type:'income', cat:'Freelance' },
  { kw: 'upwork',             type:'income', cat:'Freelance' },
  { kw: 'fiverr',             type:'income', cat:'Freelance' },
  { kw: 'tutoring fee',       type:'income', cat:'Freelance' },
  { kw: 'tutorial fee',       type:'income', cat:'Freelance' },
  { kw: 'online selling',     type:'income', cat:'Freelance' },
  { kw: 'payment received',   type:'income', cat:'Freelance' },
  { kw: 'gcash received',     type:'income', cat:'Freelance' },
  { kw: 'maya received',      type:'income', cat:'Freelance' },

  { kw: 'gift',               type:'income', cat:'Gift' },
  { kw: 'regalo',             type:'income', cat:'Gift' },
  { kw: 'pasalubong',         type:'income', cat:'Gift' },
  { kw: 'cash gift',          type:'income', cat:'Gift' },
  { kw: 'money gift',         type:'income', cat:'Gift' },
  { kw: 'ayuda',              type:'income', cat:'Gift' },
  { kw: 'birthday money',     type:'income', cat:'Gift' },
  { kw: 'ninong',             type:'income', cat:'Gift' },
  { kw: 'ninang',             type:'income', cat:'Gift' },

  // ── FOOD ──
  { kw: 'ulam',               type:'expense', cat:'Food' },
  { kw: 'kanin',              type:'expense', cat:'Food' },
  { kw: 'sinaing',            type:'expense', cat:'Food' },
  { kw: 'nilaga',             type:'expense', cat:'Food' },
  { kw: 'sinigang',           type:'expense', cat:'Food' },
  { kw: 'adobo',              type:'expense', cat:'Food' },
  { kw: 'kare-kare',          type:'expense', cat:'Food' },
  { kw: 'lechon',             type:'expense', cat:'Food' },
  { kw: 'liempo',             type:'expense', cat:'Food' },
  { kw: 'bulalo',             type:'expense', cat:'Food' },
  { kw: 'tinola',             type:'expense', cat:'Food' },
  { kw: 'pinakbet',           type:'expense', cat:'Food' },
  { kw: 'afritada',           type:'expense', cat:'Food' },
  { kw: 'caldereta',          type:'expense', cat:'Food' },
  { kw: 'mechado',            type:'expense', cat:'Food' },
  { kw: 'bistek',             type:'expense', cat:'Food' },
  { kw: 'tapsilog',           type:'expense', cat:'Food' },
  { kw: 'longsilog',          type:'expense', cat:'Food' },
  { kw: 'tocilog',            type:'expense', cat:'Food' },
  { kw: 'bangsilog',          type:'expense', cat:'Food' },
  { kw: 'hotsilog',           type:'expense', cat:'Food' },
  { kw: 'cornsilog',          type:'expense', cat:'Food' },
  { kw: 'spamsilog',          type:'expense', cat:'Food' },
  { kw: 'sinangag',           type:'expense', cat:'Food' },
  { kw: 'champorado',         type:'expense', cat:'Food' },
  { kw: 'lugaw',              type:'expense', cat:'Food' },
  { kw: 'arroz caldo',        type:'expense', cat:'Food' },
  { kw: 'goto',               type:'expense', cat:'Food' },
  { kw: 'mami',               type:'expense', cat:'Food' },
  { kw: 'lomi',               type:'expense', cat:'Food' },
  { kw: 'palabok',            type:'expense', cat:'Food' },
  { kw: 'pancit',             type:'expense', cat:'Food' },
  { kw: 'bihon',              type:'expense', cat:'Food' },
  { kw: 'sotanghon',          type:'expense', cat:'Food' },
  { kw: 'canton',             type:'expense', cat:'Food' },
  { kw: 'siomai',             type:'expense', cat:'Food' },
  { kw: 'siopao',             type:'expense', cat:'Food' },
  { kw: 'lumpia',             type:'expense', cat:'Food' },
  { kw: 'puto',               type:'expense', cat:'Food' },
  { kw: 'bibingka',           type:'expense', cat:'Food' },
  { kw: 'halo-halo',          type:'expense', cat:'Food' },
  { kw: 'buko juice',         type:'expense', cat:'Food' },
  { kw: 'buko',               type:'expense', cat:'Food' },
  { kw: 'gulaman',            type:'expense', cat:'Food' },
  { kw: 'fishball',           type:'expense', cat:'Food' },
  { kw: 'kikiam',             type:'expense', cat:'Food' },
  { kw: 'squidball',          type:'expense', cat:'Food' },
  { kw: 'kwek kwek',          type:'expense', cat:'Food' },
  { kw: 'isaw',               type:'expense', cat:'Food' },
  { kw: 'balut',              type:'expense', cat:'Food' },
  { kw: 'chicharon',          type:'expense', cat:'Food' },
  { kw: 'tinapay',            type:'expense', cat:'Food' },
  { kw: 'pandesal',           type:'expense', cat:'Food' },
  { kw: 'toyo',               type:'expense', cat:'Food' },
  { kw: 'patis',              type:'expense', cat:'Food' },
  { kw: 'suka',               type:'expense', cat:'Food' },
  { kw: 'ajinomoto',          type:'expense', cat:'Food' },
  { kw: 'mantika',            type:'expense', cat:'Food' },
  { kw: 'merienda',           type:'expense', cat:'Food' },
  { kw: 'almusal',            type:'expense', cat:'Food' },
  { kw: 'tanghalian',         type:'expense', cat:'Food' },
  { kw: 'hapunan',            type:'expense', cat:'Food' },
  { kw: 'jollibee',           type:'expense', cat:'Food' },
  { kw: 'mcdo',               type:'expense', cat:'Food' },
  { kw: 'mcdonald',           type:'expense', cat:'Food' },
  { kw: 'kfc',                type:'expense', cat:'Food' },
  { kw: 'chowking',           type:'expense', cat:'Food' },
  { kw: 'greenwich',          type:'expense', cat:'Food' },
  { kw: 'shakeys',            type:'expense', cat:'Food' },
  { kw: 'mang inasal',        type:'expense', cat:'Food' },
  { kw: 'bonchon',            type:'expense', cat:'Food' },
  { kw: 'potato corner',      type:'expense', cat:'Food' },
  { kw: 'andoks',             type:'expense', cat:'Food' },
  { kw: 'max\'s',             type:'expense', cat:'Food' },
  { kw: 'starbucks',          type:'expense', cat:'Food' },
  { kw: 'bo\'s coffee',       type:'expense', cat:'Food' },
  { kw: 'milk tea',           type:'expense', cat:'Food' },
  { kw: 'chatime',            type:'expense', cat:'Food' },
  { kw: 'gong cha',           type:'expense', cat:'Food' },
  { kw: 'tealive',            type:'expense', cat:'Food' },
  { kw: 'bubble tea',         type:'expense', cat:'Food' },
  { kw: 'carinderia',         type:'expense', cat:'Food' },
  { kw: 'carenderia',         type:'expense', cat:'Food' },
  { kw: 'turo-turo',          type:'expense', cat:'Food' },
  { kw: 'grab food',          type:'expense', cat:'Food' },
  { kw: 'foodpanda',          type:'expense', cat:'Food' },
  { kw: 'grocery',            type:'expense', cat:'Food' },
  { kw: 'groceries',          type:'expense', cat:'Food' },
  { kw: 'palengke',           type:'expense', cat:'Food' },
  { kw: 'puregold',           type:'expense', cat:'Food' },
  { kw: 'savemore',           type:'expense', cat:'Food' },
  { kw: 'waltermart',         type:'expense', cat:'Food' },
  { kw: 'landers',            type:'expense', cat:'Food' },
  { kw: 'breakfast',          type:'expense', cat:'Food' },
  { kw: 'lunch',              type:'expense', cat:'Food' },
  { kw: 'dinner',             type:'expense', cat:'Food' },
  { kw: 'snack',              type:'expense', cat:'Food' },
  { kw: 'coffee',             type:'expense', cat:'Food' },
  { kw: 'softdrinks',         type:'expense', cat:'Food' },
  { kw: 'milo',               type:'expense', cat:'Food' },
  { kw: 'kopiko',             type:'expense', cat:'Food' },
  { kw: 'nescafe',            type:'expense', cat:'Food' },
  { kw: 'c2',                 type:'expense', cat:'Food' },
  { kw: 'nestea',             type:'expense', cat:'Food' },
  { kw: 'pizza',              type:'expense', cat:'Food' },
  { kw: 'burger',             type:'expense', cat:'Food' },
  { kw: 'pasta',              type:'expense', cat:'Food' },
  { kw: 'chicken',            type:'expense', cat:'Food' },
  { kw: 'rice meal',          type:'expense', cat:'Food' },
  { kw: 'meal',               type:'expense', cat:'Food' },
  { kw: 'food',               type:'expense', cat:'Food' },
  { kw: 'restaurant',         type:'expense', cat:'Food' },
  { kw: 'eatery',             type:'expense', cat:'Food' },
  { kw: 'bread',              type:'expense', cat:'Food' },
  { kw: 'egg',                type:'expense', cat:'Food' },
  { kw: 'fruit',              type:'expense', cat:'Food' },
  { kw: 'vegetable',          type:'expense', cat:'Food' },

  // ── TRANSPORT ──
  { kw: 'jeepney',            type:'expense', cat:'Transport' },
  { kw: 'jeep fare',          type:'expense', cat:'Transport' },
  { kw: 'pedicab',            type:'expense', cat:'Transport' },
  { kw: 'tricycle fare',      type:'expense', cat:'Transport' },
  { kw: 'trike',              type:'expense', cat:'Transport' },
  { kw: 'habal-habal',        type:'expense', cat:'Transport' },
  { kw: 'uv express',         type:'expense', cat:'Transport' },
  { kw: 'mrt',                type:'expense', cat:'Transport' },
  { kw: 'lrt',                type:'expense', cat:'Transport' },
  { kw: 'beep card',          type:'expense', cat:'Transport' },
  { kw: 'angkas',             type:'expense', cat:'Transport' },
  { kw: 'grab ride',          type:'expense', cat:'Transport' },
  { kw: 'grab car',           type:'expense', cat:'Transport' },
  { kw: 'move it',            type:'expense', cat:'Transport' },
  { kw: 'mybus',              type:'expense', cat:'Transport' },
  { kw: 'bus fare',           type:'expense', cat:'Transport' },
  { kw: 'pamasahe',           type:'expense', cat:'Transport' },
  { kw: 'pasahe',             type:'expense', cat:'Transport' },
  { kw: 'commute',            type:'expense', cat:'Transport' },
  { kw: 'gasoline',           type:'expense', cat:'Transport' },
  { kw: 'petrol',             type:'expense', cat:'Transport' },
  { kw: 'fuel',               type:'expense', cat:'Transport' },
  { kw: 'parking',            type:'expense', cat:'Transport' },
  { kw: 'toll',               type:'expense', cat:'Transport' },
  { kw: 'skyway',             type:'expense', cat:'Transport' },
  { kw: 'ferry',              type:'expense', cat:'Transport' },
  { kw: 'transport',          type:'expense', cat:'Transport' },
  { kw: 'taxi',               type:'expense', cat:'Transport' },

  // ── LOAD / INTERNET ──
  { kw: 'load',               type:'expense', cat:'Communication' },
  { kw: 'e-load',             type:'expense', cat:'Communication' },
  { kw: 'eload',              type:'expense', cat:'Communication' },
  { kw: 'prepaid load',       type:'expense', cat:'Communication' },
  { kw: 'top up',             type:'expense', cat:'Communication' },
  { kw: 'topup',              type:'expense', cat:'Communication' },
  { kw: 'globe load',         type:'expense', cat:'Communication' },
  { kw: 'smart load',         type:'expense', cat:'Communication' },
  { kw: 'sun load',           type:'expense', cat:'Communication' },
  { kw: 'gigasurf',           type:'expense', cat:'Communication' },
  { kw: 'gosakto',            type:'expense', cat:'Communication' },
  { kw: 'unli call',          type:'expense', cat:'Communication' },
  { kw: 'unli text',          type:'expense', cat:'Communication' },
  { kw: 'internet load',      type:'expense', cat:'Communication' },
  { kw: 'data promo',         type:'expense', cat:'Communication' },
  { kw: 'postpaid',           type:'expense', cat:'Communication' },
  { kw: 'phone bill',         type:'expense', cat:'Communication' },

  // ── BILLS & UTILITIES ──
  { kw: 'meralco',            type:'expense', cat:'Bills' },
  { kw: 'electric bill',      type:'expense', cat:'Bills' },
  { kw: 'electricity',        type:'expense', cat:'Bills' },
  { kw: 'kuryente',           type:'expense', cat:'Bills' },
  { kw: 'maynilad',           type:'expense', cat:'Bills' },
  { kw: 'manila water',       type:'expense', cat:'Bills' },
  { kw: 'water bill',         type:'expense', cat:'Bills' },
  { kw: 'tubig bill',         type:'expense', cat:'Bills' },
  { kw: 'pldt',               type:'expense', cat:'Bills' },
  { kw: 'converge',           type:'expense', cat:'Bills' },
  { kw: 'wifi bill',          type:'expense', cat:'Bills' },
  { kw: 'internet bill',      type:'expense', cat:'Bills' },
  { kw: 'broadband',          type:'expense', cat:'Bills' },
  { kw: 'cignal',             type:'expense', cat:'Bills' },
  { kw: 'cable bill',         type:'expense', cat:'Bills' },
  { kw: 'netflix',            type:'expense', cat:'Bills' },
  { kw: 'spotify',            type:'expense', cat:'Bills' },
  { kw: 'disney',             type:'expense', cat:'Bills' },
  { kw: 'youtube premium',    type:'expense', cat:'Bills' },
  { kw: 'subscription',       type:'expense', cat:'Bills' },
  { kw: 'utility',            type:'expense', cat:'Bills' },
  { kw: 'association dues',   type:'expense', cat:'Bills' },
  { kw: 'surf & downy',       type:'expense', cat:'Bills' },
  { kw: 'cash-out fee',       type:'expense', cat:'Bills' },
  { kw: 'cash out fee',       type:'expense', cat:'Bills' },
  { kw: 'cashout fee',        type:'expense', cat:'Bills' },

  // ── SHOPPING ──
  { kw: 'shopee',             type:'expense', cat:'Shopping' },
  { kw: 'lazada',             type:'expense', cat:'Shopping' },
  { kw: 'tiktok shop',        type:'expense', cat:'Shopping' },
  { kw: 'shein',              type:'expense', cat:'Shopping' },
  { kw: 'divisoria',          type:'expense', cat:'Shopping' },
  { kw: 'ukay',               type:'expense', cat:'Shopping' },
  { kw: 'clothes',            type:'expense', cat:'Shopping' },
  { kw: 'shirt',              type:'expense', cat:'Shopping' },
  { kw: 'pants',              type:'expense', cat:'Shopping' },
  { kw: 'shoes',              type:'expense', cat:'Shopping' },
  { kw: 'sneakers',           type:'expense', cat:'Shopping' },
  { kw: 'bag',                type:'expense', cat:'Shopping' },
  { kw: 'accessories',        type:'expense', cat:'Shopping' },
  { kw: 'shampoo',            type:'expense', cat:'Shopping' },
  { kw: 'conditioner',        type:'expense', cat:'Shopping' },
  { kw: 'lotion',             type:'expense', cat:'Shopping' },
  { kw: 'deodorant',          type:'expense', cat:'Shopping' },
  { kw: 'toothpaste',         type:'expense', cat:'Shopping' },
  { kw: 'toothbrush',         type:'expense', cat:'Shopping' },
  { kw: 'hygiene',            type:'expense', cat:'Shopping' },
  { kw: 'skincare',           type:'expense', cat:'Shopping' },
  { kw: 'feminine',           type:'expense', cat:'Shopping' },
  { kw: 'sanitary',           type:'expense', cat:'Shopping' },
  { kw: 'watsons',            type:'expense', cat:'Shopping' },
  { kw: 'appliance',          type:'expense', cat:'Shopping' },
  { kw: 'gadget',             type:'expense', cat:'Shopping' },

  // ── HEALTH ──
  { kw: 'botika',             type:'expense', cat:'Health' },
  { kw: 'pharmacy',           type:'expense', cat:'Health' },
  { kw: 'gamot',              type:'expense', cat:'Health' },
  { kw: 'medicine',           type:'expense', cat:'Health' },
  { kw: 'drugstore',          type:'expense', cat:'Health' },
  { kw: 'mercury drug',       type:'expense', cat:'Health' },
  { kw: 'generika',           type:'expense', cat:'Health' },
  { kw: 'rose pharmacy',      type:'expense', cat:'Health' },
  { kw: 'hospital',           type:'expense', cat:'Health' },
  { kw: 'clinic',             type:'expense', cat:'Health' },
  { kw: 'doctor',             type:'expense', cat:'Health' },
  { kw: 'checkup',            type:'expense', cat:'Health' },
  { kw: 'consultation',       type:'expense', cat:'Health' },
  { kw: 'paracetamol',        type:'expense', cat:'Health' },
  { kw: 'biogesic',           type:'expense', cat:'Health' },
  { kw: 'neozep',             type:'expense', cat:'Health' },
  { kw: 'bioflu',             type:'expense', cat:'Health' },
  { kw: 'vitamins',           type:'expense', cat:'Health' },
  { kw: 'vaccine',            type:'expense', cat:'Health' },
  { kw: 'dental',             type:'expense', cat:'Health' },
  { kw: 'dentist',            type:'expense', cat:'Health' },
  { kw: 'alcohol',            type:'expense', cat:'Health' },
  { kw: 'sanitizer',          type:'expense', cat:'Health' },
  { kw: 'philhealth',         type:'expense', cat:'Health' },

  // ── EDUCATION ──
  { kw: 'tuition',            type:'expense', cat:'Education' },
  { kw: 'enrollment',         type:'expense', cat:'Education' },
  { kw: 'school fee',         type:'expense', cat:'Education' },
  { kw: 'lab fee',            type:'expense', cat:'Education' },
  { kw: 'matriculation',      type:'expense', cat:'Education' },
  { kw: 'textbook',           type:'expense', cat:'Education' },
  { kw: 'reviewer',           type:'expense', cat:'Education' },
  { kw: 'module',             type:'expense', cat:'Education' },
  { kw: 'workbook',           type:'expense', cat:'Education' },
  { kw: 'photocopy',          type:'expense', cat:'Education' },
  { kw: 'printing',           type:'expense', cat:'Education' },
  { kw: 'notebook',           type:'expense', cat:'Education' },
  { kw: 'ballpen',            type:'expense', cat:'Education' },
  { kw: 'pencil',             type:'expense', cat:'Education' },
  { kw: 'highlighter',        type:'expense', cat:'Education' },
  { kw: 'bondpaper',          type:'expense', cat:'Education' },
  { kw: 'bond paper',         type:'expense', cat:'Education' },
  { kw: 'pad paper',          type:'expense', cat:'Education' },
  { kw: 'school supply',      type:'expense', cat:'Education' },
  { kw: 'supplies',           type:'expense', cat:'Education' },
  { kw: 'uniform',            type:'expense', cat:'Education' },
  { kw: 'thesis',             type:'expense', cat:'Education' },
  { kw: 'research',           type:'expense', cat:'Education' },
  { kw: 'review center',      type:'expense', cat:'Education' },
  { kw: 'tutorial',           type:'expense', cat:'Education' },
  { kw: 'online class',       type:'expense', cat:'Education' },

  // ── HOUSING ──
  { kw: 'dorm fee',           type:'expense', cat:'Housing' },
  { kw: 'dormitory fee',      type:'expense', cat:'Housing' },
  { kw: 'boarding fee',       type:'expense', cat:'Housing' },
  { kw: 'bedspace',           type:'expense', cat:'Housing' },
  { kw: 'room rent',          type:'expense', cat:'Housing' },
  { kw: 'apartment rent',     type:'expense', cat:'Housing' },
  { kw: 'condo fee',          type:'expense', cat:'Housing' },
  { kw: 'laundry',            type:'expense', cat:'Housing' },
  { kw: 'maglalaba',          type:'expense', cat:'Housing' },
  { kw: 'amortization',       type:'expense', cat:'Housing' },

  // ── ENTERTAINMENT ──
  { kw: 'cinema',             type:'expense', cat:'Entertainment' },
  { kw: 'movie ticket',       type:'expense', cat:'Entertainment' },
  { kw: 'concert',            type:'expense', cat:'Entertainment' },
  { kw: 'mobile legends',     type:'expense', cat:'Entertainment' },
  { kw: 'mobile game',        type:'expense', cat:'Entertainment' },
  { kw: 'in-app',             type:'expense', cat:'Entertainment' },
  { kw: 'game top-up',        type:'expense', cat:'Entertainment' },
  { kw: 'codm',               type:'expense', cat:'Entertainment' },
  { kw: 'genshin',            type:'expense', cat:'Entertainment' },
  { kw: 'valorant',           type:'expense', cat:'Entertainment' },
  { kw: 'roblox',             type:'expense', cat:'Entertainment' },
  { kw: 'steam',              type:'expense', cat:'Entertainment' },
  { kw: 'karaoke',            type:'expense', cat:'Entertainment' },
  { kw: 'videoke',            type:'expense', cat:'Entertainment' },
  { kw: 'gimik',              type:'expense', cat:'Entertainment' },
  { kw: 'gimmick',            type:'expense', cat:'Entertainment' },
  { kw: 'resort',             type:'expense', cat:'Entertainment' },
  { kw: 'beach',              type:'expense', cat:'Entertainment' },
  { kw: 'travel',             type:'expense', cat:'Entertainment' },
  { kw: 'tour',               type:'expense', cat:'Entertainment' },
  { kw: 'hotel',              type:'expense', cat:'Entertainment' },
  { kw: 'timezone',           type:'expense', cat:'Entertainment' },

  // ── EXTRA INCOME ──
  { kw: 'profit',             type:'income', cat:'Freelance' },
  { kw: 'payout',             type:'income', cat:'Freelance' },
  { kw: 'earnings',           type:'income', cat:'Freelance' },
  { kw: 'gig',                type:'income', cat:'Freelance' },
  { kw: 'side hustle',        type:'income', cat:'Freelance' },
  { kw: 'bayad',              type:'income', cat:'Freelance' },
  { kw: 'pasok na pera',      type:'income', cat:'Allowance' },
  { kw: 'tulong',             type:'income', cat:'Gift' },
  { kw: 'interest',           type:'income', cat:'Freelance' },
  { kw: 'dividends',          type:'income', cat:'Freelance' },
  { kw: 'refund',             type:'income', cat:'Gift' },
  { kw: 'cashback',           type:'income', cat:'Gift' },
  { kw: 'cash back',          type:'income', cat:'Gift' },
  { kw: 'rebate',             type:'income', cat:'Gift' },
  { kw: 'prize',              type:'income', cat:'Gift' },
  { kw: 'raffle',             type:'income', cat:'Gift' },
  { kw: 'lotto',              type:'income', cat:'Gift' },
  { kw: 'panalo',             type:'income', cat:'Gift' },
  { kw: 'utang',              type:'income', cat:'Others' },
  { kw: 'hutang',             type:'income', cat:'Others' },
  { kw: 'ibalik',             type:'income', cat:'Others' },

  // ── EXTRA FOOD ──
  { kw: 'inihaw',             type:'expense', cat:'Food' },
  { kw: 'barbecue',           type:'expense', cat:'Food' },
  { kw: 'bbq',                type:'expense', cat:'Food' },
  { kw: 'ihaw',               type:'expense', cat:'Food' },
  { kw: 'pork chop',          type:'expense', cat:'Food' },
  { kw: 'bangus',             type:'expense', cat:'Food' },
  { kw: 'tilapia',            type:'expense', cat:'Food' },
  { kw: 'isda',               type:'expense', cat:'Food' },
  { kw: 'karne',              type:'expense', cat:'Food' },
  { kw: 'manok',              type:'expense', cat:'Food' },
  { kw: 'gulay',              type:'expense', cat:'Food' },
  { kw: 'mais',               type:'expense', cat:'Food' },
  { kw: 'kamote',             type:'expense', cat:'Food' },
  { kw: 'kamatis',            type:'expense', cat:'Food' },
  { kw: 'sibuyas',            type:'expense', cat:'Food' },
  { kw: 'bawang',             type:'expense', cat:'Food' },
  { kw: 'itlog',              type:'expense', cat:'Food' },
  { kw: 'tofu',               type:'expense', cat:'Food' },
  { kw: 'tokwa',              type:'expense', cat:'Food' },
  { kw: 'empanada',           type:'expense', cat:'Food' },
  { kw: 'puto bumbong',       type:'expense', cat:'Food' },
  { kw: 'ensaymada',          type:'expense', cat:'Food' },
  { kw: 'leche flan',         type:'expense', cat:'Food' },
  { kw: 'mais con yelo',      type:'expense', cat:'Food' },
  { kw: 'dirty ice cream',    type:'expense', cat:'Food' },
  { kw: 'sorbetes',           type:'expense', cat:'Food' },
  { kw: 'ice cream',          type:'expense', cat:'Food' },
  { kw: 'softserve',          type:'expense', cat:'Food' },
  { kw: 'coke',               type:'expense', cat:'Food' },
  { kw: 'royal',              type:'expense', cat:'Food' },
  { kw: 'sprite',             type:'expense', cat:'Food' },
  { kw: 'mountain dew',       type:'expense', cat:'Food' },
  { kw: 'energy drink',       type:'expense', cat:'Food' },
  { kw: 'juice',              type:'expense', cat:'Food' },
  { kw: 'shake',              type:'expense', cat:'Food' },
  { kw: 'smoothie',           type:'expense', cat:'Food' },
  { kw: 'iced coffee',        type:'expense', cat:'Food' },
  { kw: 'frappe',             type:'expense', cat:'Food' },
  { kw: 'yakult',             type:'expense', cat:'Food' },
  { kw: 'instant noodles',    type:'expense', cat:'Food' },
  { kw: 'lucky me',           type:'expense', cat:'Food' },
  { kw: 'nissin',             type:'expense', cat:'Food' },
  { kw: 'maggi',              type:'expense', cat:'Food' },
  { kw: 'skyflakes',          type:'expense', cat:'Food' },
  { kw: 'rebisco',            type:'expense', cat:'Food' },
  { kw: 'chips',              type:'expense', cat:'Food' },
  { kw: 'piattos',            type:'expense', cat:'Food' },
  { kw: 'nova',               type:'expense', cat:'Food' },
  { kw: 'curly tops',         type:'expense', cat:'Food' },
  { kw: 'chuckie',            type:'expense', cat:'Food' },
  { kw: 'bear brand',         type:'expense', cat:'Food' },
  { kw: 'alaska',             type:'expense', cat:'Food' },
  { kw: 'condensada',         type:'expense', cat:'Food' },
  { kw: 'evap',               type:'expense', cat:'Food' },
  { kw: 'sugar',              type:'expense', cat:'Food' },
  { kw: 'asin',               type:'expense', cat:'Food' },
  { kw: 'paminta',            type:'expense', cat:'Food' },
  { kw: 'ketchup',            type:'expense', cat:'Food' },
  { kw: 'mayonnaise',         type:'expense', cat:'Food' },
  { kw: 'jufran',             type:'expense', cat:'Food' },
  { kw: 'knorr',              type:'expense', cat:'Food' },
  { kw: 'mang tomas',         type:'expense', cat:'Food' },
  { kw: 'agahan',             type:'expense', cat:'Food' },
  { kw: 'pananghalian',       type:'expense', cat:'Food' },
  { kw: 'pagkain',            type:'expense', cat:'Food' },
  { kw: 'kaon',               type:'expense', cat:'Food' },
  { kw: 'kainan',             type:'expense', cat:'Food' },
  { kw: 'jollijeep',          type:'expense', cat:'Food' },
  { kw: 'ambulant',           type:'expense', cat:'Food' },
  { kw: 'streetfood',         type:'expense', cat:'Food' },
  { kw: 'street food',        type:'expense', cat:'Food' },
  { kw: 'bento',              type:'expense', cat:'Food' },
  { kw: 'lunchbox',           type:'expense', cat:'Food' },
  { kw: 'baon food',          type:'expense', cat:'Food' },
  { kw: 'delivery',           type:'expense', cat:'Food' },
  { kw: 'order food',         type:'expense', cat:'Food' },
  { kw: 'jco',                type:'expense', cat:'Food' },
  { kw: 'krispy kreme',       type:'expense', cat:'Food' },
  { kw: 'dunkin',             type:'expense', cat:'Food' },
  { kw: 'donut',              type:'expense', cat:'Food' },
  { kw: 'cake',               type:'expense', cat:'Food' },
  { kw: 'pastry',             type:'expense', cat:'Food' },
  { kw: 'baked goods',        type:'expense', cat:'Food' },
  { kw: 'goldilock',          type:'expense', cat:'Food' },
  { kw: 'red ribbon',         type:'expense', cat:'Food' },
  { kw: 'chowmix',            type:'expense', cat:'Food' },
  { kw: 'tokyo tokyo',        type:'expense', cat:'Food' },
  { kw: 'yoshinoya',          type:'expense', cat:'Food' },
  { kw: 'ramen',              type:'expense', cat:'Food' },
  { kw: 'sushi',              type:'expense', cat:'Food' },
  { kw: 'samgyup',            type:'expense', cat:'Food' },
  { kw: 'samgyeopsal',        type:'expense', cat:'Food' },
  { kw: 'korean bbq',         type:'expense', cat:'Food' },
  { kw: 'pho',                type:'expense', cat:'Food' },
  { kw: 'dimsum',             type:'expense', cat:'Food' },
  { kw: 'dumplings',          type:'expense', cat:'Food' },
  { kw: 'wok',                type:'expense', cat:'Food' },

  // ── EXTRA TRANSPORT ──
  { kw: 'e-bike',             type:'expense', cat:'Transport' },
  { kw: 'ebike',              type:'expense', cat:'Transport' },
  { kw: 'motorcycle',         type:'expense', cat:'Transport' },
  { kw: 'motor',              type:'expense', cat:'Transport' },
  { kw: 'kotse',              type:'expense', cat:'Transport' },
  { kw: 'aircon bus',         type:'expense', cat:'Transport' },
  { kw: 'victory liner',      type:'expense', cat:'Transport' },
  { kw: 'genesis',            type:'expense', cat:'Transport' },
  { kw: 'five star',          type:'expense', cat:'Transport' },
  { kw: 'joybus',             type:'expense', cat:'Transport' },
  { kw: 'bgc bus',            type:'expense', cat:'Transport' },
  { kw: 'uber',               type:'expense', cat:'Transport' },
  { kw: 'indriver',           type:'expense', cat:'Transport' },
  { kw: 'fuelup',             type:'expense', cat:'Transport' },
  { kw: 'shell',              type:'expense', cat:'Transport' },
  { kw: 'caltex',             type:'expense', cat:'Transport' },
  { kw: 'petron',             type:'expense', cat:'Transport' },
  { kw: 'seaoil',             type:'expense', cat:'Transport' },
  { kw: 'gas',                type:'expense', cat:'Transport' },
  { kw: 'bayad toll',         type:'expense', cat:'Transport' },
  { kw: 'easytrip',           type:'expense', cat:'Transport' },
  { kw: 'autosweep',          type:'expense', cat:'Transport' },
  { kw: 'nlex',               type:'expense', cat:'Transport' },
  { kw: 'slex',               type:'expense', cat:'Transport' },
  { kw: 'tplex',              type:'expense', cat:'Transport' },
  { kw: 'tricycle',           type:'expense', cat:'Transport' },
  { kw: 'palero',             type:'expense', cat:'Transport' },
  { kw: 'bangka',             type:'expense', cat:'Transport' },
  { kw: 'ship',               type:'expense', cat:'Transport' },
  { kw: 'boat',               type:'expense', cat:'Transport' },
  { kw: 'plane ticket',       type:'expense', cat:'Transport' },
  { kw: 'airfare',            type:'expense', cat:'Transport' },
  { kw: 'cebu pacific',       type:'expense', cat:'Transport' },
  { kw: 'philippine airlines', type:'expense', cat:'Transport' },
  { kw: 'pal',                type:'expense', cat:'Transport' },
  { kw: 'airasia',            type:'expense', cat:'Transport' },

  // ── EXTRA COMMUNICATION ──
  { kw: 'sun cellular',       type:'expense', cat:'Communication' },
  { kw: 'dito',               type:'expense', cat:'Communication' },
  { kw: 'sim card',           type:'expense', cat:'Communication' },
  { kw: 'esim',               type:'expense', cat:'Communication' },
  { kw: 'texting',            type:'expense', cat:'Communication' },
  { kw: 'roaming',            type:'expense', cat:'Communication' },
  { kw: 'giga',               type:'expense', cat:'Communication' },
  { kw: 'data',               type:'expense', cat:'Communication' },
  { kw: 'tnt',                type:'expense', cat:'Communication' },

  // ── EXTRA BILLS ──
  { kw: 'sss',                type:'expense', cat:'Bills' },
  { kw: 'pagibig',            type:'expense', cat:'Bills' },
  { kw: 'pag-ibig',           type:'expense', cat:'Bills' },
  { kw: 'hdmf',               type:'expense', cat:'Bills' },
  { kw: 'bir',                type:'expense', cat:'Bills' },
  { kw: 'tax',                type:'expense', cat:'Bills' },
  { kw: 'insurance',          type:'expense', cat:'Bills' },
  { kw: 'premium',            type:'expense', cat:'Bills' },
  { kw: 'credit card',        type:'expense', cat:'Bills' },
  { kw: 'loan payment',       type:'expense', cat:'Bills' },
  { kw: 'bayad center',       type:'expense', cat:'Bills' },
  { kw: 'gcash bills',        type:'expense', cat:'Bills' },
  { kw: 'maya bills',         type:'expense', cat:'Bills' },
  { kw: 'prime video',        type:'expense', cat:'Bills' },
  { kw: 'apple music',        type:'expense', cat:'Bills' },
  { kw: 'vivamax',            type:'expense', cat:'Bills' },
  { kw: 'canva',              type:'expense', cat:'Bills' },
  { kw: 'adobe',              type:'expense', cat:'Bills' },
  { kw: 'microsoft',          type:'expense', cat:'Bills' },

  // ── EXTRA SHOPPING ──
  { kw: 'sm',                 type:'expense', cat:'Shopping' },
  { kw: 'robinsons',          type:'expense', cat:'Shopping' },
  { kw: 'ayala mall',         type:'expense', cat:'Shopping' },
  { kw: 'mall',               type:'expense', cat:'Shopping' },
  { kw: 'department store',   type:'expense', cat:'Shopping' },
  { kw: 'sari-sari',          type:'expense', cat:'Shopping' },
  { kw: 'sarisari',           type:'expense', cat:'Shopping' },
  { kw: 'tiangge',            type:'expense', cat:'Shopping' },
  { kw: 'uniqlo',             type:'expense', cat:'Shopping' },
  { kw: 'h&m',                type:'expense', cat:'Shopping' },
  { kw: 'zara',               type:'expense', cat:'Shopping' },
  { kw: 'penshoppe',          type:'expense', cat:'Shopping' },
  { kw: 'bench',              type:'expense', cat:'Shopping' },
  { kw: 'human',              type:'expense', cat:'Shopping' },
  { kw: 'folded',             type:'expense', cat:'Shopping' },
  { kw: 'kultura',            type:'expense', cat:'Shopping' },
  { kw: 'landmark',           type:'expense', cat:'Shopping' },
  { kw: 'ace hardware',       type:'expense', cat:'Shopping' },
  { kw: 'handymanph',         type:'expense', cat:'Shopping' },
  { kw: 'handyman',           type:'expense', cat:'Shopping' },
  { kw: 'national bookstore', type:'expense', cat:'Shopping' },
  { kw: 'fully booked',       type:'expense', cat:'Shopping' },
  { kw: 'soap',               type:'expense', cat:'Shopping' },
  { kw: 'pampers',            type:'expense', cat:'Shopping' },
  { kw: 'diaper',             type:'expense', cat:'Shopping' },
  { kw: 'tissue',             type:'expense', cat:'Shopping' },
  { kw: 'feminine wash',      type:'expense', cat:'Shopping' },
  { kw: 'lipstick',           type:'expense', cat:'Shopping' },
  { kw: 'makeup',             type:'expense', cat:'Shopping' },
  { kw: 'perfume',            type:'expense', cat:'Shopping' },
  { kw: 'cologne',            type:'expense', cat:'Shopping' },
  { kw: 'sunscreen',          type:'expense', cat:'Shopping' },
  { kw: 'moisturizer',        type:'expense', cat:'Shopping' },

  // ── EXTRA HEALTH ──
  { kw: 'multivitamins',      type:'expense', cat:'Health' },
  { kw: 'ascorbic',           type:'expense', cat:'Health' },
  { kw: 'ceelin',             type:'expense', cat:'Health' },
  { kw: 'vitamin c',          type:'expense', cat:'Health' },
  { kw: 'zinc',               type:'expense', cat:'Health' },
  { kw: 'iron',               type:'expense', cat:'Health' },
  { kw: 'ibuprofen',          type:'expense', cat:'Health' },
  { kw: 'mefenamic',          type:'expense', cat:'Health' },
  { kw: 'amoxicillin',        type:'expense', cat:'Health' },
  { kw: 'antibiotic',         type:'expense', cat:'Health' },
  { kw: 'antacid',            type:'expense', cat:'Health' },
  { kw: 'dextrose',           type:'expense', cat:'Health' },
  { kw: 'x-ray',              type:'expense', cat:'Health' },
  { kw: 'laboratory',         type:'expense', cat:'Health' },
  { kw: 'blood test',         type:'expense', cat:'Health' },
  { kw: 'urinalysis',         type:'expense', cat:'Health' },
  { kw: 'ecg',                type:'expense', cat:'Health' },
  { kw: 'ultrasound',         type:'expense', cat:'Health' },
  { kw: 'optometrist',        type:'expense', cat:'Health' },
  { kw: 'eyeglasses',         type:'expense', cat:'Health' },
  { kw: 'contact lens',       type:'expense', cat:'Health' },
  { kw: 'gym',                type:'expense', cat:'Health' },
  { kw: 'fitness',            type:'expense', cat:'Health' },
  { kw: 'anfit',              type:'expense', cat:'Health' },
  { kw: 'protein powder',     type:'expense', cat:'Health' },
  { kw: 'supplement',         type:'expense', cat:'Health' },
  { kw: 'spa',                type:'expense', cat:'Health' },
  { kw: 'massage',            type:'expense', cat:'Health' },
  { kw: 'hilot',              type:'expense', cat:'Health' },
  { kw: 'salon',              type:'expense', cat:'Health' },
  { kw: 'gupit',              type:'expense', cat:'Health' },
  { kw: 'haircut',            type:'expense', cat:'Health' },
  { kw: 'barber',             type:'expense', cat:'Health' },
  { kw: 'blowdry',            type:'expense', cat:'Health' },

  // ── EXTRA EDUCATION ──
  { kw: 'pen',                type:'expense', cat:'Education' },
  { kw: 'crayon',             type:'expense', cat:'Education' },
  { kw: 'ruler',              type:'expense', cat:'Education' },
  { kw: 'eraser',             type:'expense', cat:'Education' },
  { kw: 'project',            type:'expense', cat:'Education' },
  { kw: 'binding',            type:'expense', cat:'Education' },
  { kw: 'lamination',         type:'expense', cat:'Education' },
  { kw: 'tarpaulin',          type:'expense', cat:'Education' },
  { kw: 'fieldtrip',          type:'expense', cat:'Education' },
  { kw: 'field trip',         type:'expense', cat:'Education' },
  { kw: 'seminar',            type:'expense', cat:'Education' },
  { kw: 'training',           type:'expense', cat:'Education' },
  { kw: 'certification',      type:'expense', cat:'Education' },
  { kw: 'exam fee',           type:'expense', cat:'Education' },
  { kw: 'ielts',              type:'expense', cat:'Education' },
  { kw: 'toefl',              type:'expense', cat:'Education' },
  { kw: 'licensure',          type:'expense', cat:'Education' },
  { kw: 'board exam',         type:'expense', cat:'Education' },
  { kw: 'prc',                type:'expense', cat:'Education' },
  { kw: 'transcript',         type:'expense', cat:'Education' },
  { kw: 'diploma',            type:'expense', cat:'Education' },
  { kw: 'nso',                type:'expense', cat:'Education' },
  { kw: 'nbi',                type:'expense', cat:'Education' },
  { kw: 'clearance',          type:'expense', cat:'Education' },
  { kw: 'online course',      type:'expense', cat:'Education' },
  { kw: 'udemy',              type:'expense', cat:'Education' },
  { kw: 'coursera',           type:'expense', cat:'Education' },

  // ── EXTRA HOUSING ──
  { kw: 'rent',               type:'expense', cat:'Housing' },
  { kw: 'upa',                type:'expense', cat:'Housing' },
  { kw: 'renew contract',     type:'expense', cat:'Housing' },
  { kw: 'deposit',            type:'expense', cat:'Housing' },
  { kw: 'advance rent',       type:'expense', cat:'Housing' },
  { kw: 'hoa',                type:'expense', cat:'Housing' },
  { kw: 'maintenance fee',    type:'expense', cat:'Housing' },
  { kw: 'repairs',            type:'expense', cat:'Housing' },
  { kw: 'plumber',            type:'expense', cat:'Housing' },
  { kw: 'electrician',        type:'expense', cat:'Housing' },
  { kw: 'hardware',           type:'expense', cat:'Housing' },
  { kw: 'paint',              type:'expense', cat:'Housing' },
  { kw: 'kubo',               type:'expense', cat:'Housing' },
  { kw: 'aircon service',     type:'expense', cat:'Housing' },
  { kw: 'aircon cleaning',    type:'expense', cat:'Housing' },
  { kw: 'cleaning',           type:'expense', cat:'Housing' },
  { kw: 'kasambahay',         type:'expense', cat:'Housing' },
  { kw: 'kuya service',       type:'expense', cat:'Housing' },
  { kw: 'furnishing',         type:'expense', cat:'Housing' },
  { kw: 'furniture',          type:'expense', cat:'Housing' },
  { kw: 'appliances',         type:'expense', cat:'Housing' },

  // ── EXTRA ENTERTAINMENT ──
  { kw: 'amusement',          type:'expense', cat:'Entertainment' },
  { kw: 'theme park',         type:'expense', cat:'Entertainment' },
  { kw: 'enchanted kingdom',  type:'expense', cat:'Entertainment' },
  { kw: 'star city',          type:'expense', cat:'Entertainment' },
  { kw: 'skateboard',         type:'expense', cat:'Entertainment' },
  { kw: 'bowling',            type:'expense', cat:'Entertainment' },
  { kw: 'billiards',          type:'expense', cat:'Entertainment' },
  { kw: 'pool',               type:'expense', cat:'Entertainment' },
  { kw: 'darts',              type:'expense', cat:'Entertainment' },
  { kw: 'arcade',             type:'expense', cat:'Entertainment' },
  { kw: 'playstation',        type:'expense', cat:'Entertainment' },
  { kw: 'nintendo',           type:'expense', cat:'Entertainment' },
  { kw: 'xbox',               type:'expense', cat:'Entertainment' },
  { kw: 'pc gaming',          type:'expense', cat:'Entertainment' },
  { kw: 'gaming',             type:'expense', cat:'Entertainment' },
  { kw: 'e-games',            type:'expense', cat:'Entertainment' },
  { kw: 'clash of clans',     type:'expense', cat:'Entertainment' },
  { kw: 'mlbb',               type:'expense', cat:'Entertainment' },
  { kw: 'dota',               type:'expense', cat:'Entertainment' },
  { kw: 'pubg',               type:'expense', cat:'Entertainment' },
  { kw: 'free fire',          type:'expense', cat:'Entertainment' },
  { kw: 'pokemon',            type:'expense', cat:'Entertainment' },
  { kw: 'concert ticket',     type:'expense', cat:'Entertainment' },
  { kw: 'event ticket',       type:'expense', cat:'Entertainment' },
  { kw: 'sineplex',           type:'expense', cat:'Entertainment' },
  { kw: 'sm cinema',          type:'expense', cat:'Entertainment' },
  { kw: 'ayala cinemas',      type:'expense', cat:'Entertainment' },
  { kw: 'netflix',            type:'expense', cat:'Entertainment' },
  { kw: 'bar',                type:'expense', cat:'Entertainment' },
  { kw: 'nightclub',          type:'expense', cat:'Entertainment' },
  { kw: 'inuman',             type:'expense', cat:'Entertainment' },
  { kw: 'beer',               type:'expense', cat:'Entertainment' },
  { kw: 'lambanog',           type:'expense', cat:'Entertainment' },
  { kw: 'tanduay',            type:'expense', cat:'Entertainment' },
  { kw: 'san mig',            type:'expense', cat:'Entertainment' },
  { kw: 'red horse',          type:'expense', cat:'Entertainment' },
  { kw: 'nature trip',        type:'expense', cat:'Entertainment' },
  { kw: 'hiking',             type:'expense', cat:'Entertainment' },
  { kw: 'camping',            type:'expense', cat:'Entertainment' },
  { kw: 'island hopping',     type:'expense', cat:'Entertainment' },
  { kw: 'staycation',         type:'expense', cat:'Entertainment' },
  { kw: 'airbnb',             type:'expense', cat:'Entertainment' },
  { kw: 'booking',            type:'expense', cat:'Entertainment' },
];

/**
 * Smart auto-detect: scans all rules, picks longest keyword match.
 * Returns { type, category, matched }
 */
function autoDetect(desc) {
  const lower = desc.toLowerCase().trim();
  let best = null;
  let bestScore = 0;

  for (const rule of AUTO_RULES) {
    if (lower.includes(rule.kw)) {
      const score = rule.kw.length;
      if (score > bestScore) {
        bestScore = score;
        best = rule;
      }
    }
  }

  if (best) return { type: best.type, category: best.cat, matched: true };
  return { type: null, category: null, matched: false };
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
  } catch(e) {}
}

// ──────────────────────────── UTILS ────────────────────────────
function sym() { return CURRENCY_SYMBOLS[state.currency] || '₱'; }
function fmt(n) {
  return sym() + Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
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
  return [
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  ];
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
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDisplayDate(s) {
  return parseDate(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ──────────────────────────── FILTERING & SORTING ────────────────────────────
function filterTransactions() {
  let txs = [...state.transactions];
  const f = state.filter;
  if (f.period !== 'all') {
    const now = new Date();
    let start, end = new Date(now); end.setHours(23,59,59,999);
    if (f.period==='today') { start=new Date(now); start.setHours(0,0,0,0); }
    else if (f.period==='week') { [start,end]=getWeekRange(); }
    else if (f.period==='month') { [start,end]=getMonthRange(); }
    else if (f.period==='6months') { start=new Date(now); start.setMonth(now.getMonth()-6); start.setHours(0,0,0,0); }
    else if (f.period==='custom'&&f.dateFrom&&f.dateTo) {
      start=parseDate(f.dateFrom); start.setHours(0,0,0,0);
      end=parseDate(f.dateTo); end.setHours(23,59,59,999);
    }
    if (start) txs=txs.filter(t=>{const d=parseDate(t.date);return d>=start&&d<=end;});
  }
  if (f.type!=='all') txs=txs.filter(t=>t.type===f.type);
  if (f.search.trim()) {
    const q=f.search.trim().toLowerCase();
    txs=txs.filter(t=>t.description.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||(t.note||'').toLowerCase().includes(q));
  }
  return txs;
}

function sortTx(txs) {
  const {col,dir}=state.sort;
  return [...txs].sort((a,b)=>{
    let va,vb;
    if(col==='date'){va=a.date;vb=b.date;}
    else if(col==='amount'){va=a.amount;vb=b.amount;}
    else{va=a.description.toLowerCase();vb=b.description.toLowerCase();}
    return (va<vb?-1:va>vb?1:0)*(dir==='asc'?1:-1);
  });
}

// ──────────────────────────── RENDER ────────────────────────────
function renderAll() {
  renderCards();
  renderPeriodSummary();
  renderTodayOverview();
  renderTransactions();
  renderCharts();
  renderBudgets();
  if (state.currentView==='analytics') renderAnalytics();
  updateCurrencyUI();
}

function animVal(el, text) {
  el.classList.remove('count-anim');
  void el.offsetWidth;
  el.textContent = text;
  el.classList.add('count-anim');
}

function renderCards() {
  const txs=state.transactions;
  const inc=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const bal=inc-exp;
  const sav=inc>0?Math.round((bal/inc)*100):0;
  animVal(document.getElementById('totalIncome'), fmt(inc));
  animVal(document.getElementById('totalExpense'), fmt(exp));
  animVal(document.getElementById('netBalance'), fmt(bal));
  animVal(document.getElementById('savingsRate'), sav+'%');
  document.getElementById('incomeCount').textContent=txs.filter(t=>t.type==='income').length+' transactions';
  document.getElementById('expenseCount').textContent=txs.filter(t=>t.type==='expense').length+' transactions';
  const bEl=document.getElementById('balanceStatus');
  bEl.textContent=bal>=0?'Positive balance ✓':'Spending exceeds income';
  bEl.style.color=bal>=0?'var(--income)':'var(--expense)';
}

function sumPeriod(txs, start, end) {
  const f=txs.filter(t=>{const d=parseDate(t.date);return d>=start&&d<=end;});
  const inc=f.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp=f.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  return {inc,exp,net:inc-exp};
}

function renderPeriodSummary() {
  const txs=state.transactions;
  const [ws,we]=getWeekRange();
  const [ms,me]=getMonthRange();
  const w=sumPeriod(txs,ws,we);
  const m=sumPeriod(txs,ms,me);

  document.getElementById('weekIncome').textContent=fmt(w.inc);
  document.getElementById('weekExpense').textContent=fmt(w.exp);
  const wB=document.getElementById('weekBalance');
  wB.textContent=fmt(w.net);
  wB.className='period-val '+(w.net>=0?'income':'expense');

  document.getElementById('monthIncome').textContent=fmt(m.inc);
  document.getElementById('monthExpense').textContent=fmt(m.exp);
  const mB=document.getElementById('monthBalance');
  mB.textContent=fmt(m.net);
  mB.className='period-val '+(m.net>=0?'income':'expense');
}

function renderTodayOverview() {
  const today=todayStr();
  const todayTxs=state.transactions.filter(t=>t.date===today);
  const inc=todayTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp=todayTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const net=inc-exp;

  // Date label
  document.getElementById('todayDate').textContent=parseDate(today).toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric',year:'numeric'});

  animVal(document.getElementById('todayIncome'), fmt(inc));
  animVal(document.getElementById('todayExpense'), fmt(exp));
  const netEl=document.getElementById('todayNet');
  animVal(netEl, fmt(net));
  netEl.className='today-val '+(net>=0?'income':'expense');
  document.getElementById('todayCount').textContent=todayTxs.length;

  const list=document.getElementById('todayTxList');
  if(!todayTxs.length){
    list.innerHTML='<div class="today-empty">No transactions today yet.</div>';
    return;
  }
  const sorted=[...todayTxs].sort((a,b)=>b.date.localeCompare(a.date));
  list.innerHTML=sorted.map(t=>`
    <div class="today-tx-row">
      <div class="today-tx-left">
        <span class="today-tx-emoji">${CATEGORY_EMOJI[t.category]||'📦'}</span>
        <div>
          <div class="today-tx-desc">${escHtml(t.description)}</div>
          <div class="today-tx-cat">${t.category}</div>
        </div>
      </div>
      <span class="today-tx-amt ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</span>
    </div>`).join('');
}

// ──────────────────────────── TRANSACTIONS TABLE ────────────────────────────
function renderTransactions() {
  let txs=sortTx(filterTransactions());

  // Running balance
  const allSorted=[...state.transactions].sort((a,b)=>a.date.localeCompare(b.date));
  const runMap={};let run=0;
  allSorted.forEach(t=>{run+=t.type==='income'?t.amount:-t.amount;runMap[t.id]=run;});

  const tbody=document.getElementById('txBody');
  tbody.innerHTML='';

  if(!txs.length){
    tbody.innerHTML=`<tr><td colspan="4"><div class="empty-state"><span class="empty-icon">◈</span><p>No transactions match your filters.</p></div></td></tr>`;
    return;
  }

  txs.forEach(t=>{
    const emoji=CATEGORY_EMOJI[t.category]||'📦';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td class="tx-date">${formatDisplayDate(t.date)}</td>
      <td>
        <div class="tx-desc">${escHtml(t.description)}</div>
        ${t.note?`<div class="tx-note">${escHtml(t.note)}</div>`:''}
        <div class="tx-meta-row">
          <span class="tx-cat">${emoji} ${t.category}</span>
          <span class="tx-badge ${t.type}">${t.type}</span>
        </div>
      </td>
      <td class="tx-amount ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
      <td class="tx-actions">
        <button class="btn-icon" title="Edit" data-id="${t.id}" data-action="edit">✎</button>
        <button class="btn-icon del" title="Delete" data-id="${t.id}" data-action="delete">✕</button>
      </td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.tx-table th[data-sort]').forEach(th=>{
    th.classList.remove('th-sorted');
    const a=th.querySelector('.sort-arrow');
    if(th.dataset.sort===state.sort.col){
      th.classList.add('th-sorted');
      if(a)a.textContent=state.sort.dir==='asc'?'↑':'↓';
    }else{if(a)a.textContent='↕';}
  });
}

// ──────────────────────────── CHARTS ────────────────────────────
let pieChart=null,barChart=null,analyticsBar=null,categoryBar=null;
const PIE_PALETTE=['#ff4d6d','#ff8c42','#f5cb5c','#00e5a0','#4da6ff','#c8a96e','#a78bfa','#f472b6','#34d399','#60a5fa'];

function cc(){
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  return {
    grid:dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)',
    text:dark?'#7c8296':'#5a6080',
    income:dark?'#00e5a0':'#009e6e',
    expense:dark?'#ff4d6d':'#d42045',
  };
}

function renderCharts(){ renderPieChart(); renderBarChart(); }

function renderPieChart(){
  const expenses=state.transactions.filter(t=>t.type==='expense');
  const cm={};expenses.forEach(t=>{cm[t.category]=(cm[t.category]||0)+t.amount;});
  const labels=Object.keys(cm),data=Object.values(cm);
  const emp=document.getElementById('pieEmpty');
  if(!labels.length){emp.classList.add('show');if(pieChart){pieChart.destroy();pieChart=null;}return;}
  emp.classList.remove('show');
  const ctx=document.getElementById('pieChart').getContext('2d');
  if(pieChart)pieChart.destroy();
  pieChart=new Chart(ctx,{
    type:'doughnut',
    data:{labels,datasets:[{data,backgroundColor:PIE_PALETTE.slice(0,labels.length),borderWidth:0,hoverOffset:8}]},
    options:{
      cutout:'60%',
      plugins:{
        legend:{position:'right',labels:{color:cc().text,font:{family:'JetBrains Mono',size:10},boxWidth:10,padding:9,
          generateLabels:chart=>chart.data.labels.map((l,i)=>({text:`${l}  ${sym()}${chart.data.datasets[0].data[i].toLocaleString('en-PH',{maximumFractionDigits:0})}`,fillStyle:PIE_PALETTE[i],hidden:false,index:i}))}},
        tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.parsed)}`}},
      },
      animation:{duration:450},
    },
  });
}

function renderBarChart(){
  const c=cc(),now=new Date();
  const months=[];
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({year:d.getFullYear(),month:d.getMonth(),label:d.toLocaleDateString('en-PH',{month:'short',year:'2-digit'})});}
  const inc=months.map(m=>state.transactions.filter(t=>{const d=parseDate(t.date);return t.type==='income'&&d.getFullYear()===m.year&&d.getMonth()===m.month;}).reduce((s,t)=>s+t.amount,0));
  const exp=months.map(m=>state.transactions.filter(t=>{const d=parseDate(t.date);return t.type==='expense'&&d.getFullYear()===m.year&&d.getMonth()===m.month;}).reduce((s,t)=>s+t.amount,0));
  const ctx=document.getElementById('barChart').getContext('2d');
  if(barChart)barChart.destroy();
  barChart=new Chart(ctx,{
    type:'bar',
    data:{labels:months.map(m=>m.label),datasets:[
      {label:'Income',data:inc,backgroundColor:c.income+'44',borderColor:c.income,borderWidth:2,borderRadius:4},
      {label:'Expense',data:exp,backgroundColor:c.expense+'44',borderColor:c.expense,borderWidth:2,borderRadius:4},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:c.text,font:{family:'JetBrains Mono',size:10},boxWidth:10}},tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.parsed.y)}`}}},
      scales:{x:{grid:{color:c.grid},ticks:{color:c.text,font:{family:'JetBrains Mono',size:10}}},y:{grid:{color:c.grid},ticks:{color:c.text,font:{family:'JetBrains Mono',size:10},callback:v=>sym()+v.toLocaleString()}}},
      animation:{duration:400}},
  });
}

// ──────────────────────────── CATEGORY PICKER ────────────────────────────
let selectedCategory = 'Food';

function buildCatPicker(type) {
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  const picker = document.getElementById('catPicker');
  picker.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-option' + (cat === selectedCategory ? ' selected' : '');
    btn.dataset.cat = cat;
    btn.innerHTML = `<span class="cat-opt-emoji">${CATEGORY_EMOJI[cat]||'📦'}</span><span class="cat-opt-name">${cat}</span>`;
    btn.addEventListener('click', () => {
      selectedCategory = cat;
      picker.querySelectorAll('.cat-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    picker.appendChild(btn);
  });
  // If current selectedCategory not in new list, pick first
  if (!cats.includes(selectedCategory)) {
    selectedCategory = cats[0];
    picker.querySelector('.cat-option')?.classList.add('selected');
  }
}

// ──────────────────────────── MODAL ────────────────────────────
function openModal(editId = null) {
  state.editingId = editId;
  hideCatBanner();

  if (editId) {
    const t = state.transactions.find(x => x.id === editId);
    if (!t) return;
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('txDescription').value = t.description;
    document.getElementById('txAmount').value = t.amount;
    document.getElementById('txDate').value = t.date;
    document.getElementById('txNote').value = t.note || '';
    selectedCategory = t.category;
    setTypeOpt(t.type);
    buildCatPicker(t.type);
  } else {
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('txDescription').value = '';
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = todayStr();
    document.getElementById('txNote').value = '';
    selectedCategory = 'Food';
    setTypeOpt('expense');
    buildCatPicker('expense');
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

function showCatBanner(label) {
  document.getElementById('autocatName').textContent = label;
  document.getElementById('autocatBanner').classList.remove('hidden');
}
function hideCatBanner() {
  document.getElementById('autocatBanner').classList.add('hidden');
}

// ──────────────────────────── SAVE TRANSACTION ────────────────────────────
function saveTransaction() {
  const desc   = document.getElementById('txDescription').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const note   = document.getElementById('txNote').value.trim();
  const type   = getSelectedType();

  if (!desc)              { toast('Please enter a description.', 'error'); return; }
  if (!amount || amount <= 0) { toast('Please enter a valid amount.', 'error'); return; }
  if (!date)              { toast('Please select a date.', 'error'); return; }

  const cat = selectedCategory || (type === 'income' ? 'Others' : 'Others');

  if (state.editingId) {
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    if (idx > -1) state.transactions[idx] = { ...state.transactions[idx], description:desc, amount, date, category:cat, type, note };
    toast('Transaction updated ✓');
  } else {
    state.transactions.push({ id:genId(), description:desc, amount, date, category:cat, type, note });
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
  const rows = [['Date','Description','Category','Type','Amount','Note']];
  txs.forEach(t => rows.push([t.date,`"${t.description}"`,t.category,t.type,t.amount,`"${t.note||''}"`]));
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.map(r=>r.join(',')).join('\n'));
  a.download = `fintrack_${todayStr()}.csv`;
  a.click();
  toast('CSV exported ✓');
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.trim().split('\n');
    if (lines.length < 2) { toast('CSV appears empty.', 'error'); return; }
    let added=0,skipped=0;
    lines.slice(1).forEach(line=>{
      const cols=line.split(',').map(c=>c.replace(/^"|"$/g,'').trim());
      const [date,desc,cat,type,amt,note]=cols;
      const amount=parseFloat(amt);
      if(!date||!desc||!type||isNaN(amount)){skipped++;return;}
      state.transactions.push({id:genId(),date:date||todayStr(),description:desc||'Imported',category:cat||'Others',type:type==='income'?'income':'expense',amount:Math.abs(amount),note:note||''});
      added++;
    });
    save(); renderAll();
    toast(`Imported ${added}${skipped?' ('+skipped+' skipped)':''} transaction(s).`,added>0?'success':'error');
  };
  reader.readAsText(file);
}

// ──────────────────────────── BUDGETS ────────────────────────────
function renderBudgets() {
  const grid=document.getElementById('budgetGrid');
  grid.innerHTML='';
  const [ms,me]=getMonthRange();
  const ms2={};
  state.transactions.filter(t=>t.type==='expense').filter(t=>{const d=parseDate(t.date);return d>=ms&&d<=me;}).forEach(t=>{ms2[t.category]=(ms2[t.category]||0)+t.amount;});
  EXPENSE_CATS.forEach(cat=>{
    const budget=parseFloat(state.budgets[cat])||0;
    const spent=ms2[cat]||0;
    const pct=budget>0?Math.min((spent/budget)*100,100):0;
    const over=budget>0&&spent>budget;
    const warn=budget>0&&pct>=80;
    const el=document.createElement('div');
    el.className='budget-item';
    el.innerHTML=`
      <div class="budget-item-header">
        <div class="budget-cat-name">${CATEGORY_EMOJI[cat]||'📦'} ${cat}</div>
        <input type="number" class="budget-input" data-cat="${cat}" placeholder="No limit" min="0" step="100" value="${budget>0?budget:''}" />
      </div>
      <div class="budget-bar-wrap"><div class="budget-bar ${over?'over':warn?'warn':''}" style="width:${pct}%"></div></div>
      <div class="budget-meta"><span>Spent: ${fmt(spent)}</span><span>${budget>0?fmt(budget)+' limit':'No limit set'}</span></div>`;
    grid.appendChild(el);
  });
}

function saveBudgets() {
  document.querySelectorAll('.budget-input').forEach(inp=>{
    const cat=inp.dataset.cat,val=parseFloat(inp.value);
    if(val>0)state.budgets[cat]=val;else delete state.budgets[cat];
  });
  save(); renderBudgets(); toast('Budgets saved ✓');
}

// ──────────────────────────── ANALYTICS ────────────────────────────
function renderAnalytics() {
  const txs=state.transactions;
  const expenses=txs.filter(t=>t.type==='expense');
  const incomes=txs.filter(t=>t.type==='income');
  const cm={};expenses.forEach(t=>{cm[t.category]=(cm[t.category]||0)+t.amount;});
  const top=Object.entries(cm).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('topCategory').textContent=top?`${CATEGORY_EMOJI[top[0]]||''} ${top[0]}`:'—';
  if(expenses.length){
    const dates=expenses.map(t=>t.date).sort();
    const days=Math.max(1,Math.round((parseDate(dates[dates.length-1])-parseDate(dates[0]))/86400000)+1);
    document.getElementById('avgDaily').textContent=fmt(expenses.reduce((s,t)=>s+t.amount,0)/days);
  }else{document.getElementById('avgDaily').textContent=fmt(0);}
  document.getElementById('largestExpense').textContent=fmt(expenses.reduce((m,t)=>t.amount>m?t.amount:m,0));
  document.getElementById('largestIncome').textContent=fmt(incomes.reduce((m,t)=>t.amount>m?t.amount:m,0));

  const mm={};txs.forEach(t=>{const d=parseDate(t.date);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;if(!mm[k])mm[k]={income:0,expense:0};mm[k][t.type]+=t.amount;});
  const mKeys=Object.keys(mm).sort();
  const mLabels=mKeys.map(k=>{const[y,m]=k.split('-');return new Date(+y,+m-1,1).toLocaleDateString('en-PH',{month:'short',year:'2-digit'});});
  const c=cc();
  const ctx2=document.getElementById('analyticsBar').getContext('2d');
  if(analyticsBar)analyticsBar.destroy();
  analyticsBar=new Chart(ctx2,{type:'bar',data:{labels:mLabels,datasets:[
    {label:'Income',data:mKeys.map(k=>mm[k].income),backgroundColor:c.income+'44',borderColor:c.income,borderWidth:2,borderRadius:4},
    {label:'Expense',data:mKeys.map(k=>mm[k].expense),backgroundColor:c.expense+'44',borderColor:c.expense,borderWidth:2,borderRadius:4},
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:c.text,font:{family:'JetBrains Mono',size:10},boxWidth:10}},tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.parsed.y)}`}}},scales:{x:{grid:{color:c.grid},ticks:{color:c.text,font:{family:'JetBrains Mono',size:10}}},y:{grid:{color:c.grid},ticks:{color:c.text,font:{family:'JetBrains Mono',size:10},callback:v=>sym()+v.toLocaleString()}}},animation:{duration:400}}});

  const catEntries=Object.entries(cm).sort((a,b)=>b[1]-a[1]);
  const ctx3=document.getElementById('categoryBar').getContext('2d');
  if(categoryBar)categoryBar.destroy();
  categoryBar=new Chart(ctx3,{type:'bar',data:{labels:catEntries.map(([k])=>k),datasets:[{label:'Total Spent',data:catEntries.map(([,v])=>v),backgroundColor:PIE_PALETTE,borderWidth:0,borderRadius:5}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.parsed.x)}`}}},scales:{x:{grid:{color:c.grid},ticks:{color:c.text,font:{family:'JetBrains Mono',size:10},callback:v=>sym()+v.toLocaleString()}},y:{grid:{color:'transparent'},ticks:{color:c.text,font:{family:'JetBrains Mono',size:10}}}},animation:{duration:400}}});
}

// ──────────────────────────── CURRENCY / THEME ────────────────────────────
function updateCurrencyUI() {
  // PHP only — nothing to toggle
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('.theme-icon').textContent = theme==='dark'?'☽':'☀';
  renderCharts();
  if(state.currentView==='analytics')renderAnalytics();
}

// ──────────────────────────── NAVIGATION ────────────────────────────
function switchView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent={dashboard:'Dashboard',transactions:'Transactions',budgets:'Budgets',analytics:'Analytics',receipts:'Receipts'}[view]||view;
  if(view==='analytics')renderAnalytics();
  if(view==='budgets')renderBudgets();
  if(view==='receipts')renderReceiptsList();
  closeSidebar();
}

function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.add('hidden');
}
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarBackdrop').classList.remove('hidden');
}

// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  load();
  applyTheme(state.theme);
  updateCurrencyUI();
  renderAll();

  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));

  // Sidebar
  document.getElementById('hamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);

  // FAB
  document.getElementById('openAddModal').addEventListener('click',()=>openModal());

  // Modal close
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});

  // Save
  document.getElementById('saveTransaction').addEventListener('click', saveTransaction);
  ['txDescription','txAmount','txDate','txNote'].forEach(id=>{
    document.getElementById(id).addEventListener('keydown',e=>{if(e.key==='Enter')saveTransaction();});
  });

  // ── SMART AUTO-CATEGORIZATION ──
  // Fires on every keystroke, changes both TYPE and CATEGORY
  let acTimer;
  document.getElementById('txDescription').addEventListener('input', e => {
    clearTimeout(acTimer);
    acTimer = setTimeout(() => {
      const desc = e.target.value.trim();
      if (!desc) { hideCatBanner(); return; }

      const result = autoDetect(desc);
      if (!result.matched) { hideCatBanner(); return; }

      // Switch type if different from detected
      const currentType = getSelectedType();
      if (result.type !== currentType) {
        setTypeOpt(result.type);
        buildCatPicker(result.type);
      }

      // Set category
      selectedCategory = result.category;
      document.querySelectorAll('.cat-option').forEach(b => {
        b.classList.toggle('selected', b.dataset.cat === result.category);
      });

      const emoji = CATEGORY_EMOJI[result.category] || '📦';
      showCatBanner(`${result.type === 'income' ? '💰' : '💸'} ${result.type} → ${emoji} ${result.category}`);
    }, 250);
  });

  // Type toggle
  document.querySelectorAll('.type-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      setTypeOpt(btn.dataset.type);
      buildCatPicker(btn.dataset.type);
      hideCatBanner();
    });
  });

  // Delete
  document.getElementById('closeDelete').addEventListener('click', closeDeleteConfirm);
  document.getElementById('cancelDelete').addEventListener('click', closeDeleteConfirm);
  document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
  document.getElementById('deleteOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDeleteConfirm();});

  // Table actions
  document.getElementById('txBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action==='edit') openModal(btn.dataset.id);
    if (btn.dataset.action==='delete') openDeleteConfirm(btn.dataset.id);
  });

  // Sort
  document.querySelectorAll('.tx-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.sort.col===col) state.sort.dir = state.sort.dir==='asc'?'desc':'asc';
      else { state.sort.col=col; state.sort.dir='asc'; }
      renderTransactions();
    });
  });

  // Filters
  document.getElementById('filterPeriod').addEventListener('change', e => {
    state.filter.period=e.target.value;
    document.getElementById('customRange').classList.toggle('hidden',e.target.value!=='custom');
    if(e.target.value!=='custom')renderTransactions();
  });
  document.getElementById('applyRange').addEventListener('click',()=>{
    state.filter.dateFrom=document.getElementById('dateFrom').value;
    state.filter.dateTo=document.getElementById('dateTo').value;
    renderTransactions();
  });
  document.querySelectorAll('.type-pill').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.type-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.filter.type=btn.dataset.filter;
      renderTransactions();
    });
  });
  let sTimer;
  document.getElementById('searchInput').addEventListener('input',e=>{
    clearTimeout(sTimer);
    sTimer=setTimeout(()=>{state.filter.search=e.target.value;renderTransactions();},200);
  });

  // CSV
  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.getElementById('importCSV').addEventListener('change', e => {
    const file=e.target.files[0];
    if(file){importCSV(file);e.target.value='';}
  });

  // Budgets
  document.getElementById('saveBudgets').addEventListener('click', saveBudgets);

  // Receipts — period pill selection
  document.querySelectorAll('.rcp-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rcp-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('generateReceiptBtn').addEventListener('click', generateReceipt);

  // Theme
  document.getElementById('themeToggle').addEventListener('click',()=>{
    applyTheme(state.theme==='dark'?'light':'dark');
    save();
  });

  // FAB — half-hidden, expands on tap then closes after click
  const fab = document.getElementById('openAddModal');
  let fabExpanded = false;
  let fabCollapseTimer;

  function expandFab() {
    fab.classList.add('expanded');
    fabExpanded = true;
    clearTimeout(fabCollapseTimer);
    fabCollapseTimer = setTimeout(collapseFab, 3000);
  }
  function collapseFab() {
    fab.classList.remove('expanded');
    fabExpanded = false;
  }
  fab.addEventListener('mouseenter', expandFab);
  fab.addEventListener('mouseleave', () => {
    fabCollapseTimer = setTimeout(collapseFab, 800);
  });
  // Touch: first tap expands, second tap opens modal
  fab.addEventListener('touchstart', e => {
    if (!fabExpanded) {
      e.preventDefault();
      expandFab();
    } else {
      clearTimeout(fabCollapseTimer);
    }
  }, { passive: false });

});

// ════════════════════════════════════════════════════════════════
//  RECEIPTS ENGINE
// ════════════════════════════════════════════════════════════════

// In-memory receipt store (persisted to localStorage)
let receiptStore = [];   // [{ id, period, label, dateRange, dataUrl, generatedAt }]

function saveReceipts() {
  try { localStorage.setItem('fintrack_receipts', JSON.stringify(receiptStore)); } catch(e){}
}
function loadReceipts() {
  try {
    const raw = localStorage.getItem('fintrack_receipts');
    if (raw) receiptStore = JSON.parse(raw);
  } catch(e){ receiptStore = []; }
}

// ── Date range helpers ──────────────────────────────────────────
function getRangeForPeriod(period) {
  const now = new Date();
  let start, end, label, dateRange;

  if (period === 'today') {
    start = new Date(now); start.setHours(0,0,0,0);
    end   = new Date(now); end.setHours(23,59,59,999);
    label = 'Daily Receipt — ' + now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    dateRange = now.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'});
  } else if (period === 'week') {
    const [ws,we] = getWeekRange();
    start = ws; end = we;
    label = 'Weekly Receipt — Week of ' + ws.toLocaleDateString('en-PH',{month:'short',day:'numeric'});
    dateRange = ws.toLocaleDateString('en-PH',{month:'short',day:'numeric'}) + ' – ' + we.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
  } else {
    const [ms,me] = getMonthRange();
    start = ms; end = me;
    label = 'Monthly Receipt — ' + now.toLocaleDateString('en-PH',{month:'long',year:'numeric'});
    dateRange = now.toLocaleDateString('en-PH',{month:'long',year:'numeric'});
  }
  return { start, end, label, dateRange };
}

// ── Smart saving tip generator ─────────────────────────────────
function getSmartTip(income, expense, txs) {
  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  // Find top expense category
  const catTotals = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const topCat = Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0];

  if (income === 0 && expense === 0) {
    return '💡 No transactions recorded for this period. Start tracking your spending to get personalized saving tips!';
  }
  if (income === 0) {
    return `💡 No income recorded this period, but ₱${expense.toLocaleString('en-PH',{minimumFractionDigits:2})} was spent. Make sure to log your income sources so your balance stays accurate.`;
  }
  if (savingsRate >= 50) {
    return `🌟 Amazing! You saved ${savingsRate.toFixed(0)}% of your income this period. Keep it up — consider moving your savings to a separate account or investment fund to make it grow.`;
  }
  if (savingsRate >= 30) {
    return `✅ Great job! A ${savingsRate.toFixed(0)}% savings rate is solid. Financial experts recommend aiming for at least 20–30%. You're right on track!`;
  }
  if (savingsRate >= 10) {
    const tip = topCat ? ` Try trimming your ${topCat[0]} budget (₱${topCat[1].toLocaleString('en-PH',{minimumFractionDigits:2})}) a little to boost your savings rate.` : '';
    return `📊 You saved ${savingsRate.toFixed(0)}% this period — a good start!${tip} Aim for 20% or more for a healthy financial cushion.`;
  }
  if (balance >= 0) {
    const tip = topCat ? ` Your biggest spending category is ${topCat[0]} at ₱${topCat[1].toLocaleString('en-PH',{minimumFractionDigits:2})}. Setting a budget limit there could help.` : '';
    return `⚠️ You only saved ${savingsRate.toFixed(0)}% of your income.${tip} Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.`;
  }
  const over = Math.abs(balance).toLocaleString('en-PH',{minimumFractionDigits:2});
  const tip = topCat ? ` Your top expense was ${topCat[0]} (₱${topCat[1].toLocaleString('en-PH',{minimumFractionDigits:2})}).` : '';
  return `🚨 Expenses exceeded income by ₱${over} this period.${tip} Review non-essential spending and consider setting stricter category budgets to avoid going further into the red.`;
}

// ── Build the receipt HTML template ───────────────────────────
function buildReceiptHTML(period, label, dateRange, txs) {
  const income  = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance = income - expense;
  const allIncome = txs.filter(t=>t.type==='income');

  // Group expenses by category
  const catMap = {};
  txs.filter(t=>t.type==='expense').forEach(t=>{
    if(!catMap[t.category]) catMap[t.category]=[];
    catMap[t.category].push(t);
  });

  const tip = getSmartTip(income, expense, txs);
  const generatedAt = new Date().toLocaleString('en-PH',{
    month:'short',day:'numeric',year:'numeric',
    hour:'numeric',minute:'2-digit',hour12:true
  });

  const fmtAmt = n => '₱' + n.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});

  // Receipt ID / ref
  const ref = 'FT-' + Date.now().toString(36).toUpperCase();

  // Period label map
  const periodLabels = { today:'DAILY', week:'WEEKLY', month:'MONTHLY' };

  // ── Income rows ──
  let incomeRows = '';
  if (allIncome.length === 0) {
    incomeRows = `<tr><td colspan="4" style="color:#888;font-style:italic;padding:8px 10px;">No income recorded.</td></tr>`;
  } else {
    allIncome.forEach(t => {
      const d = parseDate(t.date).toLocaleDateString('en-PH',{month:'short',day:'numeric'});
      const emoji = CATEGORY_EMOJI[t.category] || '💰';
      incomeRows += `
        <tr>
          <td>${d}</td>
          <td>${emoji} ${escHtml(t.description)}</td>
          <td style="color:#555;">${escHtml(t.category)}</td>
          <td style="color:#1a7a4a;">${fmtAmt(t.amount)}</td>
        </tr>`;
    });
  }

  // ── Expense category blocks ──
  let expenseBlocks = '';
  const catKeys = Object.keys(catMap).sort();
  if (catKeys.length === 0) {
    expenseBlocks = `<div style="font-family:Arial,sans-serif;font-size:12px;color:#888;font-style:italic;padding:8px 10px;">No expenses recorded.</div>`;
  } else {
    catKeys.forEach(cat => {
      const emoji = CATEGORY_EMOJI[cat] || '📦';
      const catTxs = catMap[cat].sort((a,b)=>a.date.localeCompare(b.date));
      const catTotal = catTxs.reduce((s,t)=>s+t.amount,0);

      let txRows = catTxs.map(t => {
        const d = parseDate(t.date).toLocaleDateString('en-PH',{month:'short',day:'numeric'});
        return `<div class="rcp-cat-tx">
          <div class="rcp-cat-tx-date">${d}</div>
          <div class="rcp-cat-tx-desc">${escHtml(t.description)}${t.note ? `<span style="color:#999;font-size:10px;"> · ${escHtml(t.note)}</span>` : ''}</div>
          <div class="rcp-cat-tx-amt">${fmtAmt(t.amount)}</div>
        </div>`;
      }).join('');

      expenseBlocks += `
        <div class="rcp-cat-block">
          <div class="rcp-cat-hdr-row">
            <span class="rcp-cat-hdr-icon">${emoji}</span>
            <span class="rcp-cat-hdr-name">${cat.toUpperCase()}</span>
            <span class="rcp-cat-col-hdr rcp-cat-col-date">DATE</span>
            <span class="rcp-cat-col-hdr rcp-cat-col-amt">AMOUNT</span>
          </div>
          ${txRows}
          <div class="rcp-cat-total-row">
            <span class="rcp-cat-total-label">SUBTOTAL — ${cat.toUpperCase()}</span>
            <span class="rcp-cat-total-val">${fmtAmt(catTotal)}</span>
          </div>
        </div>`;
    });
  }

  const balClass = balance >= 0 ? '' : 'negative';

  return `
<div class="receipt-tpl" id="receiptTpl">
  <div class="receipt-tpl-inner">

    <!-- Brand -->
    <div class="rcp-brand">FinTrack</div>
    <div class="rcp-divider-top">
      <div class="rcp-line"></div>
      <div class="rcp-diamond">◆</div>
      <div class="rcp-line"></div>
    </div>
    <div class="rcp-subtitle">${periodLabels[period]} FINANCIAL RECEIPT</div>

    <!-- Meta -->
    <div class="rcp-meta">
      <div class="rcp-meta-row">
        <span class="rcp-meta-key">Period</span>
        <span class="rcp-meta-colon">:</span>
        <span class="rcp-meta-val">${escHtml(dateRange)}</span>
      </div>
      <div class="rcp-meta-row">
        <span class="rcp-meta-key">Generated</span>
        <span class="rcp-meta-colon">:</span>
        <span class="rcp-meta-val">${generatedAt}</span>
      </div>
      <div class="rcp-meta-row">
        <span class="rcp-meta-key">Transactions</span>
        <span class="rcp-meta-colon">:</span>
        <span class="rcp-meta-val">${txs.length} record${txs.length!==1?'s':''}</span>
      </div>
      <div class="rcp-meta-row">
        <span class="rcp-meta-key">Ref No.</span>
        <span class="rcp-meta-colon">:</span>
        <span class="rcp-meta-val">${ref}</span>
      </div>
    </div>

    <!-- ─── INCOME SECTION ─── -->
    <div class="rcp-section-hdr">
      <div class="rcp-section-icon inc">▲</div>
      <div class="rcp-section-label inc">INCOME</div>
    </div>
    <table class="rcp-income-tbl">
      <thead>
        <tr>
          <th style="width:90px;">DATE</th>
          <th>DESCRIPTION</th>
          <th style="width:100px;">CATEGORY</th>
          <th style="width:100px;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${incomeRows}</tbody>
    </table>

    <div class="rcp-total-row">
      <span class="rcp-total-label">TOTAL INCOME</span>
      <span class="rcp-total-val inc">${fmtAmt(income)}</span>
    </div>

    <!-- ─── EXPENSES SECTION ─── -->
    <div class="rcp-section-hdr" style="margin-top:18px;">
      <div class="rcp-section-icon exp">▼</div>
      <div class="rcp-section-label exp">EXPENSES</div>
    </div>
    ${expenseBlocks}

    <div class="rcp-total-row">
      <span class="rcp-total-label">TOTAL EXPENSES</span>
      <span class="rcp-total-val exp">${fmtAmt(expense)}</span>
    </div>

    <!-- ─── NET BALANCE ─── -->
    <div class="rcp-balance-row">
      <span class="rcp-balance-label">${balance >= 0 ? '✔ NET BALANCE' : '✘ NET BALANCE'}</span>
      <span class="rcp-balance-val ${balClass}">${fmtAmt(Math.abs(balance))} ${balance >= 0 ? '(+)' : '(-)'}</span>
    </div>

    <!-- ─── SMART TIP ─── -->
    <div class="rcp-tip-box">
      <div class="rcp-tip-title">💡 Smart Saving Suggestion</div>
      <div class="rcp-tip-text">${tip}</div>
    </div>

    <!-- ─── FOOTER ─── -->
    <div class="rcp-footer">
      <div class="rcp-footer-heart">♥</div>
      <div class="rcp-footer-msg">Thank you for tracking with FinTrack!</div>
      <div class="rcp-footer-sub">Built by Claude™ · Keep saving, keep growing.</div>
    </div>
  </div>
  <div class="rcp-torn-bottom"></div>
</div>`;
}

// ── Generate receipt: render → capture → store ─────────────────
async function generateReceipt() {
  const period = document.querySelector('.rcp-pill.active')?.dataset.period || 'today';
  const { start, end, label, dateRange } = getRangeForPeriod(period);

  const txs = state.transactions.filter(t => {
    const d = parseDate(t.date);
    return d >= start && d <= end;
  }).sort((a,b) => a.date.localeCompare(b.date));

  // Show a placeholder card while generating
  const placeholderId = 'rcp-placeholder-' + Date.now();
  const placeholder = document.createElement('div');
  placeholder.className = 'receipt-card';
  placeholder.id = placeholderId;
  placeholder.innerHTML = `
    <div class="receipt-card-header">
      <div class="receipt-card-meta">
        <div class="receipt-card-title">${escHtml(label)}</div>
        <div class="receipt-card-date">Generating…</div>
      </div>
    </div>
    <div class="receipt-generating">
      <div class="spin-ring"></div>
      <span>Building your receipt…</span>
    </div>`;

  const listEl = document.getElementById('receiptsList');
  const emptyEl = document.getElementById('receiptsEmpty');
  if (emptyEl) emptyEl.style.display = 'none';
  listEl.prepend(placeholder);

  // Render template off-screen
  const renderArea = document.getElementById('receiptRenderArea');
  renderArea.innerHTML = buildReceiptHTML(period, label, dateRange, txs);

  await new Promise(r => setTimeout(r, 60)); // allow DOM paint

  let dataUrl = null;
  try {
    const canvas = await html2canvas(renderArea.querySelector('.receipt-tpl'), {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f5f4f0',
      logging: false,
    });
    dataUrl = canvas.toDataURL('image/png');
  } catch(err) {
    console.warn('html2canvas error:', err);
  }

  renderArea.innerHTML = '';

  // Build stored receipt entry
  const entry = {
    id: 'rcp-' + Date.now().toString(36),
    period,
    label,
    dateRange,
    generatedAt: new Date().toISOString(),
    dataUrl,
  };
  receiptStore.unshift(entry);
  saveReceipts();

  // Replace placeholder with real card
  const realCard = buildReceiptCard(entry);
  placeholder.replaceWith(realCard);

  toast('Receipt generated!', 'success');
}

// ── Build in-app receipt card element ─────────────────────────
function buildReceiptCard(entry) {
  const div = document.createElement('div');
  div.className = 'receipt-card';
  div.dataset.receiptId = entry.id;

  const genDate = new Date(entry.generatedAt).toLocaleString('en-PH',{
    month:'short',day:'numeric',year:'numeric',
    hour:'numeric',minute:'2-digit',hour12:true
  });

  const previewHTML = entry.dataUrl
    ? `<div class="receipt-card-preview"><img src="${entry.dataUrl}" alt="Receipt" /></div>`
    : `<div class="receipt-card-preview" style="background:#ddd;padding:2rem;text-align:center;color:#666;font-size:.82rem;">Preview unavailable</div>`;

  div.innerHTML = `
    <div class="receipt-card-header">
      <div class="receipt-card-meta">
        <div class="receipt-card-title">${escHtml(entry.label)}</div>
        <div class="receipt-card-date">Generated ${genDate}</div>
      </div>
      <div class="receipt-card-actions">
        ${entry.dataUrl ? `<button class="btn-rcp-action btn-rcp-download" data-action="download" data-id="${entry.id}">⬇ Download</button>` : ''}
        <button class="btn-rcp-action del" data-action="delete-receipt" data-id="${entry.id}">🗑 Delete</button>
      </div>
    </div>
    ${previewHTML}`;

  return div;
}

// ── Render all saved receipts ──────────────────────────────────
function renderReceiptsList() {
  loadReceipts();
  const listEl = document.getElementById('receiptsList');
  const emptyEl = document.getElementById('receiptsEmpty');
  listEl.innerHTML = '';

  if (receiptStore.length === 0) {
    listEl.appendChild(emptyEl || (() => {
      const d = document.createElement('div');
      d.className='receipts-empty'; d.id='receiptsEmpty';
      d.innerHTML='<span class="empty-icon">🧾</span><p>No receipts yet. Generate one above!</p>';
      return d;
    })());
    return;
  }

  // Re-attach empty el (hidden)
  if (!document.getElementById('receiptsEmpty')) {
    const d = document.createElement('div');
    d.className='receipts-empty'; d.id='receiptsEmpty'; d.style.display='none';
    d.innerHTML='<span class="empty-icon">🧾</span><p>No receipts yet. Generate one above!</p>';
    listEl.appendChild(d);
  }

  receiptStore.forEach(entry => {
    listEl.appendChild(buildReceiptCard(entry));
  });
}

// ── Delegate receipt card actions ──────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  if (btn.dataset.action === 'download') {
    const id = btn.dataset.id;
    const entry = receiptStore.find(r => r.id === id);
    if (!entry || !entry.dataUrl) return;
    const a = document.createElement('a');
    a.href = entry.dataUrl;
    a.download = entry.label.replace(/[^a-z0-9]+/gi,'_') + '.png';
    a.click();
    toast('Receipt downloaded!', 'success');
  }

  if (btn.dataset.action === 'delete-receipt') {
    const id = btn.dataset.id;
    receiptStore = receiptStore.filter(r => r.id !== id);
    saveReceipts();
    const card = document.querySelector(`[data-receipt-id="${id}"]`);
    if (card) {
      card.style.transition = 'opacity .25s, transform .25s';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        card.remove();
        if (receiptStore.length === 0) renderReceiptsList();
      }, 250);
    }
    toast('Receipt deleted.', 'info');
  }
});

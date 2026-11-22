/* Tank Defense — общая логика игры. Работает и в браузере, и на сервере (node:vm).
   Всё, что влияет на результат боя, — детерминировано: фиксированный шаг DT, свой ГСЧ G.rnd по сиду матча.
   Визуальные эффекты (G.vis) могут использовать Math.random — на сервере vis=false. */
/* ======================= Константы ======================= */
const COLS = 9, ROWS = 14, LEVELS = 32, FCOST = 1, MAXF = 10, FREGEN = 300000, DECK = 4, MAXLV = 10;
const WAVE_GAP = 5, BOXCD = 4 * 3600000;
/* Улучшения в бою: 4 уровня ★. Множители урона/перезарядки/дальности и цена (доля от стоимости танка) */
const TIER = { d: [1, 1.3, 1.65, 2.2], r: [1, 1, .92, .85], rg: [0, .25, .5, .75], up: [.6, .9, 1.3] }, MAXT = 4;
const ARMK = 0.3; /* урон по 🛡 бронированным без бронебойности */
const DETS = { a: ['✈', 'Воздух'], h: ['👁', 'Скрытые'], l: ['🛡', 'Броня'] };
const OL = '#2b2118';
const RAR = {
  common: { n: 'Обычный', c: 'var(--common)', hex: '#a3adb8' }, rare: { n: 'Редкий', c: 'var(--rare)', hex: '#3d9bff' },
  epic: { n: 'Эпический', c: 'var(--epic)', hex: '#b45cff' }, legendary: { n: 'Легендарный', c: 'var(--legendary)', hex: '#ffae1a' },
  limited: { n: 'Мифический', c: 'var(--limited)', hex: '#ff3b3b' }
};
const UPC = [60, 110, 180, 270, 400, 560, 760, 1000, 1300];
const RM = { common: 1, rare: 1.5, epic: 2.2, legendary: 3, limited: 3 };
const MODES = { first: 'Первый', strong: 'Сильный', near: 'Ближний' };

/* Танки игрока. kind = уникальная механика */
const TANKS = [
  /* det: с какого ★ в бою танк видит/бьёт: g — землю, a — ✈ воздух, h — 👁 скрытых, l — 🛡 пробивает броню. Нет ключа — никогда */
  { id: 'shmel', name: 'Шмель', kind: 'mg', rar: 'common', dmg: 5, rate: 0.15, range: 2.3, cost: 70, det: { g: 1, a: 1, h: 3, l: 4 },
    role: 'Скорострел', desc: 'Сыпет пулями очередью и сбивает авиацию. Броню не пробивает, пока не станет ★4.', perk: 'Бронебойные пули: пробивает 🛡',
    look: { h: '#86b84c', tur: 'circle', ts: .21, bar: 2, bl: .58, bw: .042 } },
  { id: 'bobr', name: 'Бобр', kind: 'cannon', rar: 'common', dmg: 28, rate: 1.1, range: 2.6, cost: 90, det: { g: 1, l: 1 },
    role: 'Пушка', desc: 'Надёжная пушка с хорошим уроном. Пробивает броню.', perk: 'Двойной выстрел',
    look: { h: '#5f9e4f', tur: 'circle', ts: .27, bar: 1, bl: .62, bw: .13, brake: 1 } },
  { id: 'zhar', name: 'Жар', kind: 'flame', rar: 'rare', dmg: 5, rate: 0.1, range: 1.6, cost: 110, det: { g: 1, l: 1 },
    role: 'Огнемёт', desc: 'Поливает огнём ВСЕХ врагов рядом и поджигает. Огонь прожигает любую броню.', perk: 'Напалм: горение ×2',
    look: { h: '#d9782f', tur: 'box', ts: .25, bar: 1, bl: .42, bw: .17, extra: 'fuel' }, price: { silver: 500 } },
  { id: 'sokol', name: 'Сокол', kind: 'sniper', rar: 'rare', dmg: 120, rate: 2.8, range: 5, cost: 130, mode: 'strong', det: { g: 1, h: 1, l: 1 },
    role: 'Снайпер', desc: 'Огромная дальность и видит скрытых. Стреляет редко, но очень больно — по самому крепкому.', perk: 'Крит 25%: урон ×2.5',
    look: { h: '#6d8f5a', tur: 'dome', ts: .22, bar: 1, bl: .98, bw: .07, brake: 1 }, price: { silver: 450 } },
  { id: 'moroz', name: 'Мороз', kind: 'cryo', rar: 'rare', dmg: 10, rate: 0.8, range: 2.3, cost: 100, slow: 0.4, det: { g: 1, a: 1, h: 3 },
    role: 'Криопушка', desc: 'Замораживает: враги и вертолёты едут на 40% медленнее.', perk: 'Глубокая заморозка −60%',
    look: { h: '#4fa8d8', tur: 'circle', ts: .26, bar: 1, bl: .44, bw: .19, extra: 'crystal' }, price: { silver: 400 } },
  { id: 'vihr', name: 'Вихрь', kind: 'aa', rar: 'rare', dmg: 14, rate: 0.3, range: 3.4, cost: 100, det: { g: 1, a: 1, h: 1, l: 1 }, dmgT: [9.5, 13.5, 18, 23],
    role: 'Зенитка', desc: 'Зенитка с радаром: рвёт авиацию и видит скрытых. По земле бьёт вполсилы, в полную силу — на ★4. Самолёты бьёт первыми.', perk: 'Полный урон по земле',
    look: { h: '#8f9c55', tur: 'box', ts: .23, bar: 2, bl: .62, bw: .07, extra: 'dish' }, price: { silver: 400 } },
  { id: 'oboz', name: 'Обоз', kind: 'supply', rar: 'rare', cost: 120, give: [25, 40, 60, 85], range: 0, det: {},
    role: 'Снабжение', desc: 'Не стреляет. В начале каждой волны привозит 💵 на постройку.', perk: '+85 💵 за волну',
    look: { h: '#b08a52' }, price: { silver: 350 } },
  { id: 'kuvalda', name: 'Кувалда', kind: 'kv2', rar: 'epic', dmg: 90, rate: 3.0, range: 3, cost: 160, splash: 0.85, det: { g: 1, l: 1 },
    role: 'Гаубица', desc: 'Тяжёлая гаубица: долго перезаряжается, но взрыв накрывает группу врагов.', perk: 'Оглушение на 0.6с',
    look: { h: '#4f6b3a', tur: 'box', ts: .34, bar: 1, bl: .5, bw: .24 }, price: { gold: 90 } },
  { id: 'tesla', name: 'Тесла', kind: 'tesla', rar: 'epic', dmg: 32, rate: 1.2, range: 2.5, cost: 160, chain: 3, det: { g: 1, a: 1, h: 1, l: 1 },
    role: 'Молния', desc: 'Молния прыгает по 3 врагам, видит всё и игнорирует броню.', perk: 'Цепь из 5 целей',
    look: { h: '#6b5ca5', tur: 'circle', ts: .25, bar: 0, extra: 'coil' }, price: { gold: 110 } },
  { id: 'grad', name: 'Град', kind: 'rockets', rar: 'epic', dmg: 24, rate: 3.2, range: 4.2, cost: 180, splash: 0.55, salvo: 4, det: { g: 1, a: 1, h: 3 },
    role: 'Ракеты', desc: 'Залп самонаводящихся ракет по нескольким целям, бьёт и авиацию. Броню не пробивает.', perk: '6 ракет в залпе',
    look: { h: '#7a8f3d', tur: 'box', ts: .27, bar: 0, extra: 'pod' }, price: { gold: 120 } },
  { id: 'mamont', name: 'Мамонт', kind: 'mammoth', rar: 'legendary', dmg: 55, rate: 1.5, range: 3, cost: 230, det: { g: 1, l: 1, h: 2, a: 4 },
    role: 'Сверхтяж', desc: 'Двуствольный монстр. Каждое попадание срывает с врага броню — остальные танки бьют его в полную силу.', perk: 'Бьёт и по авиации',
    look: { h: '#3f6e8c', tur: 'circle', ts: .31, bar: 2, bl: .7, bw: .12, brake: 1 }, price: { gold: 260 } },
  { id: 'polar', name: 'Полярная ночь', kind: 'polar', rar: 'legendary', dmg: 30, rate: 2.2, range: 2.4, cost: 200, slow: 0.5, det: { g: 1, a: 1, h: 1, l: 1 },
    role: 'Ледяной импульс', desc: 'Волна холода бьёт всех вокруг и замедляет на 50%.', perk: 'Полная заморозка на 0.8с',
    look: { h: '#e3eef6', tur: 'dome', ts: .27, bar: 0, extra: 'crystal' }, price: { gold: 260 } },
  { id: 'zavod', name: 'Завод', kind: 'spawner', rar: 'legendary', dmg: 70, rate: 5.5, range: 0, cost: 230, det: { g: 1, l: 1 },
    role: 'Танковый завод', desc: 'Выпускает свои танки: они едут по дороге навстречу врагам, стреляют и таранят их. С ★ танки сильнее и их больше.', perk: 'Тяжёлые танки по 2 за раз',
    look: { h: '#4a6fa5', tur: 'box', ts: .33, bar: 0, extra: 'hangar' }, price: { gold: 280 } },
  { id: 'grom', name: 'Гром', kind: 'tesla', rar: 'limited', dmg: 40, rate: 1.1, range: 2.7, cost: 210, chain: 3, det: { g: 1, a: 1, h: 1, l: 1 },
    role: 'Грозовая башня', desc: 'Молния бьёт сильнее Теслы и дальше прыгает.', perk: 'Цепь из 5 целей',
    look: { h: '#3a4166', tur: 'dome', ts: .27, bar: 0, extra: 'coil' }, price: { gems: 1000 } },
  { id: 'baraban', name: 'Барабан', kind: 'drum', rar: 'limited', dmg: 30, rate: 2.2, range: 2.8, cost: 200, det: { g: 1, l: 1, a: 3, h: 4 },
    role: 'Барабанная пушка', desc: 'Три ствола: выпускает 3 снаряда подряд, потом перезаряжает барабан.', perk: 'Барабан на 5 снарядов',
    look: { h: '#8a5a33', tur: 'box', ts: .28, bar: 3, bl: .6, bw: .085, brake: 1, extra: 'drum' }, price: { gems: 300 } },
  { id: 'relsa', name: 'Рельса', kind: 'rail', rar: 'limited', dmg: 75, rate: 2.6, range: 3.8, cost: 220, det: { g: 1, l: 1, h: 1, a: 3 },
    role: 'Рельсотрон', desc: 'Разгоняет снаряд магнитами и прошивает насквозь всех врагов на линии.', perk: 'Без потери урона на каждой цели',
    look: { h: '#2f3a4a', tur: 'dome', ts: .26, bar: 2, bl: .9, bw: .05, extra: 'core', core: '#4fe3ff' }, price: { gems: 500 } },
  { id: 'uskor', name: 'Ускоритель', kind: 'beam', rar: 'limited', dmg: .5, rate: .01, range: 2.6, cost: 260, det: { g: 1, l: 1, a: 1, h: 2 },
    role: 'Лучевая пушка', desc: 'Непрерывный луч бьёт каждые 0.01с. Держит цель, пока она жива, и сразу переключается на следующую.', perk: 'Перегрев: урон по одной цели растёт до ×2',
    look: { h: '#5a3a8a', tur: 'dome', ts: .27, bar: 1, bl: .7, bw: .15, extra: 'core', core: '#d27bff' }, price: { gems: 1500 } }
];
/* Ручной баланс (страница «Арсенал»): cost — постройка, up — доплата за ★2–★4, dps — DPS на 1-м уровне прокачки (в единицах игры),
   rg — радиус, slow/slowB — замедление % (обычные / боссы и мини-боссы), spl — сплеш, lim — сколько таких танков можно поставить в бою. null — как было */
const MAXTW = 20;
const TUNE = {
  shmel:   { lim: 5, up: [30, 60, 110], rg: [2.5, 3, 3.5, 4.35] },
  bobr:    { lim: 5, up: [null, null, 200], dps: [5, 7, 9, 20], rg: [null, 3, 4, 4] },
  zhar:    { lim: 2, dps: [10, 13, 20, 25], rg: [2, 2.5, 2.7, 3] },
  sokol:   { lim: 2, cost: 150, up: [150, 300, 500], dps: [12, 18, 38, 60], rg: [null, 6, 8, 8.5] },
  moroz:   { lim: 2, cost: 50, up: [150, 175, 325], dps: [2, 3, 5, 8], slow: [20, 25, 35, 50], slowB: [10, 15, 17.5, 20], spl: [.3, .4, .5, .6], rg: [3, 4, 4, 4.25] },
  vihr:    { lim: 6, cost: 80, up: [25, 100, 200], dps: [9, 10, 17, 25], rg: [3, 3.5, 3.5, 4] },
  oboz:    { lim: 5, cost: 85, up: [35, 50, 75] },
  kuvalda: { lim: 2, up: [200, 335, 595], dps: [8, 20, 28, 80], rg: [3, 3.5, 4.5, 4.5] },
  tesla:   { lim: 3, cost: 135, up: [100, 140, 200], dps: [8, 11, 18, 27], rg: [2.65, 2.95, 3.5, 4] },
  grad:    { lim: 2, cost: 150, up: [75, 250, 500], dps: [6, 8, 20, 45] },
  mamont:  { lim: 2, dps: [null, null, null, 33] },
  polar:   { lim: 3, dps: [3, 5, 8, 10], slow: [30, 33, 38, 45], slowB: [15, 20, 22.5, 25], rg: [3, 3.2, 3.6, 3.7] },
  zavod:   { lim: 3, up: [125, 200, 333] },
  grom:    { lim: 2, up: [null, null, 500], dps: [null, null, null, 25], rg: [null, null, 3.45, null] },
  baraban: { lim: 2, dps: [6.5, 9, 15, null] },
  relsa:   { lim: 3 },
  uskor:   { lim: 3, cost: 350, up: [360, 500, 900], dps: [24, 39, 57, 90], rg: [3, 3.3, 3.8, 5] },
};
for (const [id, o] of Object.entries(TUNE)) { const t = TANKS.find(x => x.id === id); if (!t) continue; if (o.cost) t.cost = o.cost; t.tune = o; }
const tierUp = (t, k) => { const u = t.tune && t.tune.up && t.tune.up[k - 2]; return u != null ? u : Math.round(t.cost * TIER.up[k - 2]); }; /* доплата за ★k */
const tv = (t, key, i) => { const a = t.tune && t.tune[key]; return a && a[i] != null ? a[i] : null; };
const tankById = (id) => TANKS.find(t => t.id === id);

/* Враги. HP в бою считается во внутренних единицах; игроку показываем /HPU: лёгкий танк ≈ 5 ❤ */
const HPU = 6.4, BASE_HP = 100;
const hpN = v => { const x = v / HPU; return x >= 10 ? Math.round(x) : +x.toFixed(1); };
const ENEMY = {
  /* arm — 🛡 бронированный (без бронебойности урон ×0.3), hid — 👁 скрытый, fly — ✈ летит напрямую */
  light:     { n: 'Лёгкий танк', hp: 32, speed: 2, reward: 2.5, cost: 1, leak: 1, size: .5, gap: .55, from: 1, w: 4, desc: 'Быстрый и хлипкий. Берёт числом.' },
  btr:       { n: 'Броневик', hp: 96, speed: 1, reward: 6, cost: 2, leak: 1, size: .56, gap: .8, from: 2, w: 3, desc: 'Покрепче лёгкого танка.' },
  tank:      { n: 'Средний танк', hp: 224, speed: .8, arm: 1, reward: 15, cost: 4.5, leak: 2, size: .64, gap: 1.1, from: 4, w: 2, desc: '🛡 Броня: без бронебойности урон всего 30%. Нужен Бобр, Сокол, Жар или Тесла.' },
  heli:      { n: 'Вертолёт', hp: 109, speed: 1.2, fly: 1, road: 1, reward: 9, cost: 3, leak: 1, size: .62, gap: 1, from: 6, w: 1.6, desc: '✈ Летит над дорогой. Сбивают только танки с ✈.' },
  medic:     { n: 'Ремонтник', hp: 128, speed: 1, reward: 11, cost: 4, leak: 1, size: .56, gap: 1, from: 7, w: .85, heal: 1, desc: 'Чинит врагов рядом. Убивай его первым.' },
  scout:     { n: 'Камуфляж', hp: 96, speed: 1.3, hid: 1, reward: 11, cost: 3, leak: 1, size: .54, gap: .9, from: 9, w: 1.3, desc: '👁 Скрытый: его видят только танки с 👁 — Сокол, Вихрь, Тесла, Шмель ★3.' },
  transport: { n: 'Грузовик', hp: 160, speed: 1.5, reward: 9, cost: 6, leak: 2, size: .62, gap: 1.1, from: 10, w: 2, spawn: 3, desc: 'При уничтожении высаживает 3 лёгких танка.' },
  heavy:     { n: 'Тяжёлый танк', hp: 576, speed: .7, arm: 1, reward: 35, cost: 10, leak: 3, size: .76, gap: 1.5, from: 12, w: .8, desc: '🛡 Огромный и бронированный. Мамонт срывает броню — тогда его бьют все.' },
  bomber:    { n: 'Бомбардировщик', hp: 510, speed: 1.5, fly: 1, reward: 15, cost: 0, leak: 0, size: .76, gap: 1.2, from: 14, w: 0, raid: 1, desc: '✈ Налёт: летит поперёк поля и сбрасывает бомбу на случайный танк — оглушение 3–8 с. Можно сбить до сброса. Улетает за край карты, базу не бьёт.' },
  sbomber:   { n: 'Супер-бомбардировщик', hp: 2040, speed: 1.5, fly: 1, reward: 60, cost: 0, leak: 0, size: 1, gap: 1.6, from: 20, w: 0, raid: 1, aoe: 1.5, img: 'bomber', desc: '✈ Тяжёлый налёт: ХП ×4, бомба оглушает все танки в радиусе 1.5 клетки на 1–4 с. Можно сбить до сброса. Улетает за край карты.' },
  assault:   { n: 'Штурмовой танк', hp: 300, speed: .95, arm: 1, reward: 20, cost: 7, size: .7, gap: 1.2, from: 17, w: .9, desc: '🛡 Быстрый бронированный танк. Опасен, если прорвётся.' },
  ghost:     { n: 'Ночной вертолёт', hp: 192, speed: 1.4, fly: 1, road: 1, hid: 1, reward: 18, cost: 6, size: .62, gap: 1, from: 20, w: .7, desc: '✈👁 Скрытый вертолёт: нужны ✈ и 👁 сразу.' },
  sled:      { n: 'Аэросани', hp: 64, speed: 2.5, reward: 6, cost: 2, leak: 1, size: .52, gap: .5, from: 18, w: 1.2, noslow: 1, desc: 'Очень быстрые. Скользят по льду — замедление на них не действует.' },
  digger:    { n: 'Бурильщик', hp: 288, speed: .95, reward: 16, cost: 5, leak: 2, size: .6, gap: 1.1, from: 20, w: .8, dig: 1, desc: '⛏ Время от времени зарывается под снег — пока он под землёй, по нему не попасть.' },
  /* ⭐ мини-боссы ледяного перевала: приходят каждые 5 волн, в обычный набор волны не попадают (w: 0) */
  icebreaker:{ n: 'Ледокол', hp: 1760, speed: .61, arm: 1, reward: 70, cost: 0, leak: 10, size: .92, gap: 1.6, from: 17, w: 0, mini: 1, frost: 1, desc: '⭐ Мини-босс. 🛡 Броня. Каждые 7 с бьёт морозом: танки рядом замерзают на 2 с. Оглуши его — и мороза не будет.' },
  shield:    { n: 'Щитоносец', hp: 1440, speed: .68, reward: 60, cost: 0, leak: 8, size: .84, gap: 1.6, from: 20, w: 0, mini: 1, aura: 1, desc: '⭐ Мини-босс. Щит: враги рядом с ним получают вдвое меньше урона. Убивай его первым.' },
  boss:      { n: 'Колосс', hp: 5120, speed: .44, arm: 1, reward: 200, cost: 0, leak: 20, size: 1.15, gap: 2, from: 99, w: 0, boss: 1, desc: '🛡 Гигантский танк-босс. Вызывает подкрепление.' }
};
const ELOOK = {
  light: { h: '#e0763c', tur: 'circle', ts: .22, bar: 1, bl: .45, bw: .08 },
  scout: { h: '#7b8a4a', tur: 'dome', ts: .2, bar: 1, bl: .5, bw: .07, camo: 1 },
  tank: { h: '#d4544a', tur: 'circle', ts: .26, bar: 1, bl: .55, bw: .12 },
  heavy: { h: '#8e3b36', tur: 'box', ts: .3, bar: 1, bl: .6, bw: .16, brake: 1 },
  assault: { h: '#b8452f', tur: 'box', ts: .27, bar: 1, bl: .62, bw: .13, brake: 1 },
  boss: { h: '#5e2c2a', tur: 'box', ts: .28, bar: 2, bl: .62, bw: .11, brake: 1, skull: 1 }
};

/* Локации и уровни */
const LOCS = [
  { name: 'Зелёные луга', rb: '#4caf3f', icon: '🌳', from: 1, to: 8, g1: '#93d65f', g2: '#89cd56', road: '#e4c189', edge: '#b28a53', obs: ['tree', 'tree', 'bush', 'rock'],
    bg: 'linear-gradient(#b5ea8a,#7fca5b)', path: '#f3dca8', dec: ['🌳', '🌲', '🌼', '🍄', '🌷', '🪨'] },
  { name: 'Жаркая пустыня', rb: '#e8862a', icon: '🏜️', from: 9, to: 16, g1: '#f4d48f', g2: '#eecb80', road: '#cfa064', edge: '#9d7240', obs: ['cactus', 'rock', 'cactus', 'bones'],
    bg: 'linear-gradient(#ffe3a6,#f0c071)', path: '#fff0cc', dec: ['🌵', '🪨', '🦂', '🐫', '🌴'], part: 'dust' },
  { name: 'Ледяной перевал', rb: '#3d9be0', icon: '❄️', from: 17, to: 32, g1: '#eef6fb', g2: '#e2eef6', road: '#bdd0de', edge: '#8ea7bc', obs: ['pine', 'pine', 'snowman', 'ice'],
    bg: 'linear-gradient(#f1f9ff,#c3e1f4)', path: '#ffffff', dec: ['🌲', '⛄', '❄️', '🏔️', '🐧'], part: 'snow' }
];
const PATHS = [
  [[[1, -1], [1, 3], [7, 3], [7, 7], [1, 7], [1, 11], [6, 11], [6, 14]]],
  [[[4, -1], [4, 2], [1, 2], [1, 6], [7, 6], [7, 10], [2, 10], [2, 14]]],
  [[[7, -1], [7, 2], [1, 2], [1, 5], [7, 5], [7, 8], [1, 8], [1, 11], [7, 11], [7, 14]]],
  [[[1, -1], [1, 9], [4, 9], [4, 3], [7, 3], [7, 14]]],
  [[[6, -1], [6, 4], [2, 4], [2, 8], [6, 8], [6, 12], [3, 12], [3, 14]]],
  [[[1, -1], [1, 12], [4, 12], [4, 2], [7, 2], [7, 14]]],
  [[[1, -1], [1, 7], [4, 7], [4, 10], [2, 10], [2, 14]], [[7, -1], [7, 3], [5, 3], [5, 7], [4, 7], [4, 10], [2, 10], [2, 14]]],
  [[[0, -1], [0, 4], [4, 4], [4, 8], [7, 8], [7, 14]], [[8, -1], [8, 2], [4, 2], [4, 8], [7, 8], [7, 14]]],
  /* ледяной перевал: длинный серпантин и две дороги, сходящиеся у базы */
  [[[0, -1], [0, 2], [8, 2], [8, 6], [0, 6], [0, 10], [4, 10], [4, 14]]],
  [[[1, -1], [1, 3], [3, 3], [3, 6], [1, 6], [1, 9], [4, 9], [4, 14]], [[7, -1], [7, 3], [5, 3], [5, 6], [7, 6], [7, 9], [4, 9], [4, 14]]]
];
const LV_P = [0, 1, 3, 2, 4, 5, 1, 2, 6, 0, 3, 7, 5, 2, 6, 4, 7, 5, 6, 3, 7, 2, 6, 7, 8, 9, 3, 7, 8, 6, 9, 9];
function LVL(n) {
  const mir = n > 8 && n % 2 === 0;
  let ps = PATHS[LV_P[n - 1]];
  if (mir) ps = ps.map(p => p.map(([x, y]) => [COLS - 1 - x, y]));
  return { n, paths: ps, loc: LOCS.find(l => n >= l.from && n <= l.to), boss: n % 8 === 0, bliz: n >= 25, scale: 1 + (n - 1) * 0.12 + Math.min(.4, Math.max(0, n - 2) * .1) + Math.min(.3, Math.max(0, n - 3) * .1) - Math.max(0, n - 12) * .04,
    cash: 170 + n * 10 + Math.max(0, n - 5) * 8 - Math.min(30, Math.max(0, n - 3) * 10) + Math.max(0, n - 12) * 6, lives: BASE_HP };
}
const levelSilver = (n) => 80 + n * 30;

/* Контейнеры */
const BOXES = [
  { id: 'wood', n: 'Деревянный', col: '#c98d4b', band: '#7a5230', price: { free: 1 }, lim: .1, odds: [['silver', 70, '🥈 50–150'], ['gold', 22, '🥇 2–6'], ['rare', 8, 'Редкий танк']] },
  { id: 'iron', n: 'Железный', col: '#a9b8c6', band: '#55606b', price: { silver: 400 }, lim: .5, odds: [['silver', 40, '🥈 200–500'], ['gold', 27, '🥇 8–20'], ['rare', 25, 'Редкий танк'], ['epic', 8, 'Эпик танк']] },
  { id: 'gold', n: 'Золотой', col: '#ffcf40', band: '#b07d10', price: { gold: 80 }, lim: 1, odds: [['rare', 45, 'Редкий танк'], ['epic', 43, 'Эпик танк'], ['legendary', 12, 'Легенда']] },
  { id: 'star', n: 'Космический', col: '#b06bff', band: '#6a3aa8', price: { gems: 50 }, lim: 5, odds: [['epic', 75, 'Эпик танк'], ['legendary', 25, 'Легенда']] }
];
const DUPC = { rare: { silver: 250 }, epic: { gold: 40 }, legendary: { gold: 120 }, limited: { gold: 300 } };
const GOLDPACKS = [{ g: 100, st: 50 }, { g: 550, st: 250 }, { g: 1200, st: 500 }];
const FUELPACK = { f: 10, st: 50 };
/* Гемы 💎 — валюта рынка, лимиток и Космического контейнера. За Stars продаются только в магазине */
const GEMPACKS = [{ g: 100, st: 100 }, { g: 550, st: 500 }, { g: 1200, st: 1000 }];
/* Всё, что продаётся за Telegram Stars: k — вид товара, arg — номер набора или модель лимитки. Цену проверяет сервер */
function starItem(k, arg) {
  if (k === 'gold') { const p = GOLDPACKS[+arg]; return p ? { st: p.st, title: `${p.g} золота`, g: p.g } : null; }
  if (k === 'fuel') return { st: FUELPACK.st, title: `+${FUELPACK.f} топлива` };
  if (k === 'gems') { const p = GEMPACKS[+arg]; return p ? { st: p.st, title: `${p.g} гемов`, gm: p.g } : null; }
  return null;
}
const QPOOL = [
  { id: 'win', t: 'Победи на уровнях', g: 3, r: { silver: 150 } }, { id: 'kill', t: 'Уничтожь врагов', g: 150, r: { gold: 5 } },
  { id: 'build', t: 'Поставь танков в боях', g: 15, r: { silver: 100 } }, { id: 'star3', t: 'Пройди уровень на 3 ★', g: 1, r: { gold: 4 } },
  { id: 'air', t: 'Сбей авиацию', g: 15, r: { silver: 120 } }, { id: 'box', t: 'Открой контейнер', g: 1, r: { silver: 80 } },
  { id: 'upg', t: 'Улучши танк в гараже', g: 1, r: { silver: 80 } }
];

/* ======================= Утилиты ======================= */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 0; for (const ch of s) h = Math.imul(h, 31) + ch.charCodeAt(0) | 0; return h; }
const lerpAng = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * Math.min(1, k); };
const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)), p = (x) => String(x).padStart(2, '0'); return s >= 3600 ? `${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}` : `${Math.floor(s / 60)}:${p(s % 60)}`; };
/* Короткие числа: 1500 → 1.5K, 2000000 → 2M */
const num = (v) => { v = Math.floor(+v || 0); const a = Math.abs(v); for (const [d, s] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (a >= d) { const x = v / d; return (a >= d * 100 ? Math.floor(x) : Math.floor(x * 10) / 10) + s; } return String(v); };
const priceTxt = (p) => p.free ? 'Бесплатно' : p.silver ? `🥈 ${num(p.silver)}` : p.gold ? `🥇 ${num(p.gold)}` : p.gems ? `💎 ${num(p.gems)}` : `⭐ ${num(p.stars)}`;
const upCost = (t, lv) => Math.round(UPC[lv - 1] * RM[t.rar]);

/* ======================= Экономика (S — состояние игрока) ======================= */
/* ---------- Поддержка: расходники в бою (до 4 в наборе, как танки в отряде) ----------
   tgt: 'pt' — тап в любую точку, 'road' — тап по дороге, 'now' — срабатывает сразу. cd — перезарядка (с), uses — раз за бой. */
const SUPS = [
  { id: 'strike', n: 'Авиаудар', rar: 'common', tgt: 'pt', cd: 30, desc: 'Самолёт сбрасывает 5 бомб вдоль ближайшей к точке дороги. Бьёт только наземных.' },
  { id: 'mine', n: 'Мины', rar: 'common', tgt: 'road', uses: 3, desc: 'Ставится на дорогу и взрывается под первым наземным врагом. 3 штуки за бой.' },
  { id: 'smoke', n: 'Дымовая завеса', rar: 'rare', tgt: 'pt', cd: 25, price: { silver: 400 }, desc: 'Облако на 6 с: все враги внутри — и наземные, и воздушные — едут вдвое медленнее, босс — на четверть.' },
  { id: 'repair', n: 'Ремкомплект', rar: 'rare', tgt: 'now', uses: 1, price: { silver: 450 }, desc: 'Сразу чинит базу на 20% 🏰. Один раз за бой.' },
  { id: 'barrage', n: 'Артобстрел', rar: 'epic', tgt: 'pt', cd: 40, price: { gold: 100 }, desc: '10 снарядов за 2,5 с по кругу вокруг точки. Бьёт только наземных.' },
  { id: 'emp', n: 'ЭМИ', rar: 'epic', tgt: 'pt', cd: 45, price: { gold: 120 }, desc: 'Оглушает всех врагов в большом круге на 3 с — и наземных, и воздушных. Босса — на 1 с.' },
  { id: 'orbital', n: 'Орбитальный удар', rar: 'legendary', tgt: 'pt', uses: 2, price: { gold: 250 }, desc: 'Через 1 с — огромный взрыв по земле и воздуху. 2 раза за бой.' },
  { id: 'freeze', n: 'Стоп-время', rar: 'limited', tgt: 'now', uses: 1, price: { gems: 300 }, desc: 'Все враги на карте замирают на 5 с. Босс — на 2 с. Один раз за бой.' },
];
const SDECK = 4, SDEF = ['strike', 'mine'], supById = (id) => SUPS.find(s => s.id === id);
const sOwn = () => (S.sup ||= Object.fromEntries(SDEF.map(k => [k, 1]))), sDeck = () => (S.sdeck ||= SDEF.slice());
const DEF = () => ({ silver: 150, gold: 10, gems: 0, fuel: MAXF, fTs: Date.now(), stars: {}, owned: { shmel: 1, bobr: 1 }, deck: ['bobr', 'shmel'],
  boxTs: 0, pity: 0, tut: false, q: [], qDay: '' });
function tickFuel() {
  const now = Date.now();
  if (S.fuel >= MAXF) { S.fTs = now; return; }
  const k = Math.floor((now - S.fTs) / FREGEN);
  if (k > 0) { S.fuel = Math.min(MAXF, S.fuel + k); S.fTs += k * FREGEN; if (S.fuel >= MAXF) S.fTs = now; save(); }
}
function give(r) { if (r.silver) S.silver += r.silver; if (r.gold) S.gold += r.gold; if (r.fuel) S.fuel += r.fuel; if (r.gems) S.gems = (S.gems || 0) + r.gems; }
/* Ежедневный подарок: цикл из 7 коробок. Серия растёт, если заходишь каждый день; каждые 10 дней серии — ещё +5 ⛽ */
const DAILY = [{ silver: 100, c: 'red' }, { gold: 3, c: 'blue' }, { fuel: 3, c: 'green' }, { silver: 300, c: 'red' }, { gold: 8, c: 'blue' }, { fuel: 5, c: 'green' }, { silver: 600, gold: 20, c: 'gold' }];
const STREAK_EVERY = 10, STREAK_FUEL = 5, STREAK_GEMS = 10, BOSS_GEMS = 20;
const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
function dailyState() {
  const d = S.daily || { day: '', streak: 0 }, today = dayKey(), alive = d.day === today || d.day === dayKey(Date.now() - 864e5);
  return { ready: d.day !== today, next: d.day === today ? d.streak : alive ? d.streak + 1 : 1, streak: alive ? d.streak : 0 };
}
function dailyRew(n) { const r = Object.assign({}, DAILY[(n - 1) % DAILY.length]); delete r.c; if (n % STREAK_EVERY === 0) { r.fuel = (r.fuel || 0) + STREAK_FUEL; r.gems = STREAK_GEMS; } return r; }
const rewTxt = (r) => [r.silver ? `🥈 ${num(r.silver)}` : '', r.gold ? `🥇 ${num(r.gold)}` : '', r.fuel ? `⛽ ${num(r.fuel)}` : '', r.gems ? `💎 ${num(r.gems)}` : ''].filter(Boolean).join(' ');
function quests() {
  const day = new Date().toDateString();
  if (S.qDay !== day) {
    const r = rng(hashStr(day)), pool = QPOOL.slice(), q = [];
    while (q.length < 3) q.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    S.q = q.map(x => ({ id: x.id, p: 0, c: false })); S.qDay = day; save();
  }
  return S.q;
}
function qAdd(id, k) { if (!k) return; for (const q of quests()) if (q.id === id && !q.c) { const d = QPOOL.find(x => x.id === id); q.p = Math.min(d.g, q.p + k); } }
const qReady = () => quests().some(q => !q.c && q.p >= QPOOL.find(x => x.id === q.id).g);
function maxUnlocked() { let n = 1; while (n < LEVELS && S.stars[n] > 0) n++; return n; }
/* Все характеристики танка: lv — уровень в гараже, tier — звёзды в бою (1..4) */
function calc(t, lv = 1, tier = 1) {
  const i = tier - 1, g = 1 + 0.2 * (lv - 1), det = t.det || {}, has = k => det[k] != null && tier >= det[k], perk = tier === MAXT;
  if (t.kind === 'supply') return { sup: 1, give: Math.round(t.give[i] * (1 + .1 * (lv - 1))), det: {}, perk, range: 0 };
  let dmg = (t.dmgT ? t.dmgT[i] : (t.dmg || 0) * TIER.d[i]) * g; const rate = +(t.rate * TIER.r[i]).toFixed(2), range = tv(t, 'rg', i) ?? +(t.range + TIER.rg[i]).toFixed(2);
  const k = t.kind;
  if (k === 'spawner') { const n = tier >= 3 ? 2 : 1; return { dmg, rate, range: 0, dps: dmg * n / rate, shots: n, aoe: 'Свои танки', perk, ally: 1, det: { g: has('g'), a: false, h: false, l: has('l') } }; }
  const shots = k === 'drum' ? (perk ? 5 : 3) : k === 'aa' || k === 'mammoth' || (k === 'cannon' && perk) ? 2 : k === 'rockets' ? (perk ? 6 : t.salvo) : 1;
  let dps = dmg * shots / rate;
  if (k === 'flame') dps += dmg * 2 * (perk ? 2 : 1);
  if (k === 'sniper' && perk) dps *= 1.375;
  if (k === 'beam' && perk) dps *= 1.5;
  const want = tv(t, 'dps', i); if (want != null && dps > 0) { const f = want * HPU * g / dps; dmg *= f; dps *= f; } /* DPS из ручного баланса */
  const sl = tv(t, 'slow', i), slow = sl != null ? sl / 100 : k === 'cryo' ? (perk ? .6 : .4) : k === 'polar' ? .5 : 0, sb = tv(t, 'slowB', i), slowB = sb != null ? sb / 100 : slow / 2, spl = tv(t, 'spl', i) || 0;
  const aoe = k === 'kv2' || k === 'rockets' ? `Сплеш ${t.splash}` : spl ? `Сплеш ${spl}` : k === 'flame' || k === 'polar' ? 'Все в радиусе' : k === 'tesla' ? `Цепь ${perk ? 5 : 3}` : k === 'rail' ? 'Насквозь' : '';
  return { dmg, rate, range, dps, shots, aoe, perk, slow, slowB, spl, det: { g: has('g'), a: has('a'), h: has('h'), l: has('l') } };
}
function rollBox(id, rnd = Math.random) {
  const b = BOXES.find(x => x.id === id);
  let odds = b.odds;
  if (id === 'gold') { S.pity = (S.pity || 0) + 1; if (S.pity >= 10) odds = [['legendary', 100]]; }
  let x = rnd() * 100, k = odds[odds.length - 1][0];
  for (const o of odds) { if (x < o[1]) { k = o[0]; break; } x -= o[1]; }
  if (b.lim && rnd() * 100 < b.lim) k = 'limited'; // мифик: шанс поверх обычных призов
  if (id === 'gold' && k === 'legendary') S.pity = 0;
  if (k === 'silver') { const a = id === 'wood' ? 50 + Math.floor(rnd() * 101) : 200 + Math.floor(rnd() * 301); S.silver += a; return { txt: `🥈 ${a}` }; }
  if (k === 'gold') { const a = id === 'wood' ? 2 + Math.floor(rnd() * 5) : 8 + Math.floor(rnd() * 13); S.gold += a; return { txt: `🥇 ${a}` }; }
  const pool = TANKS.filter(t => t.rar === k), t = pool[Math.floor(rnd() * pool.length)];
  if (S.owned[t.id]) { give(DUPC[k]); return { t, dup: rewTxt(DUPC[k]) }; }
  S.owned[t.id] = 1; if (S.deck.length < DECK) S.deck.push(t.id);
  return { t };
}
/* ======================= Бой: поле ======================= */
function buildPath(wp, noTiles) {
  const tiles = new Set(), segs = []; let cum = 0;
  for (let i = 0; i < wp.length - 1; i++) {
    const [x0, y0] = wp[i], [x1, y1] = wp[i + 1], len = Math.hypot(x1 - x0, y1 - y0);
    segs.push({ x0, y0, x1, y1, len, cum }); cum += len;
    if (!noTiles) { const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0), k = Math.abs(x1 - x0) + Math.abs(y1 - y0); for (let j = 0; j <= k; j++) { const x = x0 + sx * j, y = y0 + sy * j; if (x >= 0 && x < COLS && y >= 0 && y < ROWS) tiles.add(x + ',' + y); } }
  }
  return { wp, segs, total: cum, tiles };
}
function posAt(P, d) {
  for (const s of P.segs) if (d <= s.cum + s.len) { const k = (d - s.cum) / s.len; return { x: s.x0 + (s.x1 - s.x0) * k, y: s.y0 + (s.y1 - s.y0) * k, ang: Math.atan2(s.y1 - s.y0, s.x1 - s.x0) }; }
  const s = P.segs[P.segs.length - 1]; return { x: s.x1, y: s.y1, ang: Math.atan2(s.y1 - s.y0, s.x1 - s.x0) };
}
/* Модификаторы врагов: Раздутый — ×2 ХП (случайно, со 2-й волны), Колосс — ×5 ХП (только последние волны, с 6-го уровня).
   Награда за убийство растёт так же, как ХП. Волны по-прежнему детерминированы (сид = номер уровня). */
const MODS = { b: { n: 'Раздутый', hp: 2, sc: 1.18, col: '#7bd94f' }, c: { n: 'Колосс', hp: 5, sc: 1.4, col: '#b45cff' }, t: { n: 'Титан', hp: 7, sc: 1.55, col: '#e0362c' } };
function makeWaves(n, np) {
  const r = rng(n * 7919 + 13), boss = n % 8 === 0, nw = n <= 16 ? Math.min(15, 6 + Math.floor(n / 2)) : n === 17 ? 18 : n === 18 ? 24 : Math.min(34, 30 + Math.floor((n - 19) / 3)), waves = [];
  const minis = Object.keys(ENEMY).filter(k => ENEMY[k].mini && ENEMY[k].from <= n);
  const unl = Object.keys(ENEMY).filter(k => ENEMY[k].from <= n && !ENEMY[k].mini && !ENEMY[k].raid), fresh = unl.find(k => ENEMY[k].from === n);
  const pick = (pool) => { let x = r() * pool.reduce((a, k) => a + ENEMY[k].w, 0); for (const k of pool) { x -= ENEMY[k].w; if (x <= 0) return k; } return pool[0]; };
  for (let w = 0; w < nw; w++) {
    const cap = 2 + w * 1.4; let budget = (5 + 2.3 * Math.min(n, 4) + 1.2 * Math.max(0, n - 4)) * (1 + .37 * Math.min(w, 8) + (n <= 16 ? .18 * Math.max(0, w - 8) : .12 * Math.min(7, Math.max(0, w - 8)) + .05 * Math.max(0, w - 15)) * (n <= 16 ? 1 : .6)) * (w === 0 && n > 4 ? .7 : 1), pool = unl, list = [];
    if (w === 0) pool = unl.filter(k => ENEMY[k].cost <= 2);
    else {
      /* Ранние волны — лёгкие враги, тяжёлые появляются ближе к концу уровня */
      pool = unl.filter(k => ENEMY[k].cost <= cap || k === 'light');
      if (n >= 5 && r() < .25) { const th = pool.filter(k => k !== 'light' && k !== fresh && !(ENEMY[k].hid && n < ENEMY[k].from + 3)); if (th.length) pool = [th[Math.floor(r() * th.length)]]; }
    }
    while (budget > .5) { let k = pick(pool); if (fresh && w >= 1 && ENEMY[fresh].cost <= cap && r() < .2) k = fresh; list.push(k); budget -= ENEMY[k].cost; }
    /* ⭐ мини-босс каждые 5 волн (с ур. 27 — по два на каждой 10-й); на ур. 32 босса ведут оба мини-босса */
    if (minis.length && ((n >= 17 ? w % 3 === 2 : w % 5 === 4) || n >= 17 && w >= 9 && r() < .25) && w < nw - 1) { const m = Math.floor(w / 5); list.push(minis[m % minis.length]); if (n >= 27 && w % 10 === 9 && minis.length > 1) list.push(minis[(m + 1) % minis.length]); }
    if (boss && w === nw - 1) { list.push('boss'); if (n >= 32) list.push(...minis); }
    /* ✈ налёты (с ур. 14): самолёт бомбит случайный танк — оглушение 3–8 с */
    if (n >= ENEMY.bomber.from && w >= 2) { const k = (r() < Math.min(.5, .3 + .01 * (n - 14)) ? 1 : 0) + (n >= 25 && r() < .3 ? 1 : 0); for (let j = 0; j < k; j++) list.splice(Math.floor(r() * (list.length + 1)), 0, 'bomber'); }
    if (n >= ENEMY.sbomber.from && w >= 4 && r() < Math.min(.45, .2 + .015 * (n - 20))) list.splice(Math.floor(r() * (list.length + 1)), 0, 'sbomber');
    let pB = w === 0 ? 0 : Math.min(.22, .05 + .015 * w + .004 * n), pC = n >= 6 && w >= nw - 3 ? Math.min(.12, .03 + .004 * n) : 0;
    /* ❄ зима (ур. 17+), волны 12+: Колоссов ×5 больше, почти все остальные — Раздутые ×2 */
    if (n >= 17 && w >= 11) { pC = Math.max(pC, .16 + .004 * (w - 11)); pB = .92 - pC * 1.8; }
    const pT = pC * .8; /* Титан ×7 — чуть реже Колосса ×5 */
    waves.push(list.map((k, i) => { const q = { type: k, pi: np > 1 ? Math.floor(i / 3) % 2 : 0 }; if (k !== 'boss' && !ENEMY[k].mini) { const x = r(); if (x < pT && !ENEMY[k].raid) q.mod = 't'; else if (x < pT + pC) q.mod = 'c'; else if (x < pT + pC + pB) q.mod = 'b'; } return q; }));
  }
  return waves;
}
let G = { running: false };
function makeMatch(n, deck, lvOf, vis, seed = n * 977 + 3, sdeck = SDEF) {
  sdeck = sdeck.filter(supById).slice(0, SDECK);
  const L = LVL(n), r = rng(n * 131 + 7);
  const paths = L.paths.map(w => buildPath(w)), air = L.paths.map(w => buildPath([w[0], w[w.length - 1]], true));
  const road = new Set(); paths.forEach(p => p.tiles.forEach(k => road.add(k)));
  const obs = new Map();
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const k = x + ',' + y; if (road.has(k)) continue;
    if (r() < (n === 1 ? .06 : .1)) obs.set(k, { x, y, kind: L.loc.obs[Math.floor(r() * L.loc.obs.length)] });
  }
  G = { n, L, paths, air, road, obs, deck: deck.slice(), lvOf, vis, waves: makeWaves(n, paths.length), wave: 0, spawnQ: [], spawnT: 0, nextT: null,
    enemies: [], towers: [], shots: [], fx: [], parts: [], decals: [], mines: [], bombs: [], amb: [], allies: [], cash: L.cash, lives: L.lives,
    kills: 0, airKills: 0, built: 0, leak: {}, t: 0, time: 0, speed: 1, sel: null, prev: null, arm: null, sdeck, sup: Object.fromEntries(sdeck.map(k => [k, { cd: 0, left: supById(k).uses || 0 }])), zones: [],
    over: false, paused: false, running: false, shake: 0, seed, tut: 0, rnd: rng(seed), tick: 0, log: [], used: {}, skin: {} };
  return G;
}

/* ---------- Механика ---------- */
function tstats(tw) {
  const s = calc(tw.t, tw.lv, tw.tier);
  return Object.assign(s, { air: s.det.a, ground: s.det.g, hid: s.det.h, pen: s.det.l });
}
const upPrice = (tw) => tierUp(tw.t, tw.tier + 1);
/* 💵 после 40% пройденных волн награда ×0.5, после 60% — ×0.25 (кроме босса) */
function rewK(d) { const p = Math.max(0, G.wave - 1) / G.waves.length; return d.boss ? 1 : p > .6 ? .25 : p > .4 ? .5 : 1; }
const towerAt = (x, y) => G.towers.find(t => t.x === x && t.y === y);
/* ✈ Налёт: самолёт летит слева направо над случайным танком и оглушает его на 3–8 с */
function spawn(type, pi, dist = 0, mod) {
  const d = ENEMY[type], M = MODS[mod];
  /* ✈ бомбардировщик: летит по прямой через ряд случайного танка, бомбит его и улетает за край */
  let tw = null, P = d.fly && !d.road ? G.air[pi] : G.paths[pi];
  if (d.raid) { tw = G.towers.length ? G.towers[Math.floor(G.rnd() * G.towers.length)] : null; const y = tw ? tw.y : ROWS / 2; P = buildPath([[-1.5, y], [COLS + 1.5, y]], true); }
  /* ❄ зима: босс ×2.5, мини-боссы с 16-й волны — с ХП босса */
  const base = G.n >= 17 && d.boss ? d.hp * 2.5 : G.n >= 17 && d.mini && G.wave >= 16 ? ENEMY.boss.hp * 2.5 : d.hp;
  const hp = Math.round(base * G.L.scale * (G.n <= 16 ? 1 : 1.3) * (1 + (G.n <= 16 ? .05 * Math.max(0, G.wave - 1) : .05 * Math.min(14, Math.max(0, G.wave - 1)) + .025 * Math.max(0, G.wave - 15))) * (d.boss ? .9 : 1) * (M ? M.hp : 1));
  const p = posAt(P, dist);
  G.enemies.push({ type, d, P, pi, hp, maxHp: hp, dist, mod: M ? mod : '', sc: M ? M.sc : 1, rew: Math.round(d.reward * (M ? M.hp : 1) * rewK(d) * 10) / 10, x: p.x, y: p.y, ang: p.ang, tur: p.ang, slowT: 0, slowK: 0, burnT: 0, burnD: 0, stunT: 0, shred: 0, shredT: 0, hitT: 0, tread: 0, healT: 1, sumT: 4 });
  if (d.raid) { const E = G.enemies[G.enemies.length - 1]; E.tw = tw; if (G.rnd() < .3) E.spk = 1.2 + G.rnd() * .2; } /* ✈ иногда самолёт быстрее */
}
function targets(tw, s) {
  const L = [];
  for (const e of G.enemies) {
    if (e.dead || e.y < -.4) continue;
    if (e.d.fly ? !s.air : !s.ground) continue;
    if (e.d.hid && !s.hid) continue;
    if (e.under) continue;
    const d = Math.hypot(e.x - tw.x, e.y - tw.y);
    if (d <= s.range * (G.bliz ? .75 : 1) + e.d.size * .3) { e._d = d; L.push(e); }
  }
  if (tw.mode === 'strong') L.sort((a, b) => b.hp - a.hp || b.dist / b.P.total - a.dist / a.P.total); else if (tw.mode === 'near') L.sort((a, b) => a._d - b._d); else L.sort((a, b) => b.dist / b.P.total - a.dist / a.P.total);
  if (tw.t.kind === 'aa') L.sort((a, b) => !!b.d.fly - !!a.d.fly); /* зенитка: сначала авиация */
  return L;
}
function hurt(e, dmg, o = {}) {
  if (e.dead || e.under) return;
  const blocked = e.d.arm && !o.pen && !(e.shredT > 0), v = blocked ? dmg * ARMK : dmg;
  e.hp -= e.shU > G.time ? v / 2 : v; if (!o.quiet) e.hitT = .08;
  if (o.slow && !e.d.noslow) { const k = e.d.boss || e.d.mini ? (o.slowB != null ? o.slowB : o.slow / 2) : o.slow; e.slowK = e.slowT > 0 ? Math.max(e.slowK, k) : k; e.slowT = 2; }
  if (o.stun) e.stunT = Math.max(e.stunT, e.d.boss ? o.stun / 3 : e.d.mini ? o.stun / 2 : o.stun);
  if (o.shred) e.shredT = o.shred;
  if (blocked && !o.quiet && G.vis && Math.random() < .15) G.fx.push({ k: 'txt', x: e.x, y: e.y - .55, txt: '🛡', t: 0, life: .6, col: '#c9d1d9' });
  if (o.show && G.vis) G.fx.push({ k: 'txt', x: e.x, y: e.y - .5, txt: (o.crit ? 'КРИТ! ' : '') + Math.round(v), t: 0, life: .9, col: o.crit ? '#ff5b4f' : '#fff' });
  if (e.hp <= 0) kill(e);
}
function kill(e) {
  e.dead = true; G.cash += e.rew; G.kills++; if (e.d.fly) G.airKills++;
  if (e.d.spawn) for (let i = 0; i < e.d.spawn; i++) spawn('light', e.pi, Math.max(0, e.dist - i * .35));
  if (!G.vis) return;
  const big = e.d.boss ? 2.2 : e.d.size * 1.6;
  G.fx.push({ k: 'boom', x: e.x, y: e.y - (e.d.fly ? .4 : 0), r: big * .6, t: 0, life: .5 });
  G.fx.push({ k: 'txt', x: e.x, y: e.y - .3, txt: '+' + e.rew + ' 💵', t: 0, life: .9, col: '#ffe36b' });
  for (let i = 0; i < (e.d.boss ? 24 : 9); i++) { const a = Math.random() * 7, v = 1 + Math.random() * 2.5; G.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: .6 + Math.random() * .4, r: .05 + Math.random() * .07, col: i % 3 ? '#4b443c' : '#ff9a3d' }); }
  if (!e.d.fly) G.decals.push({ x: e.x, y: e.y, r: e.d.size * .55, a: 1 });
  G.shake = Math.max(G.shake, e.d.boss ? 16 : e.d.size > .7 ? 5 : 0);
  haptic(e.d.boss ? 'heavy' : 'light');
}
function explode(x, y, r, dmg, o) {
  for (const e of G.enemies) if (!e.dead && (!!e.d.fly === !!o.fly) && Math.hypot(e.x - x, e.y - y) < r + e.d.size * .3) hurt(e, dmg, o);
  if (!G.vis) return;
  if (o.ice) { G.fx.push({ k: 'ring', x, y: y - (o.fly ? .4 : 0), r, t: 0, life: .35, col: '#9fe6ff' }); return; }
  G.fx.push({ k: 'boom', x, y: y - (o.fly ? .4 : 0), r, t: 0, life: .45 });
  for (let i = 0; i < 6; i++) { const a = Math.random() * 7; G.parts.push({ x, y, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - .5, t: 0, life: .8, r: .12, col: 'rgba(90,85,80,.5)', smoke: 1 }); }
  if (!o.fly) G.decals.push({ x, y, r: r * .6, a: .7 });
  G.shake = Math.max(G.shake, 4);
}
function muzzle(tw, len = .5) { return { x: tw.x + Math.cos(tw.ang) * len, y: tw.y + Math.sin(tw.ang) * len }; }
function fire(tw, s, L) {
  const t = tw.t, e = L[0], m = muzzle(tw, t.look.bl ? t.look.bl * .7 + .1 : .35);
  tw.rec = 1; tw.flash = .07; const n0 = G.shots.length, pen = s.pen ? 1 : 0;
  const shot = (o) => G.shots.push(Object.assign({ x: m.x, y: m.y, delay: 0 }, o));
  switch (t.kind) {
    case 'mg': shot({ k: 'bul', tgt: e, spd: 14, dmg: s.dmg, o: {}, r: .045, col: '#ffe36b' }); tw.rec = .4; break;
    case 'cannon': shot({ k: 'shell', tgt: e, spd: 11, dmg: s.dmg, o: {}, r: .08, col: '#ffb02e' }); if (s.perk) shot({ k: 'shell', tgt: e, spd: 11, dmg: s.dmg, o: {}, r: .08, col: '#ffb02e', delay: .15 }); break;
    case 'flame':
      tw.rec = .2; tw.flash = 0;
      for (const x of L) { hurt(x, s.dmg, { pen, quiet: 1 }); x.burnT = 2; x.burnD = Math.max(x.burnD, s.dmg * 2 * (s.perk ? 2 : 1)); }
      if (G.vis) for (let i = 0; i < 3; i++) { const a = tw.ang + (Math.random() - .5) * .5, v = 3 + Math.random() * 2; G.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: .3 + Math.random() * .15, r: .12, col: '#ff7a1a', flame: 1 }); }
      break;
    case 'sniper': { const crit = s.perk && G.rnd() < .25; hurt(e, s.dmg * (crit ? 2.5 : 1), { show: 1, crit, pen }); if (G.vis) G.fx.push({ k: 'line', x: m.x, y: m.y, x2: e.x, y2: e.y, t: 0, life: .18, col: '#fff6b0', w: .07 }); G.shake = Math.max(G.shake, 2); break; }
    case 'cryo': shot({ k: 'ice', tgt: e, spd: 9, dmg: s.dmg, splash: s.spl, o: { slow: s.slow, slowB: s.slowB, ice: 1 }, r: .09, col: '#9fe6ff' }); break;
    case 'aa': for (const off of [-.08, .08]) G.shots.push({ k: 'bul', x: m.x + off, y: m.y - off, tgt: e, spd: 16, dmg: e.d.fly || s.perk ? s.dmg : s.dmg / 2, o: {}, r: .05, col: '#ffe36b', delay: off > 0 ? .05 : 0 }); tw.rec = .5; break;
    case 'kv2': { const sp = e.d.speed * (e.spk || 1) * (e.slowT > 0 ? 1 - e.slowK : 1), p = posAt(e.P, e.dist + (e.stunT > 0 ? 0 : sp * 1.1)); G.shots.push({ k: 'lob', sx: m.x, sy: m.y, tx: p.x, ty: p.y, t: 0, dur: 1.1, dmg: s.dmg, splash: t.splash, o: { stun: s.perk ? .6 : 0, fly: 0 }, delay: 0 }); G.shake = Math.max(G.shake, 3); break; }
    case 'tesla': {
      const hit = [e]; let cur = e;
      for (let i = 1; i < (s.perk ? 5 : 3); i++) { let best = null, bd = 1.8; for (const x of G.enemies) { if (x.dead || hit.includes(x) || (x.d.hid && !s.hid)) continue; const d = Math.hypot(x.x - cur.x, x.y - cur.y); if (d < bd) { bd = d; best = x; } } if (!best) break; hit.push(best); cur = best; }
      const pts = [[tw.x, tw.y - .1]]; hit.forEach((x, i) => { pts.push([x.x, x.y - (x.d.fly ? .45 : 0)]); hurt(x, s.dmg * Math.pow(.8, i), { pen }); });
      if (G.vis) G.fx.push({ k: 'zap', pts, t: 0, life: .22 });
      break;
    }
    case 'rockets': { const k = s.perk ? 6 : t.salvo; for (let i = 0; i < k; i++) shot({ k: 'rocket', tgt: L[i % L.length], spd: 6.5, dmg: s.dmg, splash: t.splash, o: {}, r: .07, col: '#ddd', delay: i * .09, wob: G.rnd() * 6 }); break; }
    case 'mammoth': for (const [off, dl] of [[-.1, 0], [.1, .12]]) G.shots.push({ k: 'shell', x: m.x + off * Math.sin(tw.ang), y: m.y - off * Math.cos(tw.ang), tgt: e, spd: 12, dmg: s.dmg, o: { shred: s.perk ? 4 : 3 }, r: .09, col: '#ffb02e', delay: dl }); break;
    case 'drum': for (let i = 0; i < (s.perk ? 5 : 3); i++) { const off = (i % 3 - 1) * .11; G.shots.push({ k: 'shell', x: m.x + off * Math.sin(tw.ang), y: m.y - off * Math.cos(tw.ang), tgt: e, spd: 12, dmg: s.dmg, o: {}, r: .07, col: '#ffb02e', delay: i * .12 }); } break;
    case 'rail': {
      const a = Math.atan2(e.y - m.y, e.x - m.x), cx = Math.cos(a), cy = Math.sin(a), len = s.range + 1.5, hit = [];
      for (const x of G.enemies) {
        if (x.dead || x.y < -.4 || (x.d.fly ? !s.air : !s.ground) || (x.d.hid && !s.hid)) continue;
        const dx = x.x - m.x, dy = x.y - m.y, along = dx * cx + dy * cy;
        if (along > -.2 && along < len && Math.abs(dy * cx - dx * cy) < .3 + x.d.size * .3) hit.push([along, x]);
      }
      hit.sort((p, q) => p[0] - q[0]); hit.forEach(([, x], i) => hurt(x, s.dmg * (s.perk ? 1 : Math.pow(.85, i)), { pen, show: 1 }));
      if (G.vis) { const sc = tw.skin && tw.skin.sc, col = sc === 'rainbow' ? `hsl(${(G.t * 220) % 360},100%,62%)` : sc || '#4fe3ff'; G.fx.push({ k: 'line', x: m.x, y: m.y, x2: m.x + cx * len, y2: m.y + cy * len, t: 0, life: .28, col, w: .2 }, { k: 'line', x: m.x, y: m.y, x2: m.x + cx * len, y2: m.y + cy * len, t: 0, life: .2, col: '#fff', w: .06 }); }
      G.shake = Math.max(G.shake, 2); break;
    }
    case 'polar': for (const x of L) hurt(x, s.dmg, { pen, slow: s.slow, slowB: s.slowB, stun: s.perk ? .8 : 0 }); if (G.vis) G.fx.push({ k: 'ring', x: tw.x, y: tw.y, r: s.range, t: 0, life: .45, col: '#9fe6ff' }); break;
  }
  for (let i = n0; i < G.shots.length; i++) { const q = G.shots[i]; q.o.pen = pen; if (G.vis && tw.skin) { if (tw.skin.sc) q.col = tw.skin.sc === 'rainbow' ? `hsl(${(G.t * 220 + i * 40) % 360},100%,62%)` : tw.skin.sc; q.hc = tw.skin.hc; q.ke = tw.skin.ke; } }
  if (G.vis && typeof sfx === 'function') sfx('fire', t.kind);   // звук выстрела (только в клиенте)
}
/* Награда за волну: волна зачищена — следующая стартует сама через WAVE_GAP с и даёт waveRew(). Можно вызвать раньше — та же награда.5.
   Пока враги волны на поле, вызвать следующую нельзя (иначе можно проскипать все волны и забрать все деньги) */
const waveRew = () => 10 + 2 * G.wave;
const waveBusy = () => G.spawnQ.length > 0 || G.enemies.length > 0;
function callWave(manual) {
  if (G.over || G.wave >= G.waves.length) return;
  if (G.wave > 0) { const b = waveRew(); G.cash += b; if (G.vis) G.fx.push({ k: 'txt', x: COLS / 2, y: 1, txt: `Волна пройдена! +${b} 💵`, t: 0, life: 1.2, col: '#ffe36b', big: 1 }); if (G.vis && typeof sfx === 'function') sfx('coin'); }
  G.spawnQ.push(...G.waves[G.wave]); if (G.spawnT <= 0) G.spawnT = .2;
  G.wave++; G.nextT = null;
  for (const tw of G.towers) if (tw.t.kind === 'supply') { const g = Math.round(tw.t.give[tw.tier - 1] * (1 + .1 * (tw.lv - 1))); G.cash += g; if (G.vis) G.fx.push({ k: 'txt', x: tw.x, y: tw.y - .4, txt: `+${g} 💵`, t: 0, life: 1.1, col: '#ffe36b' }); }
  if (G.vis) { wavePreview(); tip(G.wave === G.waves.length ? (G.L.boss ? '💀 Последняя волна — БОСС!' : 'Последняя волна!') : `Волна ${G.wave}`, 1600); haptic('medium'); if (G.tut === 2) { G.tut = 3; setTimeout(() => G.running && tip('Танки стреляют сами. Тапни по танку, чтобы улучшить ★', 4500), 1700); } }
}
/* Ближайшая к точке позиция на дороге — чтобы авиаудар всегда ложился на дорогу, а не мимо */
function nearRoad(x, y) { let best = null; for (const P of G.paths) for (let d = 0; d <= P.total; d += .2) { const p = posAt(P, d), q = Math.hypot(p.x - x, p.y - y); if (!best || q < best.q) best = { P, d, q }; } return best; }
function strike(x, y) {
  const b = nearRoad(x, y);
  for (let i = 0; i < 5; i++) { const p = b ? posAt(b.P, Math.min(b.P.total, Math.max(0, b.d + (i - 2) * .6))) : { x: x + (i - 2) * .55, y }; G.bombs.push({ x: p.x, y: p.y, delay: .35 + i * .1, dmg: 50 * G.L.scale }); }
  if (G.vis) { G.fx.push({ k: 'plane', y: b ? posAt(b.P, b.d).y : y, t: 0, life: 1.1 }); haptic('heavy'); }
}
/* Ускоритель: луч не отрывается от цели, пока она жива и в радиусе; урон идёт каждый кадр (каждые 0.01с по описанию) */
function beamTick(tw, s, L, dt) {
  let e = tw.lk;
  if (!e || e.dead || !L.includes(e)) { e = tw.lk = L[0] || null; tw.heat = 0; }
  tw.beam = e; if (!e) return;
  tw.ang = lerpAng(tw.ang, Math.atan2(e.y - tw.y, e.x - tw.x), dt * 20);
  tw.heat = Math.min(3, (tw.heat || 0) + dt); tw.rec = .15;
  hurt(e, s.dmg * (dt / s.rate) * (s.perk ? 1 + tw.heat / 3 : 1), { pen: s.pen, quiet: 1 });
  if (e.dead) { if (G.vis && tw.skin && tw.skin.ke) G.fx.push({ k: 'txt', x: e.x, y: e.y - .7, txt: tw.skin.ke, t: 0, life: .8, col: '#fff', big: 1 }); tw.lk = tw.beam = null; }
}
/* Завод: свои танки едут от базы навстречу врагам, стреляют и таранят. ★3 — по 2 танка, ★4 — тяжёлые */
/* rg — радиус стрельбы, cd — перезарядка: маленькие стреляют слабо, большие — нормально */
const ALLY = [{ sz: .42, hp: 1, gun: .1, sp: 1.5, rg: 3, cd: .7, r: .05 }, { sz: .52, hp: 1.4, gun: .16, sp: 1.3, rg: 3.2, cd: .6, r: .065 }, { sz: .64, hp: 2, gun: .22, sp: 1.1, rg: 3.5, cd: .55, r: .085 }];
function makeAllies(tw, s) {
  const kind = tw.tier >= 4 ? 2 : tw.tier >= 3 ? 1 : 0, A = ALLY[kind];
  for (let i = 0; i < s.shots; i++) {
    tw.k = (tw.k || 0) + 1; const P = G.paths[tw.k % G.paths.length], p = posAt(P, P.total);
    G.allies.push({ tw, P, dist: P.total + i * .7, kind, hp: s.dmg * A.hp, maxHp: s.dmg * A.hp, gun: s.dmg * A.gun, sp: A.sp, sz: A.sz, cd: .4, x: p.x, y: p.y, ang: p.ang + Math.PI, tur: p.ang + Math.PI, tread: 0, pen: s.pen ? 1 : 0 });
  }
  if (G.vis) G.fx.push({ k: 'txt', x: tw.x, y: tw.y - .4, txt: '🏭', t: 0, life: .8, col: '#fff' });
}
function allyTick(dt) {
  for (const a of G.allies) {
    a.dist -= a.sp * dt; a.tread += a.sp * dt * 3;
    if (a.dist <= 0) { a.dead = 1; continue; }
    const p = posAt(a.P, Math.min(a.dist, a.P.total)); a.x = p.x; a.y = p.y; a.ang = lerpAng(a.ang, p.ang + Math.PI, dt * 8);
    let near = null, nd = ALLY[a.kind].rg;
    for (const e of G.enemies) {
      if (e.dead || e.d.fly || e.y < -.4) continue;
      const d = Math.hypot(e.x - a.x, e.y - a.y);
      if (d < e.d.size * .4 + a.sz * .4) {
        const eh = e.hp; hurt(e, a.hp, { pen: 1, show: 1 }); a.hp -= eh;
        if (G.vis) { G.fx.push({ k: 'boom', x: (a.x + e.x) / 2, y: (a.y + e.y) / 2, r: .45, t: 0, life: .35 }); G.shake = Math.max(G.shake, 3); }
        if (a.hp <= 0) { a.dead = 1; break; }
        continue;
      }
      if (!e.d.hid && d < nd) { nd = d; near = e; }
    }
    if (a.dead) continue;
    if (near) { a.tur = lerpAng(a.tur, Math.atan2(near.y - a.y, near.x - a.x), dt * 10); a.cd -= dt; if (a.cd <= 0) { a.cd = ALLY[a.kind].cd; G.shots.push({ k: 'bul', x: a.x, y: a.y, tgt: near, spd: 14, dmg: a.gun, o: { pen: a.pen }, r: ALLY[a.kind].r, col: '#7fd6ff', delay: 0 }); } }
    else a.tur = lerpAng(a.tur, a.ang, dt * 4);
  }
  G.allies = G.allies.filter(a => !a.dead);
}
/* лимит башен в бою: всего MAXTW и не больше lim одного вида; возвращает текст причины или '' */
function buildLimit(id) { const t = tankById(id), lim = t && t.tune && t.tune.lim; if (G.towers.length >= MAXTW) return `Максимум ${MAXTW} танков в бою`; if (lim && G.towers.filter(q => q.t.id === id).length >= lim) return `${t.name}: не больше ${lim} в бою`; return ''; }
function newTower(t, x, y, lv) { return { x, y, t, lv, tier: 1, cd: 0, ang: -Math.PI / 2, spent: t.cost, mode: t.mode || 'first', rec: 0, flash: 0 }; }

function update(dt) {
  G.t += dt;
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < f.life);
  for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; } G.parts = G.parts.filter(p => p.t < p.life);
  if (G.parts.length > 500) G.parts.splice(0, G.parts.length - 500);
  for (const d of G.decals) d.a -= dt * .06; G.decals = G.decals.filter(d => d.a > 0);
  G.shake = Math.max(0, G.shake - dt * 30);
  if (G.over) return;
  G.time += dt;
  for (const k in G.sup) if (G.sup[k].cd > 0) G.sup[k].cd -= dt;
  for (const z of G.zones) { z.t -= dt; for (const e of G.enemies) if (!e.dead && !e.d.noslow && Math.hypot(e.x - z.x, e.y - z.y) < z.r) { const k = e.d.boss ? .25 : .5; e.slowK = e.slowT > 0 ? Math.max(e.slowK, k) : k; e.slowT = Math.max(e.slowT, .25); } }
  G.zones = G.zones.filter(z => z.t > 0);
  if (G.spawnQ.length) { G.spawnT -= dt; if (G.spawnT <= 0) { const q = G.spawnQ.shift(); spawn(q.type, q.pi, 0, q.mod); G.spawnT = ENEMY[q.type].gap * (G.spawnQ[0] && G.spawnQ[0].type !== q.type ? 1.3 : 1) * (G.n >= 17 ? .7 : 1); } }
  else if (G.wave > 0 && G.wave < G.waves.length && !G.enemies.length) { if (G.nextT == null) G.nextT = WAVE_GAP; G.nextT -= dt; if (G.nextT <= 0) callWave(false); }
  else G.nextT = null;
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (e.hitT > 0) e.hitT -= dt;
    if (e.shredT > 0) e.shredT -= dt;
    if (e.burnT > 0) { e.burnT -= dt; hurt(e, e.burnD * dt, { pen: 1, quiet: 1 }); if (e.dead) continue; if (G.vis && Math.random() < dt * 10) G.parts.push({ x: e.x + (Math.random() - .5) * .3, y: e.y, vx: 0, vy: -1, t: 0, life: .4, r: .08, col: '#ff7a1a', flame: 1 }); }
    if (e.d.heal) { e.healT -= dt; if (e.healT <= 0) { e.healT = 1; for (const o of G.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 1.6 && o.hp < o.maxHp) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * .06); if (G.vis) G.fx.push({ k: 'ring', x: e.x, y: e.y, r: 1.6, t: 0, life: .5, col: '#6bff8a' }); } }
    if (e.d.boss) { e.sumT -= dt; if (e.sumT <= 0) { e.sumT = 6; spawn('light', e.pi, Math.max(0, e.dist - .4)); spawn('btr', e.pi, Math.max(0, e.dist - .8)); } }
    if (e.d.aura) for (const o of G.enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 1.7) o.shU = G.time + .3;
    if (e.d.dig) { e.digC = (e.digC == null ? 3 : e.digC) - dt; if (e.digC <= 0) { e.under = !e.under; e.digC = e.under ? 1.5 : 3.5; } }
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    if (e.d.frost) { e.frT = (e.frT == null ? 4 : e.frT) - dt; if (e.frT <= 0) { e.frT = 7; for (const tw of G.towers) if (Math.hypot(tw.x - e.x, tw.y - e.y) < 1.9) tw.frz = 2;
      if (G.vis) G.fx.push({ k: 'ring', x: e.x, y: e.y, r: 1.9, t: 0, life: .6, col: '#9fe6ff' }); } }
    if (e.slowT > 0) e.slowT -= dt;
    const sp = e.d.speed * (e.slowT > 0 ? 1 - e.slowK : 1);
    e.dist += sp * dt; e.tread += sp * dt * 3;
    const p = posAt(e.P, e.dist); e.x = p.x; e.y = p.y;
    e.ang = lerpAng(e.ang, p.ang, dt * 8); e.tur = lerpAng(e.tur, p.ang, dt * 4);
    if (e.d.raid) {
      if (e.tw && !e.hit && e.x >= e.tw.x) { e.hit = 1; const R = e.d.aoe, hit = R ? G.towers.filter(t => Math.hypot(t.x - e.tw.x, t.y - e.tw.y) <= R) : G.towers.includes(e.tw) ? [e.tw] : [];
        for (const t of hit) t.stn = Math.max(t.stn || 0, R ? 1 + G.rnd() * 3 : 3 + G.rnd() * 5);
        if (G.vis && (R || hit.length)) { G.fx.push({ k: 'boom', x: e.tw.x, y: e.tw.y, r: R || .7, t: 0, life: R ? .6 : .4 }); G.shake = Math.max(G.shake, R ? 9 : 5); if (hit.length) tip(R ? `✈ Тяжёлая бомба! Оглушено танков: ${hit.length}` : '✈ Бомба! Танк оглушён', 1500); } }
      if (e.dist >= e.P.total) e.dead = true; /* улетел за край — базу не бьёт */
      continue;
    }
    if (e.dist >= e.P.total) {
      /* Как в TDS: дошедший враг бьёт базу на весь свой оставшийся HP */
      const hit = Math.max(1, Math.ceil(e.hp / HPU)); e.dead = true; G.lives -= hit; G.leak[e.type] = (G.leak[e.type] || 0) + 1;
      if (G.vis) { G.shake = Math.min(14, 5 + hit / 4); G.fx.push({ k: 'txt', x: e.x, y: e.y - 1, txt: `−${hit} ❤️`, t: 0, life: 1, col: '#ff5b4f' }); hapticN('warning'); if (typeof sfx === 'function') sfx('base'); }
    }
  }
  for (const m of G.mines) for (const e of G.enemies) if (!e.dead && !e.d.fly && Math.hypot(e.x - m.x, e.y - m.y) < .45) { m.done = 1; explode(m.x, m.y, .9, m.dmg, { pen: 1 }); break; }
  G.mines = G.mines.filter(m => !m.done);
  for (const b of G.bombs) { b.delay -= dt; if (b.delay <= 0) { b.done = 1; explode(b.x, b.y, b.r || .85, b.dmg, { pen: 1 }); if (b.air) explode(b.x, b.y, b.r || .85, b.dmg, { pen: 1, fly: 1 }); } }
  G.bombs = G.bombs.filter(b => !b.done);
  /* ❄ Метель (ур. 25+): каждые 50 с на 8 с дальность танков −25% */
  if (G.L.bliz) { const b = G.wave > 0 && G.time % 50 > 42; if (b && !G.bliz && G.vis) tip('🌨 Метель! Дальность танков −25%', 1800); G.bliz = b; }
  for (const tw of G.towers) {
    tw.cd -= dt; tw.rec = Math.max(0, tw.rec - dt * 5); if (tw.flash > 0) tw.flash -= dt;
    if (tw.frz > 0) { tw.frz -= dt; continue; }
    if (tw.stn > 0) { tw.stn -= dt; continue; }
    if (tw.t.kind === 'supply') continue;
    if (tw.t.kind === 'spawner') { if (G.enemies.length && tw.cd <= 0 && G.allies.filter(a => a.tw === tw).length < 8) { const s = tstats(tw); tw.cd = s.rate; makeAllies(tw, s); } continue; }
    const s = tstats(tw), L = targets(tw, s);
    if (tw.t.kind === 'beam') { beamTick(tw, s, L, dt); continue; }
    if (!L.length) continue;
    tw.ang = lerpAng(tw.ang, Math.atan2(L[0].y - tw.y, L[0].x - tw.x), dt * (tw.t.kind === 'sniper' || tw.t.kind === 'kv2' ? 5 : 12));
    if (tw.cd <= 0) { tw.cd = s.rate; fire(tw, s, L); }
  }
  allyTick(dt);
  for (const sh of G.shots) {
    if (sh.delay > 0) { sh.delay -= dt; continue; }
    if (sh.k === 'lob') { sh.t += dt; if (sh.t >= sh.dur) { sh.done = 1; explode(sh.tx, sh.ty, sh.splash, sh.dmg, sh.o); } continue; }
    const e = sh.tgt;
    if (!e.dead) { sh.lx = e.x; sh.ly = e.y - (e.d.fly ? .45 : 0); }
    else if (sh.k !== 'rocket' || sh.lx == null) { sh.done = 1; continue; }
    const tx = sh.lx, ty = sh.ly, dx = tx - sh.x, dy = ty - sh.y, d = Math.hypot(dx, dy), st = sh.spd * dt;
    if (sh.k === 'rocket' && G.vis && Math.random() < .7) G.parts.push({ x: sh.x, y: sh.y, vx: 0, vy: 0, t: 0, life: .5, r: .07, col: 'rgba(220,220,220,.6)', smoke: 1 });
    if (d <= st + .1) {
      sh.done = 1;
      if (sh.splash) explode(e.x, e.y, sh.splash, sh.dmg, Object.assign({ fly: e.d.fly }, sh.o));
      else if (!e.dead) { hurt(e, sh.dmg, sh.o); if (G.vis) { G.fx.push({ k: 'hit', x: tx, y: ty, t: 0, life: .12, col: sh.hc === 'rainbow' ? `hsl(${(G.t * 300) % 360},100%,65%)` : sh.hc || (sh.k === 'ice' ? '#bff0ff' : '#fff3b0') }); if (e.dead && sh.ke) G.fx.push({ k: 'txt', x: e.x, y: e.y - .7, txt: sh.ke, t: 0, life: .8, col: '#fff', big: 1 }); } }
    } else {
      let a = Math.atan2(dy, dx); if (sh.k === 'rocket') a += Math.sin(G.t * 10 + sh.wob) * .25;
      sh.x += Math.cos(a) * st; sh.y += Math.sin(a) * st; sh.a = a;
    }
  }
  G.shots = G.shots.filter(s => !s.done);
  G.enemies = G.enemies.filter(e => !e.dead);
  if (G.lives <= 0) { G.lives = 0; endMatch(false); }
  else if (G.wave >= G.waves.length && !G.spawnQ.length && !G.enemies.length) endMatch(true);
}

/* ======================= Детерминированный шаг и действия игрока ======================= */
/* Бой идёт фиксированными шагами по 1/60 с. Каждое действие игрока пишется в G.log как [тик, код, ...аргументы].
   Сервер берёт этот лог, проигрывает бой заново тем же кодом и сам решает, кто победил. */
const DT = 1 / 60, MAX_TICKS = 60 * 60 * 60, MAX_LOG = 4000;
function step() { update(DT); G.tick++; }
const okXY = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < COLS && y < ROWS;
const freeTile = (x, y) => okXY(x, y) && !G.road.has(x + ',' + y) && !G.obs.has(x + ',' + y) && !towerAt(x, y);
const ACT = {
  b(id, x, y) { const t = tankById(id); if (!t || !G.deck.includes(id) || !G.lvOf[id] || !freeTile(x, y) || G.cash < t.cost || buildLimit(id)) return false; G.cash -= t.cost; G.towers.push(newTower(t, x, y, G.lvOf[id])); G.built++; G.used[id] = 1; return true; },
  u(x, y) { const tw = okXY(x, y) && towerAt(x, y); if (!tw || tw.tier >= MAXT) return false; const c = upPrice(tw); if (G.cash < c) return false; G.cash -= c; tw.spent += c; tw.tier++; return true; },
  s(x, y) { const tw = okXY(x, y) && towerAt(x, y); if (!tw) return false; G.cash += Math.floor(tw.spent * .6); G.towers = G.towers.filter(q => q !== tw); return true; },
  m(x, y, mode) { const tw = okXY(x, y) && towerAt(x, y); if (!tw || !MODES[mode] || tw.t.kind === 'supply') return false; tw.mode = mode; return true; },
  w() { if (G.wave >= G.waves.length || (G.wave > 0 && waveBusy())) return false; callWave(true); return true; },
  p(id, x, y) { return useSup(id, x, y); },
  k(x, y) { return useSup('strike', x, y); },   // старые логи
  n(x, y) { return useSup('mine', x, y); }
};
function useSup(id, x, y) {
  const d = supById(id), st = G.sup && Object.hasOwn(G.sup, id) && G.sup[id]; if (!d || !st || st.cd > 0 || (d.uses && st.left <= 0)) return false;
  if (d.tgt === 'pt' && !(typeof x === 'number' && typeof y === 'number' && x >= -1 && x <= COLS && y >= -1 && y <= ROWS)) return false;
  if (d.tgt === 'road' && !(okXY(x, y) && G.road.has(x + ',' + y))) return false;
  const sc = G.L.scale;
  if (id === 'strike') strike(x, y);
  else if (id === 'mine') G.mines.push({ x, y, dmg: 110 * sc });
  else if (id === 'smoke') G.zones.push({ x, y, r: 1.5, t: 6, life: 6 });
  else if (id === 'repair') { if (G.lives >= G.L.lives) return false; G.lives = Math.min(G.L.lives, G.lives + Math.ceil(G.L.lives * .2)); }
  else if (id === 'barrage') { for (let i = 0; i < 10; i++) { const a = G.rnd() * Math.PI * 2, r = Math.sqrt(G.rnd()) * 1.7; G.bombs.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, delay: .3 + i * .25, dmg: 45 * sc, r: .75 }); } }
  else if (id === 'emp') { for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < 2.2) e.stunT = Math.max(e.stunT, e.d.boss ? 1 : 3); if (G.vis) G.fx.push({ k: 'emp', x, y, r: 2.2, t: 0, life: .6 }); }
  else if (id === 'orbital') G.bombs.push({ x, y, delay: 1, dmg: 400 * sc, r: 1.6, air: 1, big: 1 });
  else if (id === 'freeze') { for (const e of G.enemies) if (!e.dead) e.stunT = Math.max(e.stunT, e.d.boss ? 2 : 5); G.frozeT = 5; }
  if (d.cd) st.cd = d.cd; if (d.uses) st.left--;
  G.arm = null; return true;
}
function act(a, ...args) {
  if (G.over || !Object.hasOwn(ACT, a) || G.log.length >= MAX_LOG) return false;
  if (a === 'k') args = args.map(v => Math.round(v * 100) / 100);
  if (a === 'p') args = args.map((v, i) => i && typeof v === 'number' ? Math.round(v * 100) / 100 : v);
  if (!ACT[a](...args)) return false;
  G.log.push([G.tick, a, ...args]); return true;
}
function endMatch(win) {
  if (G.over) return;
  G.over = true; G.arm = null;
  const stars = win ? (G.lives >= G.L.lives ? 3 : G.lives >= G.L.lives / 2 ? 2 : 1) : 0;
  G.result = { win, stars, kills: G.kills, built: G.built, air: G.airKills, wave: G.wave, lives: G.lives, tick: G.tick, used: Object.keys(G.used) };
  if (G.vis && typeof finish === 'function') finish(win);
}
/* Перепроверка боя: тот же уровень, отряд, сид — и лог действий. Любое невозможное действие = бой не засчитан */
function replayMatch(n, deck, lvOf, seed, log, sdeck) {
  if (!Array.isArray(log) || log.length > MAX_LOG) return { bad: 'log' };
  makeMatch(n, deck, lvOf, false, seed, Array.isArray(sdeck) ? sdeck : SDEF);
  let i = 0;
  while (!G.over && G.tick <= MAX_TICKS) {
    while (i < log.length && Array.isArray(log[i]) && log[i][0] === G.tick) {
      const e = log[i++]; if (typeof e[1] !== 'string') return { bad: 'entry', at: i - 1 };
      if (!act(e[1], ...e.slice(2))) return { bad: 'act', at: i - 1 };
    }
    if (i < log.length && !(Array.isArray(log[i]) && log[i][0] > G.tick)) return { bad: 'order', at: i };
    step();
  }
  if (!G.over) return { bad: 'unfinished' };
  if (i < log.length) return { bad: 'tail' };
  return G.result;
}
/* Награда за бой (меняет S). Одинаково считает и клиент офлайн, и сервер */
function matchRewards(n, res) {
  const L = LVL(n), first = !(S.stars[n] > 0); let silver, gold = 0, gems = 0;
  if (res.win) {
    silver = first ? levelSilver(n) : Math.round(levelSilver(n) * .4);
    if (res.stars === 3 && (S.stars[n] || 0) < 3) gold = L.boss ? 15 : 5;
    S.stars[n] = Math.max(S.stars[n] || 0, res.stars); qAdd('win', 1); if (res.stars === 3) qAdd('star3', 1);
    if (n === 1) S.tut = true;
    if (first && L.boss) gems = BOSS_GEMS;              // 💎 только за первую победу над каждым боссом
  } else silver = Math.round(res.kills * 1.5);
  qAdd('kill', res.kills); qAdd('build', res.built); qAdd('air', res.air);
  S.silver += silver; S.gold += gold; S.gems = (S.gems || 0) + gems;
  return { silver, gold, gems, stars: res.stars, first };
}

/* ======================= Экономика: действия в меню ======================= */
/* Каждое действие проверяет всё само. Офлайн его зовёт клиент, онлайн — только сервер (клиент лишь показывает ответ) */
const ADCD = 3 * 60000;
const ECON = {
  squad({ id }) {
    if (!S.owned[id]) return { err: 'Нет такого танка' };
    const i = S.deck.indexOf(id);
    if (i >= 0) { if (S.deck.length === 1) return { err: 'Нужен хотя бы 1 танк' }; S.deck.splice(i, 1); }
    else { if (S.deck.length >= DECK) return { err: `В отряде максимум ${DECK} танка — сначала убери один` }; S.deck.push(id); }
    return { ok: 1 };
  },
  supBuy({ id }) {
    const d = supById(id), p = d && d.price; if (!p) return { err: 'Это не купить' };
    if (sOwn()[id]) return { err: 'Уже есть' };
    if (p.silver && S.silver < p.silver) return { err: 'Не хватает серебра' }; if (p.gold && S.gold < p.gold) return { err: 'Не хватает золота' }; if (p.gems && (S.gems || 0) < p.gems) return { err: 'Не хватает гемов' };
    if (p.silver) S.silver -= p.silver; if (p.gold) S.gold -= p.gold; if (p.gems) S.gems -= p.gems;
    sOwn()[id] = 1; if (sDeck().length < SDECK) sDeck().push(id); return { ok: 1 };
  },
  supSet({ id }) {
    if (!sOwn()[id]) return { err: 'Сначала купи' };
    const L = sDeck(), i = L.indexOf(id);
    if (i >= 0) L.splice(i, 1); else { if (L.length >= SDECK) return { err: `В наборе максимум ${SDECK} — сначала убери один` }; L.push(id); }
    return { ok: 1 };
  },
  up({ id }) {
    const t = tankById(id), lv = S.owned[id]; if (!t || !lv) return { err: 'Нет такого танка' };
    const c = upCost(t, lv); if (lv >= MAXLV) return { err: 'Максимум' }; if (S.silver < c) return { err: 'Не хватает серебра' };
    S.silver -= c; S.owned[id] = lv + 1; qAdd('upg', 1); return { ok: 1, lv: lv + 1 };
  },
  buy({ id }) {
    const t = tankById(id), p = t && t.price;
    if (!p || t.limited || p.stars) return { err: 'Этот танк так не купить' };
    if (S.owned[id]) return { err: 'Уже есть' };
    if (p.silver && S.silver < p.silver) return { err: 'Не хватает серебра' }; if (p.gold && S.gold < p.gold) return { err: 'Не хватает золота' }; if (p.gems && (S.gems || 0) < p.gems) return { err: 'Не хватает гемов' };
    if (p.silver) S.silver -= p.silver; if (p.gold) S.gold -= p.gold; if (p.gems) S.gems -= p.gems;
    S.owned[id] = 1; if (S.deck.length < DECK) S.deck.push(id); return { ok: 1 };
  },
  box({ id }, rnd, lim) {   // lim — сервер уже выбил лимитку: она и есть приз, обычный не выдаём
    const b = BOXES.find(x => x.id === id); if (!b) return { err: 'Нет такого ящика' }; const p = b.price;
    if (p.gems) { if ((S.gems || 0) < p.gems) return { err: 'Не хватает гемов' }; S.gems -= p.gems; }
    if (p.free) { if (Date.now() - S.boxTs < BOXCD) return { err: 'Ещё рано' }; S.boxTs = Date.now(); }
    if (p.silver) { if (S.silver < p.silver) return { err: 'Не хватает серебра' }; S.silver -= p.silver; }
    if (p.gold) { if (S.gold < p.gold) return { err: 'Не хватает золота' }; S.gold -= p.gold; }
    if (lim) { qAdd('box', 1); return { ok: 1, res: { lim: 1 } }; }
    const r = rollBox(id, rnd); qAdd('box', 1);
    return { ok: 1, res: { tid: r.t && r.t.id, dup: r.dup, txt: r.txt } };
  },
  claim({ id }) {
    const q = quests().find(x => x.id === id), d = QPOOL.find(x => x.id === id);
    if (!q || q.c || q.p < d.g) return { err: 'Ещё не выполнено' }; q.c = true; give(d.r); return { ok: 1, r: d.r };
  },
  daily() {
    const st = dailyState(); if (!st.ready) return { err: 'Подарок уже получен — приходи завтра' };
    const r = dailyRew(st.next); give(r); S.daily = { day: dayKey(), streak: st.next }; return { ok: 1, r, streak: st.next };
  },
  fuelAd() { if (Date.now() - (S.adTs || 0) < ADCD) return { err: 'Реклама доступна раз в 3 минуты' }; tickFuel(); if (S.fuel >= MAXF) return { err: 'Бак и так полный' }; S.adTs = Date.now(); S.fuel = MAXF; return { ok: 1 }; },
  start({ n }) {
    if (!(n >= 1 && n <= LEVELS)) return { err: 'Новые уровни скоро!' };
    if (n > maxUnlocked()) return { err: 'Сначала пройди предыдущий уровень' };
    tickFuel(); if (S.fuel < FCOST) return { err: 'fuel' };
    S.fuel -= FCOST; return { ok: 1 };
  }
};

/* ======================= Лимитки (NFT): атрибуты ======================= */
/* Каждый атрибут выпадает с весом w; редкость = w / сумма весов. Атрибуты — только внешний вид, на силу не влияют */
const NFT = {
  fee: .05,
  attrs: {
    camo: { n: 'Камуфляж', v: [['Заводской', null, 300], ['Хаки', '#6f7f4a', 200], ['Пустыня', '#d6b36a', 150], ['Арктика', '#eef4f8', 110], ['Ночь', '#2f3550', 90],
      ['Кровь', '#a8323a', 60], ['Мята', '#5fd3b0', 45], ['Неон', '#ff4fd8', 25], ['Золото', '#f2c230', 12], ['Хром', '#bcd6ea', 3],
      /* узорные: [имя, основной цвет, вес, узор, цвет узора]; новые — только в конец (в базе хранится номер) */
      ['Лесной', '#5d7a3a', 140, 'blots', '#3b5226'], ['Городской', '#8b9096', 120, 'blots', '#5c6168'], ['Цифровой', '#6b7d52', 90, 'digital', '#46553a'], ['Осколки', '#9aa7b3', 70, 'splinter', '#5c6b78'],
      ['Тигр', '#f08a24', 55, 'tiger', '#2b2118'], ['Зебра', '#f4f1ea', 40, 'tiger', '#2b2118'], ['Карамель', '#ffffff', 30, 'candy', '#ff4f6a'], ['Пламя', '#2b2b33', 22, 'flame', '#ff7a1a'],
      ['Карбон', '#2c3036', 30, 'carbon', '#454b54'], ['Гекс-сетка', '#1f2b3a', 18, 'hex', '#4fe3ff'], ['Схема', '#1b2620', 14, 'circuit', '#6bff8a'], ['Лава', '#2a1a16', 10, 'lava', '#ff6a1a'],
      ['Галактика', '#2a1d4a', 6, 'galaxy', '#ffffff'], ['Голограмма', '#bfe8ff', 4, 'holo', '#ff9cf2']] },
    shot: { n: 'Выстрел', v: [['Обычный', null, 400], ['Синий трассер', '#5cc8ff', 220], ['Зелёный трассер', '#6bff8a', 160], ['Фиолетовая плазма', '#c26bff', 110],
      ['Розовый лазер', '#ff4fd8', 60], ['Золотой', '#ffd23f', 40], ['Тёмная материя', '#1b1030', 10],
      ['Ледяной луч', '#bff6ff', 50], ['Токсичный', '#b6ff3a', 45], ['Кровавый', '#ff2a3a', 35], ['Солнечный', '#ffb020', 30], ['Радужный', 'rainbow', 8]] },
    hit: { n: 'Попадание', v: [['Искры', null, 400], ['Синие искры', '#7fd6ff', 220], ['Ядовитые', '#9dff4f', 150], ['Огненные', '#ff6a1a', 120], ['Розовые', '#ff8ad8', 70], ['Белая вспышка', '#ffffff', 30], ['Радуга', '#c86bff', 10], ['Ледяные', '#cff4ff', 60], ['Кибер', '#4fe3ff', 35], ['Тьма', '#5a2a8a', 15], ['Переливы', 'rainbow', 6]] },
    kill: { n: 'Добивание', v: [['Нет', null, 420], ['💥', '💥', 200], ['💀', '💀', 140], ['⭐', '⭐', 110], ['🔥', '🔥', 70], ['👻', '👻', 40], ['🎆', '🎆', 15], ['💎', '💎', 5], ['⚡', '⚡', 60], ['🧊', '🧊', 45], ['🚀', '🚀', 20], ['👾', '👾', 12], ['🌈', '🌈', 6]] },
    /* Снаряжение — украшения на корпусе (рисует drawTank, o.gear) */
    gear: { n: 'Снаряжение', v: [['Нет', null, 360], ['Антенна', 'antenna', 200], ['Ящики', 'crates', 150], ['Запасные траки', 'tracks', 110], ['Маскировочная сеть', 'net', 80],
      ['Пулемёт', 'mg', 50], ['Прожекторы', 'lights', 30], ['Ракеты', 'rockets', 12]] }
  },
  /* Группы для фильтров рынка */
  groups: { camo: ['camo'], fx: ['shot', 'hit', 'kill'], gear: ['gear'] }
};
const nftPct = (k, i) => { const v = NFT.attrs[k].v, s = v.reduce((a, x) => a + x[2], 0); return Math.round(v[i || 0][2] / s * 1000) / 10; };
function nftRoll1(k, rnd) { const v = NFT.attrs[k].v; let x = rnd() * v.reduce((s, q) => s + q[2], 0), j = 0; for (; j < v.length - 1; j++) { x -= v[j][2]; if (x < 0) break; } return j; }
function nftRoll(rnd) { const a = {}; for (const k in NFT.attrs) a[k] = nftRoll1(k, rnd); return a; }
/* Скин для боя: цвет корпуса, цвет снаряда, цвет попадания, эмодзи добивания, эмблема, снаряжение, номер */
function nftSkin(attrs, serial) { if (!attrs) return null; const g = (k) => NFT.attrs[k].v[attrs[k] || 0] || []; return { h: g('camo')[1], pt: g('camo')[3], p2: g('camo')[4], sc: g('shot')[1], hc: g('hit')[1], ke: g('kill')[1], gr: g('gear')[1], n: serial }; }

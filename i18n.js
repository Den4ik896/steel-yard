/* Tank Defense — перевод игры.
   Игра написана на русском; всё, что появляется на экране, само переводится на язык игрока через словарь DICT.
   Язык: сначала выбор игрока (кнопка 🌐), потом язык Telegram, потом язык браузера. Нет словаря для языка — английский.
   Добавить язык: впиши его в LANGS и сделай DICT.<код> (ключ — русская фраза, значение — перевод). */
var LANGS = {
  en: 'English', ru: 'Русский', uk: 'Українська', es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch',
  tr: 'Türkçe', id: 'Bahasa Indonesia', ar: 'العربية', fa: 'فارسی', hi: 'हिन्दी'
};
var LANG = (function () {
  if (typeof window === 'undefined') return 'ru';
  try { const s = localStorage.getItem('sy_lang'); if (s && LANGS[s]) return s; } catch (e) { }
  const tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
  const c = String((tg && tg.language_code) || navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGS[c] ? c : 'en';
})();
var LOCALE = { en: 'en-US', ru: 'ru-RU', uk: 'uk-UA', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE', tr: 'tr-TR', id: 'id-ID', ar: 'ar-u-nu-latn', fa: 'fa-u-nu-latn', hi: 'hi-IN' }[LANG] || 'en-US';
function setLang(l) { try { localStorage.setItem('sy_lang', l); } catch (e) { } location.reload(); }

/* Фразы с числами внутри, где порядок слов в переводе другой */
var RX = {
  en: [
    [/Тираж (\d+) шт\., у каждой свой номер[\s\S]*?за TON\./, 'Supply: $1. Each one has its own serial number and random traits (camo, shot, hit, finisher, emblem). Traits are cosmetic only. Drops only in battle: bosses (lv. 8, 16, 24) and 3★ wins from level 5. Buy and sell on the Market for TON.'],
    [/Гарантия: каждый 10-й Золотой контейнер — Легенда \(осталось (\d+)\)/, 'Guarantee: every 10th Golden crate is a Legend ($1 left)'],
    [/^1 уровень = (\d+) ⛽\. Восстанавливается 1 ⛽ каждые 3 минуты \(макс\. (\d+)\)\.$/, '1 level = $1 ⛽. Refills 1 ⛽ every 3 minutes (max $2).'],
    [/В отряде максимум (\d+) танка — сначала убери один/, 'Your squad can hold $1 tanks — remove one first'],
    [/с (\d+)-го уровня/g, 'from level $1'],
    [/(\d+) золота/g, '$1 gold'],
    [/(\d) ?с(?![А-Яа-яЁё])/g, '$1s'],
    [/(\d) ?ч(?![А-Яа-яЁё])/g, '$1h'],
    [/(\d) ?мин(?![А-Яа-яЁё])/g, '$1 min'],
  ]
};

var DICT = {
  en: {
    /* целые предложения */
    'Не хватает TON на балансе': 'Not enough TON on your balance',
    'Неверный адрес TON': 'Invalid TON address',
    'Сколько TON (от 1)': 'Amount of TON (min 1)',
    'Адрес TON-кошелька': 'TON wallet address',
    'Мне есть 18 лет, либо вывод делает мой взрослый (родитель) на свой кошелёк': "I'm 18+, or my adult (parent) withdraws to their own wallet",
    'Бой сыгран подозрительно быстро — награда не начислена': 'The battle was played suspiciously fast — no reward given',
    'Сервер не смог подтвердить бой — награда не начислена': "The server couldn't verify the battle — no reward given",
    'Лимитки работают только в Telegram-версии с сервером игры.': 'Limited tanks only work in the Telegram version with the game server.',
    'Пока нет. Они падают с боссов (ур. 8, 16, 24) и за 3★.': 'None yet. They drop from bosses (lv. 8, 16, 24) and for 3★ wins.',
    '3. За уничтоженных врагов — 💵, на них ставь и улучшай танки до ★4.': '3. Destroyed enemies give 💵 — spend it to place tanks and upgrade them up to ★4.',
    '4. Смотри обнаружение: ✈ авиация летит напрямую, 👁 скрытых видят не все, по 🛡 броне без бронебойности урон всего 30%.': '4. Watch detection: ✈ aircraft fly straight, 👁 hidden enemies are not seen by everyone, 🛡 armor takes only 30% damage without armor piercing.',
    '5. Проиграл? Прокачай танки в гараже или купи новые за 🥈/🥇.': '5. Lost? Upgrade tanks in the garage or buy new ones for 🥈/🥇.',
    'Авиация пролетает напрямую к базе! Возьми танк с ✈: Шмель, Мороз, Вихрь, Тесла или Град.': 'Aircraft fly straight to the base! Take a tank with ✈: Bumblebee, Frost, Whirlwind, Tesla or Hail.',
    'Авиация летит по прямой от входа к базе — ставь танки с ✈ на этой линии. Зенитка Вихрь рвёт вертолёты.': 'Aircraft fly in a straight line from the entrance to the base — place ✈ tanks along that line. The Whirlwind AA gun shreds helicopters.',
    'Камуфляж 👁 скрытый — его видят только Сокол, Вихрь, Тесла и Шмель/Мороз/Град на ★3.': 'Camo 👁 is hidden — only Falcon, Whirlwind, Tesla and Bumblebee/Frost/Hail at ★3 can see it.',
    'Прорвалась 🛡 броня. Без бронебойности урон всего 30% — ставь Бобра, Сокола, Жара или улучши Шмеля до ★4.': '🛡 Armor broke through. Without armor piercing it takes only 30% damage — use Beaver, Falcon, Blaze or upgrade Bumblebee to ★4.',
    'Ремонтники чинят врагов — уничтожай их первыми (режим цели «Сильный»).': 'Mechanics repair enemies — kill them first (target mode "Strongest").',
    'Прокачай танки в гараже (+20% урона за уровень) или купи новые в магазине. И улучшай танки в бою до ★4!': 'Upgrade tanks in the garage (+20% damage per level) or buy new ones in the shop. And upgrade tanks in battle up to ★4!',
    '🛡 Tank Defense — танковая башенная защита.\nСтавь танки, отбивай волны, выбивай лимитки с боссов!': '🛡 Tank Defense — tank tower defense.\nPlace tanks, hold off the waves, win limited tanks from bosses!',
    'Проблема с оплатой? Опиши её ответным сообщением — разберёмся вручную. Возврат Stars делается через бота.': "Payment problem? Describe it in a reply and we'll sort it out manually. Stars refunds are made via the bot.",
    'Золото — игровая валюта, не выводится и не продаётся. Лимитки — игровые предметы, торговля ими в TON доступна с 18 лет.': 'Gold is an in-game currency: it cannot be withdrawn or sold. Limited tanks are in-game items; trading them for TON is 18+ only.',
    'Продать и купить можно на Рынке за': 'Buy and sell on the Market for',

    /* танки */
    'Шмель': 'Bumblebee', 'Бобр': 'Beaver', 'Жар': 'Blaze', 'Сокол': 'Falcon', 'Мороз': 'Frost', 'Вихрь': 'Whirlwind', 'Обоз': 'Convoy',
    'Кувалда': 'Sledgehammer', 'Тесла': 'Tesla', 'Град': 'Hail', 'Мамонт': 'Mammoth', 'Полярная ночь': 'Polar Night', 'Гром': 'Thunder',
    'Скорострел': 'Rapid-fire', 'Пушка': 'Cannon', 'Огнемёт': 'Flamethrower', 'Снайпер': 'Sniper', 'Криопушка': 'Cryo cannon', 'Зенитка': 'AA gun',
    'Снабжение': 'Supply', 'Гаубица': 'Howitzer', 'Молния': 'Lightning', 'Ракеты': 'Rockets', 'Сверхтяж': 'Super-heavy', 'Ледяной импульс': 'Ice pulse', 'Грозовая башня': 'Storm tower',
    'Сыпет пулями очередью и сбивает авиацию. Броню не пробивает, пока не станет': 'Sprays bullets in bursts and shoots down aircraft. Cannot pierce armor until',
    'Бронебойные пули: пробивает': 'Armor-piercing rounds: pierces',
    'Надёжная пушка с хорошим уроном. Пробивает броню.': 'A reliable cannon with good damage. Pierces armor.',
    'Двойной выстрел': 'Double shot',
    'Поливает огнём ВСЕХ врагов рядом и поджигает. Огонь прожигает любую броню.': 'Hoses ALL nearby enemies with fire and sets them ablaze. Fire burns through any armor.',
    'Напалм: горение': 'Napalm: burning',
    'Огромная дальность и видит скрытых. Стреляет редко, но очень больно — по самому крепкому.': 'Huge range and sees hidden enemies. Fires rarely but hits very hard — at the toughest target.',
    'Крит': 'Crit', 'КРИТ!': 'CRIT!',
    'Замораживает: враги и вертолёты едут на': 'Freezes: enemies and helicopters move', 'медленнее.': 'slower.',
    'Глубокая заморозка': 'Deep freeze',
    'Зенитка с радаром: рвёт авиацию и видит скрытых. По земле стреляет только на': 'AA gun with radar: shreds aircraft and sees hidden enemies. Fires at ground targets only at',
    'Стреляет и по земле': 'Also fires at ground',
    'Не стреляет. В начале каждой волны привозит': "Doesn't shoot. At the start of every wave it brings", 'на постройку.': 'for building.',
    'Тяжёлая гаубица: долго перезаряжается, но взрыв накрывает группу врагов.': 'Heavy howitzer: slow to reload, but the blast hits a whole group of enemies.',
    'Оглушение на': 'Stun for',
    'Молния прыгает по 3 врагам, видит всё и игнорирует броню.': 'Lightning jumps between 3 enemies, sees everything and ignores armor.',
    'Цепь из 5 целей': 'Chain of 5 targets',
    'Залп самонаводящихся ракет по нескольким целям, бьёт и авиацию. Броню не пробивает.': 'A salvo of homing rockets at several targets, hits aircraft too. Cannot pierce armor.',
    'ракет в залпе': 'rockets per salvo',
    'Двуствольный монстр. Каждое попадание срывает с врага броню — остальные танки бьют его в полную силу.': 'A twin-barrel monster. Every hit strips the enemy armor — then your other tanks hit it at full power.',
    'Бьёт и по авиации': 'Also hits aircraft',
    'Волна холода бьёт всех вокруг и замедляет на': 'A cold wave hits everyone around and slows them by',
    'Полная заморозка на': 'Full freeze for',
    'Лимитка: молния бьёт сильнее Теслы и дальше прыгает.': 'Limited: lightning hits harder than Tesla and jumps further.',
    /* враги */
    'Лёгкий танк': 'Light tank', 'Броневик': 'Armored car', 'Средний танк': 'Medium tank', 'Вертолёт': 'Helicopter', 'Ремонтник': 'Mechanic',
    'Камуфляж': 'Camo', 'Грузовик': 'Truck', 'Тяжёлый танк': 'Heavy tank', 'Бомбардировщик': 'Bomber', 'Колосс': 'Colossus',
    'Быстрый и хлипкий. Берёт числом.': 'Fast and flimsy. Wins by numbers.',
    'Покрепче лёгкого танка.': 'Tougher than a light tank.',
    'Броня: без бронебойности урон всего': 'Armor: without armor piercing damage is only',
    'Нужен Бобр, Сокол, Жар или Тесла.': 'You need Beaver, Falcon, Blaze or Tesla.',
    'Летит напрямую к базе! Сбивают только танки с': 'Flies straight to the base! Only tanks with this can shoot it down:',
    'Чинит врагов рядом. Убивай его первым.': 'Repairs nearby enemies. Kill it first.',
    'Скрытый: его видят только танки с': 'Hidden: only tanks with this can see it:',
    'Сокол, Вихрь, Тесла, Шмель': 'Falcon, Whirlwind, Tesla, Bumblebee',
    'При уничтожении высаживает 3 лёгких танка.': 'Drops off 3 light tanks when destroyed.',
    'Огромный и бронированный. Мамонт срывает броню — тогда его бьют все.': 'Huge and armored. Mammoth strips its armor — then everyone can hit it.',
    'Быстрый и крепкий самолёт.': 'A fast and tough plane.',
    'Гигантский танк-босс. Вызывает подкрепление.': 'A giant boss tank. Calls in reinforcements.',
    /* локации, редкость, режимы, обнаружение */
    'Зелёные луга': 'Green Meadows', 'Жаркая пустыня': 'Hot Desert', 'Ледяной перевал': 'Icy Pass',
    'Обычный': 'Common', 'Редкий': 'Rare', 'Эпический': 'Epic', 'Легендарный': 'Legendary', 'Лимитка': 'Limited', 'Лимитка.': 'Limited.',
    'Первый': 'First', 'Сильный': 'Strongest', 'Ближний': 'Closest',
    'Воздух': 'Air', 'Скрытые': 'Hidden', 'Броня': 'Armor', 'Земля': 'Ground',
    /* контейнеры, задания */
    'Деревянный': 'Wooden', 'Железный': 'Iron', 'Золотой': 'Golden', 'Звёздный': 'Star',
    'Редкий танк': 'Rare tank', 'Эпик танк': 'Epic tank', 'Легенда': 'Legend',
    'Победи на уровнях': 'Win levels', 'Уничтожь врагов': 'Destroy enemies', 'Поставь танков в боях': 'Place tanks in battles', 'Пройди уровень на': 'Clear a level with',
    'Сбей авиацию': 'Shoot down aircraft', 'Открой контейнер': 'Open a crate', 'Улучши танк в гараже': 'Upgrade a tank in the garage',
    'Бесплатно': 'Free', 'Сплеш': 'Splash', 'Все в радиусе': 'All in radius', 'Цепь': 'Chain', 'Круг': 'Area',
    /* атрибуты лимиток */
    'Выстрел': 'Shot', 'Попадание': 'Hit', 'Добивание': 'Finisher', 'Эмблема': 'Emblem',
    'Заводской': 'Factory', 'Хаки': 'Khaki', 'Пустыня': 'Desert', 'Арктика': 'Arctic', 'Ночь': 'Night', 'Кровь': 'Blood', 'Мята': 'Mint', 'Неон': 'Neon', 'Золото': 'Gold', 'Хром': 'Chrome',
    'Синий трассер': 'Blue tracer', 'Зелёный трассер': 'Green tracer', 'Фиолетовая плазма': 'Purple plasma', 'Розовый лазер': 'Pink laser', 'Тёмная материя': 'Dark matter',
    'Искры': 'Sparks', 'Синие искры': 'Blue sparks', 'Ядовитые': 'Toxic', 'Огненные': 'Fiery', 'Розовые': 'Pink', 'Белая вспышка': 'White flash', 'Радуга': 'Rainbow',
    'Нет': 'None', 'Звезда': 'Star', 'Медведь': 'Bear', 'Орёл': 'Eagle', 'Волк': 'Wolf', 'Дракон': 'Dragon', 'Единорог': 'Unicorn', 'Корона': 'Crown',
    /* интерфейс */
    'Магазин': 'Shop', 'Гараж': 'Garage', 'В бой': 'Battle', 'В БОЙ': 'BATTLE', 'В бой!': 'Battle!', 'Рынок': 'Market', 'Задания': 'Quests', 'Карта': 'Map',
    'Волна': 'Wave', 'волна': 'wave', 'волн': 'waves', 'Авиаудар': 'Airstrike', 'Мины': 'Mines', 'Пауза': 'Pause', 'Продолжить': 'Continue', 'Заново': 'Restart', 'Выйти на карту': 'Back to map',
    'Уровень': 'Level', 'уровень': 'level', 'ур.': 'lv.', 'Босс': 'Boss', 'Бесплатный ящик!': 'Free crate!', 'Скоро': 'Coming up', 'с уровня': 'from level',
    'урона': 'damage', 'урон': 'damage', 'Урон': 'Damage', 'Твой отряд': 'Your squad', 'танка в бой': 'tanks for battle', 'Отряд': 'Squad', 'Отряд в бой': 'Battle squad',
    'Пройди уровень': 'Clear level', 'Доход за волну': 'Income per wave', 'Перезарядка': 'Reload', 'Дальность': 'Range', 'Тип': 'Type', 'Одна цель': 'Single target', 'одна цель': 'single target', 'цель': 'target',
    'Нажми на танк, чтобы улучшить или взять в отряд': 'Tap a tank to upgrade it or add it to the squad',
    'МАКС': 'MAX', 'Макс': 'Max', 'Максимум': 'Maximum', 'Макс. уровень': 'Max level', 'Только из боя': 'Battle drops only',
    'Купить': 'Buy', 'Купить за': 'Buy for', 'Убрать из отряда': 'Remove from squad', 'В отряд': 'Add to squad',
    'в бою': 'in battle', 'В бою': 'In battle', 'Зелёным — что станет на ур.': 'Green shows what you get at lv.', 'урона)': 'damage)',
    'Улучшения в бою': 'In-battle upgrades', 'цены в': 'prices in', 'матча': 'of the match',
    'Контейнеры': 'Crates', 'Повторный танк превращается в': 'A duplicate tank turns into', 'Танки': 'Tanks', 'Есть': 'Owned', 'золота': 'gold',
    'Оплата в окне': 'Payment opens in', 'золото придёт сразу после платежа.': 'gold arrives right after payment.', 'Оплата работает только в': 'Payment only works in the', 'версии.': 'version.', 'версии': 'version',
    'Оплата': 'Payment', 'работает в': 'works in the', 'Работает в': 'Works in the',
    'Задания дня': 'Daily quests', 'Новые через': 'New in', 'награда': 'reward', 'Награда': 'Reward', 'Забрать': 'Claim', 'Как играть': 'How to play',
    'Тапни по клетке у дороги': 'Tap a tile next to the road', 'выбери танк из отряда.': 'pick a tank from your squad.', 'Нажми «В бой!» — враги поедут к базе.': 'Press "Battle!" — enemies will head to the base.',
    'За уничтоженных врагов': 'Destroyed enemies give', 'на них ставь и улучшай танки до': 'spend it to place and upgrade tanks up to', 'Смотри обнаружение': 'Watch detection',
    'авиация летит напрямую': 'aircraft fly straight', 'скрытых видят не все, по': 'hidden enemies are not seen by everyone,', 'броне без бронебойности урон всего': 'armor takes damage without armor piercing of only',
    'Проиграл? Прокачай танки в гараже или купи новые за': 'Lost? Upgrade tanks in the garage or buy new ones for',
    'Сбросить прогресс (для теста)': 'Reset progress (for testing)', 'Сбросить?': 'Reset?', 'Сбросить': 'Reset', 'Все танки, серебро и звёзды удалятся.': 'All tanks, silver and stars will be deleted.', 'Отмена': 'Cancel',
    'Тираж': 'Supply', 'Тираж закончился': 'Supply is sold out',
    'шт., у каждой свой номер и случайные атрибуты (камуфляж, выстрел, попадание, добивание, эмблема). Атрибуты — только внешний вид. Добывается только в бою: боссы (ур.': 'pcs. Each one has its own serial number and random traits (camo, shot, hit, finisher, emblem). Traits are cosmetic only. Drops only in battle: bosses (lv.',
    'го уровня. Продать и купить можно на Рынке за': 'th level. Buy and sell on the Market for',
    'Лимитки работают только в': 'Limited tanks only work in', 'версии с сервером игры.': 'version with the game server.', 'На рынке': 'On the market', 'тест': 'test', 'Тест': 'Test',
    'Этот экземпляр в бою': 'This one is in battle', 'Взять в бой': 'Use in battle', 'Аукцион': 'Auction', 'ставка': 'bid', 'старт': 'start', 'до конца': 'ends in', 'Выставлено за': 'Listed for', 'Снять': 'Unlist',
    'Продать можно через': 'Can be sold in', 'защита от перепродаж и мошенников)': 'protection against flipping and scams)', 'Цена': 'Price', 'ч': 'h', 'ч.': 'h.', 'Продать': 'Sell',
    'Комиссия рынка': 'Market fee', 'Для аукциона цена — стартовая ставка, срок — справа.': 'For an auction the price is the starting bid; duration is on the right.',
    'Предложения тебе': 'Offers to you', 'от': 'from', 'ещё': 'left:', 'Принять': 'Accept', 'Владелец': 'Owner', 'Ставка': 'Bid', 'Старт': 'Start',
    'Шаг': 'Step', 'Ставка в последние 2 минуты продлевает аукцион — снайпинг не работает.': 'A bid in the last 2 minutes extends the auction — sniping does not work.',
    'Твоя цена': 'Your price', 'Предложить': 'Make offer', 'замораживаются на': 'are frozen for', 'ч. Не примут — вернутся.': "h. If it's declined, they come back.",
    'Сделки': 'Sales', 'Побед с ним': 'Wins with it', 'Происхождение': 'Origin',
    'Рынок лимиток': 'Limited tank market', 'версии игры: там сервер проверяет каждую сделку. Здесь игра запущена без сервера.': 'version of the game: there the server checks every deal. Here the game runs without a server.',
    'Баланс': 'Balance', 'Кошелёк': 'Wallet', 'Все': 'All', 'Загрузка...': 'Loading...', 'Аукционы': 'Auctions', 'Продаются': 'For sale',
    'Пока никто не продаёт. Выбей лимитку в бою с боссом — и стань первым!': 'Nobody is selling yet. Win a limited tank from a boss — and be the first!',
    'Мои предложения': 'My offers', 'Отменить': 'Cancel', 'Мои лимитки': 'My limited tanks', 'Пока нет. Они падают с боссов (ур.': 'None yet. They drop from bosses (lv.', 'и за': 'and for',
    'Прототип: тестовая сеть': 'Prototype: testnet', 'Все сделки проверяет сервер, комиссия': 'Every deal is checked by the server, fee', 'После покупки танк можно перепродать через': 'After buying, a tank can be resold in',
    'ждёт': 'pending', 'выплачено': 'paid', 'Пополнить': 'Top up', 'Отправь': 'Send', 'на адрес': 'to the address', 'с комментарием': 'with the comment',
    'Без комментария сервер не поймёт, чьи это': "Without the comment the server won't know whose", 'Открыть': 'Open',
    'Пополнение пока не настроено на сервере (нет адреса кошелька игры).': "Top-ups aren't set up on the server yet (no game wallet address).", 'Вывести': 'Withdraw',
    'Сколько': 'Amount', 'Адрес': 'Address', 'кошелька': 'wallet', 'Мне есть': "I'm", 'лет, либо вывод делает мой взрослый (родитель) на свой кошелёк': 'or older, or my adult (parent) withdraws to their own wallet',
    'Золото зачислено!': 'Gold added!', 'Сначала пройди предыдущий уровень': 'Clear the previous level first', 'входа!': 'entrances!', 'НОВЫЙ': 'NEW',
    'авиацию': 'aircraft', 'скрытых': 'hidden', 'броню': 'armor', 'Твой отряд не берёт': "Your squad can't hit", 'Поменяй состав.': 'Change your lineup.',
    'первая победа)': 'first win)', 'за': 'for', 'впервые': 'first time', 'Открываем...': 'Opening...', 'Повтор': 'Duplicate', 'Новый танк!': 'New tank!',
    'Уже есть в гараже': 'Already in the garage', 'Круто!': 'Cool!', 'Сервер посчитал бой иначе — засчитан его результат.': "The server counted the battle differently — its result stands.",
    'ТРОФЕЙ!': 'TROPHY!', 'ПОБЕДА!': 'VICTORY!', 'Для': 'For', 'не пропусти ни одного врага': "don't let a single enemy through", 'Идеально — база цела!': 'Perfect — the base is intact!',
    'уничтожено': 'destroyed', 'Дальше': 'Next', 'База потеряна': 'Base lost', 'из': 'of', 'Ещё раз': 'Try again',
    'Тапни по подсвеченной клетке': 'Tap the highlighted tile', 'Осторожно: у врагов 2 входа!': 'Careful: enemies have 2 entrances!', 'Ставь танки у поворотов дороги': 'Place tanks near road turns',
    'Это последняя волна — держись!': 'This is the last wave — hold on!', 'Последняя волна': 'Last wave', 'Последняя волна!': 'Last wave!', 'Последняя волна — БОСС!': 'Last wave — BOSS!',
    'Рано!': 'Early!', 'Танки стреляют сами. Тапни по танку, чтобы улучшить': 'Tanks fire on their own. Tap a tank to upgrade it',
    'Перк': 'Perk', 'На': 'At', 'Нажми': 'Tap', 'ещё раз, чтобы продать': 'again to sell', 'Нажми ещё раз, чтобы поставить': 'Tap again to place', 'Выбери танк': 'Pick a tank',
    'Нажми на иконку, чтобы увидеть радиус и описание': 'Tap an icon to see its range and description', 'Не хватает': 'Not enough',
    'Отлично! Теперь жми «В бой!»': 'Great! Now press "Battle!"', 'Перк открыт': 'Perk unlocked', 'Новое': 'New',
    'Мину можно поставить только на дорогу': 'Mines can only go on the road', 'Это декорация — строить можно на свободной траве': "That's decoration — you can only build on free grass",
    'Сначала поставь танк на подсвеченную клетку': 'Place a tank on the highlighted tile first', 'Сначала поставь танк': 'Place a tank first',
    'Тапни, куда сбросить бомбы (только по земле)': 'Tap where to drop bombs (ground only)', 'Тапни по дороге, чтобы поставить мину': 'Tap the road to place a mine',
    'Топливо': 'Fuel', 'Восстанавливается': 'Refills', 'каждые 3 минуты (макс.': 'every 3 minutes (max', 'Полный бак': 'Full tank', 'Реклама': 'Ad', 'Реклама в прототипе — заглушка.': 'Ads are a placeholder in this prototype.',
    'Получено': 'Received', 'Бак полный!': 'Tank is full!', 'Уже в отряде — пробуй в бою!': 'Already in the squad — try it in battle!', 'Добавь его в отряд в гараже.': 'Add it to the squad in the garage.',
    'Этот экземпляр теперь в бою': 'This one now goes to battle', 'Укажи цену в': 'Enter a price in', 'Укажи цену': 'Enter a price', 'Укажи ставку': 'Enter a bid',
    'Аукцион запущен': 'Auction started', 'Выставлено на продажу': 'Listed for sale', 'Снято с продажи': 'Removed from sale', 'Покупка': 'Purchase', 'спишутся с баланса в игре.': 'will be taken from your in-game balance.',
    'Куплено! Танк уже в гараже': 'Bought! The tank is already in your garage', 'Ставка принята': 'Bid accepted', 'заморожены до конца аукциона': 'are frozen until the auction ends',
    'Предложение отправлено владельцу': 'Offer sent to the owner', 'Продано!': 'Sold!', 'Предложение отменено': 'Offer cancelled', 'вернулись': 'returned',
    'Заявка на вывод создана': 'Withdrawal request created', 'тестовых': 'test', 'Тестовая лимитка выдана': 'Test limited tank granted',
    'Нет связи с сервером': 'No connection to the server', 'Сервер недоступен': 'Server unavailable', 'Тестер': 'Tester', 'Игрок': 'Player', 'Казна игры': 'Game treasury',
    'Победи': 'Win', 'и': 'and', 'с': 'with', 'до': 'to', 'или через взрослого': 'or via an adult', 'Вывод — только для': 'Withdrawals are only for',
    /* ошибки (сервер и core) */
    'Нет такого танка': 'No such tank', 'за волну': 'per wave', 'Это твой танк': "That's your tank", 'Нужен хотя бы 1 танк': 'You need at least 1 tank', 'В отряде максимум': 'Squad maximum is', 'танка — сначала убери один': 'tanks — remove one first',
    'Не хватает серебра': 'Not enough silver', 'Не хватает золота': 'Not enough gold', 'Этот танк так не купить': "This tank can't be bought this way", 'Уже есть': 'Already owned',
    'Нет такого ящика': 'No such crate', 'Этот ящик пока недоступен': 'This crate is not available yet', 'Ещё рано': 'Too early', 'Ещё не выполнено': 'Not completed yet',
    'Реклама доступна раз в 3 минуты': 'Ads are available once every 3 minutes', 'Новые уровни скоро!': 'New levels coming soon!',
    'Нет такой лимитки': 'No such limited tank', 'Цена от': 'Price from', 'Нет такого действия': 'No such action', 'Плохой': 'Bad', 'Это не твой танк': "That's not your tank",
    'Билет на бой не найден': 'Battle ticket not found', 'Этот бой уже засчитан': 'This battle has already been counted', 'Нет такого танка ': 'No such tank',
    'Этот танк недавно куплен — продать можно позже': 'This tank was bought recently — you can sell it later', 'Уже выставлен': 'Already listed', 'Нет такого лота': 'No such listing',
    'На аукционе уже есть ставки — снять нельзя': 'The auction already has bids — it cannot be removed', 'Лот уже продан или снят': 'The listing is already sold or removed', 'Это твой лот': "That's your listing",
    'Лот недействителен': 'The listing is invalid', 'Аукцион закончился': 'The auction has ended', 'Нельзя ставить на свой лот': "You can't bid on your own listing", 'Минимальная ставка': 'Minimum bid',
    'Танк на аукционе — делай ставку': 'The tank is on auction — place a bid', 'Танк на аукционе': 'The tank is on auction', 'Предложение уже недействительно': 'The offer is no longer valid',
    'Нет такого предложения': 'No such offer', 'Минимум': 'Minimum', 'Неверный адрес': 'Invalid address', 'Уже есть заявка — дождись выплаты': 'You already have a request — wait for the payout',
    'Нет такого набора': 'No such pack', 'Бот не настроен': 'The bot is not set up', 'не создал счёт': "couldn't create the invoice", 'Только в': 'Only in',
    'Открой игру через': 'Open the game via', 'бота': 'bot', 'Слишком много запросов': 'Too many requests', 'Слишком большой запрос': 'Request too large', 'Нет такого метода': 'No such method',
    'на балансе': 'on balance', 'тестовая сеть': 'testnet', 'основная сеть': 'mainnet',
    /* бот */
    'Играть': 'Play', 'Золото для': 'Gold for', 'Спасибо! Зачислено': 'Thanks! Added', 'Заказ устарел, попробуй ещё раз': 'The order is outdated, please try again',
    'танковая башенная защита.': 'tank tower defense.', 'Ставь танки, отбивай волны, выбивай лимитки с боссов!': 'Place tanks, hold off the waves, win limited tanks from bosses!',
    'делается через бота.': 'are made via the bot.', 'доступна с': 'is available from', 'лет.': 'years old.',
    /* обрывки длинных подсказок (на случай другой сборки фразы) */
    'Авиация пролетает напрямую к базе! Возьми танк с': 'Aircraft fly straight to the base! Take a tank with', 'Шмель, Мороз, Вихрь, Тесла или Град.': 'Bumblebee, Frost, Whirlwind, Tesla or Hail.',
    'Авиация летит по прямой от входа к базе — ставь танки с': 'Aircraft fly in a straight line from the entrance to the base — place tanks with', 'на этой линии. Зенитка Вихрь рвёт вертолёты.': 'along that line. The Whirlwind AA gun shreds helicopters.',
    'скрытый — его видят только Сокол, Вихрь, Тесла и Шмель': 'is hidden — only Falcon, Whirlwind, Tesla and Bumblebee', 'Град на': 'Hail at', 'Прорвалась': 'Broke through:',
    'броня. Без бронебойности урон всего': 'armor. Without armor piercing damage is only', 'ставь Бобра, Сокола, Жара или улучши Шмеля до': 'use Beaver, Falcon, Blaze or upgrade Bumblebee to',
    'Прокачай танки в гараже': 'Upgrade tanks in the garage', 'урона за уровень) или купи новые в магазине. И улучшай танки в бою до': 'damage per level) or buy new ones in the shop. And upgrade tanks in battle up to',
    'Гарантия: каждый': 'Guarantee: every', 'й Золотой контейнер — Легенда (осталось': 'th Golden crate is a Legend (left:', 'Новый': 'New',
    'Дешевле': 'Cheapest', 'Дороже': 'Most expensive', 'Свежие': 'Newest', 'Редкие': 'Rarest', 'Эффекты': 'Effects', 'Готово': 'Done',
    'Ничего не найдено — сбрось фильтры': 'Nothing found — reset the filters',
    'Летит над дорогой. Сбивают только танки с': 'Flies above the road. Only tanks with this can shoot it down:', 'Быстрый и крепкий самолёт — летит напрямую к базе!': 'A fast and tough plane — flies straight to the base!', 'Штурмовой танк': 'Assault tank', 'Ночной вертолёт': 'Night helicopter', 'Быстрый бронированный танк. Опасен, если прорвётся.': 'A fast armored tank. Dangerous if it breaks through.', 'Скрытый вертолёт над дорогой. Нужны танки, которые видят и бьют авиацию.': 'A hidden helicopter above the road. You need tanks that both see and hit aircraft.',
    'Снаряжение': 'Equipment', 'Антенна': 'Antenna', 'Ящики': 'Crates', 'Запасные траки': 'Spare tracks', 'Маскировочная сеть': 'Camo net', 'Пулемёт': 'Machine gun', 'Прожекторы': 'Searchlights',
  }
};

/* Другие языки (lang/xx.js): ключ — английская фраза, числа в ней заменены на {0}, {1}… */
var _trRe = {}, _trCache = {}, _trOut = {};
function _nums(s) { const n = []; return [s.replace(/\d+(?:\.\d+)?/g, (m) => '{' + (n.push(m) - 1) + '}'), n]; }
function _fill(t, n) { return t.replace(/\{(\d+)\}/g, (m, i) => n[i] !== undefined ? n[i] : m); }
function tr(s, lang = LANG) {
  if (lang === 'ru' || typeof s !== 'string' || !/[А-Яа-яЁё]/.test(s)) return s;
  const D = DICT[lang]; if (!D) return lang === 'en' ? s : tr(s, 'en');
  const O = _trOut[lang] || (_trOut[lang] = new Set()); if (O.has(s)) return s; // уже переведено (украинский тоже кириллица)
  const C = _trCache[lang] || (_trCache[lang] = new Map()), hit = C.get(s);
  if (hit !== undefined) return hit;
  const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
  let r = s.trim();
  if (lang !== 'en') {
    const e = tr(r, 'en'), [k, n] = _nums(e);
    if (Object.hasOwn(D, k)) r = _fill(D[k], n);
    else {
      const re = _trRe[lang] || (_trRe[lang] = new RegExp('(?<![A-Za-z])(?:' + Object.keys(D).sort((a, b) => b.length - a.length)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\d+\\\}/g, '\\d+(?:\\.\\d+)?')).join('|') + ')(?![A-Za-z])', 'g'));
      r = e.replace(re, (m) => { const [k2, n2] = _nums(m); return Object.hasOwn(D, k2) ? _fill(D[k2], n2) : m; });
    }
  } else if (Object.hasOwn(D, r)) r = D[r];
  else {
    for (const [a, b] of RX[lang] || []) r = r.replace(a, b);
    if (Object.hasOwn(D, r)) r = D[r];
    else if (/[А-Яа-яЁё]/.test(r)) {
      const re = _trRe[lang] || (_trRe[lang] = new RegExp('(?<![А-Яа-яЁё])(?:' + Object.keys(D).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![А-Яа-яЁё])', 'g'));
      r = r.replace(re, m => D[m]);
    }
  }
  r = lead + r + tail;
  if (C.size > 4000) C.clear();
  C.set(s, r);
  if (lang !== 'en' && /[А-Яа-яЁё]/.test(r)) { if (O.size > 4000) O.clear(); O.add(r); O.add(r.trim()); }
  return r;
}

/* В браузере: переводим всё, что появляется на странице (текст, placeholder, title). Элементы с data-notr не трогаем */
if (typeof document !== 'undefined') {
  document.documentElement.lang = LANG;
  if (LANG !== 'ru' && LANG !== 'en') document.write('<script src="lang/' + LANG + '.js?v=3"><\/script>');
  /* Тот же проход меняет эмодзи валют и значков (🥈 🥇 ⛽ ⭐ 💎 🔒 🎁 🎟) на нарисованные иконки (<i class="ing …">) — для всех языков, включая русский */
  {
    const CYR = /[А-Яа-яЁё]/, ING = /\u{1F948}|\u{1F947}|\u26FD|\u2B50|\u{1F48E}|\u{1F512}|\u{1F381}|\u{1F39F}/u, ICO = { '🥈': 's', '🥇': 'g', '⛽': 'f', '⭐': 'st', '💎': 'gem', '🔒': 'lk', '🎁': 'gift', '🎟': 'tk' }, SKIP = 'script,style,[data-notr]', DONE = new WeakMap();
    const attrs = (el) => { for (const a of ['placeholder', 'title']) { const v = el.getAttribute(a); if (v && CYR.test(v)) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } } };
    const txt = (x) => {
      let v = x.nodeValue; if (DONE.get(x) === v) return;
      if (CYR.test(v)) { const t = tr(v); if (t !== v) x.nodeValue = v = t; } // пишем только если изменилось, иначе observer зациклится
      if (!ING.test(v) || !x.parentNode || x.parentElement.closest('option,textarea,title')) return;
      const f = document.createDocumentFragment();
      for (const p of v.split(/(\u{1F948}|\u{1F947}|\u26FD|\u2B50|\u{1F48E}|\u{1F512}|\u{1F381}|\u{1F39F})\uFE0F?/u)) {
        if (!p) continue;
        if (ING.test(p)) { const i = document.createElement('i'); i.className = 'ing ' + ICO[p]; f.appendChild(i); }
        else { const t = document.createTextNode(p); DONE.set(t, p); f.appendChild(t); }
      }
      x.parentNode.replaceChild(f, x);
    };
    const walk = (n) => {
      if (n.nodeType === 3) { if (!(n.parentElement && n.parentElement.closest(SKIP))) txt(n); return; }
      if (n.nodeType !== 1 || n.closest(SKIP)) return;
      attrs(n);
      const w = document.createTreeWalker(n, 5, { acceptNode: (x) => x.nodeType === 1 && x.matches(SKIP) ? 2 : 1 }), L = [];
      for (let x = w.nextNode(); x; x = w.nextNode()) { if (x.nodeType === 3) L.push(x); else attrs(x); }
      L.forEach(txt);
    };
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') walk(m.target); else if (m.type === 'attributes') attrs(m.target); else m.addedNodes.forEach(walk); } })
      .observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] });
    document.addEventListener('DOMContentLoaded', () => walk(document.body));
  }
}
/* Подарки дня, топливо, лимитки за звёзды, новые камуфляжи и эффекты */
Object.assign(DICT.en, {"Подарок дня ждёт!":"Daily gift is waiting!","Подарок дня получен":"Daily gift claimed","Серия заходов:":"Login streak:","Серия:":"Streak:","дн.":"d.","каждые":"every","дней":"days","бонус":"bonus","через":"in","Подарки":"Gifts","День":"Day","Заходи каждый день — пропуск обнуляет серию.":"Come back every day — missing a day resets the streak.","Приходи завтра":"Come back tomorrow","1 бой = 1 ⛽. Восстанавливается 1 ⛽ каждые 5 минут до 10. Купленное и подаренное топливо не ограничено.":"1 battle = 1 ⛽. Restores 1 ⛽ every 5 minutes up to 10. Bought and gifted fuel has no limit.","после ур.":"after lv.","Как получить: босс или сундук — шанс 0,1%, покупка за звёзды Telegram или Рынок за TON.":"How to get: boss or chest — 0.1% chance, buy with Telegram Stars or on the Market for TON.","ЛИМИТКА!":"LIMITED!","Покупка зачислена!":"Purchase credited!","Подарок уже получен — приходи завтра":"Gift already claimed — come back tomorrow","Тираж закончился — звёзды вернули":"Supply sold out — your Stars were refunded","топлива":"fuel","Лесной":"Woodland","Городской":"Urban","Цифровой":"Digital","Осколки":"Splinter","Тигр":"Tiger","Зебра":"Zebra","Карамель":"Candy","Пламя":"Flames","Карбон":"Carbon","Гекс-сетка":"Hex grid","Схема":"Circuit","Лава":"Lava","Галактика":"Galaxy","Голограмма":"Hologram","Ледяной луч":"Ice beam","Токсичный":"Toxic","Кровавый":"Crimson","Солнечный":"Solar","Радужный":"Rainbow","Ледяные":"Icy","Кибер":"Cyber","Тьма":"Darkness","Переливы":"Iridescent"});
/* 4 новые лимитки и промокод */
Object.assign(DICT.en, {"Барабан":"Drum","Рельса":"Railgun","Завод":"Factory","Ускоритель":"Accelerator","Барабанная пушка":"Drum cannon","Рельсотрон":"Rail cannon","Танковый завод":"Tank factory","Лучевая пушка":"Beam cannon","Три ствола: выпускает 3 снаряда подряд, потом перезаряжает барабан.":"Three barrels: fires 3 shells in a row, then reloads the drum.","Разгоняет снаряд магнитами и прошивает насквозь всех врагов на линии.":"Launches a magnet-driven slug that pierces every enemy in a line.","Выпускает свои танки: они едут по дороге навстречу врагам, стреляют и таранят их. С ★ танки сильнее и их больше.":"Builds allied tanks that drive down the road toward enemies, shooting and ramming them. With ★ they get stronger and more numerous.","Непрерывный луч бьёт каждые 0.01с. Держит цель, пока она жива, и сразу переключается на следующую.":"A continuous beam hits every 0.01s. It holds the target until it dies, then instantly switches to the next.","Барабан на 5 снарядов":"Drum holds 5 shells","Без потери урона на каждой цели":"No damage loss per target","Тяжёлые танки по 2 за раз":"Heavy tanks, 2 at a time","Перегрев: урон по одной цели растёт до ×2":"Overheat: damage on one target grows up to ×2","Насквозь":"Pierces","Свои танки":"Allied tanks","Промокод":"Promo code","Введи промокод":"Enter promo code","Активировать":"Activate","Неверный промокод":"Invalid promo code","Промокод уже использован":"Promo code already used","Промокод закончился":"Promo code has run out","Как получить: босс или сундук — шанс 0,1–5%, покупка за звёзды Telegram или Рынок за TON.":"How to get: boss or chest — 0.1–5% chance, buy with Telegram Stars or on the Market for TON."});

Object.assign(DICT.en, {"Сначала купи контейнер за ⭐":"Buy the crate for ⭐ first","Контейнер «Звёздный»":"Crate «Star»"});

Object.assign(DICT.en, {"Бак и так полный":"Your tank is already full"});

Object.assign(DICT.en, {"Космический":"Cosmic","Не хватает гемов":"Not enough gems","гемов":"gems","Гемы":"Gems","тестовых гемов":"test gems","Гемы нужны для Космического контейнера, лимиток и рынка.":"Gems are spent on the Cosmic crate, limited tanks and the market.","Бесплатно: 10 гемов каждый 10-й день входа и 20 — за первую победу над каждым боссом.":"Free: 10 gems every 10th login day and 20 for the first win over each boss.","покупка придёт сразу после платежа.":"your purchase arrives right after payment.","Как получить: босс или сундук — шанс 0,1–5%, покупка за гемы или на Рынке.":"How to get: boss or chest — 0.1–5% chance, buy for gems or on the Market.","Ставка принята — гемы заморожены до конца аукциона":"Bid accepted — gems are frozen until the auction ends","Предложение отменено, гемы вернулись":"Offer cancelled, gems returned","Цена — целое число гемов от 1 до 1000000":"Price must be a whole number of gems from 1 to 1000000","Цена в гемах":"Price in gems","Твоя цена в гемах":"Your price in gems"});
Object.assign(DICT.en, {"Гемы замораживаются на 48 ч. Не примут — вернутся.":"Gems are frozen for 48 h. If declined, they come back.","Золото и гемы — игровые валюты, их нельзя вывести или обменять на деньги. Лимитки — игровые предметы.":"Gold and gems are in-game currencies; they can't be withdrawn or exchanged for money. Limited tanks are in-game items."});

Object.assign(DICT.en, {"У каждой свой номер и случайные атрибуты: камуфляж, эффекты, снаряжение. Атрибуты — только внешний вид.":"Each one has its own serial and random attributes: camo, effects, equipment. Attributes are cosmetic only."});

Object.assign(DICT.en, {"Вложено:":"Spent:","Выпускает:":"Produces:"});

Object.assign(DICT.en, {"Поддержка":"Support","Поддержка в бою":"Battle support","В бою кнопка 🎒 внизу меняет танки на эти предметы":"In battle, the 🎒 button at the bottom swaps tanks for these items","раз за бой":"per battle","за бой":"per battle","В наборе":"In set","Взять":"Equip","перезарядка":"cooldown","Убрать из набора":"Remove from set","В набор":"Add to set","Выбери танк внизу, потом тапни по подсвеченной клетке 👇":"Pick a tank below, then tap the highlighted tile 👇","ХП":"HP","Тапни по дороге":"Tap the road","Тапни по карте":"Tap the map","Тапни по свободной клетке, чтобы поставить":"Tap a free tile to place it","Только на дорогу":"Road only","Поставь на подсвеченную клетку":"Place it on the highlighted tile","Сначала выбери танк внизу 👇":"Pick a tank below first 👇","Выбери танк внизу 👇":"Pick a tank below 👇","База и так целая":"The base is already at full health","Тапни, куда ударить":"Tap where to strike","куплено!":"purchased!","Дымовая завеса":"Smoke screen","Ремкомплект":"Repair kit","Артобстрел":"Artillery barrage","ЭМИ":"EMP","Орбитальный удар":"Orbital strike","Стоп-время":"Time stop","Раздутый":"Bloated","Колосс":"Colossus","Самолёт сбрасывает 5 бомб вдоль ближайшей к точке дороги. Бьёт только наземных.":"A plane drops 5 bombs along the road nearest to the point. Hits ground units only.","Ставится на дорогу и взрывается под первым наземным врагом. 3 штуки за бой.":"Placed on the road, explodes under the first ground enemy. 3 per battle.","Облако на 6 с: все враги внутри — и наземные, и воздушные — едут вдвое медленнее.":"A cloud for 6s: all enemies inside — ground and air — move at half speed.","Облако на 6s: все враги внутри — и наземные, и воздушные — едут вдвое медленнее.":"A cloud for 6s: all enemies inside — ground and air — move at half speed.","Сразу чинит базу на 20% 🏰. Один раз за бой.":"Instantly repairs the base by 20% 🏰. Once per battle.","10 снарядов за 2,5 с по кругу вокруг точки. Бьёт только наземных.":"10 shells over 2.5s in a circle around the point. Hits ground units only.","10 снарядов за 2,5s по кругу вокруг точки. Бьёт только наземных.":"10 shells over 2.5s in a circle around the point. Hits ground units only.","Оглушает всех врагов в большом круге на 3 с — и наземных, и воздушных. Босса — на 1 с.":"Stuns all enemies in a large circle for 3s — ground and air. The boss for 1s.","Оглушает всех врагов в большом круге на 3s — и наземных, и воздушных. Босса — на 1s.":"Stuns all enemies in a large circle for 3s — ground and air. The boss for 1s.","Через 1 с — огромный взрыв по земле и воздуху. 2 раза за бой.":"After 1s — a huge explosion hitting ground and air. 2 per battle.","Через 1s — огромный взрыв по земле и воздуху. 2 раза за бой.":"After 1s — a huge explosion hitting ground and air. 2 per battle.","Все враги на карте замирают на 5 с. Босс — на 2 с. Один раз за бой.":"All enemies on the map freeze for 5s. The boss for 2s. Once per battle.","Все враги на карте замирают на 5s. Босс — на 2s. Один раз за бой.":"All enemies on the map freeze for 5s. The boss for 2s. Once per battle.","Это не купить":"This can't be bought","Сначала купи":"Buy it first","В наборе максимум 4 — сначала убери один":"The set holds at most 4 — remove one first","минут":"minutes","Купленное и подаренное топливо не ограничено.":"Bought and gifted fuel is not limited.","Скрытый вертолёт: нужны ✈ и 👁 сразу.":"Hidden helicopter: needs ✈ and 👁 at once.","бой":"battle"});

Object.assign(DICT.en, {"Мифический":"Mythic","Мифический танк":"Mythic tank","Молния бьёт сильнее Теслы и дальше прыгает.":"Lightning hits harder than Tesla and jumps further.","Скоро откроется!":"Coming Soon!"});

Object.assign(DICT.en, {"Волна пройдена!":"Wave cleared!"});

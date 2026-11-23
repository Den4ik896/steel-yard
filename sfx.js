/* Звуки игры (WebAudio). Файлы — snd/. Вкл/выкл хранится в localStorage 'snd'.
   sfx(k, o) — сыграть звук k. o: {rate, vol, soft}. soft — не играть, если только что прозвучал другой звук
   (так клик кнопки не накладывается на «открыть окно», «покупку» и т.п.).
   core.js зовёт sfx('fire', kind) / sfx('base') / sfx('coin') только при G.vis — на игру звук не влияет. */
const SFX = (() => {
  const V = '?v=1';
  /* ключ: [файлы (случайный), громкость, мин. интервал с, разброс тона] */
  const L = {
    click: [['click'], 1.8, .05], close: [['close'], 1.3, .05], open: [['open'], .9, .08], place: [['open'], 1, .05],
    buy: [['buy'], .55, .1], nomoney: [['nomoney'], .8, .15], busy: [['busy'], .6, .15],
    sell: [['sell1', 'sell2'], .8, .2], coin: [['coin1', 'coin2'], 1, .1],
    latch: [['latch1', 'latch2', 'latch3'], .8, .1], reveal: [['reveal'], .9, .2],
    cannon: [['cannon'], .5, .07, .12], mg: [['mg1', 'mg2', 'mg3'], .32, .06, .1], zap: [['zap1', 'zap2', 'zap3', 'zap4', 'zap5', 'zap6'], .38, .1, .1],
    base: [['base'], .8, .25], win: [['win'], 1, 1], lose: [['lose'], .9, 1],
  };
  /* оружие танка → звук. rate < 1 — ниже и тяжелее */
  const KIND = {
    mg: ['mg'], aa: ['mg', { rate: .85 }],
    cannon: ['cannon'], mammoth: ['cannon', { rate: .8 }], drum: ['cannon', { rate: 1.15, vol: .7 }], kv2: ['cannon', { rate: .7 }],
    sniper: ['cannon', { rate: .75, vol: 1.1 }], rockets: ['cannon', { rate: 1.4, vol: .5 }], cryo: ['cannon', { rate: 1.6, vol: .35 }],
    tesla: ['zap'], rail: ['zap', { rate: .6, vol: 1.3 }], polar: ['zap', { rate: .5, vol: .8 }],
  };
  const FLAME_VOL = .55;
  let ac = null, master = null, vol = 1, mvol = .5, mg = null, cur = null, want = null, bufs = {}, last = {}, lastAny = 0, FL = null, flame = null, flameUntil = 0;
  try { const sv = localStorage.sv, mv = localStorage.mv; vol = sv != null ? +sv : localStorage.snd === '0' ? 0 : 1; if (mv != null) mvol = +mv; } catch (e) {}

  const get = (u) => fetch(u).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no)));
  function init() {
    if (ac) { if (ac.state === 'suspended' && !document.hidden) ac.resume(); musicStart(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = vol; master.connect(ac.destination);
    mg = ac.createGain(); mg.gain.value = mvol; mg.connect(ac.destination); musicStart();
    const names = new Set(); Object.values(L).forEach(d => d[0].forEach(n => names.add(n)));
    names.forEach(n => get('snd/' + n + '.mp3' + V).then(b => bufs[n] = b).catch(() => {}));
    get('snd/flame.wav' + V).then(b => FL = flameLoop(b)).catch(() => {});
    if (ac.state === 'suspended') ac.resume();
  }
  /* Браузер разрешает звук только после касания — запускаем по первому тапу */
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, init, true));
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) { flameOff(); ac.suspend(); } else ac.resume(); });

  function play(k, o = {}) {
    if (!vol || !ac || ac.state !== 'running') return;
    if (k === 'flame') return flameOn();
    const d = L[k]; if (!d) return;
    const now = ac.currentTime;
    if (o.soft && now - lastAny < .08) return;
    if (last[k] && now - last[k] < d[2]) return;
    const b = bufs[d[0][Math.random() * d[0].length | 0]]; if (!b) return;
    last[k] = lastAny = now;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = b; s.playbackRate.value = (o.rate || 1) * (1 + (Math.random() - .5) * (d[3] || 0));
    g.gain.value = d[1] * (o.vol == null ? 1 : o.vol);
    s.connect(g); g.connect(master); s.start();
  }

  /* Огнемёт: Fireball Whoosh 5, петля 0.209–1.003 с («умный цикл» из обрезалки):
     громкость выровнена, конец подобран под начало, стык 200 мс sin/cos, вступление-вспышка играет один раз,
     второй слой со сдвигом на полкруга и тоном 0.94 прячет повтор. */
  function flameLoop(buf) {
    const sr = buf.sampleRate, m = buf.getChannelData(0), N = m.length, a = Math.round(.209 * sr);
    let b = Math.round(1.003 * sr);
    const xf = Math.min(Math.round(.2 * sr), Math.floor((b - a) * .45));
    { const R = Math.round(.06 * sr), st = Math.max(1, Math.round(sr / 4000)); let best = -2, bb = b;
      for (let e = Math.max(a + xf * 2 + Math.round(.05 * sr), b - R); e <= Math.min(N, b + R); e += st) {
        let s = 0, p = 0, q = 0; for (let i = 0; i < xf; i += 3) { const x = m[a + i], y = m[e - xf + i]; s += x * y; p += x * x; q += y * y; }
        const r = s / Math.sqrt(p * q + 1e-12); if (r > best) { best = r; bb = e; } }
      b = bb; }
    const g = new Float32Array(N).fill(1);
    { const W = Math.round(.05 * sr), n = Math.max(1, Math.ceil((b - a) / W)), rms = [];
      for (let k = 0; k < n; k++) { let s = 0, c = 0; for (let i = a + k * W; i < Math.min(b, a + (k + 1) * W); i++) { s += m[i] * m[i]; c++; } rms.push(Math.sqrt(s / Math.max(1, c))); }
      const tgt = [...rms].sort((x, y) => x - y)[n >> 1], g0 = rms.map(r => Math.max(.3, Math.min(3, tgt / (r + 1e-6))));
      const gk = g0.map((v, k) => (g0[Math.max(0, k - 1)] + v * 2 + g0[Math.min(n - 1, k + 1)]) / 4);
      for (let i = a; i < N; i++) { const pos = (i - a) / W - .5; let v; if (pos <= 0) v = gk[0]; else if (pos >= n - 1) v = gk[n - 1]; else { const k = Math.floor(pos), f = pos - k; v = gk[k] * (1 - f) + gk[k + 1] * f; } g[i] = v; }
      const rp = Math.round(.12 * sr); for (let i = 0; i < a; i++) { const f = Math.max(0, Math.min(1, (i - (a - rp)) / rp)); g[i] = 1 + (gk[0] - 1) * f; } }
    const ia = a + xf, Ln = b - a - xf, out = ac.createBuffer(1, ia + Ln, sr), o = out.getChannelData(0);
    for (let i = 0; i < ia; i++) o[i] = m[i] * g[i];
    for (let i = 0; i < Ln; i++) { const j = a + xf + i, t = i - (Ln - xf); let v = m[j] * g[j];
      if (t >= 0) { const k = (t + .5) / xf * Math.PI / 2; v = v * Math.cos(k) + m[a + t] * g[a + t] * Math.sin(k); } o[ia + i] = v; }
    return { b: out, ls: ia / sr, L: Ln / sr };
  }
  /* Пока хоть один огнемёт стреляет (fire каждые 0.1 с) — петля играет; тишина 0.25 с — плавно гасим */
  function flameOn() {
    if (!FL) return;
    const now = ac.currentTime; flameUntil = now + .25; if (flame) return;
    const g = ac.createGain(), vs = [];
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(FLAME_VOL, now + .03); g.connect(master);
    const voice = (rate, off, lvl, fadeIn) => {
      const vg = ac.createGain(), s = ac.createBufferSource(); vg.connect(g);
      s.buffer = FL.b; s.loop = true; s.loopStart = FL.ls; s.loopEnd = FL.ls + FL.L; s.playbackRate.value = rate; s.connect(vg);
      if (fadeIn) { vg.gain.setValueAtTime(0, now); vg.gain.linearRampToValueAtTime(lvl, now + fadeIn); } else vg.gain.value = lvl;
      s.start(now, off); vs.push(s);
    };
    voice(1, 0, .78, 0); voice(.94, FL.ls + FL.L / 2, .6, .25);
    flame = { g, vs };
  }
  function flameOff() {
    if (!flame || !ac) return;
    const { g, vs } = flame, now = ac.currentTime; flame = null;
    g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.setTargetAtTime(0, now, .05);
    setTimeout(() => vs.forEach(s => { try { s.stop(); } catch (e) {} }), 400);
  }
  setInterval(() => { if (flame && ac.currentTime > flameUntil) flameOff(); }, 100);

  function fire(kind) { if (kind === 'flame') return play('flame'); const k = KIND[kind]; if (k) play(k[0], k[1]); }
  let lastVol = 1;
  function setVol(v) {
    vol = Math.max(0, Math.min(1, v)); if (vol > 0) lastVol = vol; try { localStorage.sv = vol; } catch (e) {}
    init(); if (master) master.gain.value = vol; if (!vol) flameOff();
  }
  function toggle() { setVol(vol > 0 ? 0 : lastVol); if (vol) play('click'); return vol > 0; }
  /* 🎵 Музыка: music/<k>.mp3 — раскодированный буфер с бесшовным повтором, плавная смена трека (кроссфейд). k = null — тишина */
  const mbufs = {};
  function loopPts(b) { /* срезаем тишину-набивку mp3 по краям (до 0.12 с), чтобы петля была без щелчка */
    const d = b.getChannelData(0), lim = Math.floor(b.sampleRate * .12); let i = 0, j = d.length - 1;
    while (i < lim && Math.abs(d[i]) < 2e-4) i++; while (d.length - 1 - j < lim && Math.abs(d[j]) < 2e-4) j--;
    return [i / b.sampleRate, (j + 1) / b.sampleRate];
  }
  function fadeOut(o) { const now = ac.currentTime; o.g.gain.cancelScheduledValues(now); o.g.gain.setValueAtTime(o.g.gain.value, now); o.g.gain.linearRampToValueAtTime(0, now + 1.5); setTimeout(() => { try { o.src.stop(); } catch (e) {} }, 1700); }
  function musicStart() {
    if (!ac || !mg || mvol <= 0 || (cur ? cur.k === want : !want)) return;
    if (!want) { fadeOut(cur); cur = null; return; }
    const k = want, b = mbufs[k];
    if (b === undefined) { mbufs[k] = null; get('music/' + k + '.mp3' + V).then(x => { mbufs[k] = x; musicStart(); }).catch(() => { delete mbufs[k]; }); return; }
    if (!b) return; /* ещё грузится */
    const src = ac.createBufferSource(), g = ac.createGain(), now = ac.currentTime, [s0, s1] = loopPts(b);
    src.buffer = b; src.loop = true; src.loopStart = s0; src.loopEnd = s1;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 2); src.connect(g); g.connect(mg); src.start(0, s0);
    if (cur) fadeOut(cur); cur = { k, src, g };
  }
  function music(k) { want = k || null; musicStart(); }
  function setMusic(v) {
    mvol = Math.max(0, Math.min(1, v)); try { localStorage.mv = mvol; } catch (e) {}
    init(); if (mg) mg.gain.value = mvol; musicStart();
  }
  return { play, fire, toggle, setVol, setMusic, music, get on() { return vol > 0; }, get vol() { return vol; }, get mvol() { return mvol; } };
})();
function sfx(k, a) { if (k === 'fire') SFX.fire(a); else SFX.play(k, a); }
/* Кнопка: «клик», крестик/назад — «закрыть». Клик откладывается на тик: если обработчик сам сыграл звук (покупка, окно…) — клик не нужен */
document.addEventListener('click', (e) => {
  const b = e.target.closest('button,[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.act;
  if (a === 'close' || a === 'quit' || a === 'resume' || b.classList.contains('x')) return sfx('close');
  setTimeout(() => sfx('click', { soft: 1 }), 0);
}, true);

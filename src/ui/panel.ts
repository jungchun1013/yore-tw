import type { GameController, GameEvent } from '../core/controller';
import { CATS, SPECIAL_CATS, specialText } from '../content/cats';
import { t, lang, setLang, nameOf, descOf } from '../i18n';
import { UPGRADE_BY_ID, STAR_UPGRADES, UPGRADES } from '../content/upgrades';
import { ACHIEVEMENTS } from '../content/achievements';
import { availableUpgrades, genCost, genCostN, maxAffordable, genProduction, globalMultiplier, PRESTIGE, timeToAfford, boostMultiplier, offlineRate, offlineHours, OFFLINE, nextStarAt, lovedCount, PET, heatCap, slackCount, SLACK, SLACK_KINDS } from '../core/economy';
import { fmt, fmtInt, fmtTime } from '../core/format';
import { $, el, toast, openModal } from './dom';
import { catCanvas, iconDataUrl, propCanvas, toyCanvas, patCanvas, emoteCanvas, macaronCanvas } from '../game/sprites/pixel';
import { hasInfluencer } from '../core/economy';
import { RUSH } from '../core/controller';
import { showJournal } from './journal';
import { showCodex } from './codex';
import { showFeed, author } from './feed';
import { showFurniture } from './furniture';
import { renderPhoto } from './photo';
import type { DiaryEntry } from '../core/types';

const catIcon: Record<string, string> = {};
function iconFor(id: string): string {
  if (!catIcon[id]) { const c = CATS.find((x) => x.id === id)!; catIcon[id] = catCanvas(c.coat, c.accessory).toDataURL(); }
  return catIcon[id];
}
const upIcon: Record<string, string> = {};
function upgradeIcon(key: string): string {
  if (!upIcon[key]) {
    const m = /^prop:(\w+):(\d)$/.exec(key);
    const t = /^toy:(\w+)$/.exec(key);
    const p = /^pat:(\w+)$/.exec(key);
    upIcon[key] = m ? propCanvas(m[1], Number(m[2])).toDataURL() : t ? toyCanvas(t[1]).toDataURL() : p ? patCanvas(p[1]).toDataURL() : iconDataUrl(key);
  }
  return upIcon[key];
}

export function initPanel(ctrl: GameController): void {
  let buyAmount: number | 'max' = 1;
  let catSig = '', upSig = '', starSig = '';
  const hudMac = $('#hud-macarons'), hudCps = $('#hud-cps'), hudClick = $('#hud-click');
  const starsCount = $('#stars-count'), upgradesEl = $('#upgrades'), upgradesHint = $('#upgrades-hint');
  const patEl = $('#pat-upgrades'), patHint = $('#pat-hint');
  const catsEl = $('#cats'), starShop = $('#star-shop');
  const btnPrestige = $<HTMLButtonElement>('#btn-prestige'), prestigeGain = $('#prestige-gain'), prestigeHint = $('#prestige-hint');
  const btnRush = $<HTMLButtonElement>('#btn-rush'), boostBadge = $('#boost-badge'), boostLeft = $('#boost-left');
  const playtime = $('#playtime');
  const hudCpsText = $('#hud-cps-text'), hudClickText = $('#hud-click-text');
  const lovedBadge = $('#loved-badge');
  const heatBadge = $('#heat-badge');
  const hudSub = $('.hud-sub'), hudSlack = $('#hud-slack');
  const slackIcon: Record<string, string> = { nap: emoteCanvas('zzz').toDataURL(), love: emoteCanvas('love').toDataURL(), fight: emoteCanvas('anger', '#E8453C').toDataURL(), window: emoteCanvas('dream').toDataURL(), play: emoteCanvas('scratch', '#9C8A82').toDataURL(), eat: macaronCanvas('pink').toDataURL() };
  let slackSig = '';
  const gramBadge = $('#gram-badge'), gramCount = $('#gram-count');
  const blessBadge = $('#bless-badge');
  const warpBadge = $('#warp-badge');
  $('#star-bonus').textContent = `+${Math.round(PRESTIGE.bonusPerStar * 100)}%`;

  // buy amount segmented control
  $('#buy-amount').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    buyAmount = b.dataset.n === 'max' ? 'max' : Number(b.dataset.n);
    for (const x of $('#buy-amount').children) x.classList.toggle('on', x === b);
    catSig = '';
  });

  // header buttons
  const btnSound = $('#btn-sound');
  const syncSound = () => { btnSound.textContent = ctrl.state.sound ? '🔊' : '🔇'; };
  btnSound.addEventListener('click', () => { ctrl.toggleSound(); syncSound(); });
  syncSound();
  $('#btn-achievements').addEventListener('click', () => showAchievements(ctrl));
  $('#btn-journal').addEventListener('click', () => showJournal(ctrl));
  $('#btn-codex').addEventListener('click', () => showCodex(ctrl));
  $('#btn-feed').addEventListener('click', () => showFeed(ctrl));
  $('#btn-furniture').addEventListener('click', () => showFurniture(ctrl));
  $('#gram-badge').addEventListener('click', () => showFeed(ctrl));
  $('#btn-settings').addEventListener('click', () => showSettings(ctrl));
  $('#btn-lang').addEventListener('click', () => switchLang(ctrl));

  btnPrestige.addEventListener('click', () => {
    const gain = ctrl.prestigeStars();
    if (gain < 1) return;
    const body = el('div', {}, [
      el('h2', {}, [t('prestigeQ')]),
      el('p', {}, [t('prestigeBody')]),
      el('div', { class: 'big' }, [`+${gain} ★`]),
      el('p', { class: 'muted small' }, [t('prestigeAfter', { p: Math.round(PRESTIGE.bonusPerStar * 100), n: ctrl.state.stars + gain, m: (1 + (ctrl.state.stars + gain) * PRESTIGE.bonusPerStar).toFixed(2) })]),
    ]);
    const actions = el('div', { class: 'actions' });
    const cancel = el('button', { class: 'btn' }, [t('notYet')]);
    const ok = el('button', { class: 'btn primary', id: 'btn-prestige-confirm' }, [t('openNewShop')]);
    actions.append(cancel, ok); body.append(actions);
    const close = openModal(body);
    cancel.onclick = close;
    ok.onclick = async () => { close(); const g = await ctrl.prestige(); if (g > 0) toast(t('newShopOpened', { n: g }), 'ach'); };
  });

  btnRush.addEventListener('click', async () => {
    if (!ctrl.rushAvailable()) return;
    const ok = await ctrl.startRush();
    toast(ok ? t('rushOn') : t('rushFail'));
  });

  // cat list
  const renderCats = () => {
    const s = ctrl.state;
    const money = s.macarons;
    const rows: { def: typeof CATS[number]; owned: number; locked: boolean; n: number; cost: number }[] = [];
    let revealedLocked = 0;
    for (const [i, def] of CATS.entries()) {
      if (def.secret) continue; // secret cats are appended below, outside the reveal-order rule
      const owned = s.gens[def.id] ?? 0;
      // the first cat is always available; others appear once the player has baked 40% of their base cost; one extra is a teaser
      const visible = i === 0 || owned > 0 || s.allTimeEarned >= def.baseCost * 0.4 || !!def.secret;
      if (!visible) { if (revealedLocked++ >= 1) break; rows.push({ def, owned, locked: true, n: 0, cost: def.baseCost }); continue; }
      const n = buyAmount === 'max' ? Math.max(1, maxAffordable(def, owned, money)) : buyAmount;
      rows.push({ def, owned, locked: false, n, cost: genCostN(def, owned, n) });
    }
    for (const def of CATS) {
      if (!def.secret || !s.achievements.includes(def.secret)) continue;
      const owned = s.gens[def.id] ?? 0;
      const n = buyAmount === 'max' ? Math.max(1, maxAffordable(def, owned, money)) : buyAmount;
      rows.push({ def, owned, locked: false, n, cost: genCostN(def, owned, n) });
    }
    const catUps = availableUpgrades(s).filter((u) => u.effect.type === 'genMult');
    const sig = rows.map((r) => `${r.def.id}:${r.owned}:${r.locked ? 'L' : ''}:${r.n}:${r.cost <= money ? 1 : 0}:${Math.round(genProduction(s, r.def))}:${lovedCount(s, ctrl.now(), r.def.id)}:${catUps.filter((u) => u.effect.type === 'genMult' && u.effect.gen === r.def.id).map((u) => `${u.id}${u.cost <= money ? '+' : '-'}`).join(',')}`).join('|') + globalMultiplier(s) + ':' + boostMultiplier(s, ctrl.now());
    if (sig === catSig) return;
    catSig = sig;
    const now = ctrl.now();
    catsEl.replaceChildren(...rows.map((r) => {
      const special = SPECIAL_CATS[r.def.id];
      const node = el('div', { class: `cat ${r.locked ? 'locked' : ''} ${special && !r.locked ? `special tone-${special.tone}` : ''}`, role: 'listitem', 'data-cat': r.def.id });
      const img = el('img', { src: iconFor(r.def.id), alt: '' });
      const info = el('div', { class: 'info' });
      if (r.locked) {
        info.append(el('div', { class: 'name' }, ['???']), el('div', { class: 'meta' }, [t('unlocksAround', { n: fmt(r.def.baseCost * 0.4) })]));
        node.append(img, info, el('div'));
        return node;
      }
      const openJournal = () => showJournal(ctrl, r.def.id);
      img.onclick = openJournal; info.onclick = openJournal;
      img.classList.add('tap'); info.classList.add('tap');
      info.title = t('openJournal');
      const prod = genProduction(s, r.def) * globalMultiplier(s) * boostMultiplier(s, now);
      const each = r.def.baseProd * (prod / Math.max(1e-9, r.def.baseProd * r.owned) || globalMultiplier(s) * boostMultiplier(s, now));
      if (special) { const st = specialText(r.def.id); info.append(el('div', { class: 'special-tag', 'data-tip': `<b>✦ ${st.label}</b>${st.blurb}` }, [`✦ ${st.label}`])); } // the glow on the cat itself is the only cue
      info.append(
        el('div', { class: 'name' }, [nameOf(r.def), el('span', { class: 'owned' }, [r.owned ? `×${r.owned}` : ''])]),
        el('div', { class: 'meta' }, [r.owned ? `${fmt(prod)}/${t('sec')} ${t('total')} · ${fmt(each)}/${t('sec')} ${t('each')}` : `${fmt(each)}/${t('sec')} ${t('each')}`]),
      );
      const lovedHere = lovedCount(s, now, r.def.id);
      if (lovedHere > 0) info.append(el('div', { class: 'loved' }, ['♥ ' + t('petted', { n: lovedHere, p: Math.round(lovedHere * PET.lovedEach * 100) })]));
      const mine = catUps.filter((u) => u.effect.type === 'genMult' && u.effect.gen === r.def.id);
      if (mine.length) {
        const strip = el('div', { class: 'row-upgrades' });
        for (const u of mine) {
          const b = el('button', { class: `upg small ${u.cost <= money ? '' : 'cant'}`, 'data-upgrade': u.id, 'aria-label': nameOf(u),
            'data-tip': `<b>${nameOf(u)}</b>${descOf(u)}<br><span class="tip-cost">🍪 ${fmtInt(u.cost)}</span>` }, [
            el('img', { src: upgradeIcon(u.icon), alt: '' }), el('span', { class: 'cost' }, [fmt(u.cost)]),
          ]);
          b.onclick = (e) => { e.stopPropagation(); if (ctrl.buyUpgrade(u.id)) toast(`${nameOf(u)} ✓`); };
          strip.append(b);
        }
        info.append(strip);
      }
      const can = r.cost <= money;
      const btn = el('button', { class: 'btn buy', 'data-buy': r.def.id }, [
        el('span', { class: 'n' }, [`${t('hire')} ×${r.n}`]),
        el('span', { class: 'c' }, [`🍪 ${fmtInt(r.cost)}`]),
      ]) as HTMLButtonElement;
      btn.disabled = !can;
      if (!can) { const eta = timeToAfford(s, r.cost, now); btn.title = isFinite(eta) ? t('affordableIn', { t: fmtTime(eta) }) : t('keepPatting'); }
      btn.onclick = () => ctrl.buyGen(r.def.id, buyAmount === 'max' ? 'max' : r.n);
      node.append(img, info, btn);
      return node;
    }));
    void genCost;
  };

  // Kitchen equipment and patting upgrades live in two strips; each shows what unlocks the next one when empty.
  const isEquip = (id: string) => id.startsWith('equip_');
  const isPat = (id: string) => /^(click|pct)\d$/.test(id);
  const nextHint = (kind: 'equip' | 'pat'): string => {
    const s = ctrl.state;
    const next = UPGRADES.find((u) => (kind === 'equip' ? isEquip(u.id) : isPat(u.id)) && !s.upgrades.includes(u.id));
    if (!next) return t(kind === 'equip' ? 'equipDone' : 'patDone');
    if (next.requires?.clicks) return t('patHint', { n: fmt(next.requires.clicks) });
    return t(kind === 'equip' ? 'equipHint' : 'patHintEarned', { n: fmt(next.requires?.earned ?? next.cost) });
  };
  const renderUpgrades = () => {
    const s = ctrl.state;
    const all = availableUpgrades(s).filter((u) => u.effect.type !== 'genMult');
    const list = all.filter((u) => isEquip(u.id)).slice(0, 8);
    const pats = all.filter((u) => isPat(u.id)).slice(0, 8);
    const sig = [...list, ...pats].map((u) => `${u.id}:${u.cost <= s.macarons ? 1 : 0}`).join('|') + '#' + s.upgrades.length;
    if (sig === upSig) return;
    upSig = sig;
    upgradesHint.textContent = list.length ? '' : nextHint('equip');
    patHint.textContent = pats.length ? '' : nextHint('pat');
    const mk = (u: typeof all[number]) => {
      const b = el('button', { class: `upg ${u.cost <= s.macarons ? '' : 'cant'}`, 'data-upgrade': u.id, 'aria-label': nameOf(u),
        'data-tip': `<b>${nameOf(u)}</b>${descOf(u)}<br><span class="tip-cost">🍪 ${fmtInt(u.cost)}</span>` }, [
        el('img', { src: upgradeIcon(u.icon), alt: '' }), el('span', { class: 'cost' }, [fmt(u.cost)]),
      ]);
      b.onclick = () => { if (ctrl.buyUpgrade(u.id)) toast(`${nameOf(UPGRADE_BY_ID[u.id])} ✓`); };
      return b;
    };
    patEl.replaceChildren(...pats.map(mk));
    upgradesEl.replaceChildren(...list.map(mk));
  };

  const renderStarShop = () => {
    const s = ctrl.state;
    const show = s.prestigeCount > 0 || s.stars > 0 || s.starUpgrades.length > 0;
    starShop.hidden = !show;
    if (!show) return;
    const sig = STAR_UPGRADES.map((u) => `${u.id}:${s.starUpgrades.includes(u.id) ? 'B' : s.stars >= u.cost ? 1 : 0}`).join('|');
    if (sig === starSig) return;
    starSig = sig;
    starShop.replaceChildren(...STAR_UPGRADES.map((u) => {
      const bought = s.starUpgrades.includes(u.id);
      const node = el('div', { class: 'cat', 'data-star': u.id });
      const btn = el('button', { class: 'btn buy', 'data-buy-star': u.id }, [bought ? el('span', { class: 'c' }, [t('owned')]) : el('span', { class: 'c' }, [`★ ${u.cost}`])]) as HTMLButtonElement;
      btn.disabled = bought || s.stars < u.cost;
      btn.onclick = () => { if (ctrl.buyStarUpgrade(u.id)) toast(`${nameOf(u)} ✓`, 'ach'); };
      node.append(el('img', { src: upgradeIcon(u.icon), alt: '' }), el('div', {}, [el('div', { class: 'name' }, [nameOf(u)]), el('div', { class: 'meta' }, [descOf(u)])]), btn);
      return node;
    }));
  };

  const renderFast = () => {
    const s = ctrl.state;
    hudMac.textContent = fmtInt(s.macarons);
    hudCps.textContent = fmt(ctrl.cps());
    hudClick.textContent = fmt(ctrl.clickValue());
    hudCpsText.textContent = t('cpsText', { n: hudCps.textContent! });
    hudClickText.textContent = t('clickText', { n: hudClick.textContent! });
    const gain = ctrl.prestigeStars();
    btnPrestige.disabled = gain < PRESTIGE.minStars;
    prestigeGain.textContent = `(+${gain} ★)`;
    prestigeHint.textContent = gain < 1 ? t('firstStarHint', { base: fmt(nextStarAt(s)), sofar: fmt(s.allTimeEarned) }) : t('nextStarHint', { n: fmt(nextStarAt(s)) });
    const boost = ctrl.boostActive();
    boostBadge.hidden = !boost;
    if (boost) boostLeft.textContent = fmtTime(ctrl.boostLeftMs() / 1000);
    const cd = ctrl.rushCooldownLeftMs();
    btnRush.hidden = boost || cd > 0; // no countdown: it simply appears when ready
    btnRush.disabled = ctrl.adInFlight;
    const narrow = window.innerWidth < 700;
    btnRush.textContent = narrow ? t('rushShort', { m: RUSH.mult }) : t('rushLong', { m: RUSH.mult });
    playtime.textContent = t('footer', { t: fmtTime(s.playTimeMs / 1000) });
    const warped = ctrl.now() < s.warpUntil;
    warpBadge.hidden = !warped;
    if (warped) warpBadge.textContent = `⏳ ×${s.warpMult} · ${fmtTime((s.warpUntil - ctrl.now()) / 1000)}`;
    const blessed = ctrl.now() < s.blessedUntil;
    blessBadge.hidden = !blessed;
    if (blessed) blessBadge.textContent = t('blessedPill', { m: s.blessMult.toFixed(2), t: fmtTime((s.blessedUntil - ctrl.now()) / 1000) });
    starsCount.textContent = s.starFragments > 0 ? `${s.stars} ✦${s.starFragments}` : String(s.stars);
    gramBadge.hidden = !hasInfluencer(s) && s.followers === 0;
    gramCount.textContent = fmt(s.followers);
    // slacking: the per-second line blinks with a ↓ and one icon per reason (zzz / love / fight / window)
    const slackN = slackCount(s);
    const sig = SLACK_KINDS.map((k) => `${k}${s.slack[k]}`).join();
    if (sig !== slackSig) {
      slackSig = sig;
      hudSub.classList.toggle('slack', slackN > 0);
      hudSlack.hidden = slackN === 0;
      if (slackN > 0) {
        hudSlack.replaceChildren(' ↓', ...SLACK_KINDS.filter((k) => s.slack[k] > 0).map((k) => el('img', { src: slackIcon[k], alt: k, class: 'slack-icon' })));
        hudSlack.title = t('slackTip', { n: Math.round(Math.min(SLACK.max, slackN * SLACK.perCat) * 100) });
      }
    }
    const heat = Math.min(s.heat, heatCap(s));
    heatBadge.hidden = heat < 0.5;
    if (heat >= 0.5) heatBadge.textContent = t('heatPill', { n: heat.toFixed(heat < 10 ? 1 : 0) });
    const lovedAll = lovedCount(s, ctrl.now());
    lovedBadge.hidden = lovedAll === 0;
    if (lovedAll > 0) lovedBadge.textContent = '♥ ' + t('petted', { n: lovedAll, p: Math.round(lovedAll * PET.lovedEach * 100) });
  };

  let lastSlow = 0;
  const loop = () => {
    renderFast();
    const now = performance.now();
    if (now - lastSlow > 200) { lastSlow = now; renderCats(); renderUpgrades(); renderStarShop(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  ctrl.on((e: GameEvent) => {
    if (e.type === 'achievement') { const a = ACHIEVEMENTS.find((x) => x.id === e.id); if (a) toast(`🏆 ${nameOf(a)}`, 'ach'); }
    if (e.type === 'diary' && (e.entry.kind === 'post' || e.entry.snap)) { const entry = e.entry; setTimeout(() => showPost(entry, ctrl.state.followers), e.entry.snap ? 400 : 1700); } // after the banner fades
    if (e.type === 'rainbow') { catSig = ''; if (e.burst > 0) toast(t('nyanDash', { n: fmt(e.burst) }), 'ach'); else toast(t('rainbowFound'), 'ach'); }
    if (e.type === 'bless') toast(t('blessToast', { m: e.mult.toFixed(2), n: fmt(e.burst) }), 'ach');
    if (e.type === 'warp') toast(t('warpToast', { m: e.mult, s: e.seconds }), 'ach');
    if (e.type === 'stardust') toast(e.starGained ? t('dustFull') : t('dust', { n: e.fragments }), 'ach');
    if (e.type === 'bless' || e.type === 'warp' || e.type === 'stardust') { catSig = ''; upSig = ''; }
    if (e.type === 'buy' || e.type === 'upgrade' || e.type === 'prestige' || e.type === 'boost' || e.type === 'reset' || e.type === 'offline') { catSig = ''; upSig = ''; starSig = ''; }
  });
}

/** A Meowstagram post card that pops up on the stage for a few seconds. */
function showPost(entry: DiaryEntry, followers: number): void {
  const stage = document.getElementById('hud');
  if (!stage) return;
  const by = entry.by ? author(entry.by, entry.t) : null;
  stage.querySelectorAll('.post').forEach((p) => p.remove());
  const card = el('div', { class: 'post', role: 'status' }, [
    el('div', { class: 'post-head' }, [el('img', { src: by ? by.avatar : iconFor('influencer'), alt: '' }), el('div', { html: by ? `${by.handle}<small>${t('taggedYou')} · ${t('followersNew', { f: fmt(followers) })}</small>` : `meowcaron.official<small>${t('followersNew', { f: fmt(followers) })}</small>` })]),
    el('div', { class: 'post-photo' }, [el('img', { src: renderPhoto(entry), alt: '' })]),
    el('div', { class: 'post-caption' }, [entry.text]),
    el('div', { class: 'post-likes' }, [t('likesN', { n: fmt(Math.max(3, Math.round(followers * (0.3 + Math.random() * 0.4)))) })]),
  ]);
  const dismiss = () => { card.classList.add('leaving'); setTimeout(() => card.remove(), 300); };
  card.onclick = dismiss;
  stage.append(card);
  setTimeout(() => { if (card.isConnected) dismiss(); }, 7000);
}

function showAchievements(ctrl: GameController): void {
  const s = ctrl.state;
  const body = el('div', {}, [
    el('h2', {}, [t('achievements', { a: s.achievements.length, b: ACHIEVEMENTS.length })]),
    el('p', { class: 'muted small' }, [t('achBody', { n: s.achievements.length })]),
  ]);
  const list = el('ul', { class: 'ach-list' });
  const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(s.achievements.includes(b.id)) - Number(s.achievements.includes(a.id)));
  for (const a of sorted) {
    const got = s.achievements.includes(a.id);
    list.append(el('li', { class: `ach-row ${got ? 'done' : ''}` }, [
      el('span', { class: 'ach-mark' }, [got ? '✓' : '○']),
      el('div', {}, [el('b', {}, [got ? nameOf(a) : '???']), el('div', { class: 'ach-desc' }, [descOf(a)])]),
    ]));
  }
  body.append(list);
  const actions = el('div', { class: 'actions' });
  const ok = el('button', { class: 'btn primary' }, [t('close')]);
  actions.append(ok); body.append(actions);
  const close = openModal(body); ok.onclick = close;
}

/** Save, flip the language and reload: every piece of UI, scene text and number format follows the new language from boot. */
function switchLang(ctrl: GameController): void {
  ctrl.save();
  setLang(lang() === 'zh' ? 'en' : 'zh');
  location.reload();
}

function showSettings(ctrl: GameController): void {
  const body = el('div', {}, [
    el('h2', {}, [t('settings')]),
    el('p', { class: 'small muted' }, [t('settingsBody', { p: ctrl.platform.name })]),
  ]);
  const langRow = el('div', { class: 'row settings-row' }, [el('span', {}, [`${t('language')}: ${t('langName')}`]), el('button', { class: 'btn', id: 'btn-lang-switch' }, [t('switchLang')])]);
  const soundBtn = el('button', { class: 'btn', id: 'btn-sound-switch' }, ['']);
  const soundRow = el('div', { class: 'row settings-row' }, [el('span', {}, [t('sound')]), soundBtn]);
  const syncSound = () => { soundBtn.textContent = ctrl.state.sound ? `🔊 ${t('on')}` : `🔇 ${t('off')}`; $('#btn-sound').textContent = ctrl.state.sound ? '🔊' : '🔇'; };
  soundBtn.onclick = () => { ctrl.toggleSound(); syncSound(); };
  syncSound();
  body.append(soundRow, langRow);
  const actions = el('div', { class: 'actions' });
  const reset = el('button', { class: 'btn', id: 'btn-hard-reset' }, [t('wipe')]);
  const ok = el('button', { class: 'btn primary' }, [t('close')]);
  actions.append(reset, ok); body.append(actions);
  langRow.querySelector<HTMLButtonElement>('#btn-lang-switch')!.onclick = () => switchLang(ctrl);
  const close = openModal(body); ok.onclick = close;
  reset.onclick = () => {
    if (reset.dataset.armed !== '1') { reset.dataset.armed = '1'; reset.textContent = t('wipeConfirm'); return; }
    ctrl.hardReset(); close(); toast(t('wiped'));
  };
}

/** Welcome-back modal for offline earnings. Resolves when dismissed. */
export function showOfflineModal(ctrl: GameController): void {
  const p = ctrl.pendingOffline;
  if (!p) return;
  const body = el('div', {}, [
    el('h2', {}, [t('welcomeBack')]),
    el('p', {}, [t(p.capped ? 'offlineBodyLong' : 'offlineBody', { t: fmtTime(p.seconds), h: offlineHours(ctrl.state), p: Math.round(offlineRate(ctrl.state) * 100), tail: Math.round(OFFLINE.tailRate * 100) })]),
    el('div', { class: 'big', id: 'offline-amount' }, [`🍪 ${fmt(p.amount)}`]),
  ]);
  const actions = el('div', { class: 'actions' });
  const claim = el('button', { class: 'btn', id: 'btn-offline-claim' }, [t('collect')]);
  const dbl = el('button', { class: 'btn primary', id: 'btn-offline-double' }, [t('collect2x')]);
  actions.append(claim, dbl); body.append(actions);
  const close = openModal(body, { dismissable: false });
  const lock = () => { claim.setAttribute('disabled', '1'); dbl.setAttribute('disabled', '1'); };
  claim.onclick = () => { lock(); ctrl.claimOffline(false); close(); };
  dbl.onclick = async () => {
    lock();
    const ok = await ctrl.doubleOfflineViaAd();
    ctrl.claimOffline(ok);
    if (!ok) toast(t('adUnavailable'));
    close();
  };
}

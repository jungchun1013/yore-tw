import type { GameController } from '../core/controller';
import { el, openModal } from './dom';
import { renderPhoto } from './photo';
import { fmt } from '../core/format';
import { hasInfluencer } from '../core/economy';
import { catCanvas, animalCanvas } from '../game/sprites/pixel';
import { CAT_BY_ID } from '../content/cats';
import { SPECIES_BY_ID } from '../content/customers';
import { t } from '../i18n';

function ago(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return t('justNow');
  if (s < 3600) return t('minAgo', { n: Math.floor(s / 60) });
  if (s < 86400) return t('hAgo', { n: Math.floor(s / 3600) });
  return t('dAgo', { n: Math.floor(s / 86400) });
}

let avatar = '';
const portraits: Record<string, string> = {};
/** A customer's handle and avatar for a post that tags the shop. */
export function author(by: string, t: number): { handle: string; avatar: string } {
  if (!portraits[by]) { const sp = SPECIES_BY_ID[by]; portraits[by] = sp ? animalCanvas(sp, sp.coats[0], 'happy').toDataURL() : ''; }
  return { handle: `${by}.${100 + (t % 900)}`, avatar: portraits[by] };
}

/** The shop's Meowstagram: every diary moment as a post (photo, caption, likes). Opens once an Influencer Cat is hired. */
export function showFeed(ctrl: GameController): void {
  const s = ctrl.state;
  if (!avatar) { const inf = CAT_BY_ID.influencer; avatar = catCanvas(inf.coat, inf.accessory, 'happy').toDataURL(); }
  const body = el('div', { class: 'feed' });
  const close = openModal(body);
  if (!hasInfluencer(s) && s.followers === 0) {
    body.append(
      el('div', { class: 'feed-head' }, [el('img', { src: avatar, alt: '' }), el('div', { html: `<b>meowcaron.official</b><small>${t('notOpen')}</small>` })]),
      el('p', { class: 'feed-locked' }, [t('feedLocked')]),
      el('div', { class: 'actions' }, [el('button', { class: 'btn primary', id: 'feed-close' }, [t('close')])]),
    );
    body.querySelector<HTMLButtonElement>('#feed-close')!.onclick = close;
    return;
  }
  const entries = [...s.diary].reverse();
  const now = ctrl.now();
  const posts = entries.length ? entries.map((e, i) => {
    const likes = Math.max(3, Math.round(s.followers * (0.25 + ((e.t % 97) / 97) * 0.5) / Math.max(1, Math.sqrt(i + 1))));
    const by = e.by ? author(e.by, e.t) : null;
    return el('article', { class: 'feed-post' + (by ? ' feed-tagged' : ''), 'data-kind': e.kind }, [
      ...(by ? [el('div', { class: 'feed-author' }, [el('img', { src: by.avatar, alt: '' }), el('span', {}, [by.handle]), el('small', {}, [t('taggedYou')])])] : []),
      el('div', { class: 'feed-photo' }, [el('img', { src: renderPhoto(e), alt: '' })]),
      el('div', { class: 'feed-meta' }, [el('span', { class: 'feed-likes' }, [`♥ ${fmt(likes)}`]), el('span', { class: 'feed-when' }, [ago(e.t, now)])]),
      el('p', { class: 'feed-caption' }, [el('b', {}, [(by ? by.handle : 'meowcaron.official') + ' ']), e.text]),
    ]);
  }) : [el('p', { class: 'feed-locked' }, [t('noPosts')])];
  body.append(
    el('div', { class: 'feed-head' }, [el('img', { src: avatar, alt: '' }), el('div', { html: `<b>meowcaron.official</b><small>${t('followersPosts', { f: fmt(s.followers), p: entries.length })}</small>` })]),
    el('div', { class: 'feed-list' }, posts),
    el('div', { class: 'actions' }, [el('button', { class: 'btn primary', id: 'feed-close' }, [t('close')])]),
  );
  body.querySelector<HTMLButtonElement>('#feed-close')!.onclick = close;
}

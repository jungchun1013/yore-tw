import { el, openModal } from './dom';
import { t } from '../i18n';

export interface DiaryNote { tone: 'pink' | 'lemon' | 'mint'; label: string; text: string }
export interface DiaryPage {
  id: string; open: boolean; portrait: string; name: string; title: string; sticker: string; story: string[]; notes: DiaryNote[];
}

/**
 * One diary component for every book in the game (staff journal, customer book):
 * one page per entry with prev / next / close.
 */
export function diaryBook(opts: { pages: DiaryPage[]; startId?: string; closeId: string; prefix: string }): void {
  const { pages, prefix } = opts;
  let index = Math.max(0, pages.findIndex((p) => p.id === opts.startId));
  const body = el('div', { class: 'journal' });
  const close = openModal(body);
  body.parentElement?.classList.add('diary');
  const stop = () => { close(); document.removeEventListener('keydown', onKey); };

  const renderDetail = () => {
    const p = pages[index];
    const page = el('div', { class: `diary-page ${p.open ? '' : 'locked'}`, 'data-id': p.id, 'data-species': p.id }, [
      el('div', { class: 'diary-ribbon' }),
      el('div', { class: `polaroid ${p.open ? '' : 'locked'}`, style: `--tilt:${(index % 2 ? 1 : -1) * (2 + (index % 3))}deg` }, [
        el('div', { class: 'tape' }),
        el('img', { src: p.portrait, alt: '' }),
        el('div', { class: 'polaroid-caption' }, [p.name]),
      ]),
      el('h2', { class: 'journal-name' }, [p.name]),
      el('div', { class: 'journal-title' }, [p.title]),
      el('div', { class: `sticker ${p.open ? '' : 'faded'}` }, [p.sticker]),
      ...p.story.map((t) => el('p', { class: `journal-story ${p.open ? '' : 'muted'}` }, [t])),
      p.notes.length ? el('div', { class: 'notes' }, p.notes.map((n) => el('div', { class: `note note-${n.tone}` }, [el('b', {}, [n.label]), n.text]))) : el('div'),
      el('div', { class: 'diary-pageno' }, [`${index + 1} / ${pages.length}`]),
    ]);
    body.replaceChildren(
      el('div', { class: 'diary-wrap' }, [
        el('button', { class: 'page-arrow left', id: `${prefix}-prev`, 'aria-label': t('prevPage') }, ['‹']),
        el('div', { class: 'diary-cover' }, [page]),
        el('button', { class: 'page-arrow right', id: `${prefix}-next`, 'aria-label': t('nextPage') }, ['›']),
      ]),
      el('div', { class: 'journal-head' }, [el('button', { class: 'btn primary', id: opts.closeId }, [t('close')])]),
    );
    body.querySelector<HTMLButtonElement>(`#${prefix}-prev`)!.onclick = () => { index = (index + pages.length - 1) % pages.length; render(); };
    body.querySelector<HTMLButtonElement>(`#${prefix}-next`)!.onclick = () => { index = (index + 1) % pages.length; render(); };
    body.querySelector<HTMLButtonElement>(`#${opts.closeId}`)!.onclick = stop;
  };

  const render = () => renderDetail();
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { index = (index + pages.length - 1) % pages.length; render(); }
    if (e.key === 'ArrowRight') { index = (index + 1) % pages.length; render(); }
    if (e.key === 'Escape') stop();
  };
  document.addEventListener('keydown', onKey);
  render();
}

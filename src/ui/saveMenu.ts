import { SAVE_EXTENSION, decodeSave, encodeSave } from '@/io/codec';
import { type CameraSave, type Game, type SaveMeta, takeSave } from '@/io/save';
import {
  type SlotSummary,
  deleteSlot,
  getSlot,
  listSlots,
  newSlotId,
  putSlot,
  storageAvailable,
} from '@/io/store';
import { fmt, t } from './i18n';

/** URL params that describe a fresh game; dropped once the game lives in a save slot. */
const GAME_PARAMS = ['seed', 'mode', 'unlock', 'free', 'nodecline', 'sandbox', 'tut', 'x', 'z'];

export function urlForSlot(id: string): string {
  const q = new URLSearchParams(window.location.search);
  for (const k of GAME_PARAMS) q.delete(k);
  q.set('load', id);
  return `${window.location.pathname}?${q.toString()}`;
}

/** The running game's save slot: manual saves, autosave and the slot id in the URL. */
export class SaveSession {
  readonly slotId: string;
  private busy = false;

  constructor(
    private readonly game: Game,
    readonly meta: SaveMeta,
    private readonly camera: () => CameraSave,
    private readonly say: (text: string, cls?: string) => void,
    slotId?: string,
  ) {
    this.slotId = slotId ?? newSlotId();
  }

  /** Writes the game to its slot. Quiet for autosaves. */
  async save(quiet = false): Promise<boolean> {
    if (this.busy) return false;
    if (!storageAvailable()) {
      if (!quiet) this.say(t('save.noStorage'), 'bad');
      return false;
    }
    this.busy = true;
    try {
      this.meta.updatedAt = Date.now();
      const bytes = await encodeSave(takeSave(this.game, this.meta, this.camera()));
      await putSlot({
        id: this.slotId,
        name: this.meta.name,
        mode: this.meta.mode,
        seed: this.meta.seed,
        population: this.game.sim.population,
        updatedAt: this.meta.updatedAt,
        bytes,
      });
      // Reloading the page now continues this game.
      window.history.replaceState(null, '', urlForSlot(this.slotId));
      if (!quiet) this.say(t('save.saved', { name: this.meta.name }));
      return true;
    } catch (e) {
      console.warn('save failed', e);
      this.say(t('save.failed'), 'bad');
      return false;
    } finally {
      this.busy = false;
    }
  }

  /** Autosave every `seconds` while the page is open, and when it is hidden or closed. */
  startAutosave(seconds: number): void {
    setInterval(() => void this.save(true), seconds * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.save(true);
    });
  }
}

function download(bytes: Uint8Array, name: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/gzip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'save'}${SAVE_EXTENSION}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads a .mtsave file into a new slot and opens it. */
export async function importFile(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const data = await decodeSave(bytes);
  const id = newSlotId();
  await putSlot({
    id,
    name: data.meta.name,
    mode: data.meta.mode,
    seed: data.meta.seed,
    population: 0,
    updatedAt: Date.now(),
    bytes: await encodeSave(data),
  });
  return id;
}

/** The save / load dialog. */
export function showSaveMenu(parent: HTMLElement, session: SaveSession): void {
  const el = document.createElement('div');
  el.className = 'mt-newgame mt-saves';
  el.innerHTML = `<div class="mt-newgame-card" role="dialog" aria-modal="true" aria-labelledby="mt-sv-title">
    <h2 id="mt-sv-title">${t('save.title')}</h2>
    <form class="mt-save-row">
      <input name="name" maxlength="40" value="" aria-label="${t('save.name')}">
      <button type="submit" class="mt-primary">💾 ${t('save.now')}</button>
    </form>
    <ul class="mt-slots"><li>…</li></ul>
    <div class="mt-save-row">
      <label class="mt-file">📂 ${t('save.import')}<input type="file" accept="${SAVE_EXTENSION},application/gzip,application/json" hidden></label>
      <button type="button" data-act="close">${t('ui.close')}</button>
    </div>
  </div>`;
  parent.appendChild(el);
  const nameInput = el.querySelector('input[name=name]') as HTMLInputElement;
  nameInput.value = session.meta.name;
  const list = el.querySelector('.mt-slots') as HTMLUListElement;
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') el.remove();
  });

  const row = (s: SlotSummary): string => {
    const current = s.id === session.slotId;
    const when = new Date(s.updatedAt).toLocaleString();
    return `<li data-id="${s.id}" class="${current ? 'current' : ''}">
      <div><b>${escapeHtml(s.name)}</b>${current ? ` <em>${t('save.current')}</em>` : ''}
      <small>${t(`mode.${s.mode}`)} · ${t('towns.pop', { pop: fmt(s.population) })} · ${when} · ${fmt(Math.ceil(s.size / 1024))} KB</small></div>
      <span>${current ? '' : `<button type="button" data-act="load">${t('save.load')}</button>`}
      <button type="button" data-act="export">${t('save.export')}</button>
      <button type="button" data-act="delete">${t('save.delete')}</button></span></li>`;
  };
  const refresh = async (): Promise<void> => {
    try {
      const slots = await listSlots();
      list.innerHTML = slots.length ? slots.map(row).join('') : `<li>${t('save.empty')}</li>`;
    } catch {
      list.innerHTML = `<li>${t('save.noStorage')}</li>`;
    }
  };
  void refresh();

  (el.querySelector('form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    session.meta.name = nameInput.value.trim() || session.meta.seed;
    void session.save().then(refresh);
  });
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'close') {
      el.remove();
      return;
    }
    const id = btn.closest<HTMLElement>('[data-id]')?.dataset.id;
    if (!id) return;
    if (act === 'load') {
      // Keep the current game first, then open the other one.
      void session.save(true).then(() => window.location.assign(urlForSlot(id)));
    } else if (act === 'export') {
      void getSlot(id).then((rec) => rec && download(rec.bytes, rec.name));
    } else if (act === 'delete') {
      // Two clicks: the first arms the button (no blocking browser dialogs).
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.textContent = t('save.confirmDelete');
        return;
      }
      void deleteSlot(id).then(refresh);
    }
  });
  const file = el.querySelector('input[type=file]') as HTMLInputElement;
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    importFile(f)
      .then((id) => window.location.assign(urlForSlot(id)))
      .catch((err: unknown) => {
        console.warn('import failed', err);
        list.insertAdjacentHTML('afterbegin', `<li class="bad">${t('save.importFailed')}</li>`);
      });
  });
  nameInput.focus();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export interface PanelLine {
  /** true ✓, false ✗, undefined • */
  ok?: boolean;
  text: string;
}

export interface PanelSection {
  title?: string;
  lines: PanelLine[];
}

export interface PanelContent {
  title: string;
  sections: PanelSection[];
  verdict?: { ok: boolean; text: string };
  action?: { label: string; run: () => void };
}

/** The checklist card: follows the cursor while placing, or pinned to the side when inspecting. */
export class InfoPanel {
  private el: HTMLElement;
  private action: (() => void) | undefined;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'mt-panel';
    this.el.hidden = true;
    this.el.setAttribute('role', 'status');
    this.el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) this.action?.();
    });
    this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
    parent.appendChild(this.el);
  }

  show(c: PanelContent, at: { x: number; y: number } | 'pinned'): void {
    const esc = (s: string): string => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
    const cls = (ok?: boolean): string => (ok === undefined ? 'info' : ok ? 'ok' : 'bad');
    this.action = c.action?.run;
    this.el.innerHTML =
      `<h3>${esc(c.title)}</h3>` +
      c.sections
        .filter((s) => s.lines.length)
        .map(
          (s) =>
            (s.title ? `<div class="mt-sub">${esc(s.title)}</div>` : '') +
            `<ul>${s.lines.map((l) => `<li class="${cls(l.ok)}">${esc(l.text)}</li>`).join('')}</ul>`,
        )
        .join('') +
      (c.verdict
        ? `<div class="mt-verdict ${c.verdict.ok ? 'ok' : 'bad'}">${esc(c.verdict.text)}</div>`
        : '') +
      (c.action ? `<button type="button">${esc(c.action.label)}</button>` : '');
    this.el.hidden = false;
    this.el.classList.toggle('pinned', at === 'pinned');
    if (at === 'pinned') {
      this.el.style.transform = `translate(${Math.max(12, window.innerWidth - this.el.offsetWidth - 12)}px, 56px)`;
    } else {
      // Keep the card on screen, offset from the cursor.
      const w = this.el.offsetWidth;
      const h = this.el.offsetHeight;
      let x = at.x + 18;
      let y = at.y + 18;
      if (x + w > window.innerWidth - 8) x = at.x - w - 18;
      if (y + h > window.innerHeight - 8) y = Math.max(8, at.y - h - 18);
      this.el.style.transform = `translate(${Math.max(8, x)}px, ${y}px)`;
    }
  }

  hide(): void {
    this.el.hidden = true;
    this.action = undefined;
  }
}

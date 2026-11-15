import './policyMenu.css';
import type { City } from '@/sim/city';
import { POLICIES } from '@/sim/policies';
import { t } from './i18n';

export interface PolicyMenu {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function mountPolicyMenu(city: City, parent: HTMLElement): PolicyMenu {
  const backdrop = document.createElement('div');
  backdrop.className = 'mt-policy-backdrop';
  backdrop.hidden = true;

  const modal = document.createElement('div');
  modal.className = 'mt-policy-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', t('policy.title'));
  modal.addEventListener('pointerdown', (e) => e.stopPropagation());

  const header = document.createElement('header');
  header.className = 'mt-policy-header';
  header.innerHTML = `<h2>📜 ${t('policy.title')}</h2>`;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'mt-policy-close';
  closeBtn.setAttribute('aria-label', t('ui.close'));
  closeBtn.textContent = '✕';
  header.appendChild(closeBtn);

  const banner = document.createElement('div');
  banner.className = 'mt-policy-banner';

  const list = document.createElement('div');
  list.className = 'mt-policy-list';

  modal.appendChild(header);
  modal.appendChild(banner);
  modal.appendChild(list);
  backdrop.appendChild(modal);
  parent.appendChild(backdrop);

  // Launcher button
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'mt-policy-btn';
  openBtn.title = `${t('policy.title')} (P)`;
  openBtn.setAttribute('aria-label', t('policy.title'));
  openBtn.textContent = '📜';
  openBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  parent.appendChild(openBtn);

  let isOpen = false;

  const render = (): void => {
    const hasTownHall = city.countOf('town_hall') > 0 || city.countTag('town') > 0;
    if (hasTownHall) {
      banner.className = 'mt-policy-banner ok';
      banner.textContent = `🏛️ ${t('policy.townHallActive')}`;
    } else {
      banner.className = 'mt-policy-banner warn';
      banner.textContent = `⚠️ ${t('policy.needTownHall')}`;
    }

    list.innerHTML = POLICIES.map((p) => {
      const active = city.isPolicyActive(p.id);
      const disabled = !hasTownHall;
      return `
        <div class="mt-policy-card ${active ? 'active' : ''}">
          <div class="mt-policy-card-info">
            <div class="mt-policy-card-title">${p.icon} ${t(p.nameKey)}</div>
            <div class="mt-policy-card-desc">${t(p.descKey)}</div>
            <div class="mt-policy-card-effect">${t(p.effectDescKey)}</div>
          </div>
          <button type="button" class="mt-policy-toggle ${active ? 'active' : ''}" data-policy="${p.id}" ${
            disabled ? 'disabled' : ''
          }>
            ${active ? t('policy.active') : t('policy.inactive')}
          </button>
        </div>
      `;
    }).join('');
  };

  list.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-policy]');
    if (!target || target.disabled) return;
    const policyId = target.dataset.policy;
    if (policyId) {
      const current = city.isPolicyActive(policyId);
      city.setPolicy(policyId, !current);
      render();
    }
  });

  const setOpen = (v: boolean): void => {
    isOpen = v;
    backdrop.hidden = !isOpen;
    openBtn.setAttribute('aria-pressed', String(isOpen));
    if (isOpen) render();
  };

  openBtn.addEventListener('click', () => setOpen(!isOpen));
  closeBtn.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) setOpen(false);
  });

  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyP') {
      e.preventDefault();
      setOpen(!isOpen);
    } else if (e.code === 'Escape' && isOpen) {
      e.preventDefault();
      setOpen(false);
    }
  });

  city.on((e) => {
    if (e.type === 'policy' && isOpen) render();
    if ((e.type === 'added' || e.type === 'removed') && isOpen) render();
  });

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
  };
}

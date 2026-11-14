import type { CameraState } from '@/render/cameraController';
import type { City } from '@/sim/city';
import { t } from './i18n';

interface Step {
  key: string;
  /** Done when this holds; steps already done are skipped. */
  done: () => boolean;
}

/**
 * A short tutorial in the left column: one instruction at a time, each finished by doing it
 * (moving the camera, building a road, a hut...). Skippable at any point.
 */
export function mountTutorial(
  parent: HTMLElement,
  before: Element | null,
  city: City,
  camera: () => CameraState,
  onClose: () => void,
): { el: HTMLElement; step: () => string | null } {
  const start = { ...camera() };
  const infoOpen = (): boolean =>
    !!document.querySelector('.mt-panel:not([hidden]), .mt-detail:not([hidden])');
  const steps: Step[] = [
    {
      key: 'camera',
      done: () => {
        const c = camera();
        return (
          Math.hypot(c.x - start.x, c.z - start.z) > 4 ||
          Math.abs(c.distance - start.distance) > 5 ||
          Math.abs(c.yaw - start.yaw) > 0.2
        );
      },
    },
    { key: 'road', done: () => city.countOf('road') >= 5 },
    { key: 'hut', done: () => city.countOf('hut') + city.countOf('cottage') >= 1 },
    { key: 'food', done: () => city.countOf('berry_field') >= 1 },
    { key: 'well', done: () => city.countOf('well') >= 1 },
    { key: 'inspect', done: infoOpen },
    { key: 'finish', done: () => false },
  ];
  let i = 0;

  const el = document.createElement('section');
  el.className = 'mt-goals mt-tutorial';
  el.setAttribute('aria-live', 'polite');
  parent.insertBefore(el, before);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  const close = (): void => {
    clearInterval(timer);
    el.remove();
    onClose();
  };
  el.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act === 'skip' || act === 'done') close();
  });

  let shown = -1;
  const render = (): void => {
    if (i === shown) return;
    shown = i;
    const s = steps[i] as Step;
    const last = i === steps.length - 1;
    el.innerHTML = `<h3>${t('tutorial.title', { n: i + 1, total: steps.length })}</h3>
      <p>${t(`tutorial.${s.key}`)}</p>
      <button type="button" data-act="${last ? 'done' : 'skip'}">${t(last ? 'tutorial.done' : 'tutorial.skip')}</button>`;
  };
  const check = (): void => {
    while (i < steps.length - 1 && (steps[i] as Step).done()) i++;
    render();
  };
  const timer = setInterval(check, 400);
  check();
  return { el, step: () => (el.isConnected ? (steps[i] as Step).key : null) };
}

import './style.css';
import './ui/ui.css';
import './ui/gameShell.css';
import { getLang } from '@/ui/i18n';
import { readSetup } from '@/ui/newGame';

document.documentElement.lang = getLang();
const params = new URLSearchParams(window.location.search);
if (readSetup(params).undecided && !params.get('load')) {
  const { mountLauncher } = await import('@/ui/launcher');
  mountLauncher(document.body);
} else {
  await import('./main');
}

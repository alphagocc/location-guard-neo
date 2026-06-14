import { spoofLocation } from './spoof-location';
import { renderConfigUI } from './ui';
import 'typed-query-selector';

declare const __CONFIG_UI_ORIGIN__: string;
declare const __CONFIG_UI_HOST__: string;

(() => {
  spoofLocation();

  if ('registerMenuCommand' in GM && typeof GM.registerMenuCommand === 'function') {
    GM.registerMenuCommand(
      'Configuration',
      () => {
        const a = document.createElement('a');
        a.href = `${__CONFIG_UI_ORIGIN__}/options`;
        a.target = '_blank';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      },
    );
  }

  if (
    window.location.host === 'localhost:3000'
    || window.location.host === __CONFIG_UI_HOST__
  ) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderConfigUI);
    }
    else {
      renderConfigUI();
    }
  }
})();

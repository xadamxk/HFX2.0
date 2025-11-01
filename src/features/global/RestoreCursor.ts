import { Feature } from '../../core/Feature';
import Global from '../../sections/Global';

class RestoreCursor extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Restore Cursor",
      enabled: false,
      description: "Restores the custom cursor to your system's default."
    });
  }

  run() {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules || []) {
          if (rule instanceof CSSStyleRule && rule.style.cursor?.includes('url(')) {
            const match = rule.style.cursor.match(/,\s*(\w+)\s*;?$/);
            rule.style.cursor = match ? match[1] : 'auto';
          }
        }
      } catch {
        // Ignore cross-origin stylesheets
      }
    }
  }
}

export default new RestoreCursor();

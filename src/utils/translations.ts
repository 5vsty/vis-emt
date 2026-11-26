import { getEventBus } from '@fsdev/eventbus/eventBus.js';
import cz from '../translation/languages/cz.json';
import de from '../translation/languages/de.json';
import en from '../translation/languages/en.json';
import fr from '../translation/languages/fr.json';
import it from '../translation/languages/it.json';
import pl from '../translation/languages/pl.json';
import { TRANSLATION_EVENTS } from '@/constants';

export const Utilities = {
  sendCustomTranslations() {
    const sendObj = {
      de: de,
      en: en,
      fr: fr,
      cz: cz,
      it: it,
      pl: pl,
    };
    getEventBus().emit(TRANSLATION_EVENTS.EVENT_ADD_MODULE_TRANSLATIONS, sendObj);
  },
};

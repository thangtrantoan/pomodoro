import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../constants/i18n';

export function useT() {
  const language = useSettingsStore((s) => s.language);
  return translations[language];
}

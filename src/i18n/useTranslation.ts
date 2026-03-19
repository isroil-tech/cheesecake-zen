import { useLanguageStore } from '@/stores/languageStore';
import uz from './uz.json';
import ru from './ru.json';

const translations: Record<string, any> = { uz, ru };

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function useTranslation() {
  const { language } = useLanguageStore();
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[language], key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, String(v));
      });
    }
    return value;
  };

  return { t, language };
}

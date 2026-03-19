import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

const YANDEX_API_KEY = 'e9013c63-eb04-4e33-a452-813273d801f4';

interface Suggestion {
  title: { text: string };
  subtitle?: { text: string };
  uri?: string;
}

interface YandexAddressSearchProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}

export function YandexAddressSearch({ value, onChange, placeholder }: YandexAddressSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://suggest-maps.yandex.ru/v1/suggest?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(text)}&lang=uz_UZ&results=5&types=geo,biz&print_address=1`
      );
      const data = await response.json();
      if (data.results) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Yandex suggest error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const handleSelect = (suggestion: Suggestion) => {
    const full = suggestion.subtitle
      ? `${suggestion.title.text}, ${suggestion.subtitle.text}`
      : suggestion.title.text;
    setQuery(full);
    onChange(full);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder || t('checkout.addressPlaceholder')}
          className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-card rounded-xl card-shadow border border-border overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/60 active:bg-secondary transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.title.text}</p>
                {s.subtitle && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{s.subtitle.text}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
